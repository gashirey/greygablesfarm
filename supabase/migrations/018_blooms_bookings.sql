-- Photos in the Blooms date-night session bookings

create table if not exists public.blooms_bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  partner_name text,
  email text not null,
  phone text,
  preferred_date date,
  preferred_time text,
  notes text,
  payment_status text not null default 'pending',
  amount_cents integer not null default 32500,
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blooms_bookings_email_format check (
    email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
  ),
  constraint blooms_bookings_payment_status check (
    payment_status in ('pending', 'paid', 'cancelled')
  )
);

create index if not exists blooms_bookings_created_at_idx
  on public.blooms_bookings (created_at desc);

create index if not exists blooms_bookings_stripe_session_idx
  on public.blooms_bookings (stripe_session_id)
  where stripe_session_id is not null;

alter table public.blooms_bookings enable row level security;

-- Inserts via service role API only (no public policies)
