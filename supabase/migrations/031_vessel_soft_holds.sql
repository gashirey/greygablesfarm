-- Allow vessel-only holds before fulfillment date is chosen.
-- capacity_cost stays 0 until checkout upgrades the reservation.

alter table public.ss_reservations
  alter column fulfillment_date drop not null;

alter table public.ss_reservations
  alter column capacity_cost set default 0;
