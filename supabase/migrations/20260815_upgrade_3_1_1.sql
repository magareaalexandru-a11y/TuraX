-- TuraX Upgrade 3.1.1 — hardening fluxuri critice
-- 2026-08-15
-- Necesită Upgrade 3 + 3.1 deja aplicate.
-- Rerulabil. Nu șterge ture, profiluri, candidaturi sau mesaje.

begin;

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
  if auth.uid() is null then raise exception 'Trebuie să fii autentificat.'; end if;
  select * into me from public.profiles where id = auth.uid();
  if not found or me.role <> 'manager' then
    raise exception 'Doar un cont de restaurant / angajator poate publica ture.';
  end if;

  if coalesce(btrim(p_role), '') = '' then raise exception 'Alege rolul căutat.'; end if;
  if coalesce(btrim(p_location_name), '') = '' then raise exception 'Completează numele locației.'; end if;
  if coalesce(btrim(p_city), '') = '' then raise exception 'Completează orașul.'; end if;
  if p_shift_date is null or p_start_time is null or p_end_time is null then
    raise exception 'Completează data și intervalul orar.';
  end if;
  if p_workers_needed is null or p_workers_needed < 1 or p_workers_needed > 100 then
    raise exception 'Numărul de persoane necesare trebuie să fie între 1 și 100.';
  end if;
  if p_hourly_rate is null or p_hourly_rate <= 0 or p_hourly_rate > 100000 then
    raise exception 'Introdu un tarif orar valid.';
  end if;

  local_start := p_shift_date + p_start_time;
  if (local_start at time zone 'Europe/Bucharest') <= now() then
    raise exception 'Ora de început trebuie să fie în viitor.';
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

create or replace function public.apply_to_shift(p_shift_id uuid)
returns setof public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles%rowtype;
  s public.shifts%rowtype;
  accepted_count integer;
  inserted public.applications%rowtype;
begin
  if auth.uid() is null then raise exception 'Trebuie să fii autentificat.'; end if;

  select * into me from public.profiles where id = auth.uid();
  if not found or me.role <> 'waiter' then
    raise exception 'Doar un cont de ospătar poate candida.';
  end if;
  if coalesce(btrim(me.full_name), '') = ''
     or coalesce(btrim(me.city), '') = ''
     or me.experience is null then
    raise exception 'Completează profilul înainte să aplici.';
  end if;

  select * into s from public.shifts where id = p_shift_id for update;
  if not found then raise exception 'Tura nu mai există.'; end if;
  if s.status <> 'open' then raise exception 'Tura nu mai este deschisă.'; end if;
  if s.starts_at is null or s.starts_at <= now() then raise exception 'Tura a început deja.'; end if;

  if exists (
    select 1 from public.applications
    where shift_id = s.id and waiter_id = auth.uid()
  ) then
    raise exception 'Ai deja o candidatură pentru această tură.';
  end if;

  select count(*)::integer into accepted_count
  from public.applications
  where shift_id = s.id and status = 'accepted';

  if accepted_count >= s.workers_needed then
    raise exception 'Toate locurile pentru această tură sunt ocupate.';
  end if;

  insert into public.applications(
    shift_id, waiter_id, waiter_name, waiter_city,
    waiter_experience, waiter_avatar_url, status
  )
  values (
    s.id, auth.uid(), me.full_name, me.city,
    coalesce(me.experience, 0), me.avatar_url, 'pending'
  )
  returning * into inserted;

  return next inserted;
end;
$$;

create or replace function public.ensure_conversation(
  p_other_user_id uuid,
  p_shift_id uuid default null
)
returns setof public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles%rowtype;
  other_user public.profiles%rowtype;
  s public.shifts%rowtype;
  manager_id_value uuid;
  waiter_id_value uuid;
  manager_profile public.profiles%rowtype;
  waiter_profile public.profiles%rowtype;
  context_value text;
  row_value public.conversations%rowtype;
begin
  if auth.uid() is null then raise exception 'Trebuie să fii autentificat.'; end if;
  if p_other_user_id is null or p_other_user_id = auth.uid() then raise exception 'Participant invalid.'; end if;

  select * into me from public.profiles where id = auth.uid();
  if not found then raise exception 'Profilul tău nu există.'; end if;

  select * into other_user from public.profiles where id = p_other_user_id;
  if not found then raise exception 'Utilizatorul nu există.'; end if;

  if me.role = 'manager' and other_user.role = 'waiter' then
    manager_id_value := auth.uid();
    waiter_id_value := p_other_user_id;
    manager_profile := me;
    waiter_profile := other_user;
  elsif me.role = 'waiter' and other_user.role = 'manager' then
    manager_id_value := p_other_user_id;
    waiter_id_value := auth.uid();
    manager_profile := other_user;
    waiter_profile := me;
  else
    raise exception 'Conversațiile TuraX sunt între un ospătar și o locație.';
  end if;

  if p_shift_id is not null then
    select * into s from public.shifts where id = p_shift_id;
    if not found then raise exception 'Tura nu există.'; end if;
    if s.manager_id <> manager_id_value then raise exception 'Tura nu aparține acestei locații.'; end if;
    context_value := concat(
      coalesce(s.role, 'Tură'), ' · ',
      to_char(s.shift_date, 'DD.MM.YYYY'), ' · ',
      to_char(s.start_time, 'HH24:MI'), '–', to_char(s.end_time, 'HH24:MI')
    );
  end if;

  insert into public.conversations(
    shift_id, manager_id, waiter_id, manager_name, waiter_name,
    manager_avatar_url, waiter_avatar_url, shift_context
  )
  values (
    p_shift_id, manager_id_value, waiter_id_value,
    coalesce(manager_profile.location_name, 'Locație HoReCa'),
    coalesce(waiter_profile.full_name, 'Ospătar'),
    manager_profile.avatar_url, waiter_profile.avatar_url, context_value
  )
  on conflict (manager_id, waiter_id)
  do update set
    shift_id = coalesce(excluded.shift_id, public.conversations.shift_id),
    shift_context = coalesce(excluded.shift_context, public.conversations.shift_context),
    manager_name = excluded.manager_name,
    waiter_name = excluded.waiter_name,
    manager_avatar_url = excluded.manager_avatar_url,
    waiter_avatar_url = excluded.waiter_avatar_url
  returning * into row_value;

  return next row_value;
end;
$$;

create or replace function public.sync_my_avatar(p_avatar_url text)
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'Trebuie să fii autentificat.'; end if;
  if coalesce(btrim(p_avatar_url), '') = '' then raise exception 'URL fotografie invalid.'; end if;

  update public.profiles
  set avatar_url = p_avatar_url, updated_at = now()
  where id = auth.uid()
  returning * into me;

  if not found then raise exception 'Profilul nu există.'; end if;

  if me.role = 'manager' then
    update public.shifts set manager_avatar_url = p_avatar_url where manager_id = auth.uid();
    update public.conversations set manager_avatar_url = p_avatar_url where manager_id = auth.uid();
  elsif me.role = 'waiter' then
    update public.availability set waiter_avatar_url = p_avatar_url where waiter_id = auth.uid();
    update public.applications set waiter_avatar_url = p_avatar_url where waiter_id = auth.uid();
    update public.conversations set waiter_avatar_url = p_avatar_url where waiter_id = auth.uid();
  end if;

  return next me;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.conversations%rowtype;
begin
  if auth.uid() is null then raise exception 'Trebuie să fii autentificat.'; end if;

  select * into c from public.conversations where id = p_conversation_id;
  if not found or (c.manager_id <> auth.uid() and c.waiter_id <> auth.uid()) then
    raise exception 'Nu ai acces la această conversație.';
  end if;

  update public.messages
  set read_at = coalesce(read_at, now())
  where conversation_id = p_conversation_id
    and sender_id <> auth.uid()
    and read_at is null;

  update public.notifications
  set read_at = coalesce(read_at, now())
  where user_id = auth.uid()
    and type = 'message_new'
    and data ->> 'conversation_id' = p_conversation_id::text
    and read_at is null;
end;
$$;

revoke insert, update, delete on table public.shifts from authenticated;
revoke insert, update, delete on table public.applications from authenticated;
revoke insert, update, delete on table public.conversations from authenticated;
revoke update on table public.messages from authenticated;

revoke update on table public.availability from authenticated;
grant update (
  waiter_name, city, available_date, start_time, end_time,
  desired_rate, waiter_avatar_url, updated_at
) on public.availability to authenticated;

-- Funcțiile SECURITY DEFINER nu rămân executabile generic prin rolul PUBLIC.
revoke all on function public.publish_shift(text, text, text, text, date, time, time, integer, numeric, text) from public;
revoke all on function public.apply_to_shift(uuid) from public;
revoke all on function public.ensure_conversation(uuid, uuid) from public;
revoke all on function public.sync_my_avatar(text) from public;
revoke all on function public.mark_conversation_read(uuid) from public;

grant execute on function public.publish_shift(text, text, text, text, date, time, time, integer, numeric, text) to authenticated;
grant execute on function public.apply_to_shift(uuid) to authenticated;
grant execute on function public.ensure_conversation(uuid, uuid) to authenticated;
grant execute on function public.sync_my_avatar(text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Hardening și pentru RPC-urile critice din Upgrade 3.
revoke all on function public.manager_set_application_status(uuid, text) from public;
revoke all on function public.cancel_my_application(uuid) from public;
revoke all on function public.manager_cancel_shift(uuid, text) from public;
revoke all on function public.manager_mark_attendance(uuid, text) from public;
revoke all on function public.submit_shift_review(uuid, uuid, integer, text) from public;
grant execute on function public.manager_set_application_status(uuid, text) to authenticated;
grant execute on function public.cancel_my_application(uuid) to authenticated;
grant execute on function public.manager_cancel_shift(uuid, text) to authenticated;
grant execute on function public.manager_mark_attendance(uuid, text) to authenticated;
grant execute on function public.submit_shift_review(uuid, uuid, integer, text) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['shifts','availability','applications','conversations','notifications']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

commit;
