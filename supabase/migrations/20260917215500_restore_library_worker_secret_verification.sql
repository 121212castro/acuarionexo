create or replace function public.verify_library_generation_worker_secret(candidate text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from vault.decrypted_secrets s
    where s.name = 'library_generation_worker_secret'
      and length(coalesce(candidate, '')) >= 24
      and s.decrypted_secret = candidate
  );
$$;

revoke all on function public.verify_library_generation_worker_secret(text) from public;
grant execute on function public.verify_library_generation_worker_secret(text) to service_role;
