-- TuraX Upgrade 2.1
-- UX + compatibilitate legacy + filled_positions server-side
-- 2026-08-14

begin;

-- Coloanele rămase din vechea schemă nu mai trebuie să blocheze inserturile noi.
do $$
declare
  r record;
begin
  for r in
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'shifts'
      and is_nullable = 'NO'
      and column_name not in (
        'id', 'manager_id', 'role', 'location_name', 'city',
        'shift_date', 'start_time', 'end_time', 'workers_needed',
        'hourly_rate', 'status', 'created_at', 'updated_at'
      )
  loop
    execute format('alter table public.shifts alter column %I drop not null', r.column_name);
  end loop;
end $$;

-- Numărul de locuri ocupate devine o valoare server-side, derivată din candidaturile acceptate.
alter table public.shifts
  add column if not exists filled_positions integer not null default 0;

update public.shifts s
set filled_positions = (
  select count(*)::integer
  from public.applications a
  where a.shift_id = s.id
    and a.status = 'accepted'
);

create or replace function public.sync_shift_filled_positions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_shift uuid;
begin
  target_shift := case when tg_op = 'DELETE' then old.shift_id else new.shift_id end;

  update public.shifts s
  set filled_positions = (
        select count(*)::integer
        from public.applications a
        where a.shift_id = target_shift
          and a.status = 'accepted'
      ),
      updated_at = now()
  where s.id = target_shift;

  if tg_op = 'UPDATE' and old.shift_id is distinct from new.shift_id then
    update public.shifts s
    set filled_positions = (
          select count(*)::integer
          from public.applications a
          where a.shift_id = old.shift_id
            and a.status = 'accepted'
        ),
        updated_at = now()
    where s.id = old.shift_id;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists applications_sync_shift_filled_positions on public.applications;
create trigger applications_sync_shift_filled_positions
after insert or delete or update of status, shift_id
on public.applications
for each row execute function public.sync_shift_filled_positions();

commit;
