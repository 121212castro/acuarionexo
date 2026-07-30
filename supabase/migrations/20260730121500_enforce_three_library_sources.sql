create or replace function public.library_guard_entry()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_biological boolean := new.entry_type = any(array['pez_marino','pez_dulce','coral','invertebrado','planta','microfauna']);
  approved boolean := coalesce((new.validation_result->>'approved')::boolean, false);
  scientific_taxa text[];
  is_multitaxon_microfauna boolean := false;
begin
  scientific_taxa := regexp_split_to_array(coalesce(new.scientific_name, ''), '\s*\+\s*');
  is_multitaxon_microfauna :=
    new.entry_type = 'microfauna'
    and cardinality(scientific_taxa) >= 2
    and coalesce(new.data->>'culture_type', '') || ' ' || coalesce(new.data->>'identification', '') ~* '\m(mezcla|multiespecífica|multiespecifica|multiespecífico|multiespecifico)\M'
    and not exists (
      select 1
      from unnest(scientific_taxa) as taxon
      where btrim(taxon) !~ '^[A-Z][a-z-]+( [a-z][a-z-]+( var\. [a-z-]+)?| sp\.)?$'
    );

  if tg_op = 'UPDATE' and old.status in ('validated','published') and (
    old.title is distinct from new.title or old.scientific_name is distinct from new.scientific_name
    or old.entry_type is distinct from new.entry_type or old.summary is distinct from new.summary
    or old.sections is distinct from new.sections or old.data is distinct from new.data
    or old.sources is distinct from new.sources
  ) then
    new.status := 'review';
    new.validation_result := jsonb_build_object('approved', false, 'errors', jsonb_build_array('La ficha cambió después de validarse y requiere una nueva auditoría.'), 'audited_at', now());
    approved := false;
  end if;

  if new.status in ('draft','review','validated','published') and not new.identity_confirmed then
    raise exception 'Identificación insuficiente. No se puede crear ficha.';
  end if;
  if is_biological and new.status in ('draft','review','validated','published')
    and not is_multitaxon_microfauna
    and (coalesce(new.scientific_name, '') !~ '^[A-Z][a-z-]+ [a-z][a-z-]+(\s+var\.\s+[a-z-]+)?$'
      or new.scientific_name ~* '\m(spp?|cf|aff)\.?\M') then
    raise exception 'La ficha biológica requiere una especie concreta.';
  end if;
  if new.status in ('validated','published') then
    if public.library_real_url_count(new.sources) < 3 then raise exception 'Se requieren al menos tres fuentes con URL real.'; end if;
    if not approved then raise exception 'La ficha no tiene una auditoría aprobada.'; end if;
  end if;
  if new.status = 'published' then
    if tg_op = 'INSERT' or old.status <> 'validated' then raise exception 'Solo se puede publicar una ficha previamente validada.'; end if;
    new.visibility := 'public';
    new.published_at := coalesce(new.published_at, now());
  else
    new.visibility := 'private';
    new.published_at := null;
  end if;
  if new.status = 'validated' then
    new.validated_at := coalesce(new.validated_at, now());
  elsif new.status not in ('published') then
    new.validated_at := null;
    new.validated_by := null;
  end if;
  new.updated_at := now();
  return new;
end
$$;
