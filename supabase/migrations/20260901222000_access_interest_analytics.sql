-- Measure the beta access funnel without mixing recognized admin browsers into it.

alter table public.site_analytics_events
  add column if not exists actor_type text not null default 'visitor';

alter table public.site_analytics_events
  drop constraint if exists site_analytics_events_actor_type_check;

alter table public.site_analytics_events
  add constraint site_analytics_events_actor_type_check
  check (actor_type in ('visitor', 'user', 'admin'));

create index if not exists site_analytics_events_access_funnel_idx
  on public.site_analytics_events (event_name, actor_type, created_at desc, session_id);

revoke all privileges on table public.site_analytics_events from anon, authenticated;
grant select on table public.site_analytics_events to authenticated;
grant all privileges on table public.site_analytics_events to service_role;

create or replace function public.admin_analytics_summary()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allowed boolean;
  v_now timestamptz := now();
  v_today_start timestamptz := ((timezone('Europe/Madrid', now())::date)::timestamp at time zone 'Europe/Madrid');
  v_access_visitors integer := 0;
  v_access_form_opens integer := 0;
  v_access_submissions_tracked integer := 0;
  v_access_requests integer := 0;
  v_access_pending integer := 0;
  v_access_conversion numeric := 0;
  result jsonb;
begin
  select exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = auth.uid()
      and ar.active = true
      and ar.role in ('owner', 'admin', 'trusted_admin')
  ) into v_allowed;

  if not v_allowed then
    raise exception 'Acceso no autorizado';
  end if;

  select count(distinct session_id)::integer
    into v_access_visitors
    from public.site_analytics_events
   where event_name = 'access_landing_view'
     and actor_type <> 'admin'
     and created_at >= v_now - interval '30 days';

  select count(distinct session_id)::integer
    into v_access_form_opens
    from public.site_analytics_events
   where event_name = 'access_form_open'
     and actor_type <> 'admin'
     and created_at >= v_now - interval '30 days';

  select count(distinct session_id)::integer
    into v_access_submissions_tracked
    from public.site_analytics_events
   where event_name = 'access_request_submitted'
     and actor_type <> 'admin'
     and created_at >= v_now - interval '30 days';

  select count(*)::integer
    into v_access_requests
    from public.access_requests
   where created_at >= v_now - interval '30 days';

  select count(*)::integer
    into v_access_pending
    from public.access_requests
   where status = 'pending';

  if v_access_visitors > 0 then
    v_access_conversion := round((v_access_submissions_tracked::numeric * 100) / v_access_visitors, 1);
  end if;

  select jsonb_build_object(
    'activeNow', (select count(distinct session_id) from public.site_analytics_events where created_at >= v_now - interval '5 minutes'),
    'visitsToday', (select count(*) from public.site_analytics_events where created_at >= v_today_start),
    'sessionsToday', (select count(distinct session_id) from public.site_analytics_events where created_at >= v_today_start),
    'visits7d', (select count(*) from public.site_analytics_events where created_at >= v_now - interval '7 days'),
    'sessions7d', (select count(distinct session_id) from public.site_analytics_events where created_at >= v_now - interval '7 days'),
    'visits30d', (select count(*) from public.site_analytics_events where created_at >= v_now - interval '30 days'),
    'sessions30d', (select count(distinct session_id) from public.site_analytics_events where created_at >= v_now - interval '30 days'),
    'accessVisitors30d', v_access_visitors,
    'accessFormOpens30d', v_access_form_opens,
    'accessSubmissionsTracked30d', v_access_submissions_tracked,
    'accessRequests30d', v_access_requests,
    'accessPending', v_access_pending,
    'accessConversion30d', v_access_conversion,
    'topPages', coalesce((
      select jsonb_agg(jsonb_build_object('page', page, 'views', views) order by views desc)
      from (
        select page, count(*)::int as views
        from public.site_analytics_events
        where created_at >= v_now - interval '30 days'
        group by page
        order by views desc
        limit 8
      ) q
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device', device, 'views', views) order by views desc)
      from (
        select device, count(*)::int as views
        from public.site_analytics_events
        where created_at >= v_now - interval '30 days'
        group by device
        order by views desc
      ) q
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(jsonb_build_object('country', country, 'views', views) order by views desc)
      from (
        select coalesce(nullif(country, ''), 'Sin dato') as country, count(*)::int as views
        from public.site_analytics_events
        where created_at >= v_now - interval '30 days'
        group by coalesce(nullif(country, ''), 'Sin dato')
        order by views desc
        limit 8
      ) q
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(jsonb_build_object('source', source, 'views', views) order by views desc)
      from (
        select coalesce(nullif(referrer_host, ''), 'Directo') as source, count(*)::int as views
        from public.site_analytics_events
        where created_at >= v_now - interval '30 days'
        group by coalesce(nullif(referrer_host, ''), 'Directo')
        order by views desc
        limit 8
      ) q
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('date', day, 'views', views, 'sessions', sessions) order by day)
      from (
        select (timezone('Europe/Madrid', created_at)::date)::text as day,
               count(*)::int as views,
               count(distinct session_id)::int as sessions
        from public.site_analytics_events
        where created_at >= v_now - interval '14 days'
        group by timezone('Europe/Madrid', created_at)::date
        order by timezone('Europe/Madrid', created_at)::date
      ) q
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.admin_analytics_summary() from public, anon;
grant execute on function public.admin_analytics_summary() to authenticated, service_role;
