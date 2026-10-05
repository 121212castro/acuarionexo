#!/usr/bin/env node
/*
 * Copies the public PostgreSQL schema and data to a fresh Neon database.
 * Supabase remains untouched. Run only after creating a dedicated, empty Neon DB.
 * The Firebase UID is kept equal to the existing Supabase auth UUID so all user_id
 * references and auth.uid()-based policies continue to work behind the new API.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const source = process.env.SUPABASE_DATABASE_URL;
const target = process.env.NEON_DATABASE_URL;
if (!source || !target) {
  throw new Error('Set SUPABASE_DATABASE_URL and NEON_DATABASE_URL as secrets.');
}
if (source === target) throw new Error('Source and destination must be different databases.');

const work = mkdtempSync(join(tmpdir(), 'acuarionexo-neon-migration-'));
const dump = join(work, 'public.dump');
const usersCsv = join(work, 'auth-users.csv');
const toc = join(work, 'restore.list');

const script = String.raw`
set -euo pipefail
umask 077
trap 'rm -rf "$WORK"' EXIT

pg_dump --version
pg_dump "$SUPABASE_DATABASE_URL" --format=custom --schema=public --no-owner --no-acl --file="$DUMP"
psql "$SUPABASE_DATABASE_URL" --csv --no-psqlrc --set=ON_ERROR_STOP=1 \
  --command="select id::text as id, email, created_at::text as created_at from auth.users where deleted_at is null order by id" > "$USERS_CSV"

existing_tables="$(psql "$NEON_DATABASE_URL" --no-psqlrc --tuples-only --no-align --set=ON_ERROR_STOP=1 \
  --command="select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m','S','f')")"
if [ "$existing_tables" != "0" ]; then
  echo "Destination guard: Neon public schema is not empty; refusing to overwrite it."
  exit 3
fi
existing_auth="$(psql "$NEON_DATABASE_URL" --no-psqlrc --tuples-only --no-align --set=ON_ERROR_STOP=1 \
  --command="select coalesce(to_regclass('auth.users')::text,'')")"
if [ -n "$existing_auth" ]; then
  echo "Destination guard: auth.users already exists; refusing to overwrite it."
  exit 3
fi

psql "$NEON_DATABASE_URL" --no-psqlrc --set=ON_ERROR_STOP=1 <<'SQL'
create schema auth;
create table auth.users (
  id uuid primary key,
  email text,
  created_at timestamptz
);
create or replace function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text
language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'authenticated') $$;
create or replace function auth.jwt() returns jsonb
language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
create or replace function auth.email() returns text
language sql stable
as $$ select auth.jwt()->>'email' $$;
SQL

psql "$NEON_DATABASE_URL" --no-psqlrc --set=ON_ERROR_STOP=1 <<SQL
\\copy auth.users(id,email,created_at) from '$USERS_CSV' with (format csv, header true)
SQL

pg_restore --list "$DUMP" | grep -v ' SCHEMA - public ' > "$TOC"
pg_restore --exit-on-error --no-owner --no-acl --use-list="$TOC" --dbname="$NEON_DATABASE_URL" "$DUMP"

source_users="$(tail -n +2 "$USERS_CSV" | wc -l | tr -d ' ')"
dest_tables="$(psql "$NEON_DATABASE_URL" --no-psqlrc --tuples-only --no-align --set=ON_ERROR_STOP=1 \
  --command="select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')")"
echo "Migration complete: user rows mirrored=$source_users; public tables restored=$dest_tables."
`;

const result = spawnSync('docker', [
  'run', '--rm',
  '--env', 'SUPABASE_DATABASE_URL',
  '--env', 'NEON_DATABASE_URL',
  '--env', 'WORK',
  '--env', 'DUMP',
  '--env', 'USERS_CSV',
  '--env', 'TOC',
  '--volume', `${work}:${work}`,
  'postgres:17-alpine',
  'sh', '-c', script
], { encoding: 'utf8', env: process.env, maxBuffer: 4 * 1024 * 1024 });

rmSync(work, { recursive: true, force: true });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
