-- Designer's Choice product tiers (admin-managed)

create table if not exists public.flower_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  price integer not null,
  description text not null default '',
  cta_label text not null default 'Order for delivery',
  image_url text not null default '',
  image_alt text not null default '',
  image_object_position text,
  is_popular boolean not null default false,
  is_visible boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flower_tiers_slug_format check (slug ~ '^[a-z][a-z0-9_-]*$'),
  constraint flower_tiers_slug_unique unique (slug),
  constraint flower_tiers_price_positive check (price > 0)
);

create index if not exists flower_tiers_sort_idx
  on public.flower_tiers (sort_order asc, created_at asc);

alter table public.flower_tiers enable row level security;

drop policy if exists "Public read visible flower tiers" on public.flower_tiers;
create policy "Public read visible flower tiers"
  on public.flower_tiers for select
  using (is_visible = true);

-- Seed current Designer's Choice offerings
insert into public.flower_tiers (
  slug, name, price, description, cta_label,
  image_url, image_alt, image_object_position,
  is_popular, is_visible, sort_order
)
select v.slug, v.name, v.price, v.description, v.cta_label,
       v.image_url, v.image_alt, v.image_object_position,
       v.is_popular, true, v.sort_order
from (
  values
    (
      'choice',
      'Designer''s Choice',
      150,
      'The best of this morning''s harvest, arranged in a classic vase. Ande designs every arrangement from what''s freshest in the field — no two are alike.',
      'Order for delivery',
      'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg',
      'Designer''s Choice arrangement in a classic fluted vase',
      null::text,
      false,
      10
    ),
    (
      'deluxe',
      'Designer''s Choice Deluxe',
      225,
      'A fuller, more abundant arrangement with premium focal flowers and greater variety. Our most-sent gift.',
      'Order for delivery',
      'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/81c656df-c2b0-40fc-a269-43912145ccb8/1779243921399-1X3A0640-ebe20511.jpg',
      'Full harvest bunches of blue and white nigella',
      null::text,
      true,
      20
    ),
    (
      'vessel',
      'Deluxe, Curated Vessel',
      300,
      'Our deluxe arrangement designed in a hand-selected ceramic or artisan vessel chosen to suit the flowers. The vessel is theirs to keep.',
      'Order for delivery',
      'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg',
      'Arrangement in a distinctive artisan vessel',
      '50% 85%',
      false,
      30
    )
) as v(
  slug, name, price, description, cta_label,
  image_url, image_alt, image_object_position,
  is_popular, sort_order
)
where not exists (
  select 1 from public.flower_tiers t where t.slug = v.slug
);

-- Allow admin-defined tiers/prices on orders (no longer locked to three SKUs)
alter table public.orders drop constraint if exists orders_tier;
alter table public.orders drop constraint if exists orders_price;
alter table public.orders
  add constraint orders_price_positive check (price > 0);

notify pgrst, 'reload schema';
