alter table public.shifts
  drop constraint if exists shifts_manager_id_fkey;

alter table public.shifts
  add constraint shifts_manager_id_fkey
  foreign key (manager_id)
  references auth.users(id)
  on delete cascade;
