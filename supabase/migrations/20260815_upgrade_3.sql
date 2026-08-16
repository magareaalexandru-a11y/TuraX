-- TuraX Upgrade 3
-- Lifecycle complet: anulări, 48h server-side, attendance/no-show, rating sigur, compatibilitate legacy
-- 2026-08-15

begin;

-- -----------------------------------------------------------------------------
-- 1) Compatibilitate + drepturi minime
-- -----------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select on table
  public.profiles,
  public.shifts,
  public.availability,
  public.applications,
  public.favorites,
  public.conversations,
  public.messages,
  public.notifications,
  public.reviews
to authenticated;

-- Profilul își păstrează doar coloanele editabile, ratingul rămâne server-side.
revoke update on table public.profiles from authenticated;
grant update (
  id, email, role, full_name, city, experience, description,
  work_types, horeca_skills,
  location_name, location_type, location_city, location_address,
  contact_name, contact_phone, updated_at
) on public.profiles to authenticated;

-- Curățăm NOT NULL-urile rămase din vechea schemă shifts, fără să ștergem coloane/date.
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

alter table public.profiles alter column role drop not null;

-- -----------------------------------------------------------------------------
-- 2) Timestamps reale + lifecycle ture
-- -----------------------------------------------------------------------------

alter table public.shifts add column if not exists starts_at timestamptz;
alter table public.shifts add column if not exists ends_at timestamptz;
alter table public.shifts add column if not exists cancelled_at timestamptz;
alter table public.shifts add column if not exists cancellation_reason text;
alter table public.shifts add column if not exists filled_positions integer not null default 0;

create or replace function public.sync_shift_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  local_start timestamp;
  local_end timestamp;
begin
  if new.shift_date is null or new.start_time is null or new.end_time is null then
    return new;
  end if;

  local_start := new.shift_date + new.start_time;
  local_end := new.shift_date + new.end_time;
  if new.end_time <= new.start_time then
    local_end := (new.shift_date + 1) + new.end_time;
  end if;

  new.starts_at := local_start at time zone 'Europe/Bucharest';
  new.ends_at := local_end at time zone 'Europe/Bucharest';
  return new;
end;
$$;

drop trigger if exists shifts_sync_timestamps on public.shifts;
create trigger shifts_sync_timestamps
before insert or update of shift_date, start_time, end_time
on public.shifts
for each row execute function public.sync_shift_timestamps();

update public.shifts
set
  starts_at = (shift_date + start_time) at time zone 'Europe/Bucharest',
  ends_at = (
    case
      when end_time <= start_time then (shift_date + 1) + end_time
      else shift_date + end_time
    end
  ) at time zone 'Europe/Bucharest'
where shift_date is not null and start_time is not null and end_time is not null;

-- Statusurile noi.
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.shifts'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.shifts drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.shifts
  add constraint shifts_status_check
  check (status in ('open', 'closed', 'cancelled', 'completed'));

-- -----------------------------------------------------------------------------
-- 3) Candidaturi/angajamente
-- -----------------------------------------------------------------------------

alter table public.applications add column if not exists accepted_at timestamptz;
alter table public.applications add column if not exists cancelled_at timestamptz;
alter table public.applications add column if not exists cancelled_by uuid references auth.users(id) on delete set null;
alter table public.applications add column if not exists cancellation_reason text;
alter table public.applications add column if not exists completed_at timestamptz;

do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.applications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.applications drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.applications
  add constraint applications_status_check
  check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed', 'no_show'));

-- Statusurile nu pot fi schimbate direct de client.
drop policy if exists applications_update_participants on public.applications;
revoke update on table public.applications from authenticated;

-- Sincronizează locurile și starea turei după orice schimbare de angajament.
create or replace function public.sync_shift_filled_positions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_shift uuid;
  accepted_count integer;
  terminal_count integer;
  s public.shifts%rowtype;
begin
  target_shift := case when tg_op = 'DELETE' then old.shift_id else new.shift_id end;

  select * into s from public.shifts where id = target_shift for update;
  if not found then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  select count(*)::integer into accepted_count
  from public.applications
  where shift_id = target_shift and status = 'accepted';

  select count(*)::integer into terminal_count
  from public.applications
  where shift_id = target_shift and status in ('completed', 'no_show');

  update public.shifts
  set filled_positions = accepted_count,
      status = case
        when s.status = 'cancelled' then 'cancelled'
        when s.ends_at is not null and s.ends_at <= now() and accepted_count = 0 and terminal_count > 0 then 'completed'
        when s.starts_at is not null and s.starts_at > now() and accepted_count >= s.workers_needed then 'closed'
        when s.starts_at is not null and s.starts_at > now() and accepted_count < s.workers_needed and s.status = 'closed' then 'open'
        else s.status
      end,
      updated_at = now()
  where id = target_shift;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists applications_sync_shift_filled_positions on public.applications;
create trigger applications_sync_shift_filled_positions
after insert or delete or update of status, shift_id
on public.applications
for each row execute function public.sync_shift_filled_positions();

-- Backfill filled positions.
update public.shifts s
set filled_positions = (
  select count(*)::integer
  from public.applications a
  where a.shift_id = s.id and a.status = 'accepted'
);

-- -----------------------------------------------------------------------------
-- 4) Acceptare/respingere cu limită workers_needed
-- -----------------------------------------------------------------------------

create or replace function public.manager_set_application_status(
  p_application_id uuid,
  p_status text
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.applications%rowtype;
  s public.shifts%rowtype;
  accepted_count integer;
begin
  if auth.uid() is null then raise exception 'Trebuie să fii autentificat.'; end if;
  if p_status not in ('accepted', 'rejected') then raise exception 'Status invalid.'; end if;

  select * into a from public.applications where id = p_application_id for update;
  if not found then raise exception 'Candidatura nu există.'; end if;

  select * into s from public.shifts where id = a.shift_id for update;
  if not found or s.manager_id <> auth.uid() then
    raise exception 'Nu ai permisiunea să modifici această candidatură.';
  end if;

  if p_status = 'accepted' then
    if a.status = 'accepted' then return a; end if;
    if a.status <> 'pending' then raise exception 'Doar candidaturile în așteptare pot fi acceptate.'; end if;
    if s.status <> 'open' then raise exception 'Tura nu mai este deschisă.'; end if;
    if s.starts_at is not null and s.starts_at <= now() then raise exception 'Tura a început deja.'; end if;

    select count(*)::integer into accepted_count
    from public.applications
    where shift_id = s.id and status = 'accepted' and id <> a.id;

    if accepted_count >= s.workers_needed then
      raise exception 'Toate locurile pentru această tură sunt deja ocupate.';
    end if;

    update public.applications
    set status = 'accepted',
        accepted_at = coalesce(accepted_at, now()),
        cancelled_at = null,
        cancelled_by = null,
        cancellation_reason = null,
        updated_at = now()
    where id = a.id
    returning * into a;
  else
    if a.status <> 'pending' then raise exception 'Doar candidaturile în așteptare pot fi respinse.'; end if;
    update public.applications set status = 'rejected', updated_at = now()
    where id = a.id returning * into a;
  end if;

  return a;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5) Regula 48h — obligatoriu pe server
-- -----------------------------------------------------------------------------

create or replace function public.cancel_my_application(p_application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.applications%rowtype;
  s public.shifts%rowtype;
begin
  if auth.uid() is null then raise exception 'Trebuie să fii autentificat.'; end if;

  select * into a from public.applications where id = p_application_id for update;
  if not found or a.waiter_id <> auth.uid() then
    raise exception 'Candidatura nu există sau nu îți aparține.';
  end if;

  select * into s from public.shifts where id = a.shift_id for update;

  if a.status = 'pending' then
    update public.applications
    set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(),
        cancellation_reason = 'Retrasă de ospătar înainte de confirmare', updated_at = now()
    where id = a.id returning * into a;
    return a;
  end if;

  if a.status <> 'accepted' then raise exception 'Această candidatură nu mai poate fi anulată.'; end if;
  if s.starts_at is null then raise exception 'Ora de început a turei nu este configurată corect.'; end if;
  if s.starts_at <= now() + interval '48 hours' then
    raise exception 'Anularea este blocată cu 48 de ore sau mai puțin înainte de începerea turei.';
  end if;

  update public.applications
  set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(),
      cancellation_reason = 'Anulată de ospătar cu mai mult de 48h înainte', updated_at = now()
  where id = a.id returning * into a;

  return a;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6) Managerul poate anula întreaga tură
-- -----------------------------------------------------------------------------

create or replace function public.manager_cancel_shift(
  p_shift_id uuid,
  p_reason text default null
)
returns public.shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.shifts%rowtype;
begin
  if auth.uid() is null then raise exception 'Trebuie să fii autentificat.'; end if;

  select * into s from public.shifts where id = p_shift_id for update;
  if not found or s.manager_id <> auth.uid() then raise exception 'Nu ai permisiunea să anulezi această tură.'; end if;
  if s.status = 'completed' then raise exception 'O tură finalizată nu mai poate fi anulată.'; end if;
  if s.status = 'cancelled' then return s; end if;

  update public.shifts
  set status = 'cancelled', cancelled_at = now(),
      cancellation_reason = coalesce(nullif(trim(p_reason), ''), 'Anulată de manager'),
      updated_at = now()
  where id = p_shift_id
  returning * into s;

  update public.applications
  set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(),
      cancellation_reason = 'Tura a fost anulată de manager', updated_at = now()
  where shift_id = p_shift_id and status in ('pending', 'accepted');

  return s;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7) Attendance / no-show după terminarea turei
-- -----------------------------------------------------------------------------

create or replace function public.manager_mark_attendance(
  p_application_id uuid,
  p_result text
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.applications%rowtype;
  s public.shifts%rowtype;
begin
  if auth.uid() is null then raise exception 'Trebuie să fii autentificat.'; end if;
  if p_result not in ('completed', 'no_show') then raise exception 'Rezultat invalid.'; end if;

  select * into a from public.applications where id = p_application_id for update;
  if not found then raise exception 'Candidatura nu există.'; end if;

  select * into s from public.shifts where id = a.shift_id for update;
  if not found or s.manager_id <> auth.uid() then raise exception 'Nu ai permisiunea să marchezi această prezență.'; end if;
  if a.status <> 'accepted' then raise exception 'Doar o tură confirmată poate primi status de prezență.'; end if;
  if s.ends_at is null or s.ends_at > now() then raise exception 'Prezența poate fi marcată numai după terminarea turei.'; end if;

  update public.applications
  set status = p_result, completed_at = now(), updated_at = now()
  where id = a.id
  returning * into a;

  return a;
end;
$$;

-- -----------------------------------------------------------------------------
-- 8) Rating sigur, inclusiv rating negativ după no-show
-- -----------------------------------------------------------------------------

-- Eliminăm vechea unicitate shift+reviewer și permitem evaluarea fiecărui participant separat.
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%shift_id%'
      and pg_get_constraintdef(oid) ilike '%reviewer_id%'
  loop
    execute format('alter table public.reviews drop constraint %I', c.conname);
  end loop;
end $$;

create unique index if not exists reviews_shift_reviewer_reviewee_unique
  on public.reviews(shift_id, reviewer_id, reviewee_id);

create or replace function public.recompute_profile_rating(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set rating = stats.avg_rating,
      review_count = stats.cnt,
      updated_at = now()
  from (
    select round(avg(r.rating)::numeric, 2) as avg_rating,
           count(*)::integer as cnt
    from public.reviews r
    where r.reviewee_id = p_user_id
  ) stats
  where p.id = p_user_id;
end;
$$;

create or replace function public.reviews_refresh_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_profile_rating(old.reviewee_id);
    return old;
  end if;
  perform public.recompute_profile_rating(new.reviewee_id);
  if tg_op = 'UPDATE' and old.reviewee_id is distinct from new.reviewee_id then
    perform public.recompute_profile_rating(old.reviewee_id);
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_rating_refresh on public.reviews;
create trigger reviews_rating_refresh
after insert or update or delete on public.reviews
for each row execute function public.reviews_refresh_rating();

-- Review-urile se scriu numai prin RPC; clientul nu poate falsifica reviewer_id.
revoke insert, update, delete on table public.reviews from authenticated;
grant select on table public.reviews to authenticated;

create or replace function public.submit_shift_review(
  p_shift_id uuid,
  p_reviewee_id uuid,
  p_rating integer,
  p_comment text default null
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.shifts%rowtype;
  a public.applications%rowtype;
  r public.reviews%rowtype;
  reviewer uuid := auth.uid();
begin
  if reviewer is null then raise exception 'Trebuie să fii autentificat.'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'Ratingul trebuie să fie între 1 și 5.'; end if;
  if reviewer = p_reviewee_id then raise exception 'Nu te poți evalua singur.'; end if;

  select * into s from public.shifts where id = p_shift_id;
  if not found then raise exception 'Tura nu există.'; end if;

  if reviewer = s.manager_id then
    select * into a
    from public.applications
    where shift_id = p_shift_id
      and waiter_id = p_reviewee_id
      and status in ('completed', 'no_show')
    limit 1;
    if not found then raise exception 'Poți evalua doar ospătarii care au un rezultat final pentru această tură.'; end if;
  else
    if p_reviewee_id <> s.manager_id then raise exception 'Poți evalua doar locația acestei ture.'; end if;
    select * into a
    from public.applications
    where shift_id = p_shift_id
      and waiter_id = reviewer
      and status = 'completed'
    limit 1;
    if not found then raise exception 'Poți evalua locația numai după o tură finalizată.'; end if;
  end if;

  insert into public.reviews(shift_id, reviewer_id, reviewee_id, rating, comment)
  values (p_shift_id, reviewer, p_reviewee_id, p_rating, nullif(trim(p_comment), ''))
  on conflict (shift_id, reviewer_id, reviewee_id)
  do update set rating = excluded.rating, comment = excluded.comment, created_at = now()
  returning * into r;

  insert into public.notifications(user_id, type, title, body, data)
  values (
    p_reviewee_id,
    'review_received',
    'Ai primit un rating',
    'Ai primit ' || p_rating || ' din 5 stele pentru o tură TuraX.',
    jsonb_build_object('shift_id', p_shift_id, 'rating', p_rating)
  );

  return r;
end;
$$;

-- -----------------------------------------------------------------------------
-- 9) Notificări lifecycle
-- -----------------------------------------------------------------------------

create or replace function public.notify_application_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_manager uuid;
  shift_name text;
begin
  select manager_id, location_name into target_manager, shift_name
  from public.shifts where id = new.shift_id;

  if tg_op = 'INSERT' then
    insert into public.notifications(user_id, type, title, body, data)
    values (
      target_manager, 'application_new', 'Candidatură nouă',
      coalesce(new.waiter_name, 'Un ospătar') || ' a aplicat la tura ta.',
      jsonb_build_object('shift_id', new.shift_id, 'application_id', new.id)
    );
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status in ('accepted', 'rejected', 'completed', 'no_show') then
      insert into public.notifications(user_id, type, title, body, data)
      values (
        new.waiter_id,
        'application_status',
        case
          when new.status = 'accepted' then 'Tura confirmată'
          when new.status = 'rejected' then 'Candidatură respinsă'
          when new.status = 'completed' then 'Tura a fost finalizată'
          when new.status = 'no_show' then 'Neprezentare înregistrată'
        end,
        case
          when new.status = 'accepted' then coalesce(shift_name, 'Locația') || ' ți-a acceptat candidatura.'
          when new.status = 'rejected' then coalesce(shift_name, 'Locația') || ' a respins candidatura.'
          when new.status = 'completed' then 'Tura a fost marcată ca finalizată. Poți evalua locația.'
          when new.status = 'no_show' then 'Managerul a marcat că nu te-ai prezentat la această tură.'
        end,
        jsonb_build_object('shift_id', new.shift_id, 'application_id', new.id, 'status', new.status)
      );
    elsif new.status = 'cancelled' then
      if new.cancelled_by = new.waiter_id then
        insert into public.notifications(user_id, type, title, body, data)
        values (
          target_manager, 'application_cancelled', 'Participare anulată',
          coalesce(new.waiter_name, 'Ospătarul') || ' și-a retras participarea.',
          jsonb_build_object('shift_id', new.shift_id, 'application_id', new.id, 'status', new.status)
        );
      else
        insert into public.notifications(user_id, type, title, body, data)
        values (
          new.waiter_id, 'application_cancelled', 'Tura a fost anulată',
          coalesce(shift_name, 'Locația') || ' a anulat participarea ta.',
          jsonb_build_object('shift_id', new.shift_id, 'application_id', new.id, 'status', new.status)
        );
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists applications_notify on public.applications;
create trigger applications_notify
after insert or update of status on public.applications
for each row execute function public.notify_application_change();

-- -----------------------------------------------------------------------------
-- 10) Grants pentru RPC-uri
-- -----------------------------------------------------------------------------

grant execute on function public.manager_set_application_status(uuid, text) to authenticated;
grant execute on function public.cancel_my_application(uuid) to authenticated;
grant execute on function public.manager_cancel_shift(uuid, text) to authenticated;
grant execute on function public.manager_mark_attendance(uuid, text) to authenticated;
grant execute on function public.submit_shift_review(uuid, uuid, integer, text) to authenticated;

commit;
