-- Farm events CMS: index + detail pages, multi-date schedules, content segments

create table if not exists public.farm_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  summary text not null default '',
  status text not null default 'draft',
  eyebrow text,
  subtitle text,
  index_image_url text,
  index_image_alt text not null default '',
  detail_image_url text,
  detail_image_alt text not null default '',
  cta_label text,
  cta_href text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint farm_events_slug_unique unique (slug),
  constraint farm_events_slug_format check (slug ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint farm_events_status_check check (status in ('draft', 'published', 'archived')),
  constraint farm_events_cta_href_relative check (
    cta_href is null or cta_href ~ '^/'
  )
);

create index if not exists farm_events_status_sort_idx
  on public.farm_events (status, sort_order, title);

create table if not exists public.farm_event_dates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.farm_events (id) on delete cascade,
  starts_on date not null,
  ends_on date,
  time_note text,
  label text,
  is_cancelled boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  constraint farm_event_dates_range check (
    ends_on is null or ends_on >= starts_on
  )
);

create index if not exists farm_event_dates_event_idx
  on public.farm_event_dates (event_id, sort_order, starts_on);

create table if not exists public.farm_event_segments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.farm_events (id) on delete cascade,
  segment_type text not null default 'text',
  title text,
  body text not null default '',
  image_url text,
  image_alt text not null default '',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  constraint farm_event_segments_type_check check (
    segment_type in ('text', 'bullets', 'cta', 'image')
  )
);

create index if not exists farm_event_segments_event_idx
  on public.farm_event_segments (event_id, sort_order);

alter table public.farm_events enable row level security;
alter table public.farm_event_dates enable row level security;
alter table public.farm_event_segments enable row level security;

comment on table public.farm_events is
  'Public farm events (You Picks, Photos in the Flowers, etc.).';
comment on table public.farm_event_dates is
  'Single dates or date ranges for an event.';
comment on table public.farm_event_segments is
  'Ordered content blocks on an event detail page.';

-- Seed draft events (images required before publish — set in Admin → Events)
insert into public.farm_events (
  slug, title, summary, status, eyebrow, subtitle, cta_label, cta_href, sort_order
) values
(
  'you-picks',
  'You Picks',
  'Gather your own seasonal blooms from the field — multi-date pick sessions on the farm.',
  'draft',
  'On the farm',
  'Bring scissors, a bucket, and curiosity.',
  'Contact to reserve',
  '/contact?subject=event',
  10
),
(
  'photos-in-the-flowers',
  'Photos in the Flowers',
  'Couples sessions among the blooms — multi-date evenings on the farm.',
  'draft',
  'Now booking',
  'Capture something different among seasonal flowers.',
  'Book a session',
  '/photos-in-the-blooms',
  20
)
on conflict (slug) do nothing;

insert into public.farm_event_dates (event_id, starts_on, ends_on, time_note, label, sort_order)
select e.id, d.starts_on, d.ends_on, d.time_note, d.label, d.sort_order
from public.farm_events e
join (
  values
    ('you-picks', date '2026-07-26', date '2026-07-27', 'Morning & late afternoon windows', 'Opening weekend', 10),
    ('you-picks', date '2026-08-02', date '2026-08-03', 'Morning & late afternoon windows', null, 20),
    ('photos-in-the-flowers', date '2026-07-25', null, 'Golden hour sessions', 'Friday evening', 10),
    ('photos-in-the-flowers', date '2026-08-01', null, 'Golden hour sessions', 'Friday evening', 20),
    ('photos-in-the-flowers', date '2026-08-08', null, 'Golden hour sessions', 'Friday evening', 30)
) as d(slug, starts_on, ends_on, time_note, label, sort_order)
  on d.slug = e.slug
where not exists (
  select 1 from public.farm_event_dates x where x.event_id = e.id
);

insert into public.farm_event_segments (event_id, segment_type, title, body, sort_order)
select e.id, s.segment_type, s.title, s.body, s.sort_order
from public.farm_events e
join (
  values
    (
      'you-picks',
      'text',
      'What to expect',
      E'Walk our cutting rows and gather a bucket of seasonal stems. We''ll point you toward what''s at peak and help you build a loose, natural bunch.\n\nSessions are by scheduled date — check the calendar below and contact us to hold a spot.',
      10
    ),
    (
      'you-picks',
      'bullets',
      'Good to know',
      E'Wear closed-toe shoes suitable for field paths\nBring water and sun protection\nBuckets and guidance provided on site\nWeather may shift dates — we''ll confirm by email',
      20
    ),
    (
      'you-picks',
      'cta',
      'Ready to pick?',
      'Tell us which date works and how many people are coming.',
      30
    ),
    (
      'photos-in-the-flowers',
      'text',
      'Among the blooms',
      E'A relaxed couples session in our cutting garden and greenhouse — soft light, seasonal color, and time together without the rush of a studio.\n\nPrefer the full Epic Date Night package (gallery, bouquet, mocktail)? Book through Photos in the Blooms.',
      10
    ),
    (
      'photos-in-the-flowers',
      'bullets',
      'Session notes',
      E'30–40 minutes among the flowers\nDress for the field — we''ll guide you to the best light\nMulti-date evenings through the season\nQuestions welcome before you book',
      20
    ),
    (
      'photos-in-the-flowers',
      'cta',
      'Reserve your date',
      'Choose a preferred evening and we''ll confirm by email.',
      30
    )
) as s(slug, segment_type, title, body, sort_order)
  on s.slug = e.slug
where not exists (
  select 1 from public.farm_event_segments x where x.event_id = e.id
);

-- Nav: Events (hidden until images are set and events published)
insert into public.site_nav_items (label, href, sort_order, is_visible)
select 'events', '/events', 35, false
where not exists (
  select 1 from public.site_nav_items where href = '/events'
);

notify pgrst, 'reload schema';
