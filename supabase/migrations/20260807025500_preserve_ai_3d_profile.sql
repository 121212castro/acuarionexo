-- AcuarioNexo · Preservar ai_3d_profile como objeto estructurado
create or replace function public.library_flatten_generated_data()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  item record;
  flattened jsonb := '{}'::jsonb;
  base jsonb := coalesce(new.data, '{}'::jsonb);
begin
  for item in select key, value from jsonb_each(base)
  loop
    if jsonb_typeof(item.value) = 'object'
       and item.key not in ('review_flags','validation_result','ai_classification','ai_3d_profile') then
      flattened := flattened || item.value;
    else
      flattened := flattened || jsonb_build_object(item.key, item.value);
    end if;
  end loop;

  flattened := flattened || jsonb_strip_nulls(jsonb_build_object(
    'manufacturer', coalesce(flattened->'manufacturer', to_jsonb(nullif(new.identify_result->>'manufacturer',''))),
    'brand', coalesce(flattened->'brand', to_jsonb(nullif(new.identify_result->>'brand',''))),
    'product_code', coalesce(flattened->'product_code', to_jsonb(nullif(new.identify_result->>'product_code','')))
  ));

  new.data := flattened;
  return new;
end
$$;
