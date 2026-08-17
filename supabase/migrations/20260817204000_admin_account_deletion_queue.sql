-- Make account-deletion requests visible to authenticated administrators.

create or replace function public.admin_account_deletion_requests()
returns table(
  id uuid,
  user_id uuid,
  email text,
  status text,
  reason text,
  requested_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'admin_required';
  end if;

  return query
    select r.id, r.user_id, r.email, r.status, r.reason,
           r.requested_at, r.cancelled_at, r.completed_at, r.updated_at
    from public.account_deletion_requests r
    order by
      case when r.status = 'pending' then 0 else 1 end,
      r.requested_at desc;
end;
$$;

revoke execute on function public.admin_account_deletion_requests() from public, anon;
grant execute on function public.admin_account_deletion_requests() to authenticated, service_role;
