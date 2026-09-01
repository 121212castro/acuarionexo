-- Evaluate the current user once per statement when checking analytics access.

drop policy if exists admins_can_read_site_analytics
  on public.site_analytics_events;

create policy admins_can_read_site_analytics
  on public.site_analytics_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_roles as ar
      where ar.user_id = (select auth.uid())
        and ar.active is true
        and ar.role = any (array['owner', 'admin', 'trusted_admin'])
    )
  );
