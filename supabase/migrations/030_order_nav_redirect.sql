-- Point Flowers nav at self-service /order
update public.site_nav_items
set href = '/order', label = 'Flowers', is_visible = true
where href in ('/flowers', '/order');

insert into public.site_nav_items (label, href, sort_order, is_visible)
select 'Flowers', '/order', 15, true
where not exists (
  select 1 from public.site_nav_items where href = '/order'
);

notify pgrst, 'reload schema';
