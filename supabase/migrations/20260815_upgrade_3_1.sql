-- TuraX Upgrade 3.1
-- UX mobil, poze profil/logo, conversații unificate, statusuri și notificări citite
-- 2026-08-15
-- Script rerulabil. Nu șterge ture, candidaturi, mesaje sau profiluri.

begin;

-- -----------------------------------------------------------------------------
-- 1) Coloane noi pentru avataruri și conversații
-- -----------------------------------------------------------------------------

alter table public.profiles add column if not exists avatar_url text;
alter table public.shifts add column if not exists manager_avatar_url text;
alter table public.availability add column if not exists waiter_avatar_url text;
alter table public.applications add column if not exists waiter_avatar_url text;

alter table public.conversations add column if not exists manager_avatar_url text;
alter table public.conversations add column if not exists waiter_avatar_url text;
alter table public.conversations add column if not exists shift_context text;
alter table public.conversations add column if not exists last_message text;
alter table public.conversations add column if not exists last_message_at timestamptz;
alter table public.conversations add column if not exists last_sender_id uuid references auth.users(id) on delete set null;

-- Profilul poate modifica avatar_url, dar ratingul rămâne exclusiv server-side.
revoke update on table public.profiles from authenticated;
grant update (
  id, email, role, full_name, city, experience, description,
  work_types, horeca_skills,
  location_name, location_type, location_city, location_address,
  contact_name, contact_phone, avatar_url, updated_at
) on public.profiles to authenticated;

-- Snapshoturile de avatar pentru ture/disponibilități/conversații.
grant update on table public.shifts, public.availability, public.conversations to authenticated;

-- Ospătarul poate actualiza doar avatarul snapshot din candidaturile proprii.
grant update (waiter_avatar_url) on public.applications to authenticated;
drop policy if exists applications_update_own_avatar on public.applications;
create policy applications_update_own_avatar on public.applications
for update to authenticated
using (waiter_id = auth.uid())
with check (waiter_id = auth.uid());

-- Mesajele pot fi marcate citite, dar corpul mesajului nu poate fi rescris de client.
revoke update on table public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;
drop policy if exists messages_participants_update on public.messages;
create policy messages_participants_update on public.messages
for update to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.manager_id = auth.uid() or c.waiter_id = auth.uid())
  )
)
with check (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.manager_id = auth.uid() or c.waiter_id = auth.uid())
  )
);

-- -----------------------------------------------------------------------------
-- 2) Backfill avataruri din profilurile existente
-- -----------------------------------------------------------------------------

update public.shifts s
set manager_avatar_url = p.avatar_url
from public.profiles p
where p.id = s.manager_id
  and p.avatar_url is not null
  and s.manager_avatar_url is distinct from p.avatar_url;

update public.availability a
set waiter_avatar_url = p.avatar_url
from public.profiles p
where p.id = a.waiter_id
  and p.avatar_url is not null
  and a.waiter_avatar_url is distinct from p.avatar_url;

update public.applications a
set waiter_avatar_url = p.avatar_url
from public.profiles p
where p.id = a.waiter_id
  and p.avatar_url is not null
  and a.waiter_avatar_url is distinct from p.avatar_url;

-- Păstrăm cronologia conversațiilor în timpul backfill-ului.
alter table public.conversations disable trigger conversations_set_updated_at;

update public.conversations c
set manager_avatar_url = p.avatar_url
from public.profiles p
where p.id = c.manager_id
  and p.avatar_url is not null
  and c.manager_avatar_url is distinct from p.avatar_url;

update public.conversations c
set waiter_avatar_url = p.avatar_url
from public.profiles p
where p.id = c.waiter_id
  and p.avatar_url is not null
  and c.waiter_avatar_url is distinct from p.avatar_url;

update public.conversations c
set shift_context = concat(
  coalesce(s.role, 'Tură'), ' · ',
  to_char(s.shift_date, 'DD.MM.YYYY'), ' · ',
  to_char(s.start_time, 'HH24:MI'), '–', to_char(s.end_time, 'HH24:MI')
)
from public.shifts s
where c.shift_id = s.id
  and (c.shift_context is null or btrim(c.shift_context) = '');

-- -----------------------------------------------------------------------------
-- 3) O singură conversație logică pentru aceeași pereche manager–ospătar
-- -----------------------------------------------------------------------------

-- Indexul vechi permitea câte o conversație separată pentru fiecare tură.
drop index if exists public.conversations_shift_participants_unique;

-- Mutăm mesajele/notificările din conversațiile duplicate în cea mai recentă.
do $$
declare
  pair_row record;
  canonical_id uuid;
begin
  for pair_row in
    select manager_id, waiter_id
    from public.conversations
    group by manager_id, waiter_id
    having count(*) > 1
  loop
    select id into canonical_id
    from public.conversations
    where manager_id = pair_row.manager_id
      and waiter_id = pair_row.waiter_id
    order by updated_at desc nulls last, created_at desc, id desc
    limit 1;

    update public.messages
    set conversation_id = canonical_id
    where conversation_id in (
      select id
      from public.conversations
      where manager_id = pair_row.manager_id
        and waiter_id = pair_row.waiter_id
        and id <> canonical_id
    );

    update public.notifications n
    set data = jsonb_set(
      coalesce(n.data, '{}'::jsonb),
      '{conversation_id}',
      to_jsonb(canonical_id::text),
      true
    )
    where n.type = 'message_new'
      and n.data ? 'conversation_id'
      and (n.data ->> 'conversation_id') in (
        select id::text
        from public.conversations
        where manager_id = pair_row.manager_id
          and waiter_id = pair_row.waiter_id
          and id <> canonical_id
      );

    delete from public.conversations
    where manager_id = pair_row.manager_id
      and waiter_id = pair_row.waiter_id
      and id <> canonical_id;
  end loop;
end $$;

create unique index if not exists conversations_participants_unique
  on public.conversations(manager_id, waiter_id);

-- Ultimul mesaj pentru lista de conversații.
update public.conversations c
set last_message = (
      select m.body
      from public.messages m
      where m.conversation_id = c.id
      order by m.created_at desc, m.id desc
      limit 1
    ),
    last_message_at = (
      select m.created_at
      from public.messages m
      where m.conversation_id = c.id
      order by m.created_at desc, m.id desc
      limit 1
    ),
    last_sender_id = (
      select m.sender_id
      from public.messages m
      where m.conversation_id = c.id
      order by m.created_at desc, m.id desc
      limit 1
    )
where exists (
  select 1 from public.messages m where m.conversation_id = c.id
);

update public.conversations
set updated_at = coalesce(last_message_at, updated_at, created_at);

alter table public.conversations enable trigger conversations_set_updated_at;

-- -----------------------------------------------------------------------------
-- 4) Trigger mesaje: ultimul mesaj + notificare
-- -----------------------------------------------------------------------------

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
  select * into c
  from public.conversations
  where id = new.conversation_id;

  if c.id is null then
    return new;
  end if;

  recipient := case
    when new.sender_id = c.manager_id then c.waiter_id
    else c.manager_id
  end;

  sender_name := case
    when new.sender_id = c.manager_id then coalesce(c.manager_name, 'Locație HoReCa')
    else coalesce(c.waiter_name, 'Ospătar')
  end;

  update public.conversations
  set last_message = new.body,
      last_message_at = new.created_at,
      last_sender_id = new.sender_id,
      updated_at = new.created_at
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

-- -----------------------------------------------------------------------------
-- 5) Storage public pentru poze de profil / logo-uri TuraX
-- -----------------------------------------------------------------------------

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'turax-avatars',
  'turax-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists turax_avatars_public_read on storage.objects;
create policy turax_avatars_public_read on storage.objects
for select to public
using (bucket_id = 'turax-avatars');

drop policy if exists turax_avatars_insert_own on storage.objects;
create policy turax_avatars_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'turax-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists turax_avatars_update_own on storage.objects;
create policy turax_avatars_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'turax-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'turax-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists turax_avatars_delete_own on storage.objects;
create policy turax_avatars_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'turax-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
