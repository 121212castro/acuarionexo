create extension if not exists pg_net with schema extensions;

create or replace function public.verify_library_generation_worker_secret(candidate text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from vault.decrypted_secrets
    where name = 'library_generation_worker_secret'
      and decrypted_secret = candidate
  );
$$;

revoke all on function public.verify_library_generation_worker_secret(text) from public, anon, authenticated;
grant execute on function public.verify_library_generation_worker_secret(text) to service_role;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'process-library-generation-queue';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'process-library-generation-queue',
    '* * * * *',
    $cron$
      select net.http_post(
        url := (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'project_url'
        ) || '/functions/v1/library-generation-worker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'legacy_anon_key'
          )
        ),
        body := jsonb_build_object(
          'worker_secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'library_generation_worker_secret'
          )
        ),
        timeout_milliseconds := 30000
      );
    $cron$
  );
end
$$;

comment on function public.verify_library_generation_worker_secret(text)
is 'Compara en servidor el secreto recibido por el trabajador con Supabase Vault; solo service_role puede invocarla.';
