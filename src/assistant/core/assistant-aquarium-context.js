/* AcuarioNexo · Asistente IA · Fase 3 · contexto del acuario */
(function (root, factory) {
  const api = factory(root?.ANX);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.ANX = root.ANX || {};
    root.ANX.AssistantAquariumContext = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function (ANX) {
  const VERSION = '1.0.0';

  function requireUuid(value) {
    const id = String(value || '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error('Selecciona un acuario válido.');
    }
    return id;
  }

  function clampInteger(value, fallback, min, max) {
    const parsed = Number.parseInt(value, 10);
    return Math.max(min, Math.min(Number.isFinite(parsed) ? parsed : fallback, max));
  }

  function normalizeContext(raw) {
    const value = raw && typeof raw === 'object' ? raw : {};
    const arrays = ['animals', 'latest_measurements', 'inventory', 'recent_maintenance', 'open_tasks', 'recent_water_changes', 'microfauna_cultures'];
    arrays.forEach(key => { if (!Array.isArray(value[key])) value[key] = []; });
    value.aquarium = value.aquarium && typeof value.aquarium === 'object' ? value.aquarium : {};
    value.context_version = String(value.context_version || VERSION);
    return value;
  }

  async function load(aquariumId, options = {}) {
    const supabase = options.supabase || ANX?.supabase;
    if (!supabase?.rpc) throw new Error('Conexión con Supabase no disponible.');
    const id = requireUuid(aquariumId);
    const measurementDays = clampInteger(options.measurementDays, 30, 1, 365);
    const historyLimit = clampInteger(options.historyLimit, 12, 1, 50);
    const response = await supabase.rpc('assistant_get_aquarium_context', {
      p_aquarium_id: id,
      p_measurement_days: measurementDays,
      p_history_limit: historyLimit
    });
    if (response.error) {
      const message = String(response.error.message || 'No se pudo cargar el contexto del acuario.');
      if (/AUTHENTICATION_REQUIRED/i.test(message)) throw new Error('Inicia sesión para consultar tu acuario.');
      if (/AQUARIUM_NOT_FOUND_OR_FORBIDDEN/i.test(message)) throw new Error('El acuario no existe o no pertenece a tu cuenta.');
      throw new Error(message);
    }
    return normalizeContext(response.data);
  }

  function summary(context) {
    const value = normalizeContext(context);
    return {
      aquarium_id: value.aquarium.id || null,
      aquarium_name: value.aquarium.name || '',
      aquarium_type: value.aquarium.aquarium_type || '',
      system_net_liters: value.aquarium.system_net_liters ?? null,
      animal_count: value.animals.reduce((total, item) => total + Number(item.quantity || 0), 0),
      species_records: value.animals.length,
      measurement_count: value.latest_measurements.length,
      inventory_count: value.inventory.length,
      open_task_count: value.open_tasks.length,
      maintenance_count: value.recent_maintenance.length,
      context_version: value.context_version
    };
  }

  return Object.freeze({ VERSION, requireUuid, normalizeContext, load, summary });
});
