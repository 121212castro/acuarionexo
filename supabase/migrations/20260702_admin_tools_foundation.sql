-- AcuarioNexo · base de herramientas Admin

create table if not exists public.admin_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open','reviewing','resolved','discarded')),
  severity text not null default 'normal' check (severity in ('low','normal','high','critical')),
  area text,
  title text not null,
  details text,
  screenshot_url text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.admin_user_history (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_reports enable row level security;
alter table public.admin_user_history enable row level security;

drop policy if exists admin_reports_insert_own on public.admin_reports;
create policy admin_reports_insert_own on public.admin_reports for insert with check (auth.uid() = user_id);

drop policy if exists admin_reports_read_own on public.admin_reports;
create policy admin_reports_read_own on public.admin_reports for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists admin_reports_update_admin on public.admin_reports;
create policy admin_reports_update_admin on public.admin_reports for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists admin_user_history_read_admin on public.admin_user_history;
create policy admin_user_history_read_admin on public.admin_user_history for select using (public.is_admin(auth.uid()));

create or replace function public.admin_list_users()
returns table (user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, role text, active boolean)
language sql stable security definer set search_path = public, auth as $$
  select u.id, u.email::text, u.created_at, u.last_sign_in_at, ar.role, coalesce(ar.active,false)
  from auth.users u
  left join public.admin_roles ar on ar.user_id = u.id
  where public.is_admin(auth.uid())
  order by u.created_at desc;
$$;

create or replace function public.admin_set_role_by_email(target_email text, new_role text, make_active boolean default true)
returns table (user_id uuid, email text, role text, active boolean)
language plpgsql security definer set search_path = public, auth as $$
declare target uuid;
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin_required'; end if;
  if new_role not in ('owner','admin','trusted_admin') then raise exception 'invalid_role'; end if;
  select id into target from auth.users where lower(email) = lower(target_email) limit 1;
  if target is null then raise exception 'user_not_found'; end if;
  insert into public.admin_roles (user_id, role, active, notes)
  values (target, new_role, make_active, 'Asignado desde Panel Admin')
  on conflict (user_id) do update set role = excluded.role, active = excluded.active, updated_at = now();
  insert into public.admin_user_history (target_user_id, actor_user_id, action, details)
  values (target, auth.uid(), 'admin_role_changed', jsonb_build_object('role', new_role, 'active', make_active));
  return query select u.id, u.email::text, ar.role, ar.active from auth.users u join public.admin_roles ar on ar.user_id = u.id where u.id = target;
end;
$$;

create or replace function public.admin_get_user_history(target uuid)
returns table (id uuid, action text, details jsonb, actor_user_id uuid, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select h.id, h.action, h.details, h.actor_user_id, h.created_at
  from public.admin_user_history h
  where public.is_admin(auth.uid()) and h.target_user_id = target
  order by h.created_at desc;
$$;

grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_role_by_email(text,text,boolean) to authenticated;
grant execute on function public.admin_get_user_history(uuid) to authenticated;
