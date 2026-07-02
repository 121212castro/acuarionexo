-- AcuarioNexo · roles restringidos de administracion
-- Aplicar en Supabase antes de usar el Panel Admin.

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'trusted_admin')),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_roles enable row level security;

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = check_user
      and ar.active = true
      and ar.role in ('owner', 'admin', 'trusted_admin')
  );
$$;

-- Politica segura para frontend:
-- cada usuario autenticado solo puede leer su propio rol.
-- La gestion de roles se hace desde SQL editor/service role, no desde la app publica.
drop policy if exists admin_roles_owner_read_all on public.admin_roles;
drop policy if exists admin_roles_owner_insert on public.admin_roles;
drop policy if exists admin_roles_owner_update on public.admin_roles;
drop policy if exists admin_roles_read_own on public.admin_roles;

create policy admin_roles_read_own
  on public.admin_roles
  for select
  using (auth.uid() = user_id);

-- Primer alta manual del propietario:
-- 1. Localizar el user id en Supabase Auth.
-- 2. Ejecutar con permisos de service role o desde SQL editor:
-- insert into public.admin_roles (user_id, role, active, notes)
-- values ('USER_ID_AQUI', 'owner', true, 'Propietario AcuarioNexo')
-- on conflict (user_id) do update set role = excluded.role, active = true, updated_at = now();
