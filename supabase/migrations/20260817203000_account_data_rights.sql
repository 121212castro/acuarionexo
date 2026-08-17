-- User data portability and deletion-request workflow for the closed beta.

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'cancelled', 'completed')),
  reason text,
  requested_at timestamptz not null default now(),
  cancelled_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;

revoke all privileges on table public.account_deletion_requests from public, anon, authenticated;
grant all privileges on table public.account_deletion_requests to service_role;

create or replace function public.export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester uuid := (select auth.uid());
  requester_email text;
  payload jsonb := '{}'::jsonb;
  rows_json jsonb;
  item record;
begin
  if requester is null then
    raise exception 'authentication_required';
  end if;

  select u.email::text
    into requester_email
  from auth.users u
  where u.id = requester;

  if requester_email is null then
    raise exception 'account_not_found';
  end if;

  for item in
    select * from (values
      ('aquariums', 'user_id = $1'),
      ('animals', 'user_id = $1'),
      ('aquarium_photos', 'user_id = $1'),
      ('aquarium_measurements', 'user_id = $1'),
      ('aquarium_water_changes', 'user_id = $1'),
      ('inventory_items', 'user_id = $1'),
      ('tasks', 'user_id = $1'),
      ('maintenance_events', 'user_id = $1'),
      ('water_changes', 'user_id = $1'),
      ('water_change_history', 'user_id = $1'),
      ('microfauna_cultures', 'user_id = $1'),
      ('support_reports', 'user_id = $1'),
      ('admin_reports', 'user_id = $1'),
      ('ai_usage_logs', 'user_id = $1 or actor_user_id = $1'),
      ('library_entries', 'user_id = $1'),
      ('library_generation_jobs', 'requested_by = $1'),
      ('account_plans', 'user_id = $1'),
      ('ai_billing_profiles', 'user_id = $1'),
      ('admin_roles', 'user_id = $1'),
      ('admin_user_history', 'target_user_id = $1 or actor_user_id = $1'),
      ('access_approvals', 'user_id = $1')
    ) as owned(table_name, predicate)
  loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where %s',
      item.table_name,
      item.predicate
    ) using requester into rows_json;
    payload := payload || jsonb_build_object(item.table_name, rows_json);
  end loop;

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into rows_json
  from public.access_requests t
  where lower(t.email) = lower(requester_email);
  payload := payload || jsonb_build_object('access_requests', rows_json);

  -- Audit metadata can contain repeated full copies of library entries. Export
  -- the user's audit trail without duplicating those large content snapshots.
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'entry_id', a.entry_id,
    'action', a.action,
    'old_status', a.old_status,
    'new_status', a.new_status,
    'created_at', a.created_at
  )), '[]'::jsonb)
    into rows_json
  from public.library_audit_log a
  where a.user_id = requester;
  payload := payload || jsonb_build_object('library_audit_log', rows_json);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'provider', d.provider,
    'platform', d.platform,
    'enabled', d.enabled,
    'last_seen_at', d.last_seen_at,
    'created_at', d.created_at,
    'updated_at', d.updated_at
  )), '[]'::jsonb)
    into rows_json
  from public.notification_devices d
  where d.user_id = requester;
  payload := payload || jsonb_build_object('notification_devices', rows_json);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'task_id', d.task_id,
    'provider', d.provider,
    'status', d.status,
    'response', d.response,
    'error', d.error,
    'sent_at', d.sent_at,
    'created_at', d.created_at
  )), '[]'::jsonb)
    into rows_json
  from public.notification_deliveries d
  where d.user_id = requester;
  payload := payload || jsonb_build_object('notification_deliveries', rows_json);

  select coalesce(jsonb_agg(jsonb_build_object(
    'bucket', o.bucket_id,
    'path', o.name,
    'metadata', o.metadata,
    'created_at', o.created_at,
    'updated_at', o.updated_at
  )), '[]'::jsonb)
    into rows_json
  from storage.objects o
  where o.owner_id = requester::text
     or o.name like requester::text || '/%';
  payload := payload || jsonb_build_object('storage_objects', rows_json);

  return jsonb_build_object(
    'format', 'AcuarioNexo user data export',
    'version', 1,
    'exported_at', now(),
    'account', jsonb_build_object(
      'id', requester,
      'email', requester_email,
      'created_at', (select u.created_at from auth.users u where u.id = requester),
      'last_sign_in_at', (select u.last_sign_in_at from auth.users u where u.id = requester)
    ),
    'data', payload
  );
end;
$$;

create or replace function public.my_account_deletion_request()
returns table(status text, requested_at timestamptz, cancelled_at timestamptz, completed_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.status, r.requested_at, r.cancelled_at, r.completed_at
  from public.account_deletion_requests r
  where r.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function public.request_account_deletion(p_reason text default null)
returns table(status text, requested_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester uuid := (select auth.uid());
  requester_email text;
begin
  if requester is null then
    raise exception 'authentication_required';
  end if;

  select u.email::text into requester_email
  from auth.users u
  where u.id = requester;

  if requester_email is null then
    raise exception 'account_not_found';
  end if;

  insert into public.account_deletion_requests as r
    (user_id, email, status, reason, requested_at, cancelled_at, completed_at, updated_at)
  values
    (requester, requester_email, 'pending', nullif(left(trim(p_reason), 1000), ''), now(), null, null, now())
  on conflict (user_id) do update
    set email = excluded.email,
        status = 'pending',
        reason = excluded.reason,
        requested_at = now(),
        cancelled_at = null,
        completed_at = null,
        updated_at = now();

  return query
    select r.status, r.requested_at
    from public.account_deletion_requests r
    where r.user_id = requester;
end;
$$;

create or replace function public.cancel_account_deletion()
returns table(status text, cancelled_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester uuid := (select auth.uid());
begin
  if requester is null then
    raise exception 'authentication_required';
  end if;

  update public.account_deletion_requests r
     set status = 'cancelled', cancelled_at = now(), updated_at = now()
   where r.user_id = requester
     and r.status = 'pending';

  return query
    select r.status, r.cancelled_at
    from public.account_deletion_requests r
    where r.user_id = requester;
end;
$$;

revoke execute on function public.export_my_data() from public, anon;
revoke execute on function public.my_account_deletion_request() from public, anon;
revoke execute on function public.request_account_deletion(text) from public, anon;
revoke execute on function public.cancel_account_deletion() from public, anon;

grant execute on function public.export_my_data() to authenticated, service_role;
grant execute on function public.my_account_deletion_request() to authenticated, service_role;
grant execute on function public.request_account_deletion(text) to authenticated, service_role;
grant execute on function public.cancel_account_deletion() to authenticated, service_role;
