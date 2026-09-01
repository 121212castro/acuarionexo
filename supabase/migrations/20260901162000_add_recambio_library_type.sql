ALTER TABLE public.library_entries
  DROP CONSTRAINT IF EXISTS library_entries_entry_type_check;

ALTER TABLE public.library_entries
  ADD CONSTRAINT library_entries_entry_type_check
  CHECK (entry_type = ANY (ARRAY[
    'pez_marino'::text,
    'pez_dulce'::text,
    'coral'::text,
    'invertebrado'::text,
    'planta'::text,
    'microfauna'::text,
    'producto'::text,
    'medicamento'::text,
    'sal'::text,
    'aditivo'::text,
    'alimento'::text,
    'test'::text,
    'equipamiento'::text,
    'recambio'::text
  ]));

ALTER TABLE public.library_generation_jobs
  DROP CONSTRAINT IF EXISTS library_generation_jobs_entry_type_check;

ALTER TABLE public.library_generation_jobs
  ADD CONSTRAINT library_generation_jobs_entry_type_check
  CHECK (entry_type = ANY (ARRAY[
    'auto'::text,
    'pez_marino'::text,
    'pez_dulce'::text,
    'coral'::text,
    'invertebrado'::text,
    'planta'::text,
    'microfauna'::text,
    'producto'::text,
    'medicamento'::text,
    'sal'::text,
    'aditivo'::text,
    'alimento'::text,
    'test'::text,
    'equipamiento'::text,
    'recambio'::text
  ]));
