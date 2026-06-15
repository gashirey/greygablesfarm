-- Per-slot display ratio for public image crops

alter table public.site_media_slots
  add column if not exists display_ratio text not null default '16:10';

alter table public.site_media_slots
  drop constraint if exists site_media_slots_display_ratio_check;

alter table public.site_media_slots
  add constraint site_media_slots_display_ratio_check
  check (
    display_ratio in (
      'natural',
      '16:9',
      '2:1',
      '16:10',
      '5:4',
      '4:5',
      '3:4',
      '1:1'
    )
  );

update public.site_media_slots
set display_ratio = 'natural'
where slot_key = 'about';

update public.site_media_slots
set display_ratio = '16:9'
where slot_key = 'contact';
