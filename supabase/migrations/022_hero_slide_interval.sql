-- Homepage hero slideshow interval (milliseconds between slides)

alter table public.site_settings
  add column if not exists hero_slide_interval_ms integer not null default 14000;

alter table public.site_settings
  drop constraint if exists site_settings_hero_slide_interval_ms_range;

alter table public.site_settings
  add constraint site_settings_hero_slide_interval_ms_range
  check (hero_slide_interval_ms >= 3000 and hero_slide_interval_ms <= 60000);

comment on column public.site_settings.hero_slide_interval_ms is
  'Homepage hero slideshow dwell time in milliseconds (3s–60s).';

notify pgrst, 'reload schema';
