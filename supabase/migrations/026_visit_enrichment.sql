-- Richer first-party visit log (device, language, UTM, timezone, prior QR cookie)

alter table public.site_visit_events
  add column if not exists accept_language text;

alter table public.site_visit_events
  add column if not exists device_type text;

alter table public.site_visit_events
  add column if not exists browser text;

alter table public.site_visit_events
  add column if not exists os text;

alter table public.site_visit_events
  add column if not exists geo_timezone text;

alter table public.site_visit_events
  add column if not exists geo_latitude text;

alter table public.site_visit_events
  add column if not exists geo_longitude text;

alter table public.site_visit_events
  add column if not exists utm_source text;

alter table public.site_visit_events
  add column if not exists utm_medium text;

alter table public.site_visit_events
  add column if not exists utm_campaign text;

alter table public.site_visit_events
  add column if not exists utm_content text;

alter table public.site_visit_events
  add column if not exists utm_term text;

alter table public.site_visit_events
  add column if not exists attributed_campaign_slug text;

alter table public.site_visit_events
  add column if not exists request_host text;

comment on column public.site_visit_events.accept_language is
  'Browser Accept-Language header (preferred languages).';
comment on column public.site_visit_events.device_type is
  'mobile | tablet | desktop | unknown — parsed from user-agent.';
comment on column public.site_visit_events.browser is
  'Browser family parsed from user-agent.';
comment on column public.site_visit_events.os is
  'Operating system family parsed from user-agent.';
comment on column public.site_visit_events.geo_timezone is
  'Approximate timezone from Vercel IP geo.';
comment on column public.site_visit_events.geo_latitude is
  'Approximate latitude from Vercel IP geo.';
comment on column public.site_visit_events.geo_longitude is
  'Approximate longitude from Vercel IP geo.';
comment on column public.site_visit_events.utm_source is
  'utm_source query param when present.';
comment on column public.site_visit_events.utm_medium is
  'utm_medium query param when present.';
comment on column public.site_visit_events.utm_campaign is
  'utm_campaign query param when present.';
comment on column public.site_visit_events.utm_content is
  'utm_content query param when present.';
comment on column public.site_visit_events.utm_term is
  'utm_term query param when present.';
comment on column public.site_visit_events.attributed_campaign_slug is
  'Prior QR/short-link slug from ggf_campaign cookie, if any.';
comment on column public.site_visit_events.request_host is
  'Host header for the request (which domain was hit).';

notify pgrst, 'reload schema';
