alter table public.shifts
  drop column if exists restaurant_id;

drop table if exists public.availabilities;
drop table if exists public.waiter_profiles;
drop table if exists public.restaurants;
