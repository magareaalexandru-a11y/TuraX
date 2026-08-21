create or replace function public.current_profile_is_complete(expected_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = expected_role
      and (
        (
          expected_role = 'waiter'
          and coalesce(btrim(p.full_name), '') <> ''
          and coalesce(btrim(p.city), '') <> ''
          and p.experience is not null
          and p.experience >= 0
          and coalesce(array_length(p.worker_roles, 1), 0) > 0
          and coalesce(array_length(p.work_types, 1), 0) > 0
          and coalesce(array_length(p.horeca_skills, 1), 0) > 0
        )
        or
        (
          expected_role = 'manager'
          and coalesce(btrim(p.location_name), '') <> ''
          and coalesce(btrim(p.location_type), '') <> ''
          and coalesce(btrim(p.location_city), '') <> ''
          and coalesce(btrim(p.location_address), '') <> ''
          and coalesce(btrim(p.contact_name), '') <> ''
          and coalesce(btrim(p.contact_phone), '') <> ''
        )
      )
  );
$$;

revoke all on function public.current_profile_is_complete(text) from public;
grant execute on function public.current_profile_is_complete(text) to authenticated;

drop policy if exists availability_insert_own on public.availability;
create policy availability_insert_own
on public.availability
for insert
to authenticated
with check (
  waiter_id = auth.uid()
  and public.current_profile_is_complete('waiter')
);

drop policy if exists shifts_insert_manager on public.shifts;
create policy shifts_insert_manager
on public.shifts
for insert
to authenticated
with check (
  manager_id = auth.uid()
  and public.current_profile_is_complete('manager')
);

create or replace function public.publish_shift(
  p_role text,
  p_location_name text,
  p_city text,
  p_address text,
  p_shift_date date,
  p_start_time time without time zone,
  p_end_time time without time zone,
  p_workers_needed integer,
  p_hourly_rate numeric,
  p_description text default null::text
)
returns setof public.shifts
language plpgsql
security definer
set search_path = public
as $function$
declare
  me public.profiles%rowtype;
  local_start timestamp;
  inserted public.shifts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Trebuie sa fii autentificat.';
  end if;

  select * into me from public.profiles where id = auth.uid();

  if not found or me.role <> 'manager' then
    raise exception 'Doar un cont de restaurant / angajator poate publica ture.';
  end if;

  if not public.current_profile_is_complete('manager') then
    raise exception 'Completeaza profilul locatiei inainte de a publica o tura.';
  end if;

  if coalesce(btrim(p_role), '') = '' then
    raise exception 'Alege rolul cautat.';
  end if;

  if coalesce(btrim(p_location_name), '') = '' then
    raise exception 'Completeaza numele locatiei.';
  end if;

  if coalesce(btrim(p_city), '') = '' then
    raise exception 'Completeaza orasul.';
  end if;

  if p_shift_date is null or p_start_time is null or p_end_time is null then
    raise exception 'Completeaza data si intervalul orar.';
  end if;

  if p_workers_needed is null or p_workers_needed < 1 or p_workers_needed > 100 then
    raise exception 'Numarul de persoane necesare trebuie sa fie intre 1 si 100.';
  end if;

  if p_hourly_rate is null or p_hourly_rate <= 0 or p_hourly_rate > 100000 then
    raise exception 'Introdu un tarif valid.';
  end if;

  local_start := p_shift_date + p_start_time;

  if (local_start at time zone 'Europe/Bucharest') < now() + interval '60 minutes' then
    raise exception 'Tura trebuie sa inceapa cu cel putin 60 de minute de acum.';
  end if;

  insert into public.shifts(
    manager_id,
    role,
    location_name,
    city,
    address,
    shift_date,
    start_time,
    end_time,
    workers_needed,
    hourly_rate,
    description,
    manager_avatar_url,
    status
  )
  values (
    auth.uid(),
    btrim(p_role),
    btrim(p_location_name),
    btrim(p_city),
    nullif(btrim(coalesce(p_address, '')), ''),
    p_shift_date,
    p_start_time,
    p_end_time,
    p_workers_needed,
    p_hourly_rate,
    nullif(btrim(coalesce(p_description, '')), ''),
    me.avatar_url,
    'open'
  )
  returning * into inserted;

  return next inserted;
end;
$function$;
