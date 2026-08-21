drop policy if exists "Waiters can apply to shifts" on public.applications;

drop policy if exists applications_insert_waiter on public.applications;
create policy applications_insert_waiter
on public.applications
for insert
to authenticated
with check (
  waiter_id = auth.uid()
  and status = 'pending'
  and public.current_profile_is_complete('waiter')
);

create or replace function public.apply_to_shift(p_shift_id uuid)
returns setof public.applications
language plpgsql
security definer
set search_path = public
as $function$
declare
  me public.profiles%rowtype;
  s public.shifts%rowtype;
  accepted_count integer;
  inserted public.applications%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat.';
  end if;

  select * into me
  from public.profiles
  where id = auth.uid();

  if not found or me.role <> 'waiter' then
    raise exception 'Doar un cont de ospătar poate candida.';
  end if;

  if not public.current_profile_is_complete('waiter') then
    raise exception 'Completează profilul înainte să aplici.';
  end if;

  select * into s
  from public.shifts
  where id = p_shift_id
  for update;

  if not found then
    raise exception 'Tura nu mai există.';
  end if;

  if s.status <> 'open' then
    raise exception 'Tura nu mai este deschisă.';
  end if;

  if s.starts_at is null or s.starts_at <= now() then
    raise exception 'Tura a început deja.';
  end if;

  if exists (
    select 1
    from public.applications
    where shift_id = s.id
      and waiter_id = auth.uid()
  ) then
    raise exception 'Ai deja o candidatură pentru această tură.';
  end if;

  select count(*)::integer
  into accepted_count
  from public.applications
  where shift_id = s.id
    and status = 'accepted';

  if accepted_count >= s.workers_needed then
    raise exception 'Toate locurile pentru această tură sunt ocupate.';
  end if;

  insert into public.applications(
    shift_id,
    waiter_id,
    waiter_name,
    waiter_city,
    waiter_experience,
    waiter_avatar_url,
    status
  )
  values (
    s.id,
    auth.uid(),
    me.full_name,
    me.city,
    coalesce(me.experience, 0),
    me.avatar_url,
    'pending'
  )
  returning * into inserted;

  return next inserted;
end;
$function$;
