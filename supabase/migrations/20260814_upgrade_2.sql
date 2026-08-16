-- TuraX Upgrade 2 — fundație ture/angajamente, anulare 48h, rating sigur
-- Data: 2026-08-14
-- Rulează o singură dată în Supabase SQL Editor.
-- Scriptul este conceput să fie sigur la rerulare.

begin;

-- -----------------------------------------------------------------------------
-- 1) Compatibilitate cu schema veche + granturi de bază
-- -----------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select, insert, delete
on table
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

grant update
on table
  public.shifts,
  public.availability,
  public.favorites,
  public.conversations,
  public.messages,
  public.notifications,
  public.reviews
to authenticated;

-- Rolul este ales după crearea contului, deci poate fi NULL temporar.
alter table public.profiles alter column role drop not null;

update public.profiles
set role = case
  when role in ('restaurant', 'owner', 'employer') then 'manager'
  when role in ('waiter', 'manager') then role
  else null
end
where role is not null
  and role not in ('waiter', 'manager');

do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role is null or role in ('waiter', 'manager'));

-- Ratingul nu mai poate fi modificat direct de client.
revoke update on table public.profiles from authenticated;
grant update (
  id, email, role, full_name, city, experience, description,
  work_types, horeca_skills,
  location_name, location_type, location_city, location_address,
  contact_name, contact_phone, updated_at
) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- 2) Ture cu timestamps reale (inclusiv ture peste miezul nopții)
-- -----------------------------------------------------------------------------

alter table public.shifts add column if not exists starts_at timestamptz;
alter table public.shifts add column if not exists ends_at timestamptz;
alter table public.shifts add column if not exists cancelled_at timestamptz;
alter table public.shifts add column if not exists cancellation_reason text;

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

  -- Ex: 16:00 -> 02:00 înseamnă final în ziua următoare.
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

-- Backfill pentru turele deja existente.
update public.shifts
set
  starts_at = (shift_date + start_time) at time zone 'Europe/Bucharest',
  ends_at = (
    case
      when end_time <= start_time then (shift_date + 1) + end_time
      else shift_date + end_time
    end
  ) at time zone 'Europe/Bucharest'
where shift_date is not null
  and start_time is not null
  and end_time is not null;

create index if not exists shifts_starts_at_status_idx
  on public.shifts(starts_at, status);

-- Permitem și starea completed pentru evoluția completă a turei.
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
-- 3) Candidaturi / angajamente
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

-- Candidatul poate crea doar o candidatură proprie și doar ca pending.
drop policy if exists applications_insert_waiter on public.applications;
create policy applications_insert_waiter on public.applications
for insert to authenticated
with check (
  waiter_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'waiter'
  )
);

-- Citirea rămâne permisă doar participanților.
drop policy if exists applications_select_participants on public.applications;
create policy applications_select_participants on public.applications
for select to authenticated
using (
  waiter_id = auth.uid()
  or exists (
    select 1 from public.shifts s
    where s.id = applications.shift_id and s.manager_id = auth.uid()
  )
);

-- Modificările de status nu se mai fac direct din client; numai prin RPC-urile de mai jos.
drop policy if exists applications_update_participants on public.applications;
revoke update on table public.applications from authenticated;

-- Manager: acceptă/respinge, cu blocare concurentă și limită workers_needed.
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
  after_count integer;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat.';
  end if;

  if p_status not in ('accepted', 'rejected') then
    raise exception 'Status invalid.';
  end if;

  select * into a
  from public.applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Candidatura nu există.';
  end if;

  select * into s
  from public.shifts
  where id = a.shift_id
  for update;

  if not found or s.manager_id <> auth.uid() then
    raise exception 'Nu ai permisiunea să modifici această candidatură.';
  end if;

  if p_status = 'accepted' then
    if a.status = 'accepted' then
      return a;
    end if;

    if a.status <> 'pending' then
      raise exception 'Doar candidaturile în așteptare pot fi acceptate.';
    end if;

    if s.status <> 'open' then
      raise exception 'Tura nu mai este deschisă.';
    end if;

    if s.starts_at is not null and s.starts_at <= now() then
      raise exception 'Tura a început deja.';
    end if;

    select count(*) into accepted_count
    from public.applications
    where shift_id = s.id
      and status = 'accepted'
      and id <> a.id;

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

    after_count := accepted_count + 1;
    if after_count >= s.workers_needed then
      update public.shifts
      set status = 'closed', updated_at = now()
      where id = s.id and status = 'open';
    end if;

  else
    if a.status = 'accepted' then
      raise exception 'O tură deja confirmată nu poate fi respinsă. Va avea un flux separat de anulare.';
    end if;

    if a.status <> 'pending' then
      raise exception 'Această candidatură nu mai poate fi respinsă.';
    end if;

    update public.applications
    set status = 'rejected', updated_at = now()
    where id = a.id
    returning * into a;
  end if;

  return a;
end;
$$;

-- Ospătar: retrage candidatura pending oricând; o tură confirmată doar cu >48h înainte.
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
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat.';
  end if;

  select * into a
  from public.applications
  where id = p_application_id
  for update;

  if not found or a.waiter_id <> auth.uid() then
    raise exception 'Candidatura nu există sau nu îți aparține.';
  end if;

  select * into s
  from public.shifts
  where id = a.shift_id
  for update;

  if a.status = 'pending' then
    update public.applications
    set status = 'cancelled',
        cancelled_at = now(),
        cancelled_by = auth.uid(),
        cancellation_reason = 'Retrasă de ospătar înainte de confirmare',
        updated_at = now()
    where id = a.id
    returning * into a;
    return a;
  end if;

  if a.status <> 'accepted' then
    raise exception 'Această candidatură nu mai poate fi anulată.';
  end if;

  if s.starts_at is null then
    raise exception 'Ora de început a turei nu este configurată corect.';
  end if;

  if s.starts_at <= now() + interval '48 hours' then
    raise exception 'Anularea este blocată cu 48 de ore sau mai puțin înainte de începerea turei.';
  end if;

  update public.applications
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = auth.uid(),
      cancellation_reason = 'Anulată de ospătar cu mai mult de 48h înainte',
      updated_at = now()
  where id = a.id
  returning * into a;

  -- Dacă tura fusese închisă pentru că era completă, eliberarea locului o redeschide.
  if s.status = 'closed' and s.starts_at > now() then
    update public.shifts
    set status = 'open', updated_at = now()
    where id = s.id;
  end if;

  return a;
end;
$$;

-- Manager: după terminarea turei poate marca prezența / neprezentarea.
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
  if p_result not in ('completed', 'no_show') then
    raise exception 'Rezultat invalid.';
  end if;

  select * into a
  from public.applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Candidatura nu există.';
  end if;

  select * into s
  from public.shifts
  where id = a.shift_id;

  if not found or s.manager_id <> auth.uid() then
    raise exception 'Nu ai permisiunea să marchezi această prezență.';
  end if;

  if a.status <> 'accepted' then
    raise exception 'Doar o tură confirmată poate fi marcată finalizată sau no-show.';
  end if;

  if s.ends_at is null or s.ends_at > now() then
    raise exception 'Prezența poate fi marcată numai după terminarea turei.';
  end if;

  update public.applications
  set status = p_result,
      completed_at = now(),
      updated_at = now()
  where id = a.id
  returning * into a;

  return a;
end;
$$;

grant execute on function public.manager_set_application_status(uuid, text) to authenticated;
grant execute on function public.cancel_my_application(uuid) to authenticated;
grant execute on function public.manager_mark_attendance(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 4) Notificări corecte pentru schimbările de status
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
  select manager_id, location_name
  into target_manager, shift_name
  from public.shifts
  where id = new.shift_id;

  if tg_op = 'INSERT' then
    insert into public.notifications(user_id, type, title, body, data)
    values (
      target_manager,
      'application_new',
      'Candidatură nouă',
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
          when new.status = 'rejected' then coalesce(shift_name, 'Locația') || ' a ales alt candidat pentru această tură.'
          when new.status = 'completed' then 'Tura a fost marcată ca finalizată.'
          when new.status = 'no_show' then 'Managerul a marcat că nu te-ai prezentat la această tură.'
        end,
        jsonb_build_object('shift_id', new.shift_id, 'application_id', new.id, 'status', new.status)
      );

    elsif new.status = 'cancelled' then
      if new.cancelled_by = new.waiter_id then
        insert into public.notifications(user_id, type, title, body, data)
        values (
          target_manager,
          'application_cancelled',
          'Candidatură / tură anulată',
          coalesce(new.waiter_name, 'Ospătarul') || ' și-a retras participarea.',
          jsonb_build_object('shift_id', new.shift_id, 'application_id', new.id, 'status', new.status)
        );
      else
        insert into public.notifications(user_id, type, title, body, data)
        values (
          new.waiter_id,
          'application_cancelled',
          'Tura a fost anulată',
          coalesce(shift_name, 'Locația') || ' a anulat participarea ta.',
          jsonb_build_object('shift_id', new.shift_id, 'application_id', new.id, 'status', new.status)
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- Triggerul existent păstrează același nume; îl recreăm ca să fim siguri.
drop trigger if exists applications_notify on public.applications;
create trigger applications_notify
after insert or update of status on public.applications
for each row execute function public.notify_application_change();

-- -----------------------------------------------------------------------------
-- 5) Reviews/rating: mai mulți ospătari pe aceeași tură + rating calculat server-side
-- -----------------------------------------------------------------------------

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
    select
      round(avg(r.rating)::numeric, 2) as avg_rating,
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

-- Review-urile sunt vizibile utilizatorilor autentificați, dar pot fi create doar între participanți reali.
drop policy if exists reviews_select_authenticated on public.reviews;
create policy reviews_select_authenticated on public.reviews
for select to authenticated
using (true);

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
for insert to authenticated
with check (
  reviewer_id = auth.uid()
  and reviewer_id <> reviewee_id
  and exists (
    select 1
    from public.shifts s
    join public.applications a on a.shift_id = s.id
    where s.id = reviews.shift_id
      and a.status in ('completed', 'no_show')
      and (
        (reviews.reviewer_id = s.manager_id and reviews.reviewee_id = a.waiter_id)
        or
        (reviews.reviewer_id = a.waiter_id and reviews.reviewee_id = s.manager_id)
      )
  )
);

-- Reviews rămân imuabile din client după publicare.
drop policy if exists reviews_update_own on public.reviews;
drop policy if exists reviews_delete_own on public.reviews;
revoke update, delete on table public.reviews from authenticated;

-- Recalculăm ratingurile existente o dată.
do $$
declare r record;
begin
  for r in select id from public.profiles loop
    perform public.recompute_profile_rating(r.id);
  end loop;
end $$;

commit;
