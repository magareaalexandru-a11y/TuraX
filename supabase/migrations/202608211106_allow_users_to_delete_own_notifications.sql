drop policy if exists notifications_own_delete on public.notifications;

create policy notifications_own_delete
on public.notifications
for delete
to authenticated
using (user_id = auth.uid());
