-- Access requests and approvals are exposed only through constrained RPCs.
-- Direct Data API table access is unnecessary even with deny-by-default RLS.

revoke all privileges on table public.access_requests from anon, authenticated;
revoke all privileges on table public.access_approvals from anon, authenticated;

grant all privileges on table public.access_requests to service_role;
grant all privileges on table public.access_approvals to service_role;
