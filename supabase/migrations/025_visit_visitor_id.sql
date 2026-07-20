-- Approximate unique visitors (first-party cookie id) + bot flag

alter table public.site_visit_events
  add column if not exists visitor_id text;

alter table public.site_visit_events
  add column if not exists is_bot boolean not null default false;

create index if not exists site_visit_events_visitor_id_idx
  on public.site_visit_events (visitor_id, created_at desc)
  where visitor_id is not null;

create index if not exists site_visit_events_is_bot_idx
  on public.site_visit_events (is_bot, created_at desc);

comment on column public.site_visit_events.visitor_id is
  'Opaque first-party visitor cookie id for unique-visitor estimates.';
comment on column public.site_visit_events.is_bot is
  'True when user-agent matched known crawler / probe patterns.';

notify pgrst, 'reload schema';
