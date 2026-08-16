
-- TuraX schema v1
-- Rulează în Supabase SQL Editor o singură dată.
-- Scriptul este conceput să fie rerulabil.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text check (role in ('waiter','manager')),
  full_name text,
  city text,
  experience integer,
  description text,
  work_types text[] default '{}',
  horeca_skills text[] default '{}',
  location_name text,
  location_type text,
  location_city text,
  location_address text,
  contact_name text,
  contact_phone text,
  rating numeric(3,2),
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists experience integer;
alter table public.profiles add column if not exists description text;
alter table public.profiles add column if not exists work_types text[] default '{}';
alter table public.profiles add column if not exists horeca_skills text[] default '{}';
alter table public.profiles add column if not exists location_name text;
alter table public.profiles add column if not exists location_type text;
alter table public.profiles add column if not exists location_city text;
alter table public.profiles add column if not exists location_address text;
alter table public.profiles add column if not exists contact_name text;
alter table public.profiles add column if not exists contact_phone text;
alter table public.profiles add column if not exists rating numeric(3,2);
alter table public.profiles add column if not exists review_count integer not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  location_name text not null,
  city text not null,
  address text,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  workers_needed integer not null default 1 check (workers_needed > 0),
  hourly_rate numeric(10,2) not null check (hourly_rate > 0),
  description text,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  waiter_id uuid not null references auth.users(id) on delete cascade,
  waiter_name text not null,
  city text,
  available_date date not null,
  start_time time not null,
  end_time time not null,
  desired_rate numeric(10,2) not null check (desired_rate > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(waiter_id, available_date)
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  waiter_id uuid not null references auth.users(id) on delete cascade,
  waiter_name text not null,
  waiter_city text,
  waiter_experience integer not null default 0,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(shift_id, waiter_id)
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, shift_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references public.shifts(id) on delete set null,
  manager_id uuid not null references auth.users(id) on delete cascade,
  waiter_id uuid not null references auth.users(id) on delete cascade,
  manager_name text,
  waiter_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_participants_idx
  on public.conversations(manager_id, waiter_id);
create index if not exists conversations_shift_idx
  on public.conversations(shift_id);
create unique index if not exists conversations_shift_participants_unique
  on public.conversations(shift_id, manager_id, waiter_id)
  where shift_id is not null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'general',
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(shift_id, reviewer_id)
);

create index if not exists shifts_date_status_idx on public.shifts(shift_date, status);
create index if not exists shifts_manager_idx on public.shifts(manager_id);
create index if not exists availability_date_idx on public.availability(available_date);
create index if not exists applications_shift_idx on public.applications(shift_id);
create index if not exists applications_waiter_idx on public.applications(waiter_id);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists shifts_set_updated_at on public.shifts;
create trigger shifts_set_updated_at
before update on public.shifts
for each row execute function public.set_updated_at();

drop trigger if exists availability_set_updated_at on public.availability;
create trigger availability_set_updated_at
before update on public.availability
for each row execute function public.set_updated_at();

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();

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
    insert into public.notifications(user_id, type, title, body, data)
    values (
      new.waiter_id,
      'application_status',
      case
        when new.status = 'accepted' then 'Tura confirmată'
        when new.status = 'rejected' then 'Candidatură actualizată'
        else 'Status candidatură'
      end,
      case
        when new.status = 'accepted' then coalesce(shift_name, 'Locația') || ' ți-a acceptat candidatura.'
        when new.status = 'rejected' then coalesce(shift_name, 'Locația') || ' a ales alt candidat pentru această tură.'
        else 'Statusul candidaturii tale este: ' || new.status
      end,
      jsonb_build_object('shift_id', new.shift_id, 'application_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists applications_notify on public.applications;
create trigger applications_notify
after insert or update of status on public.applications
for each row execute function public.notify_application_change();

create or replace function public.after_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.conversations%rowtype;
  recipient uuid;
  sender_name text;
begin
  select * into c from public.conversations where id = new.conversation_id;
  if c.id is null then return new; end if;

  recipient := case when new.sender_id = c.manager_id then c.waiter_id else c.manager_id end;
  sender_name := case when new.sender_id = c.manager_id then coalesce(c.manager_name, 'Locație HoReCa')
                      else coalesce(c.waiter_name, 'Ospătar') end;

  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;

  insert into public.notifications(user_id, type, title, body, data)
  values (
    recipient,
    'message_new',
    'Mesaj nou',
    sender_name || ' ți-a trimis un mesaj.',
    jsonb_build_object('conversation_id', new.conversation_id)
  );
  return new;
end;
$$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
after insert on public.messages
for each row execute function public.after_message_insert();

alter table public.profiles enable row level security;
alter table public.shifts enable row level security;
alter table public.availability enable row level security;
alter table public.applications enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists shifts_select_authenticated on public.shifts;
create policy shifts_select_authenticated on public.shifts
for select to authenticated
using (true);

drop policy if exists shifts_insert_manager on public.shifts;
create policy shifts_insert_manager on public.shifts
for insert to authenticated
with check (
  manager_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'manager'
  )
);

drop policy if exists shifts_update_owner on public.shifts;
create policy shifts_update_owner on public.shifts
for update to authenticated
using (manager_id = auth.uid())
with check (manager_id = auth.uid());

drop policy if exists shifts_delete_owner on public.shifts;
create policy shifts_delete_owner on public.shifts
for delete to authenticated
using (manager_id = auth.uid());

drop policy if exists availability_select on public.availability;
create policy availability_select on public.availability
for select to authenticated
using (
  waiter_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'manager'
  )
);


drop policy if exists availability_insert_own on public.availability;
create policy availability_insert_own on public.availability
for insert to authenticated
with check (
  waiter_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'waiter'
  )
);

drop policy if exists availability_update_own on public.availability;
create policy availability_update_own on public.availability
for update to authenticated
using (waiter_id = auth.uid())
with check (waiter_id = auth.uid());

drop policy if exists availability_delete_own on public.availability;
create policy availability_delete_own on public.availability
for delete to authenticated
using (waiter_id = auth.uid());

drop policy if exists applications_select_participants on public.applications;
create policy applications_select_participants on public.applications
for select to authenticated
using (
  waiter_id = auth.uid()
  or exists (
    select 1 from public.shifts s
    where s.id = shift_id and s.manager_id = auth.uid()
  )
);


drop policy if exists applications_insert_waiter on public.applications;
create policy applications_insert_waiter on public.applications
for insert to authenticated
with check (
  waiter_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'waiter'
  )
  and exists (
    select 1
    from public.shifts s
    where s.id = shift_id
      and s.status = 'open'
      and s.shift_date >= current_date
  )
);

drop policy if exists applications_update_participants on public.applications;
drop policy if exists applications_update_manager on public.applications;

create policy applications_update_manager on public.applications
for update to authenticated
using (
  exists (
    select 1
    from public.shifts s
    where s.id = shift_id
      and s.manager_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.shifts s
    where s.id = shift_id
      and s.manager_id = auth.uid()
  )
);

drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());


drop policy if exists conversations_participants on public.conversations;
create policy conversations_participants on public.conversations
for select to authenticated
using (
  manager_id = auth.uid()
  or waiter_id = auth.uid()
);

drop policy if exists conversations_insert_participants on public.conversations;
drop policy if exists conversations_insert_secure on public.conversations;

create policy conversations_insert_secure on public.conversations
for insert to authenticated
with check (
  (
    manager_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'manager'
    )
    and (
      shift_id is null
      or exists (
        select 1
        from public.shifts s
        where s.id = shift_id
          and s.manager_id = auth.uid()
      )
    )
  )
  or
  (
    waiter_id = auth.uid()
    and shift_id is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'waiter'
    )
    and exists (
      select 1
      from public.shifts s
      where s.id = shift_id
        and s.manager_id = manager_id
    )
  )
);

drop policy if exists conversations_update_participants on public.conversations;

drop policy if exists messages_participants_select on public.messages;
create policy messages_participants_select on public.messages
for select to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.manager_id = auth.uid() or c.waiter_id = auth.uid())
  )
);

drop policy if exists messages_participants_insert on public.messages;
create policy messages_participants_insert on public.messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.manager_id = auth.uid() or c.waiter_id = auth.uid())
  )
);

drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications
for select to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());


drop policy if exists reviews_select_authenticated on public.reviews;
create policy reviews_select_authenticated on public.reviews
for select to authenticated
using (true);

drop policy if exists reviews_insert_own on public.reviews;
drop policy if exists reviews_insert_participant on public.reviews;

create policy reviews_insert_participant on public.reviews
for insert to authenticated
with check (
  reviewer_id = auth.uid()
  and reviewer_id <> reviewee_id
  and (
    exists (
      select 1
      from public.shifts s
      join public.applications a
        on a.shift_id = s.id
       and a.status = 'accepted'
      where s.id = shift_id
        and s.manager_id = auth.uid()
        and a.waiter_id = reviewee_id
    )
    or
    exists (
      select 1
      from public.shifts s
      join public.applications a
        on a.shift_id = s.id
       and a.status = 'accepted'
      where s.id = shift_id
        and a.waiter_id = auth.uid()
        and s.manager_id = reviewee_id
    )
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
