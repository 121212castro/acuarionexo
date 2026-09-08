create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (
    select 1 from public.admin_roles ar
    where ar.user_id=v_uid and ar.active=true and ar.role in ('owner','admin','trusted_admin')
  ) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  return jsonb_build_object(
    'libraryReview', (select count(*) from public.library_entries where status = 'review'),
    'libraryValidated', (select count(*) from public.library_entries where status in ('validated','published')),
    'aquariums', (select count(*) from public.aquariums),
    'inventory', (select count(*) from public.inventory_items),
    'microfauna', (select count(*) from public.microfauna_cultures),
    'reports', (select count(*) from public.admin_reports where status in ('open','reviewing')),
    'aiUsage', (select count(*) from public.ai_usage_logs),
    'generationPending', (select count(*) from public.library_generation_jobs where status in ('pending','identifying','generating')),
    'generationErrors', (select count(*) from public.library_generation_jobs where status in ('failed','blocked'))
  );
end;
$function$;
