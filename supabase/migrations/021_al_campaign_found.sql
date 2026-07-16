-- Point Artful Lodger QR short link /al at the locked found landing
insert into public.campaigns (slug, name, destination_url, notes)
values (
  'al',
  'Artful Lodger / found us',
  '/found',
  'QR cards — arrangements campaign landing'
)
on conflict (slug) do update set
  name = excluded.name,
  destination_url = excluded.destination_url,
  notes = excluded.notes,
  is_active = true,
  updated_at = now();
