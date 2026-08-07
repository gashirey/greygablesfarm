-- Scheduled "In Town" pickup locations (e.g. Richmond office drop-offs)

create table if not exists public.ss_pickup_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_street text not null,
  address_line2 text,
  address_city text not null,
  address_state text not null default 'VA',
  address_zip text not null,
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ss_pickup_locations_zip_format check (address_zip ~ '^[0-9]{5}$')
);

create table if not exists public.ss_in_town_pickup_slots (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.ss_pickup_locations(id) on delete cascade,
  pickup_date date not null,
  starts_at time not null,
  ends_at time not null,
  label text not null default '',
  capacity integer not null default 10 check (capacity >= 0),
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ss_in_town_pickup_slots_time_order check (ends_at > starts_at)
);

create index if not exists ss_in_town_pickup_slots_date_idx
  on public.ss_in_town_pickup_slots (pickup_date);

create index if not exists ss_in_town_pickup_slots_location_idx
  on public.ss_in_town_pickup_slots (location_id);

alter table public.ss_orders
  drop constraint if exists ss_orders_fulfillment_type_check;

alter table public.ss_orders
  add constraint ss_orders_fulfillment_type_check
  check (fulfillment_type in ('delivery', 'pickup', 'in_town_pickup'));

alter table public.ss_orders
  add column if not exists in_town_pickup_slot_id uuid
    references public.ss_in_town_pickup_slots(id) on delete set null;

alter table public.ss_reservations
  add column if not exists in_town_pickup_slot_id uuid
    references public.ss_in_town_pickup_slots(id) on delete set null;

create index if not exists ss_orders_in_town_slot_idx
  on public.ss_orders (in_town_pickup_slot_id)
  where in_town_pickup_slot_id is not null;

create index if not exists ss_reservations_in_town_slot_idx
  on public.ss_reservations (in_town_pickup_slot_id)
  where in_town_pickup_slot_id is not null
    and (status = 'held' or status = 'committed');

alter table public.ss_pickup_locations enable row level security;
alter table public.ss_in_town_pickup_slots enable row level security;

drop policy if exists "Public read active pickup locations" on public.ss_pickup_locations;
create policy "Public read active pickup locations"
  on public.ss_pickup_locations for select using (is_active = true);

drop policy if exists "Public read active in-town slots" on public.ss_in_town_pickup_slots;
create policy "Public read active in-town slots"
  on public.ss_in_town_pickup_slots for select using (is_active = true);
