-- Delivery arrangement inquiries (send-flowers page)

create table if not exists public.delivery_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  recipient_name text not null,
  recipient_address text not null,
  recipient_county text,
  delivery_date date not null,
  occasion text not null,
  budget text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint delivery_inquiries_email_format check (
    email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
  ),
  constraint delivery_inquiries_occasion check (
    occasion in ('birthday', 'anniversary', 'sympathy', 'just_because', 'other')
  ),
  constraint delivery_inquiries_budget check (
    budget in ('75_125', '125_200', '200_350', '350_plus')
  )
);

create index if not exists delivery_inquiries_created_at_idx
  on public.delivery_inquiries (created_at desc);

alter table public.delivery_inquiries enable row level security;

-- Inserts via service role API only (no public policies)

-- Navigation: Send Flowers as primary entry
insert into public.site_nav_items (label, href, sort_order)
select 'Send Flowers', '/send-flowers', 5
where not exists (
  select 1 from public.site_nav_items where href = '/send-flowers'
);
