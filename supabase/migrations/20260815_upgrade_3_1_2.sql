-- TuraX Upgrade 3.1.2
-- UX publicare + catalog ospatari + reguli 60 minute + fix availability
begin;

-- Fix permanent pentru upsert-ul disponibilitatii.
grant select, insert, delete on table public.availability to authenticated;
revoke update on table public.availability from authenticated;
grant update (
  waiter_id, waiter_name, city, available_date, start_time, end_time,
  desired_rate, waiter_avatar_url, updated_at
) on table public.availability to authenticated;

-- Publicarea unei ture: minimum 60 minute in viitor, verificat server-side.
create or replace function public.publish_shift(
  p_role text,
  p_location_name text,
  p_city text,
  p_address text,
  p_shift_date date,
  p_start_time time,
  p_end_time time,
  p_workers_needed integer,
  p_hourly_rate numeric,
  p_description text default null
)
returns setof public.shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles%rowtype;
  local_start timestamp;
  inserted public.shifts%rowtype;
begin
  if auth.uid() is null then raise exception 'Trebuie sa fii autentificat.'; end if;
  select * into me from public.profiles where id = auth.uid();
  if not found or me.role <> 'manager' then
    raise exception 'Doar un cont de restaurant / angajator poate publica ture.';
  end if;

  if coalesce(btrim(p_role), '') = '' then raise exception 'Alege rolul cautat.'; end if;
  if coalesce(btrim(p_location_name), '') = '' then raise exception 'Completeaza numele locatiei.'; end if;
  if coalesce(btrim(p_city), '') = '' then raise exception 'Completeaza orasul.'; end if;
  if p_shift_date is null or p_start_time is null or p_end_time is null then
    raise exception 'Completeaza data si intervalul orar.';
  end if;
  if p_workers_needed is null or p_workers_needed < 1 or p_workers_needed > 100 then
    raise exception 'Numarul de persoane necesare trebuie sa fie intre 1 si 100.';
  end if;
  if p_hourly_rate is null or p_hourly_rate <= 0 or p_hourly_rate > 100000 then
    raise exception 'Introdu un tarif orar valid.';
  end if;

  local_start := p_shift_date + p_start_time;
  if (local_start at time zone 'Europe/Bucharest') < now() + interval '60 minutes' then
    raise exception 'Tura trebuie sa inceapa cu cel putin 60 de minute de acum.';
  end if;

  insert into public.shifts(
    manager_id, role, location_name, city, address,
    shift_date, start_time, end_time, workers_needed,
    hourly_rate, description, manager_avatar_url, status
  )
  values (
    auth.uid(), btrim(p_role), btrim(p_location_name), btrim(p_city),
    nullif(btrim(coalesce(p_address, '')), ''),
    p_shift_date, p_start_time, p_end_time, p_workers_needed,
    p_hourly_rate, nullif(btrim(coalesce(p_description, '')), ''),
    me.avatar_url, 'open'
  )
  returning * into inserted;

  return next inserted;
end;
$$;
revoke all on function public.publish_shift(text,text,text,text,date,time,time,integer,numeric,text) from public;
grant execute on function public.publish_shift(text,text,text,text,date,time,time,integer,numeric,text) to authenticated;

-- Disponibilitatea publicata pentru azi trebuie sa inceapa cu minimum 60 minute in viitor.
create or replace function public.validate_availability_lead_time()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.available_date = (now() at time zone 'Europe/Bucharest')::date then
    if ((new.available_date + new.start_time) at time zone 'Europe/Bucharest') < now() + interval '60 minutes' then
      raise exception 'Disponibilitatea pentru azi trebuie sa inceapa cu cel putin 60 de minute de acum.';
    end if;
  elsif new.available_date < (now() at time zone 'Europe/Bucharest')::date then
    raise exception 'Nu poti publica disponibilitate in trecut.';
  end if;
  return new;
end;
$$;

drop trigger if exists availability_lead_time_guard on public.availability;
create trigger availability_lead_time_guard
before insert or update of available_date, start_time on public.availability
for each row execute function public.validate_availability_lead_time();

-- Catalog profesional: expune managerilor doar campurile publice ale ospatarilor.
create or replace function public.list_waiter_directory()
returns table (
  waiter_id uuid,
  waiter_name text,
  city text,
  experience integer,
  description text,
  work_types text[],
  horeca_skills text[],
  waiter_avatar_url text,
  rating numeric,
  review_count integer,
  next_available_date date,
  next_start_time time,
  next_end_time time,
  desired_rate numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    coalesce(p.full_name, 'Ospatar'),
    p.city,
    p.experience,
    p.description,
    coalesce(p.work_types, '{}'::text[]),
    coalesce(p.horeca_skills, '{}'::text[]),
    p.avatar_url,
    p.rating,
    coalesce(p.review_count, 0),
    a.available_date,
    a.start_time,
    a.end_time,
    a.desired_rate
  from public.profiles p
  left join lateral (
    select av.available_date, av.start_time, av.end_time, av.desired_rate
    from public.availability av
    where av.waiter_id = p.id
      and av.available_date >= (now() at time zone 'Europe/Bucharest')::date
    order by av.available_date asc, av.start_time asc
    limit 1
  ) a on true
  where p.role = 'waiter'
    and exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'manager'
    )
  order by
    case when a.available_date is null then 1 else 0 end,
    a.available_date asc nulls last,
    coalesce(p.rating, 0) desc,
    coalesce(p.full_name, '') asc;
$$;
revoke all on function public.list_waiter_directory() from public;
grant execute on function public.list_waiter_directory() to authenticated;

commit;
