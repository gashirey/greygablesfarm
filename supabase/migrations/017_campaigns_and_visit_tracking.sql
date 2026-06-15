-- Campaign short links (e.g. /bc from business card QR) and attributed visit logging

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  destination_url text not null default '/',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_slug_unique unique (slug),
  constraint campaigns_slug_format check (slug ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint campaigns_destination_relative check (destination_url ~ '^/')
);

create index if not exists campaigns_slug_idx on public.campaigns (slug);
create index if not exists campaigns_active_idx on public.campaigns (is_active) where is_active = true;

create table if not exists public.site_visit_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns (id) on delete set null,
  slug text,
  pathname text not null,
  search_params jsonb,
  referrer text,
  user_agent text,
  visit_type text not null,
  created_at timestamptz not null default now(),
  constraint site_visit_events_visit_type check (
    visit_type in ('campaign', 'path', 'query')
  )
);

create index if not exists site_visit_events_created_at_idx
  on public.site_visit_events (created_at desc);

create index if not exists site_visit_events_campaign_id_idx
  on public.site_visit_events (campaign_id, created_at desc)
  where campaign_id is not null;

create index if not exists site_visit_events_slug_idx
  on public.site_visit_events (slug, created_at desc)
  where slug is not null;

alter table public.campaigns enable row level security;
alter table public.site_visit_events enable row level security;

comment on table public.campaigns is
  'Short-link slugs at site root (e.g. /bc). Active campaigns redirect to destination_url.';
comment on table public.site_visit_events is
  'First-party visit log for campaign scans and URLs with path/query beyond the homepage.';

insert into public.campaigns (slug, name, destination_url, notes)
values (
  'bc',
  'Business card',
  '/',
  'QR code on back of business card'
)
on conflict (slug) do nothing;
