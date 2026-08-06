-- AcuarioNexo · Asistente IA · Fase 2
-- Buscador oficial de biblioteca. Respeta RLS y solo devuelve filas visibles para el rol llamante.

create or replace function public.assistant_search_library(
  p_query text default '',
  p_entry_types text[] default null,
  p_ecosystems text[] default null,
  p_environments text[] default null,
  p_target_groups text[] default null,
  p_target_animals text[] default null,
  p_food_forms text[] default null,
  p_life_stages text[] default null,
  p_limit integer default 12
)
returns table (
  id uuid,
  title text,
  scientific_name text,
  entry_type text,
  summary text,
  cover_url text,
  data jsonb,
  sources jsonb,
  score numeric,
  selection_reasons text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  with normalized as (
    select
      lower(trim(coalesce(p_query, ''))) as query_text,
      case when p_entry_types is null or cardinality(p_entry_types) = 0 then null else array(select lower(trim(v)) from unnest(p_entry_types) v where trim(v) <> '') end as entry_types,
      case when p_ecosystems is null or cardinality(p_ecosystems) = 0 then null else array(select lower(trim(v)) from unnest(p_ecosystems) v where trim(v) <> '') end as ecosystems,
      case when p_environments is null or cardinality(p_environments) = 0 then null else array(select lower(trim(v)) from unnest(p_environments) v where trim(v) <> '') end as environments,
      case when p_target_groups is null or cardinality(p_target_groups) = 0 then null else array(select lower(trim(v)) from unnest(p_target_groups) v where trim(v) <> '') end as target_groups,
      case when p_target_animals is null or cardinality(p_target_animals) = 0 then null else array(select lower(trim(v)) from unnest(p_target_animals) v where trim(v) <> '') end as target_animals,
      case when p_food_forms is null or cardinality(p_food_forms) = 0 then null else array(select lower(trim(v)) from unnest(p_food_forms) v where trim(v) <> '') end as food_forms,
      case when p_life_stages is null or cardinality(p_life_stages) = 0 then null else array(select lower(trim(v)) from unnest(p_life_stages) v where trim(v) <> '') end as life_stages,
      greatest(1, least(coalesce(p_limit, 12), 12)) as result_limit
  ),
  candidates as (
    select
      e.*,
      n.*,
      coalesce(e.data -> 'ai_classification', '{}'::jsonb) as classification
    from public.library_entries e
    cross join normalized n
    where e.status = 'published'
      and e.visibility = 'public'
      and (n.entry_types is null or lower(e.entry_type) = any(n.entry_types))
      and (
        n.ecosystems is null or exists (
          select 1 from jsonb_array_elements_text(coalesce(e.data -> 'ai_classification' -> 'ecosystem', '[]'::jsonb)) v
          where lower(v.value) = any(n.ecosystems)
        )
      )
      and (
        n.environments is null or exists (
          select 1 from jsonb_array_elements_text(coalesce(e.data -> 'ai_classification' -> 'environment', '[]'::jsonb)) v
          where lower(v.value) = any(n.environments)
        )
      )
      and (
        n.target_groups is null or exists (
          select 1 from jsonb_array_elements_text(coalesce(e.data -> 'ai_classification' -> 'target_groups', '[]'::jsonb)) v
          where lower(v.value) = any(n.target_groups)
        )
      )
      and (
        n.target_animals is null or exists (
          select 1 from jsonb_array_elements_text(coalesce(e.data -> 'ai_classification' -> 'target_animals', '[]'::jsonb)) v
          where lower(v.value) = any(n.target_animals)
        )
      )
      and (
        n.food_forms is null or exists (
          select 1 from jsonb_array_elements_text(coalesce(e.data -> 'ai_classification' -> 'food_form', '[]'::jsonb)) v
          where lower(v.value) = any(n.food_forms)
        )
      )
      and (
        n.life_stages is null or exists (
          select 1 from jsonb_array_elements_text(coalesce(e.data -> 'ai_classification' -> 'life_stage', '[]'::jsonb)) v
          where lower(v.value) = any(n.life_stages)
        )
      )
      and (
        n.query_text = ''
        or lower(e.title) = n.query_text
        or lower(coalesce(e.scientific_name, '')) = n.query_text
        or lower(e.title) like '%' || n.query_text || '%'
        or lower(coalesce(e.scientific_name, '')) like '%' || n.query_text || '%'
        or lower(coalesce(e.summary, '')) like '%' || n.query_text || '%'
        or exists (select 1 from unnest(e.tags) tag where lower(tag) like '%' || n.query_text || '%')
        or lower(e.data::text) like '%' || n.query_text || '%'
      )
  ),
  ranked as (
    select
      c.id,
      c.title,
      c.scientific_name,
      c.entry_type,
      c.summary,
      c.cover_url,
      c.data,
      c.sources,
      (
        case when c.query_text <> '' and lower(c.title) = c.query_text then 100 else 0 end +
        case when c.query_text <> '' and lower(coalesce(c.scientific_name, '')) = c.query_text then 90 else 0 end +
        case when c.query_text <> '' and lower(c.title) like '%' || c.query_text || '%' then 40 else 0 end +
        case when c.query_text <> '' and lower(coalesce(c.scientific_name, '')) like '%' || c.query_text || '%' then 35 else 0 end +
        case when c.query_text <> '' and exists (select 1 from unnest(c.tags) tag where lower(tag) like '%' || c.query_text || '%') then 25 else 0 end +
        case when c.query_text <> '' and lower(coalesce(c.summary, '')) like '%' || c.query_text || '%' then 15 else 0 end +
        case when c.query_text <> '' and lower(c.data::text) like '%' || c.query_text || '%' then 8 else 0 end +
        case when c.entry_types is not null then 10 else 0 end +
        case when c.ecosystems is not null then 10 else 0 end +
        case when c.environments is not null then 10 else 0 end +
        case when c.target_groups is not null then 12 else 0 end +
        case when c.target_animals is not null then 10 else 0 end +
        case when c.food_forms is not null then 6 else 0 end +
        case when c.life_stages is not null then 8 else 0 end
      )::numeric as score,
      array_remove(array[
        case when c.query_text <> '' and lower(c.title) = c.query_text then 'exact_title' end,
        case when c.query_text <> '' and lower(coalesce(c.scientific_name, '')) = c.query_text then 'exact_scientific_name' end,
        case when c.query_text <> '' and lower(c.title) like '%' || c.query_text || '%' then 'title_match' end,
        case when c.query_text <> '' and lower(coalesce(c.scientific_name, '')) like '%' || c.query_text || '%' then 'scientific_name_match' end,
        case when c.query_text <> '' and exists (select 1 from unnest(c.tags) tag where lower(tag) like '%' || c.query_text || '%') then 'tag_match' end,
        case when c.query_text <> '' and lower(coalesce(c.summary, '')) like '%' || c.query_text || '%' then 'summary_match' end,
        case when c.entry_types is not null then 'entry_type_filter' end,
        case when c.ecosystems is not null then 'ecosystem_filter' end,
        case when c.environments is not null then 'environment_filter' end,
        case when c.target_groups is not null then 'target_group_filter' end,
        case when c.target_animals is not null then 'target_animal_filter' end,
        case when c.food_forms is not null then 'food_form_filter' end,
        case when c.life_stages is not null then 'life_stage_filter' end
      ], null)::text[] as selection_reasons,
      c.result_limit
    from candidates c
  )
  select
    r.id,
    r.title,
    r.scientific_name,
    r.entry_type,
    r.summary,
    r.cover_url,
    r.data,
    r.sources,
    r.score,
    r.selection_reasons
  from ranked r
  order by r.score desc, r.title asc
  limit (select result_limit from normalized);
$$;

revoke all on function public.assistant_search_library(text, text[], text[], text[], text[], text[], text[], text[], integer) from public;
grant execute on function public.assistant_search_library(text, text[], text[], text[], text[], text[], text[], text[], integer) to anon, authenticated;

comment on function public.assistant_search_library(text, text[], text[], text[], text[], text[], text[], text[], integer)
is 'Buscador oficial del Asistente IA. Respeta RLS, limita a 12 resultados y explica el ranking.';
