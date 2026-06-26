/* AcuarioNexo · Biblioteca V3 · contrato oficial */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.ANX = root.ANX || {};
    root.ANX.LibrarySchema = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const STATUSES = ['identified', 'draft', 'review', 'validated', 'published'];
  const BIOLOGICAL_TYPES = ['pez_marino', 'pez_dulce', 'coral', 'invertebrado', 'planta', 'microfauna'];
  const PRODUCT_TYPES = ['producto', 'medicamento', 'sal', 'aditivo', 'alimento', 'test', 'equipamiento'];
  const REEF_SAFE = ['Sí', 'Sí con precaución', 'No'];

  const COMMON_FIELDS = ['title', 'entry_type', 'sources'];
  const CONTRACTS = {
    pez_marino: COMMON_FIELDS.concat(['scientific_name', 'family', 'order_name', 'class_name', 'distribution', 'adult_size_cm', 'minimum_tank_liters', 'temperature_min', 'temperature_max', 'ph_min', 'ph_max', 'salinity_min', 'salinity_max', 'diet', 'behavior', 'compatibility', 'reef_safe', 'care_level']),
    pez_dulce: COMMON_FIELDS.concat(['scientific_name', 'family', 'order_name', 'class_name', 'distribution', 'adult_size_cm', 'minimum_tank_liters', 'temperature_min', 'temperature_max', 'ph_min', 'ph_max', 'diet', 'behavior', 'compatibility', 'care_level']),
    coral: COMMON_FIELDS.concat(['scientific_name', 'family', 'distribution', 'lighting', 'flow', 'placement', 'growth_rate', 'aggressiveness', 'reef_safe']),
    invertebrado: COMMON_FIELDS.concat(['scientific_name', 'family', 'distribution', 'reef_safe', 'molting', 'feeding', 'behavior']),
    planta: COMMON_FIELDS.concat(['scientific_name', 'family', 'distribution', 'lighting', 'co2', 'growth_rate', 'placement']),
    microfauna: COMMON_FIELDS.concat(['scientific_name', 'culture_method', 'feeding', 'harvest', 'use_in_aquarium']),
    producto: COMMON_FIELDS.concat(['manufacturer', 'product_code', 'composition', 'dose', 'use', 'monitoring', 'risks']),
    sal: COMMON_FIELDS.concat(['manufacturer', 'product_code', 'composition', 'dose', 'use', 'monitoring', 'risks']),
    aditivo: COMMON_FIELDS.concat(['manufacturer', 'product_code', 'composition', 'dose', 'use', 'monitoring', 'risks']),
    alimento: COMMON_FIELDS.concat(['manufacturer', 'product_code', 'composition', 'dose', 'use', 'monitoring', 'risks']),
    medicamento: COMMON_FIELDS.concat(['manufacturer', 'product_code', 'active_ingredient', 'dose', 'treatment_days', 'remove_equipment', 'monitoring', 'risks']),
    test: COMMON_FIELDS.concat(['manufacturer', 'product_code', 'parameter', 'range', 'resolution', 'interpretation']),
    equipamiento: COMMON_FIELDS.concat(['manufacturer', 'product_code', 'power', 'flow', 'volume', 'maintenance'])
  };

  const GENERIC_PATTERNS = [
    /requiere buena calidad de agua/i,
    /mantener par[aá]metros estables/i,
    /alimentaci[oó]n variada/i,
    /compatible con peces pac[ií]ficos/i,
    /\b(bajo|medio|alto|moderado|normalmente|suele|aproximadamente)\b/i
  ];
  const UNCERTAIN_TAXONOMY = /\b(?:spp?|cf|aff)\.?\b/i;

  function extractUrlsFromAny(value, found = []) {
    if (value == null) return found;
    if (typeof value === 'string') {
      const matches = value.match(/https?:\/\/[^\s<>"')\]]+/gi) || [];
      matches.forEach(url => found.push(url.replace(/[.,;:]+$/, '')));
      return found;
    }
    if (Array.isArray(value)) {
      value.forEach(item => extractUrlsFromAny(item, found));
      return found;
    }
    if (typeof value === 'object') {
      Object.values(value).forEach(item => extractUrlsFromAny(item, found));
    }
    return found;
  }

  function hasRealUrl(value) {
    return extractUrlsFromAny(value).some(url => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.includes('.');
      } catch (_) {
        return false;
      }
    });
  }

  function normalizeSources(value) {
    const raw = Array.isArray(value) ? value : [];
    const seen = new Set();
    return raw.map((source, index) => {
      const item = typeof source === 'string' ? { url: source } : (source || {});
      const url = extractUrlsFromAny(item.url || item)[0] || '';
      return {
        name: String(item.name || item.title || (url ? new URL(url).hostname : `Fuente ${index + 1}`)).trim(),
        url,
        source_type: String(item.source_type || item.type || '').trim(),
        original: item.original || item,
        used_for: String(item.used_for || '').trim(),
        confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : null,
        consulted_at: item.consulted_at || new Date().toISOString()
      };
    }).filter(source => {
      if (!hasRealUrl(source.url) || seen.has(source.url)) return false;
      seen.add(source.url);
      return true;
    });
  }

  function isConcreteScientificName(value) {
    const name = String(value || '').trim();
    return /^[A-Z][a-z-]+ [a-z][a-z-]+(?:\s+var\.\s+[a-z-]+)?$/.test(name) && !UNCERTAIN_TAXONOMY.test(name);
  }

  function missingFields(entry) {
    const contract = CONTRACTS[entry.entry_type] || COMMON_FIELDS;
    return contract.filter(field => {
      if (field === 'sources') return normalizeSources(entry.sources).length < 2;
      const value = entry.data?.[field] ?? entry[field];
      return value == null || value === '' || (Array.isArray(value) && !value.length);
    });
  }

  function audit(entry) {
    const errors = [];
    const warnings = [];
    const sources = normalizeSources(entry.sources);
    if (!STATUSES.includes(entry.status)) errors.push('Estado no permitido.');
    if (!entry.identity_confirmed) errors.push('Identificación insuficiente.');
    if (BIOLOGICAL_TYPES.includes(entry.entry_type) && !isConcreteScientificName(entry.scientific_name)) errors.push('La ficha biológica no tiene una especie concreta.');
    if (sources.length < 2) errors.push('Se requieren al menos dos URLs reales.');
    const missing = missingFields({ ...entry, sources });
    if (missing.length) errors.push(`Campos obligatorios incompletos: ${missing.join(', ')}.`);
    const text = JSON.stringify(entry.data || entry.sections || {});
    GENERIC_PATTERNS.forEach(pattern => {
      const match = text.match(pattern);
      if (match) warnings.push(`Frase genérica o imprecisa: ${match[0]}.`);
    });
    if (entry.entry_type === 'pez_marino' && /\bGH\b/i.test(text)) errors.push('GH no es un parámetro contractual para pez marino.');
    return { approved: errors.length === 0, errors, warnings, missing_fields: missing, source_count: sources.length, sources };
  }

  return { STATUSES, BIOLOGICAL_TYPES, PRODUCT_TYPES, REEF_SAFE, CONTRACTS, extractUrlsFromAny, hasRealUrl, normalizeSources, isConcreteScientificName, missingFields, audit };
});
