-- Notify the owner automatically whenever a beta access request is created or renewed.

alter table public.access_requests
  add column if not exists notification_claimed_at timestamptz,
  add column if not exists notification_last_error text,
  add column if not exists notification_attempts integer not null default 0;

create or replace function public.claim_access_request_notification(p_request_id uuid)
returns table (
  id uuid,
  email text,
  name text,
  message text,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  update public.access_requests r
     set notification_claimed_at = now(),
         notification_last_error = null,
         notification_attempts = coalesce(r.notification_attempts, 0) + 1
   where r.id = p_request_id
     and r.status = 'pending'
     and r.notification_sent_at is null
     and (
       r.notification_claimed_at is null
       or r.notification_claimed_at < now() - interval '5 minutes'
     )
  returning r.id, r.email, r.name, r.message, r.created_at;
$$;

create or replace function public.finish_access_request_notification(
  p_request_id uuid,
  p_success boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.access_requests
     set notification_sent_at = case when p_success then now() else notification_sent_at end,
         notification_claimed_at = null,
         notification_last_error = case
           when p_success then null
           else nullif(left(trim(coalesce(p_error, 'notification_failed')), 700), '')
         end
   where id = p_request_id;
end;
$$;

revoke execute on function public.claim_access_request_notification(uuid) from public, anon, authenticated;
revoke execute on function public.finish_access_request_notification(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.claim_access_request_notification(uuid) to service_role;
grant execute on function public.finish_access_request_notification(uuid, boolean, text) to service_role;

create or replace function public.queue_access_request_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending' and new.notification_sent_at is null then
    perform net.http_post(
      url := 'https://vqpxhozavfzgtkqscncs.supabase.co/functions/v1/notify-access-request',
      body := jsonb_build_object('request_id', new.id),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 5000
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.queue_access_request_notification() from public, anon, authenticated;

drop trigger if exists access_request_notification_trigger on public.access_requests;
create trigger access_request_notification_trigger
after insert or update of created_at on public.access_requests
for each row
execute function public.queue_access_request_notification();

