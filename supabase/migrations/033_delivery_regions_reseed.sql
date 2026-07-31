-- Grey Gables launch delivery regions (ZIP-based fees)
-- Reuses ss_delivery_zones + ss_delivery_zone_zips from 029.
-- Deactivates obsolete seed regions; upserts approved launch set.

-- Optional metadata for admin / special delivery
alter table public.ss_delivery_zones
  add column if not exists notes text not null default '',
  add column if not exists kind text not null default 'standard';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ss_delivery_zones_kind_check'
  ) then
    alter table public.ss_delivery_zones
      add constraint ss_delivery_zones_kind_check
      check (kind in ('standard', 'special'));
  end if;
end $$;

alter table public.ss_delivery_zone_zips
  add column if not exists is_active boolean not null default true;

-- Snapshot region name on orders (historical fee already on delivery_fee_cents)
alter table public.ss_orders
  add column if not exists delivery_zone_name text,
  add column if not exists address_line2 text;

create index if not exists ss_delivery_zone_zips_zip_active_idx
  on public.ss_delivery_zone_zips (zip)
  where is_active = true;

-- Deactivate legacy seed regions (keep rows for historical order FKs)
update public.ss_delivery_zones
set
  is_active = false,
  updated_at = now()
where name in (
  'Louisa',
  'Orange',
  'Charlottesville',
  'Extended Delivery'
);

-- Upsert launch regions by name
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('Charlottesville Area', 2500, 10, 'standard', 'Launch region — July 2026'),
      ('Greene County', 2500, 20, 'standard', 'Launch region — July 2026'),
      ('Orange County', 2500, 30, 'standard', 'Barboursville, Gordonsville, Orange'),
      ('Local Louisa', 1500, 40, 'standard', 'ZIP 23093'),
      ('Extended Louisa', 2500, 45, 'standard', 'ZIP 23024'),
      ('Lake Monticello & Fluvanna', 2500, 50, 'standard', 'Launch region — July 2026'),
      ('Goochland', 4000, 60, 'standard', 'Launch region — July 2026'),
      ('Short Pump / West End', 5000, 70, 'standard', 'Limited Richmond-area ZIPs only')
    ) as v(name, fee_cents, sort_order, kind, notes)
  loop
    update public.ss_delivery_zones
    set
      fee_cents = r.fee_cents,
      sort_order = r.sort_order,
      is_active = true,
      kind = r.kind,
      notes = r.notes,
      updated_at = now()
    where name = r.name;

    if not found then
      insert into public.ss_delivery_zones (name, fee_cents, sort_order, is_active, kind, notes)
      values (r.name, r.fee_cents, r.sort_order, true, r.kind, r.notes);
    end if;
  end loop;
end $$;

-- Unique region names going forward (safe after seed)
create unique index if not exists ss_delivery_zones_name_unique
  on public.ss_delivery_zones (name);

-- Replace ZIP map: remove launch ZIPs from any old zone, then attach to new regions
delete from public.ss_delivery_zone_zips
where zip in (
  '22901','22902','22903','22911',
  '22968','22973',
  '22923','22942','22960',
  '23024','23093',
  '22963',
  '23063','23065','23129',
  '23059','23233',
  -- obsolete sample ZIPs no longer in regular online delivery
  '22508','22932','22936','24590'
);

insert into public.ss_delivery_zone_zips (zone_id, zip, is_active)
select z.id, v.zip, true
from (values
  ('Charlottesville Area', '22901'),
  ('Charlottesville Area', '22902'),
  ('Charlottesville Area', '22903'),
  ('Charlottesville Area', '22911'),
  ('Greene County', '22968'),
  ('Greene County', '22973'),
  ('Orange County', '22923'),
  ('Orange County', '22942'),
  ('Orange County', '22960'),
  ('Local Louisa', '23093'),
  ('Extended Louisa', '23024'),
  ('Lake Monticello & Fluvanna', '22963'),
  ('Goochland', '23063'),
  ('Goochland', '23065'),
  ('Goochland', '23129'),
  ('Short Pump / West End', '23059'),
  ('Short Pump / West End', '23233')
) as v(region_name, zip)
join public.ss_delivery_zones z on z.name = v.region_name
on conflict (zip) do update
  set zone_id = excluded.zone_id,
      is_active = true;

notify pgrst, 'reload schema';

-- Rollback guidance (manual):
-- 1. delete from ss_delivery_zone_zips where zip in (...launch zips...);
-- 2. update ss_delivery_zones set is_active = false where name in (...launch names...);
-- 3. update ss_delivery_zones set is_active = true where name in ('Louisa','Orange','Charlottesville','Extended Delivery');
-- 4. re-seed prior ZIP sample from 029 if needed.
