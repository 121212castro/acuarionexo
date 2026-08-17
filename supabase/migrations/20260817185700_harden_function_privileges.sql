-- Reduce the exposed RPC surface and make function name resolution deterministic.

alter function internal.measurement_key(text) set search_path = '';
alter function public.normalize_invertebrate_library_entry() set search_path = '';
alter function public.set_support_reports_updated_at() set search_path = '';

-- Quota helpers are authenticated/self-scoped. Anonymous callers do not need
-- them; service_role remains available to server-side workers.
revoke execute on function public.ai_check_quota() from public, anon;
revoke execute on function public.ai_check_quota_for_user(uuid) from public, anon;
revoke execute on function public.ai_quota_status() from public, anon;
revoke execute on function public.ai_quota_status_for_user(uuid) from public, anon;
grant execute on function public.ai_check_quota() to authenticated, service_role;
grant execute on function public.ai_check_quota_for_user(uuid) to authenticated, service_role;
grant execute on function public.ai_quota_status() to authenticated, service_role;
grant execute on function public.ai_quota_status_for_user(uuid) to authenticated, service_role;

-- Authorization helpers are used inside RLS policies but must not be callable
-- without a signed-in session.
revoke execute on function public.is_library_editor(uuid) from public, anon;
grant execute on function public.is_library_editor(uuid) to authenticated, service_role;

-- Trigger functions execute through their triggers and are not public RPCs.
revoke execute on function public.enforce_library_generation_ai_quota() from public, anon, authenticated;
revoke execute on function public.remove_completed_library_generation_job() from public, anon, authenticated;
revoke execute on function public.route_blocked_library_generation_to_review() from public, anon, authenticated;
grant execute on function public.enforce_library_generation_ai_quota() to service_role;
grant execute on function public.remove_completed_library_generation_job() to service_role;
grant execute on function public.route_blocked_library_generation_to_review() to service_role;

-- Keep the two intentional anonymous access endpoints explicit.
revoke execute on function public.can_register_email(text) from public;
revoke execute on function public.submit_access_request(text, text, text) from public;
grant execute on function public.can_register_email(text) to anon, authenticated, service_role;
grant execute on function public.submit_access_request(text, text, text) to anon, authenticated, service_role;

-- Prevent new functions created by postgres from becoming public RPC endpoints
-- unless a migration grants the required roles deliberately.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
