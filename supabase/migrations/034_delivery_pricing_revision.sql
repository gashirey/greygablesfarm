-- Delivery pricing revision (July 30, 2026)
-- Updates fees; splits Louisa into Local / Extended; removes empty regions.

-- Fee updates on existing launch regions
update public.ss_delivery_zones
set fee_cents = 2500, updated_at = now()
where name = 'Charlottesville Area' and fee_cents is distinct from 2500;

update public.ss_delivery_zones
set fee_cents = 2500, updated_at = now()
where name = 'Greene County' and fee_cents is distinct from 2500;

update public.ss_delivery_zones
set fee_cents = 2500, updated_at = now()
where name = 'Orange County' and fee_cents is distinct from 2500;

update public.ss_delivery_zones
set fee_cents = 2500, updated_at = now()
where name = 'Lake Monticello & Fluvanna' and fee_cents is distinct from 2500;

-- Goochland $40 and Short Pump $50 unchanged

-- Deactivate prior single Louisa County region (ZIPs move to split regions)
update public.ss_delivery_zones
set is_active = false, updated_at = now()
where name = 'Louisa County';

-- Upsert Local Louisa ($15 / 23093) and Extended Louisa ($25 / 23024)
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('Local Louisa', 1500, 40),
      ('Extended Louisa', 2500, 45)
    ) as v(name, fee_cents, sort_order)
  loop
    update public.ss_delivery_zones
    set
      fee_cents = r.fee_cents,
      sort_order = r.sort_order,
      is_active = true,
      updated_at = now()
    where name = r.name;

    if not found then
      insert into public.ss_delivery_zones (name, fee_cents, sort_order, is_active)
      values (r.name, r.fee_cents, r.sort_order, true);
    end if;
  end loop;
end $$;

-- Remap Louisa ZIPs
delete from public.ss_delivery_zone_zips where zip in ('23093', '23024');

insert into public.ss_delivery_zone_zips (zone_id, zip)
select z.id, v.zip
from (values
  ('Local Louisa', '23093'),
  ('Extended Louisa', '23024')
) as v(region_name, zip)
join public.ss_delivery_zones z on z.name = v.region_name
on conflict (zip) do update
  set zone_id = excluded.zone_id;

-- Prefer is_active on zips when column exists
do $$
begin
  update public.ss_delivery_zone_zips
  set is_active = true
  where zip in ('23093', '23024');
exception
  when undefined_column then null;
end $$;

-- Remove Special Delivery and any other active/inactive regions that have zero ZIPs
-- and are not referenced by orders (safe delete). Otherwise deactivate.
do $$
declare
  z record;
  order_refs int;
begin
  for z in
    select dz.id, dz.name
    from public.ss_delivery_zones dz
    where not exists (
      select 1 from public.ss_delivery_zone_zips xz where xz.zone_id = dz.id
    )
  loop
    select count(*) into order_refs
    from public.ss_orders o
    where o.delivery_zone_id = z.id;

    if order_refs = 0 then
      delete from public.ss_delivery_zones where id = z.id;
    else
      update public.ss_delivery_zones
      set is_active = false, updated_at = now()
      where id = z.id;
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
