alter table public.library_generation_jobs
add column if not exists queue_order bigint generated always as identity;

create unique index if not exists library_generation_jobs_queue_order_idx
on public.library_generation_jobs (queue_order);
