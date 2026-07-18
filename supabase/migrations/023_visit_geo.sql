-- Approximate IP geolocation for campaign QR scans (Vercel headers)

alter table public.site_visit_events
  add column if not exists geo_city text;

alter table public.site_visit_events
  add column if not exists geo_region text;

alter table public.site_visit_events
  add column if not exists geo_country text;

comment on column public.site_visit_events.geo_city is
  'Approximate city from Vercel IP geo (campaign scans).';
comment on column public.site_visit_events.geo_region is
  'Approximate region / state code from Vercel IP geo.';
comment on column public.site_visit_events.geo_country is
  'Approximate country code from Vercel IP geo.';

notify pgrst, 'reload schema';
