-- Short link for Artful Lodger grand opening cards / QR
insert into public.campaigns (slug, name, destination_url, notes)
values (
  'al',
  'Artful Lodger grand opening',
  '/artful-lodger',
  'Cards and arrangements at Artful Lodger grand opening'
)
on conflict (slug) do update set
  name = excluded.name,
  destination_url = excluded.destination_url,
  notes = excluded.notes,
  is_active = true,
  updated_at = now();
