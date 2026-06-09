-- Contact page image slot

insert into public.site_media_slots (slot_key, image_url, alt_text)
values (
  'contact',
  '/images/bb.jpg',
  'Seasonal flowers from Grey Gables Farm'
)
on conflict (slot_key) do nothing;
