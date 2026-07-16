-- Store image dimensions for orientation filters (landscape / portrait / square)

alter table public.media_assets
  add column if not exists width integer,
  add column if not exists height integer;

alter table public.media_assets
  drop constraint if exists media_assets_width_positive;

alter table public.media_assets
  add constraint media_assets_width_positive
  check (width is null or width > 0);

alter table public.media_assets
  drop constraint if exists media_assets_height_positive;

alter table public.media_assets
  add constraint media_assets_height_positive
  check (height is null or height > 0);

comment on column public.media_assets.width is
  'Pixel width after web processing (EXIF-rotated).';
comment on column public.media_assets.height is
  'Pixel height after web processing (EXIF-rotated).';
