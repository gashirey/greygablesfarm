-- Designer's Choice scales: Classic / Signature / Grand
-- Adds editable blurb, per-scale curated vessel upgrade, popular flag.
-- Remaps legacy choice/deluxe/curated-vessel → classic/signature/grand.

alter table public.ss_products
  add column if not exists blurb text not null default '',
  add column if not exists vessel_upgrade_cents integer not null default 0
    check (vessel_upgrade_cents >= 0),
  add column if not exists is_popular boolean not null default false;

-- Order metadata for gift / presentation (optional; notes still used for designer guidance)
alter table public.ss_orders
  add column if not exists presentation text
    check (presentation is null or presentation in ('signature-glass', 'curated-keepsake')),
  add column if not exists is_gift boolean not null default false,
  add column if not exists hide_pricing boolean not null default false;

-- Remap existing scale slugs (only when target slug is free)
do $$
begin
  if exists (select 1 from public.ss_products where slug = 'choice')
     and not exists (select 1 from public.ss_products where slug = 'classic') then
    update public.ss_products set slug = 'classic' where slug = 'choice';
  end if;
  if exists (select 1 from public.ss_products where slug = 'deluxe')
     and not exists (select 1 from public.ss_products where slug = 'signature') then
    update public.ss_products set slug = 'signature' where slug = 'deluxe';
  end if;
  if exists (select 1 from public.ss_products where slug = 'curated-vessel')
     and not exists (select 1 from public.ss_products where slug = 'grand') then
    update public.ss_products set slug = 'grand' where slug = 'curated-vessel';
  end if;
end $$;

-- Seed / refresh Classic, Signature, Grand
insert into public.ss_products (
  slug, name, description, blurb, base_price_cents, vessel_upgrade_cents,
  capacity_cost, requires_vessel, allows_delivery, allows_pickup,
  image_url, image_alt, is_popular, is_active, sort_order
)
values
  (
    'classic',
    'Classic',
    'A thoughtfully composed arrangement for everyday gifting and smaller spaces.',
    'Intimate and refined — ideal for a nightstand, desk, or quiet thank-you.',
    15000,
    4000,
    1,
    false,
    true,
    true,
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780969108915-1X3A1390-b350af98.jpg',
    'Classic-scale Designer’s Choice arrangement',
    false,
    true,
    10
  ),
  (
    'signature',
    'Signature',
    'Our most-sent gift — fuller, more abundant, with greater presence.',
    'Our most-sent gift. Fuller presence for the table or a welcome home.',
    22500,
    5000,
    2,
    false,
    true,
    true,
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1783597232259-IN7A5280-6d032280.jpg',
    'Signature-scale Designer’s Choice arrangement',
    true,
    true,
    20
  ),
  (
    'grand',
    'Grand',
    'A generous statement arrangement with maximum presence.',
    'Maximum presence — for celebrations, gratitude, and grand gestures.',
    35000,
    7500,
    3,
    false,
    true,
    true,
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1781401339985-1X3A1494-3322be5b.jpg',
    'Grand-scale Designer’s Choice arrangement',
    false,
    true,
    30
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  blurb = excluded.blurb,
  base_price_cents = excluded.base_price_cents,
  vessel_upgrade_cents = excluded.vessel_upgrade_cents,
  capacity_cost = excluded.capacity_cost,
  requires_vessel = false,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  is_popular = excluded.is_popular,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Deactivate any leftover legacy SKUs that were not remapped
update public.ss_products
set is_active = false, updated_at = now()
where slug in ('choice', 'deluxe', 'curated-vessel');

notify pgrst, 'reload schema';
