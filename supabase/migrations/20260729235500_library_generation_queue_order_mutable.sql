alter table public.library_generation_jobs
alter column queue_order drop identity if exists;

create sequence if not exists public.library_generation_jobs_queue_order_seq;

alter sequence public.library_generation_jobs_queue_order_seq
owned by public.library_generation_jobs.queue_order;

alter table public.library_generation_jobs
alter column queue_order set default nextval('public.library_generation_jobs_queue_order_seq');

select setval(
  'public.library_generation_jobs_queue_order_seq',
  greatest(coalesce((select max(queue_order) from public.library_generation_jobs), 0), 1),
  true
);
