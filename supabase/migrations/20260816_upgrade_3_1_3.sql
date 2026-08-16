-- TuraX Upgrade 3.1.3
-- Profesioniști HoReCa + roluri multiple
begin;

alter table public.profiles
add column if not exists worker_roles text[]
not null default '{}'::text[];

update public.profiles
set worker_roles = array['Ospătar']::text[],
    updated_at = now()
where role = 'waiter'
  and coalesce(cardinality(worker_roles), 0) = 0;

grant update (worker_roles)
on table public.profiles
to authenticated;

create or replace function public.enforce_application_role_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  roles text[];
  wanted_role text;
begin
  select worker_roles
  into roles
  from public.profiles
  where id = new.waiter_id;

  select role
  into wanted_role
  from public.shifts
  where id = new.shift_id;

  if coalesce(cardinality(roles), 0) = 0 then
    raise exception 'Selectează cel puțin un rol profesional în profil.';
  end if;

  if not exists (
    select 1
    from unnest(roles) as r(role_name)
    where lower(btrim(r.role_name)) = lower(btrim(wanted_role))
  ) then
    raise exception 'Rolul acestei ture nu este inclus în profilul tău.';
  end if;

  return new;
end;
$$;

drop trigger if exists applications_role_match
on public.applications;

create trigger applications_role_match
before insert on public.applications
for each row
execute function public.enforce_application_role_match();

commit;
