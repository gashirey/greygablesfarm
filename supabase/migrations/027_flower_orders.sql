-- Designer's Choice flower orders (/flowers)

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tier text not null,
  price integer not null,
  sender_name text not null,
  sender_email text not null,
  sender_phone text not null,
  recipient_name text not null,
  recipient_phone text not null,
  address_street text not null,
  address_city text not null,
  address_zip text not null,
  delivery_date date not null,
  card_message text,
  notes text,
  status text not null default 'new',
  constraint orders_email_format check (
    sender_email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
  ),
  constraint orders_tier check (
    tier in ('choice', 'deluxe', 'vessel')
  ),
  constraint orders_price check (
    price in (150, 225, 300)
  ),
  constraint orders_status check (
    status in ('new', 'confirmed', 'paid', 'delivered', 'cancelled')
  )
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_status_idx
  on public.orders (status);

alter table public.orders enable row level security;

-- Inserts via service role API only (no public policies)

-- Nav: Flowers between Home and About
insert into public.site_nav_items (label, href, sort_order, is_visible)
select 'Flowers', '/flowers', 15, true
where not exists (
  select 1 from public.site_nav_items where href = '/flowers'
);

update public.site_nav_items
set sort_order = 15, is_visible = true, label = 'Flowers'
where href = '/flowers';
