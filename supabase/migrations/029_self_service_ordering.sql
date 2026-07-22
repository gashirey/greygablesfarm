-- Self-service boutique flower ordering (ss_*)

-- Products (arrangements)
create table if not exists public.ss_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  base_price_cents integer not null check (base_price_cents > 0),
  capacity_cost integer not null default 1 check (capacity_cost > 0),
  requires_vessel boolean not null default false,
  allows_delivery boolean not null default true,
  allows_pickup boolean not null default true,
  image_url text not null default '',
  image_alt text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ss_products_slug_format check (slug ~ '^[a-z][a-z0-9_-]*$')
);

-- Vessel inventory
create table if not exists public.ss_vessels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  image_url text not null default '',
  image_alt text not null default '',
  qty_on_hand integer not null default 0 check (qty_on_hand >= 0),
  price_adjustment_cents integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ss_vessels_slug_format check (slug ~ '^[a-z][a-z0-9_-]*$')
);

-- Delivery zones + ZIPs
create table if not exists public.ss_delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee_cents integer not null default 0 check (fee_cents >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ss_delivery_zone_zips (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.ss_delivery_zones(id) on delete cascade,
  zip text not null,
  created_at timestamptz not null default now(),
  constraint ss_delivery_zone_zips_zip_format check (zip ~ '^[0-9]{5}$'),
  constraint ss_delivery_zone_zips_unique unique (zip)
);

create index if not exists ss_delivery_zone_zips_zone_idx
  on public.ss_delivery_zone_zips (zone_id);

-- Fulfillment calendar + pickup windows
create table if not exists public.ss_fulfillment_dates (
  id uuid primary key default gen_random_uuid(),
  fulfillment_date date not null unique,
  max_capacity integer not null default 10 check (max_capacity >= 0),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ss_pickup_windows (
  id uuid primary key default gen_random_uuid(),
  fulfillment_date_id uuid not null references public.ss_fulfillment_dates(id) on delete cascade,
  label text not null,
  starts_at time not null,
  ends_at time not null,
  capacity integer not null default 5 check (capacity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ss_pickup_windows_date_idx
  on public.ss_pickup_windows (fulfillment_date_id);

-- Orders
create table if not exists public.ss_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  product_id uuid not null references public.ss_products(id),
  vessel_id uuid references public.ss_vessels(id),
  fulfillment_type text not null check (fulfillment_type in ('delivery', 'pickup')),
  fulfillment_date date not null,
  pickup_window_id uuid references public.ss_pickup_windows(id),
  delivery_zone_id uuid references public.ss_delivery_zones(id),
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  recipient_name text,
  recipient_phone text,
  address_street text,
  address_city text,
  address_state text default 'VA',
  address_zip text,
  delivery_instructions text,
  card_message text,
  notes text,
  arrangement_cents integer not null,
  vessel_cents integer not null default 0,
  delivery_fee_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null,
  stripe_session_id text,
  stripe_payment_intent_id text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  fulfillment_status text not null default 'checkout_started'
    check (fulfillment_status in (
      'checkout_started', 'confirmed', 'designing', 'ready',
      'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled'
    )),
  reservation_id uuid,
  constraint ss_orders_email_format check (
    buyer_email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
  )
);

create index if not exists ss_orders_created_at_idx on public.ss_orders (created_at desc);
create index if not exists ss_orders_payment_status_idx on public.ss_orders (payment_status);
create index if not exists ss_orders_fulfillment_status_idx on public.ss_orders (fulfillment_status);
create index if not exists ss_orders_stripe_session_idx on public.ss_orders (stripe_session_id)
  where stripe_session_id is not null;

create table if not exists public.ss_order_line_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ss_orders(id) on delete cascade,
  kind text not null check (kind in ('arrangement', 'vessel', 'delivery', 'tax', 'other')),
  label text not null,
  quantity integer not null default 1,
  unit_amount_cents integer not null,
  created_at timestamptz not null default now()
);

create index if not exists ss_order_line_items_order_idx
  on public.ss_order_line_items (order_id);

-- Reservations (vessel qty + capacity)
create table if not exists public.ss_reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'held'
    check (status in ('held', 'committed', 'released')),
  product_id uuid not null references public.ss_products(id),
  vessel_id uuid references public.ss_vessels(id),
  fulfillment_date date not null,
  pickup_window_id uuid references public.ss_pickup_windows(id),
  capacity_cost integer not null default 1,
  order_id uuid references public.ss_orders(id) on delete set null,
  committed_at timestamptz,
  released_at timestamptz
);

create index if not exists ss_reservations_status_expires_idx
  on public.ss_reservations (status, expires_at);
create index if not exists ss_reservations_date_idx
  on public.ss_reservations (fulfillment_date)
  where status = 'held' or status = 'committed';

alter table public.ss_orders
  drop constraint if exists ss_orders_reservation_fk;
alter table public.ss_orders
  add constraint ss_orders_reservation_fk
  foreign key (reservation_id) references public.ss_reservations(id) on delete set null;

-- RLS: public read for catalog/zones; writes via service role only
alter table public.ss_products enable row level security;
alter table public.ss_vessels enable row level security;
alter table public.ss_delivery_zones enable row level security;
alter table public.ss_delivery_zone_zips enable row level security;
alter table public.ss_fulfillment_dates enable row level security;
alter table public.ss_pickup_windows enable row level security;
alter table public.ss_orders enable row level security;
alter table public.ss_order_line_items enable row level security;
alter table public.ss_reservations enable row level security;

drop policy if exists "Public read active ss products" on public.ss_products;
create policy "Public read active ss products"
  on public.ss_products for select using (is_active = true);

drop policy if exists "Public read active ss vessels" on public.ss_vessels;
create policy "Public read active ss vessels"
  on public.ss_vessels for select using (is_active = true and qty_on_hand > 0);

drop policy if exists "Public read active ss zones" on public.ss_delivery_zones;
create policy "Public read active ss zones"
  on public.ss_delivery_zones for select using (is_active = true);

drop policy if exists "Public read ss zone zips" on public.ss_delivery_zone_zips;
create policy "Public read ss zone zips"
  on public.ss_delivery_zone_zips for select using (true);

drop policy if exists "Public read active fulfillment dates" on public.ss_fulfillment_dates;
create policy "Public read active fulfillment dates"
  on public.ss_fulfillment_dates for select using (is_active = true);

drop policy if exists "Public read active pickup windows" on public.ss_pickup_windows;
create policy "Public read active pickup windows"
  on public.ss_pickup_windows for select using (is_active = true);

-- Seed products
insert into public.ss_products (
  slug, name, description, base_price_cents, capacity_cost,
  requires_vessel, image_url, image_alt, sort_order
)
select * from (values
  (
    'choice',
    'Designer''s Choice',
    'The best of this morning''s harvest, arranged in a classic vase. Ande designs every arrangement from what''s freshest in the field — no two are alike.',
    15000,
    1,
    false,
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg',
    'Designer''s Choice arrangement in a classic fluted vase',
    10
  ),
  (
    'deluxe',
    'Designer''s Choice Deluxe',
    'A fuller, more abundant arrangement with premium focal flowers and greater variety. Our most-sent gift.',
    22500,
    2,
    false,
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/81c656df-c2b0-40fc-a269-43912145ccb8/1779243921399-1X3A0640-ebe20511.jpg',
    'Full harvest bunches of blue and white nigella',
    20
  ),
  (
    'curated-vessel',
    'Deluxe, Curated Vessel',
    'Our deluxe arrangement designed in a hand-selected ceramic or artisan vessel chosen to suit the flowers. The vessel is theirs to keep.',
    35000,
    3,
    true,
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg',
    'Arrangement in a distinctive artisan vessel',
    30
  )
) as v(slug, name, description, base_price_cents, capacity_cost, requires_vessel, image_url, image_alt, sort_order)
where not exists (select 1 from public.ss_products p where p.slug = v.slug);

-- Seed vessels
insert into public.ss_vessels (
  slug, name, description, image_url, image_alt,
  qty_on_hand, price_adjustment_cents, sort_order
)
select * from (values
  (
    'classic-glass',
    'Classic Glass Vase',
    'Our standard clear glass vase — included with curated vessel arrangements when selected.',
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg',
    'Classic fluted glass vase',
    8,
    0,
    10
  ),
  (
    'white-ceramic-compote',
    'White Ceramic Compote',
    'A clean white ceramic compote that elevates any arrangement. Theirs to keep.',
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg',
    'White ceramic compote vessel',
    3,
    0,
    20
  ),
  (
    'garden-urn',
    'Garden Urn',
    'A substantial garden urn with classic proportions.',
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg',
    'Garden urn vessel',
    2,
    4000,
    30
  ),
  (
    'hand-thrown-stoneware',
    'Hand Thrown Stoneware',
    'One-of-a-kind hand-thrown stoneware — artisan-made.',
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg',
    'Hand thrown stoneware vessel',
    2,
    6500,
    40
  ),
  (
    'hand-painted-vessel',
    'Hand Painted Vessel',
    'A hand-painted ceramic vessel with unique character.',
    'https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg',
    'Hand painted ceramic vessel',
    1,
    9500,
    50
  )
) as v(slug, name, description, image_url, image_alt, qty_on_hand, price_adjustment_cents, sort_order)
where not exists (select 1 from public.ss_vessels x where x.slug = v.slug);

-- Seed zones
insert into public.ss_delivery_zones (name, fee_cents, sort_order)
select v.name, v.fee_cents, v.sort_order
from (values
  ('Louisa', 0, 10),
  ('Orange', 1500, 20),
  ('Charlottesville', 2500, 30),
  ('Extended Delivery', 4500, 40)
) as v(name, fee_cents, sort_order)
where not exists (select 1 from public.ss_delivery_zones z where z.name = v.name);

-- Seed ZIPs (representative sample — staff expand in admin)
insert into public.ss_delivery_zone_zips (zone_id, zip)
select z.id, v.zip
from (
  values
    ('Louisa', '23093'),
    ('Louisa', '23024'),
    ('Orange', '22960'),
    ('Orange', '22508'),
    ('Charlottesville', '22901'),
    ('Charlottesville', '22902'),
    ('Charlottesville', '22903'),
    ('Charlottesville', '22911'),
    ('Extended Delivery', '22932'),
    ('Extended Delivery', '22936'),
    ('Extended Delivery', '24590')
) as v(zone_name, zip)
join public.ss_delivery_zones z on z.name = v.zone_name
where not exists (
  select 1 from public.ss_delivery_zone_zips xz where xz.zip = v.zip
);

-- Seed next two weeks of Tue–Sat fulfillment dates
insert into public.ss_fulfillment_dates (fulfillment_date, max_capacity, is_active)
select d::date, 12, true
from generate_series(
  current_date,
  current_date + interval '21 days',
  interval '1 day'
) as d
where extract(dow from d) between 2 and 6
  and not exists (
    select 1 from public.ss_fulfillment_dates f where f.fulfillment_date = d::date
  );

-- Default pickup windows for seeded dates
insert into public.ss_pickup_windows (
  fulfillment_date_id, label, starts_at, ends_at, capacity
)
select f.id, w.label, w.starts_at::time, w.ends_at::time, w.capacity
from public.ss_fulfillment_dates f
cross join (
  values
    ('Morning', '09:00', '11:00', 4),
    ('Afternoon', '13:00', '16:00', 4)
) as w(label, starts_at, ends_at, capacity)
where f.fulfillment_date >= current_date
  and not exists (
    select 1 from public.ss_pickup_windows p
    where p.fulfillment_date_id = f.id and p.label = w.label
  );

notify pgrst, 'reload schema';
