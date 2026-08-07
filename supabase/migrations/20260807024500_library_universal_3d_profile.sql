-- AcuarioNexo · Perfil 3D universal de biblioteca
-- Todas las fichas reciben un perfil físico/visual trazable. Los datos no verificados quedan marcados para revisión.

create or replace function public.library_build_3d_profile(
  p_entry_type text,
  p_title text,
  p_scientific_name text,
  p_data jsonb
) returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_text text := lower(coalesce(p_title,'') || ' ' || coalesce(p_scientific_name,'') || ' ' || coalesce(p_data->>'family','') || ' ' || coalesce(p_data->>'equipment_type',''));
  v_representation text := 'package';
  v_family text := 'generic';
  v_morphology text := 'sin confirmar';
  v_length numeric := null;
  v_match text[];
begin
  if p_entry_type in ('pez_marino','pez_dulce') then
    v_representation := 'fish';
    if v_text ~ 'pterophyllum|escalar|angelfish' then v_family := 'freshwater_angelfish';
    elsif v_text ~ 'acanthuridae|cirujano|surgeon' then v_family := 'surgeonfish';
    elsif v_text ~ 'pomacanthidae|ángel marino|angel marino' then v_family := 'marine_angelfish';
    elsif v_text ~ 'chaetodontidae|mariposa|butterfly' then v_family := 'butterflyfish';
    elsif v_text ~ 'amphiprion|payaso|clownfish' then v_family := 'clownfish';
    elsif v_text ~ 'gobiidae|gobio|goby' then v_family := 'goby';
    elsif v_text ~ 'labridae|lábrido|labrido|wrasse' then v_family := 'wrasse';
    elsif v_text ~ 'balistidae|ballesta|trigger' then v_family := 'triggerfish';
    elsif v_text ~ 'tetraodontidae|globo|puffer' then v_family := 'pufferfish';
    elsif v_text ~ 'syngnathidae|caballito|seahorse' then v_family := 'seahorse';
    elsif v_text ~ 'scorpaenidae|pez león|pez leon|lionfish' then v_family := 'lionfish';
    elsif v_text ~ 'callionymidae|mandarín|mandarin|dragonet' then v_family := 'dragonet';
    elsif v_text ~ 'apogonidae|cardenal|cardinal' then v_family := 'cardinalfish';
    elsif v_text ~ 'anthiinae|anthias|antias' then v_family := 'anthias';
    elsif v_text ~ 'siganidae|conejo|rabbitfish' then v_family := 'rabbitfish';
    elsif v_text ~ 'pseudochromidae|pseudochromis|dottyback' then v_family := 'dottyback';
    elsif v_text ~ 'ptereleotrinae|dardo|firefish' then v_family := 'firefish';
    elsif v_text ~ 'cirrhitidae|halcón|halcon|hawkfish' then v_family := 'hawkfish';
    elsif v_text ~ 'cichlidae|cíclido|ciclido' then v_family := 'cichlid';
    else v_family := 'generic_fish';
    end if;
    v_morphology := v_family;
    v_match := regexp_match(coalesce(p_data->>'adult_size_cm',''), '([0-9]+(?:[\.,][0-9]+)?)');
    if v_match is not null then v_length := replace(v_match[1], ',', '.')::numeric; end if;
  elsif p_entry_type = 'coral' then
    v_representation := 'coral'; v_family := lower(coalesce(nullif(p_data->>'growth_form',''),'coral')); v_morphology := v_family;
  elsif p_entry_type = 'invertebrado' then
    v_representation := 'invertebrate'; v_family := lower(coalesce(nullif(p_data->>'family',''),'invertebrate')); v_morphology := v_family;
  elsif p_entry_type = 'planta' then
    v_representation := 'plant'; v_family := lower(coalesce(nullif(p_data->>'plant_type',''),'aquatic_plant')); v_morphology := v_family;
  elsif p_entry_type = 'microfauna' then
    v_representation := 'microfauna'; v_family := 'microfauna'; v_morphology := 'microscopic';
  elsif p_entry_type = 'fitoplancton' then
    v_representation := 'phytoplankton'; v_family := 'phytoplankton'; v_morphology := 'microscopic';
  elsif p_entry_type = 'equipamiento' then
    v_representation := 'equipment';
    if v_text ~ 'bomba|pump|circulación|circulacion|wavemaker' then v_family := 'aquarium_pump';
    elsif v_text ~ 'filtro|filter' then v_family := 'aquarium_filter';
    elsif v_text ~ 'skimmer' then v_family := 'protein_skimmer';
    elsif v_text ~ 'calentador|heater' then v_family := 'heater';
    elsif v_text ~ 'luz|pantalla|led|t5|light' then v_family := 'aquarium_light';
    elsif v_text ~ 'uv|ultravioleta' then v_family := 'uv_unit';
    else v_family := 'aquarium_equipment';
    end if;
    v_morphology := v_family;
  else
    v_representation := 'package';
    v_family := case p_entry_type
      when 'alimento' then 'food_package'
      when 'medicamento' then 'medicine_package'
      when 'sal' then 'salt_package'
      when 'aditivo' then 'additive_package'
      when 'test' then 'test_kit_package'
      else 'product_package'
    end;
    v_morphology := v_family;
  end if;

  return jsonb_build_object(
    'profile_version','1.0.0',
    'status','inferred',
    'exactness','placeholder',
    'representation_type',v_representation,
    'asset_family',v_family,
    'asset_variant','default',
    'model_url',null,
    'texture_url',null,
    'real_dimensions_cm',jsonb_build_object('width',null,'height',null,'depth',null,'length',v_length),
    'orientation','upright',
    'mounting',case when v_representation='equipment' then 'sin confirmar' else 'free' end,
    'connection_points','[]'::jsonb,
    'movement_profile',case when v_representation='fish' then 'swimming' else 'static' end,
    'primary_colors','[]'::jsonb,
    'pattern','sin confirmar',
    'morphology',v_morphology,
    'source_basis',jsonb_build_array('Datos existentes de la ficha; completar con documentación o referencia visual del elemento exacto.'),
    'needs_asset_review',true,
    'needs_dimension_review',true,
    'notes','Perfil provisional generado sin inventar medidas ni modelo. Debe revisarse antes de marcarlo como representación exacta.'
  );
end;
$$;

create or replace function public.library_ensure_3d_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.data := coalesce(new.data, '{}'::jsonb);
  if not (new.data ? 'ai_3d_profile')
     or jsonb_typeof(new.data->'ai_3d_profile') <> 'object' then
    new.data := jsonb_set(
      new.data,
      '{ai_3d_profile}',
      public.library_build_3d_profile(new.entry_type, new.title, new.scientific_name, new.data),
      true
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_library_ensure_3d_profile on public.library_entries;
create trigger trg_library_ensure_3d_profile
before insert or update of entry_type, title, scientific_name, data
on public.library_entries
for each row execute function public.library_ensure_3d_profile();

update public.library_entries
set data = jsonb_set(
  coalesce(data,'{}'::jsonb),
  '{ai_3d_profile}',
  public.library_build_3d_profile(entry_type, title, scientific_name, coalesce(data,'{}'::jsonb)),
  true
)
where not (coalesce(data,'{}'::jsonb) ? 'ai_3d_profile')
   or jsonb_typeof(coalesce(data,'{}'::jsonb)->'ai_3d_profile') <> 'object';
