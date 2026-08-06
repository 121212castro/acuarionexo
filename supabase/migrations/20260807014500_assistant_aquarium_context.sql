-- AcuarioNexo · Asistente IA · Fase 3
-- Contexto único del acuario seleccionado. Respeta auth.uid() y RLS.

create or replace function public.assistant_get_aquarium_context(
  p_aquarium_id uuid,
  p_measurement_days integer default 30,
  p_history_limit integer default 12
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_aquarium public.aquariums%rowtype;
  v_days integer := greatest(1, least(coalesce(p_measurement_days, 30), 365));
  v_limit integer := greatest(1, least(coalesce(p_history_limit, 12), 50));
begin
  if v_uid is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select * into v_aquarium
  from public.aquariums
  where id = p_aquarium_id and user_id = v_uid;

  if not found then
    raise exception 'AQUARIUM_NOT_FOUND_OR_FORBIDDEN' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'context_version', '1.0',
    'generated_at', now(),
    'aquarium', jsonb_strip_nulls(jsonb_build_object(
      'id', v_aquarium.id,
      'name', v_aquarium.name,
      'aquarium_type', coalesce(v_aquarium.aquarium_type, v_aquarium.type),
      'status', v_aquarium.status,
      'system_net_liters', coalesce(v_aquarium.manual_real_liters, v_aquarium.real_liters, v_aquarium.system_net_liters, v_aquarium.volume_liters, v_aquarium.liters),
      'dimensions_cm', jsonb_strip_nulls(jsonb_build_object('length', v_aquarium.tank_length_cm, 'width', v_aquarium.tank_width_cm, 'height', v_aquarium.tank_height_cm)),
      'has_sump', v_aquarium.has_sump,
      'has_refugium', v_aquarium.has_refugium,
      'mounted_at', v_aquarium.mounted_at,
      'cycling_start_date', v_aquarium.cycling_start_date,
      'cycling_end_date', v_aquarium.cycling_end_date,
      'notes', v_aquarium.notes,
      'ai_summary', v_aquarium.ai_summary
    )),
    'animals', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', a.id, 'common_name', a.common_name, 'scientific_name', a.scientific_name,
        'category', a.category, 'quantity', a.quantity, 'status', a.status, 'notes', a.notes
      )) order by a.common_name)
      from public.animals a
      where a.aquarium_id = p_aquarium_id and a.user_id = v_uid
    ), '[]'::jsonb),
    'latest_measurements', coalesce((
      select jsonb_agg(to_jsonb(m) - 'rn' order by m.measured_at desc)
      from (
        select am.parameter_key, am.parameter_label, am.parameter, am.display_value,
               am.raw_value, am.value, am.normalized_value, am.unit, am.risk_level,
               am.method, am.source, am.measured_at, am.notes,
               row_number() over (partition by coalesce(am.parameter_key, am.parameter_label, am.parameter) order by am.measured_at desc, am.created_at desc) rn
        from public.aquarium_measurements am
        where am.aquarium_id = p_aquarium_id and am.user_id = v_uid
          and am.measured_at >= now() - make_interval(days => v_days)
      ) m where m.rn = 1
    ), '[]'::jsonb),
    'inventory', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', i.id, 'name', i.name, 'category', i.category, 'quantity', i.quantity,
        'unit', i.unit, 'expiry_date', coalesce(i.expires_at, i.expiry_date), 'notes', i.notes
      )) order by i.name)
      from public.inventory_items i
      where i.aquarium_id = p_aquarium_id and i.user_id = v_uid
    ), '[]'::jsonb),
    'recent_maintenance', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.event_at desc)
      from (
        select me.id, me.title, coalesce(me.event_type, me.type, me.category) as event_type,
               coalesce(me.description, me.notes) as description,
               coalesce(me.performed_at, me.changed_at, me.water_changed_at, me.event_at, me.completed_at, me.created_at) as event_at
        from public.maintenance_events me
        where me.aquarium_id = p_aquarium_id and me.user_id = v_uid
        order by coalesce(me.performed_at, me.changed_at, me.water_changed_at, me.event_at, me.completed_at, me.created_at) desc
        limit v_limit
      ) x
    ), '[]'::jsonb),
    'open_tasks', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', t.id, 'title', t.title, 'task_type', coalesce(t.task_type, t.type, t.category),
        'priority', t.priority, 'status', t.status, 'due_at', t.due_at,
        'description', coalesce(t.description, t.notes)
      )) order by t.due_at nulls last)
      from public.tasks t
      where t.aquarium_id = p_aquarium_id and t.user_id = v_uid
        and coalesce(lower(t.status), '') not in ('done','completed','cancelled','canceled')
    ), '[]'::jsonb),
    'recent_water_changes', coalesce((
      select jsonb_agg(to_jsonb(w) order by w.changed_at desc)
      from (
        select wc.id, wc.title, wc.notes,
               coalesce(wc.changed_at, wc.performed_at, wc.created_at) as changed_at
        from public.water_changes wc
        where wc.aquarium_id = p_aquarium_id and wc.user_id = v_uid
        order by coalesce(wc.changed_at, wc.performed_at, wc.created_at) desc
        limit v_limit
      ) w
    ), '[]'::jsonb),
    'microfauna_cultures', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', mc.id, 'name', mc.name, 'culture_type', mc.culture_type, 'status', mc.status,
        'volume_ml', mc.volume_ml, 'salinity_ppt', mc.salinity_ppt,
        'temperature_c', mc.temperature_c, 'density', mc.density,
        'feed_type', mc.feed_type, 'next_feed_at', mc.next_feed_at,
        'next_water_change_at', mc.next_water_change_at, 'next_harvest_at', mc.next_harvest_at
      )) order by mc.name)
      from public.microfauna_cultures mc
      where mc.aquarium_id = p_aquarium_id and mc.user_id = v_uid
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.assistant_get_aquarium_context(uuid, integer, integer) from public, anon;
grant execute on function public.assistant_get_aquarium_context(uuid, integer, integer) to authenticated;
comment on function public.assistant_get_aquarium_context is 'Fase 3: devuelve contexto reducido del acuario propiedad del usuario autenticado para el Asistente IA.';
