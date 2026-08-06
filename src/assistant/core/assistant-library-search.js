/* AcuarioNexo · Asistente IA · buscador oficial de biblioteca */
(function (root, factory) {
  const api = factory(root?.ANX);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.ANX = root.ANX || {};
    root.ANX.AssistantLibrarySearch = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function (ANX) {
  const MAX_RESULTS = 12;
  const RPC_NAME = 'assistant_search_library';
  const FILTER_KEYS = Object.freeze([
    'entryTypes',
    'ecosystems',
    'environments',
    'targetGroups',
    'targetAnimals',
    'foodForms',
    'lifeStages'
  ]);

  function cleanText(value) {
    return String(value || '').trim();
  }

  function cleanList(value) {
    const list = Array.isArray(value) ? value : (value == null || value === '' ? [] : [value]);
    return [...new Set(list.map(cleanText).filter(Boolean))];
  }

  function normalizeRequest(input = {}) {
    const request = {
      query: cleanText(input.query),
      entryTypes: cleanList(input.entryTypes),
      ecosystems: cleanList(input.ecosystems),
      environments: cleanList(input.environments),
      targetGroups: cleanList(input.targetGroups),
      targetAnimals: cleanList(input.targetAnimals),
      foodForms: cleanList(input.foodForms),
      lifeStages: cleanList(input.lifeStages),
      limit: Math.max(1, Math.min(Number(input.limit) || MAX_RESULTS, MAX_RESULTS))
    };
    const hasFilter = FILTER_KEYS.some(key => request[key].length > 0);
    if (!request.query && !hasFilter) {
      throw new Error('La búsqueda necesita texto o al menos un filtro de biblioteca.');
    }
    return request;
  }

  function rpcPayload(request) {
    return {
      p_query: request.query,
      p_entry_types: request.entryTypes.length ? request.entryTypes : null,
      p_ecosystems: request.ecosystems.length ? request.ecosystems : null,
      p_environments: request.environments.length ? request.environments : null,
      p_target_groups: request.targetGroups.length ? request.targetGroups : null,
      p_target_animals: request.targetAnimals.length ? request.targetAnimals : null,
      p_food_forms: request.foodForms.length ? request.foodForms : null,
      p_life_stages: request.lifeStages.length ? request.lifeStages : null,
      p_limit: request.limit
    };
  }

  function normalizeResult(row) {
    return {
      id: cleanText(row?.id),
      title: cleanText(row?.title),
      scientificName: cleanText(row?.scientific_name),
      entryType: cleanText(row?.entry_type),
      summary: cleanText(row?.summary),
      coverUrl: cleanText(row?.cover_url),
      data: row?.data && typeof row.data === 'object' ? row.data : {},
      sources: Array.isArray(row?.sources) ? row.sources : [],
      score: Number(row?.score || 0),
      selectionReasons: cleanList(row?.selection_reasons)
    };
  }

  function validateResults(results) {
    const errors = [];
    if (!Array.isArray(results)) return { approved: false, errors: ['El buscador no devolvió una lista.'] };
    if (results.length > MAX_RESULTS) errors.push(`El buscador devolvió más de ${MAX_RESULTS} resultados.`);
    results.forEach((result, index) => {
      if (!result.id) errors.push(`Resultado ${index + 1}: falta id.`);
      if (!result.title) errors.push(`Resultado ${index + 1}: falta title.`);
      if (!result.entryType) errors.push(`Resultado ${index + 1}: falta entryType.`);
      if (!Array.isArray(result.selectionReasons)) errors.push(`Resultado ${index + 1}: selectionReasons no es una lista.`);
    });
    return { approved: errors.length === 0, errors };
  }

  async function search(input = {}, client = ANX?.supabase) {
    if (!client || typeof client.rpc !== 'function') {
      throw new Error('La conexión oficial con Supabase no está disponible.');
    }
    const request = normalizeRequest(input);
    const response = await client.rpc(RPC_NAME, rpcPayload(request));
    if (response.error) throw response.error;
    const results = (response.data || []).map(normalizeResult);
    const validation = validateResults(results);
    if (!validation.approved) throw new Error(validation.errors.join(' · '));
    return {
      request,
      results,
      total: results.length,
      contractVersion: ANX?.AssistantContract?.VERSION || null,
      rpc: RPC_NAME
    };
  }

  return Object.freeze({
    MAX_RESULTS,
    RPC_NAME,
    FILTER_KEYS,
    cleanList,
    normalizeRequest,
    rpcPayload,
    normalizeResult,
    validateResults,
    search
  });
});
