-- Record the legal version acknowledged when an anonymous visitor requests beta access.

alter table public.access_requests
  add column if not exists legal_version text,
  add column if not exists privacy_acknowledged_at timestamptz,
  add column if not exists terms_accepted_at timestamptz;

create or replace function public.submit_access_request(
  p_email text,
  p_name text,
  p_message text,
  p_legal_version text,
  p_legal_accepted boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_version text := trim(coalesce(p_legal_version, ''));
begin
  if v_email = '' or position('@' in v_email) < 2 then
    raise exception 'Email no válido';
  end if;
  if p_legal_accepted is not true or v_version <> '2026-08-17' then
    raise exception 'legal_acceptance_required';
  end if;

  insert into public.access_requests(
    email, name, message, status, legal_version,
    privacy_acknowledged_at, terms_accepted_at
  )
  values (
    v_email,
    nullif(left(trim(coalesce(p_name, '')), 200), ''),
    nullif(left(trim(coalesce(p_message, '')), 2000), ''),
    'pending', v_version, now(), now()
  )
  on conflict ((lower(email))) where status = 'pending'
  do update set
    name = excluded.name,
    message = excluded.message,
    legal_version = excluded.legal_version,
    privacy_acknowledged_at = excluded.privacy_acknowledged_at,
    terms_accepted_at = excluded.terms_accepted_at,
    created_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.submit_access_request(text, text, text, text, boolean) from public;
grant execute on function public.submit_access_request(text, text, text, text, boolean) to anon, authenticated, service_role;
