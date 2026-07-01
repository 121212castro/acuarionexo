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

  const GENERIC_PATTERNS = [
    /requiere buena calidad de agua/i,
    /mantener par[aá]metros estables/i,
    /alimentaci[oó]n variada/i,
    /compatible con peces pac[ií]ficos/i,
    /\b(bajo|medio|alto|moderado|normalmente|suele|aproximadamente)\b/i
  ];
  const UNCERTAIN_TAXONOMY = /\b(?:spp?|cf|aff)\.?\b/i;
  const INTERNAL_FIELD_PATTERN = /\b(entry_type|order_name|class_name|family|data|sections|identity_confirmed|source_context|utm_source)\b/i;

  const FIELD_RULES = {
    title: { label: 'Nombre común', required: true, minLength: 2, ai: true, public: true, section: 'identity' },
    scientific_name: { label: 'Nombre científico', required: true, minLength: 5, ai: true, public: true, section: 'identity', validator: 'scientificName' },
    entry_type: { label: 'Tipo de ficha', required: true, ai: true, public: false, section: 'identity' },
    sources: { label: 'Fuentes', required: true, minSources: 2, ai: true, public: true, section: 'sources' },
    cover_url: { label: 'Foto portada con nombre', required: true, minLength: 8, ai: false, public: true, section: 'cover' },
    photo_url: { label: 'Foto principal al abrir ficha', required: true, minLength: 8, ai: false, public: true, section: 'photo' },
    summary: { label: 'Resumen del pez', required: true, minLength: 40, ai: true, public: true, section: 'summary' },
    identity_notes: { label: 'Identificación completa', required: true, minLength: 40, ai: true, public: true, section: 'identity' },
    family: { label: 'Familia', required: true, ai: true, public: false, section: 'identity' },
    order_name: { label: 'Orden', required: true, ai: true, public: false, section: 'identity' },
    class_name: { label: 'Clase', required: true, ai: true, public: false, section: 'identity' },
    distribution: { label: 'Distribución / hábitat', required: true, minLength: 25, ai: true, public: true, section: 'habitat' },
    habitat_natural: { label: 'Hábitat natural', required: true, minLength: 40, ai: true, public: true, section: 'habitat' },
    adult_size_cm: { label: 'Tamaño adulto', required: true, type: 'number', ai: true, public: true, section: 'identity' },
    life_expectancy: { label: 'Esperanza de vida', required: true, minLength: 2, ai: true, public: true, section: 'identity' },
    minimum_tank_liters: { label: 'Acuario mínimo', required: true, type: 'number', ai: true, public: true, section: 'aquarium' },
    aquarium_recommended: { label: 'Acuario recomendado', required: true, minLength: 40, ai: true, public: true, section: 'aquarium' },
    temperature_min: { label: 'Temperatura mínima', required: true, type: 'number', ai: true, public: true, section: 'parameters' },
    temperature_max: { label: 'Temperatura máxima', required: true, type: 'number', ai: true, public: true, section: 'parameters' },
    ph_min: { label: 'pH mínimo', required: true, type: 'number', ai: true, public: true, section: 'parameters' },
    ph_max: { label: 'pH máximo', required: true, type: 'number', ai: true, public: true, section: 'parameters' },
    salinity_min: { label: 'Salinidad mínima', required: true, type: 'number', ai: true, public: true, section: 'parameters' },
    salinity_max: { label: 'Salinidad máxima', required: true, type: 'number', ai: true, public: true, section: 'parameters' },
    kh_min: { label: 'KH mínimo', required: true, type: 'number', ai: true, public: true, section: 'parameters' },
    kh_max: { label: 'KH máximo', required: true, type: 'number', ai: true, public: true, section: 'parameters' },
    nitrate_max: { label: 'Nitrato máximo', required: true, type: 'number', ai: true, public: true, section: 'parameters' },
    phosphate_max: { label: 'Fosfato máximo', required: true, type: 'number', ai: true, public: true, section: 'parameters' },
    diet: { label: 'Alimentación', required: true, minLength: 25, ai: true, public: true, section: 'feeding' },
    feeding_plan: { label: 'Plan de alimentación', required: true, minLength: 40, ai: true, public: true, section: 'feeding' },
    behavior: { label: 'Comportamiento', required: true, minLength: 25, ai: true, public: true, section: 'behavior' },
    compatibility: { label: 'Compatibilidad', required: true, minLength: 25, ai: true, public: true, section: 'compatibility' },
    reef_safe: { label: 'Reef safe', required: true, allowed: REEF_SAFE, ai: true, public: true, section: 'reef_safe' },
    reef_safe_notes: { label: 'Detalle reef safe', required: true, minLength: 30, ai: true, public: true, section: 'reef_safe' },
    breeding: { label: 'Reproducción', required: true, minLength: 30, ai: true, public: true, section: 'breeding' },
    diseases: { label: 'Enfermedades', required: true, minLength: 30, ai: true, public: true, section: 'health' },
    care_level: { label: 'Nivel de cuidado', required: true, ai: true, public: true, section: 'maintenance' },
    curiosities: { label: 'Curiosidades', required: true, minLength: 20, ai: true, public: true, section: 'curiosities' },
    lighting: { label: 'Iluminación', required: true, minLength: 15, ai: true, public: true, section: 'lighting' },
    flow: { label: 'Flujo / caudal', required: true, minLength: 10, ai: true, public: true, section: 'flow' },
    placement: { label: 'Ubicación', required: true, minLength: 10, ai: true, public: true, section: 'placement' },
    growth_rate: { label: 'Crecimiento', required: true, ai: true, public: true, section: 'maintenance' },
    aggressiveness: { label: 'Agresividad', required: true, ai: true, public: true, section: 'compatibility' },
    molting: { label: 'Muda', required: true, minLength: 15, ai: true, public: true, section: 'health' },
    feeding: { label: 'Alimentación / cultivo', required: true, minLength: 15, ai: true, public: true, section: 'feeding' },
    co2: { label: 'CO2 y nutrientes', required: true, minLength: 10, ai: true, public: true, section: 'co2' },
    culture_method: { label: 'Método de cultivo', required: true, minLength: 25, ai: true, public: true, section: 'culture' },
    harvest: { label: 'Cosecha', required: true, minLength: 15, ai: true, public: true, section: 'harvest' },
    use_in_aquarium: { label: 'Uso en acuario', required: true, minLength: 15, ai: true, public: true, section: 'use' },
    manufacturer: { label: 'Fabricante', required: true, minLength: 2, ai: true, public: true, section: 'identity' },
    product_code: { label: 'Modelo / código', required: true, minLength: 2, ai: true, public: true, section: 'identity' },
    composition: { label: 'Composición', required: true, minLength: 20, ai: true, public: true, section: 'nutrition' },
    dose: { label: 'Dosis', required: true, minLength: 10, ai: true, public: true, section: 'dose' },
    use: { label: 'Uso recomendado', required: true, minLength: 20, ai: true, public: true, section: 'use' },
    monitoring: { label: 'Seguimiento', required: true, minLength: 15, ai: true, public: true, section: 'monitoring' },
    risks: { label: 'Riesgos', required: true, minLength: 20, ai: true, public: true, section: 'risks' },
    active_ingredient: { label: 'Principio activo', required: true, minLength: 2, ai: true, public: true, section: 'uses' },
    treatment_days: { label: 'Duración tratamiento', required: true, ai: true, public: true, section: 'dose' },
    remove_equipment: { label: 'Retirar durante tratamiento', required: true, minLength: 10, ai: true, public: true, section: 'remove' },
    parameter: { label: 'Parámetro medido', required: true, minLength: 2, ai: true, public: true, section: 'parameters' },
    range: { label: 'Rango', required: true, minLength: 2, ai: true, public: true, section: 'range' },
    resolution: { label: 'Resolución', required: true, minLength: 1, ai: true, public: true, section: 'reading' },
    interpretation: { label: 'Interpretación', required: true, minLength: 20, ai: true, public: true, section: 'reading' },
    power: { label: 'Potencia', required: true, minLength: 1, ai: true, public: true, section: 'specs' },
    volume: { label: 'Volumen recomendado', required: true, minLength: 1, ai: true, public: true, section: 'specs' },
    maintenance: { label: 'Mantenimiento', required: true, minLength: 20, ai: true, public: true, section: 'maintenance' }
  };

  const COMMON_FIELDS = ['title', 'entry_type', 'sources'];
  const CONTRACTS = {
    pez_marino: ['title', 'entry_type', 'scientific_name', 'cover_url', 'photo_url', 'summary', 'identity_notes', 'family', 'order_name', 'class_name', 'distribution', 'habitat_natural', 'adult_size_cm', 'life_expectancy', 'minimum_tank_liters', 'aquarium_recommended', 'temperature_min', 'temperature_max', 'ph_min', 'ph_max', 'salinity_min', 'salinity_max', 'kh_min', 'kh_max', 'nitrate_max', 'phosphate_max', 'behavior', 'compatibility', 'diet', 'feeding_plan', 'reef_safe', 'reef_safe_notes', 'breeding', 'diseases', 'care_level', 'maintenance', 'curiosities', 'sources'],
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

  const SECTION_LABELS = {
    cover: 'Portada', photo: 'Foto principal', summary: 'Resumen', identity: 'Identificación', habitat: 'Hábitat natural', aquarium: 'Acuario recomendado', parameters: 'Parámetros', behavior: 'Comportamiento', feeding: 'Alimentación', compatibility: 'Compatibilidad', reef_safe: 'Reef safe', breeding: 'Reproducción', health: 'Enfermedades', purchase: 'Antes de comprar', lighting: 'Iluminación', flow: 'Flujo', placement: 'Ubicación', maintenance: 'Mantenimiento', curiosities: 'Curiosidades', culture: 'Cultivo', harvest: 'Cosecha', use: 'Uso recomendado', nutrition: 'Composición', dose: 'Dosis', monitoring: 'Mediciones / seguimiento', risks: 'Riesgos', uses: 'Usos indicados', remove: 'Retirar durante tratamiento', reading: 'Lectura', range: 'Rangos', specs: 'Especificaciones', sources: 'Fuentes'
  };

  const TEMPLATE_ORDER = ['cover', 'photo', 'summary', 'identity', 'habitat', 'aquarium', 'parameters', 'behavior', 'compatibility', 'feeding', 'reef_safe', 'breeding', 'health', 'maintenance', 'curiosities', 'purchase', 'lighting', 'flow', 'placement', 'culture', 'harvest', 'use', 'nutrition', 'dose', 'monitoring', 'risks', 'uses', 'remove', 'reading', 'range', 'specs', 'sources'];

  function fieldRule(field) {
    return FIELD_RULES[field] || { label: field, required: true, ai: true, public: true, section: 'identity' };
  }

  function templateFor(type = 'general') {
    const fields = CONTRACTS[type] || COMMON_FIELDS;
    const sections = new Map();
    fields.forEach(field => {
      const rule = fieldRule(field);
      const sectionId = rule.section || 'identity';
      if (!sections.has(sectionId)) {
        sections.set(sectionId, {
          id: sectionId,
          label: SECTION_LABELS[sectionId] || sectionId,
          order: TEMPLATE_ORDER.indexOf(sectionId) === -1 ? 999 : TEMPLATE_ORDER.indexOf(sectionId) + 1,
          required: true,
          ai: true,
          validation: 'automatic_and_manual',
          fields: []
        });
      }
      sections.get(sectionId).fields.push({ id: field, ...rule });
    });
    return Array.from(sections.values()).sort((a, b) => a.order - b.order);
  }

  function templatePrompt(type, sectionId) {
    const section = templateFor(type).find(item => item.id === sectionId);
    if (!section) return '';
    return [
      `Completa solo el apartado: ${section.label}.`,
      'No rellenes otros apartados.',
      'No inventes datos.',
      'No uses bajo, medio, alto, moderado, suele, normalmente ni aproximadamente.',
      'Usa valores concretos cuando existan.',
      'No incluyas JSON, claves internas, nombres de campos internos ni URLs dentro del texto.',
      `Campos obligatorios: ${section.fields.map(field => field.label).join(', ')}.`,
      'Las fuentes deben ir separadas en sources.'
    ].join('\n');
  }

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
    if (typeof value === 'object') Object.values(value).forEach(item => extractUrlsFromAny(item, found));
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

  function cleanUrl(url) {
    try {
      const parsed = new URL(url);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => parsed.searchParams.delete(key));
      return parsed.toString();
    } catch (_) {
      return url || '';
    }
  }

  function normalizeSources(value) {
    const raw = Array.isArray(value) ? value : [];
    const seen = new Set();
    return raw.map((source, index) => {
      const item = typeof source === 'string' ? { url: source } : (source || {});
      const url = cleanUrl(extractUrlsFromAny(item.url || item)[0] || '');
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

  function valueFor(entry, field) {
    return entry.data?.[field] ?? entry[field];
  }

  function invalidFieldReason(entry, field) {
    const rule = fieldRule(field);
    if (field === 'sources') return normalizeSources(entry.sources).length >= (rule.minSources || 2) ? '' : `Se requieren al menos ${rule.minSources || 2} fuentes reales.`;
    const value = valueFor(entry, field);
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) return 'Campo obligatorio vacío.';
    if (rule.type === 'number' && !Number.isFinite(Number(value))) return 'Debe ser un valor numérico.';
    if (rule.minLength && String(value).trim().length < rule.minLength) return `Debe tener al menos ${rule.minLength} caracteres.`;
    if (rule.allowed && !rule.allowed.includes(value)) return `Valor no permitido: ${value}.`;
    if (rule.validator === 'scientificName' && !isConcreteScientificName(value)) return 'Debe ser una especie concreta.';
    const text = String(value);
    if (INTERNAL_FIELD_PATTERN.test(text)) return 'Contiene campos internos o parámetros técnicos.';
    if (extractUrlsFromAny(text).length) return 'Contiene URLs dentro del texto; deben ir en Fuentes.';
    return '';
  }

  function missingFields(entry) {
    const contract = CONTRACTS[entry.entry_type] || COMMON_FIELDS;
    return contract.filter(field => invalidFieldReason(entry, field));
  }

  function validateTemplate(entry) {
    const type = entry.entry_type || 'general';
    return templateFor(type).map(section => {
      const fields = section.fields.map(field => ({
        id: field.id,
        label: field.label,
        required: field.required !== false,
        valid: !invalidFieldReason(entry, field.id),
        error: invalidFieldReason(entry, field.id)
      }));
      return {
        id: section.id,
        label: section.label,
        required: section.required,
        valid: fields.every(field => field.valid),
        fields
      };
    });
  }

  function audit(entry) {
    const errors = [];
    const warnings = [];
    const sources = normalizeSources(entry.sources);
    const template = validateTemplate({ ...entry, sources });
    if (!STATUSES.includes(entry.status)) errors.push('Estado no permitido.');
    if (!entry.identity_confirmed) errors.push('Identificación insuficiente.');
    if (BIOLOGICAL_TYPES.includes(entry.entry_type) && !isConcreteScientificName(entry.scientific_name)) errors.push('La ficha biológica no tiene una especie concreta.');
    if (sources.length < 2) errors.push('Se requieren al menos dos URLs reales.');
    template.forEach(section => section.fields.forEach(field => { if (!field.valid) errors.push(`${section.label} · ${field.label}: ${field.error}`); }));
    const text = JSON.stringify(entry.data || entry.sections || {});
    GENERIC_PATTERNS.forEach(pattern => {
      const match = text.match(pattern);
      if (match) warnings.push(`Frase genérica o imprecisa: ${match[0]}.`);
    });
    if (INTERNAL_FIELD_PATTERN.test(text)) errors.push('La ficha contiene campos internos o trazas técnicas.');
    if (entry.entry_type === 'pez_marino' && /\bGH\b/i.test(text)) errors.push('GH no es un parámetro contractual para pez marino.');
    return { approved: errors.length === 0, errors, warnings, missing_fields: missingFields({ ...entry, sources }), source_count: sources.length, sources, template };
  }

  return { STATUSES, BIOLOGICAL_TYPES, PRODUCT_TYPES, REEF_SAFE, FIELD_RULES, CONTRACTS, SECTION_LABELS, templateFor, templatePrompt, extractUrlsFromAny, hasRealUrl, normalizeSources, isConcreteScientificName, missingFields, validateTemplate, audit };
});