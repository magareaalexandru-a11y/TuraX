-- TuraX Hotfix 3.1.3.1
-- Profil profesional public sigur pentru Restaurant / Angajator
-- NU expune emailul sau telefonul profesionistului.

begin;

create or replace function public.get_worker_public_profile(
  p_waiter_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'manager'
  ) then
    raise exception 'Doar un Restaurant / Angajator poate vedea acest profil.';
  end if;

  select jsonb_build_object(
    'waiter_id', p.id,
    'full_name', p.full_name,
    'city', p.city,
    'experience', p.experience,
    'description', p.description,
    'worker_roles', coalesce(p.worker_roles, '{}'::text[]),
    'work_types', coalesce(p.work_types, '{}'::text[]),
    'horeca_skills', coalesce(p.horeca_skills, '{}'::text[]),
    'avatar_url', p.avatar_url,
    'rating', p.rating,
    'review_count', coalesce(p.review_count, 0),
    'availability',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', a.id,
              'available_date', a.available_date,
              'start_time', a.start_time,
              'end_time', a.end_time,
              'desired_rate', a.desired_rate
            )
            order by a.available_date, a.start_time
          )
          from public.availability a
          where a.waiter_id = p.id
            and a.available_date >= current_date
        ),
        '[]'::jsonb
      )
  )
  into result
  from public.profiles p
  where p.id = p_waiter_id
    and p.role = 'waiter';

  if result is null then
    raise exception 'Profilul profesionistului nu există.';
  end if;

  return result;
end;
$$;

revoke all
on function public.get_worker_public_profile(uuid)
from public;

grant execute
on function public.get_worker_public_profile(uuid)
to authenticated;

commit;
