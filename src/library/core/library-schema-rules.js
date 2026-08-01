/* AcuarioNexo · motor único de contrato, auditoría y publicación */
(function () {
  const S = window.ANX?.LibrarySchema;
  if (!S) return;

  const originalTemplateFor = S.templateFor.bind(S);
  const TOP = new Set(['title', 'scientific_name', 'summary', 'sources']);
  const BIO = new Set(S.BIOLOGICAL_TYPES || []);
  const PRODUCT = new Set(['producto','medicamento','sal','aditivo','alimento','test','equipamiento']);
  const STATUS = new Set(S.STATUSES || []);
  const SOURCE_POLICY = S.SOURCE_POLICY || {};
  const MIN_SOURCES = Number(SOURCE_POLICY.minimumSources || 3);
  const MIN_HOSTS = Number(SOURCE_POLICY.minimumIndependentSources || 2);
  const SPECIALIZED = SOURCE_POLICY.specializedDomains || {};
  const OFFICIAL = new RegExp(SOURCE_POLICY.officialSourcePattern || '\\b(fabricante|manufacturer|oficial|official|manual|prospecto|ficha t[eé]cnica|datasheet|sds)\\b', 'i');
  const WEAK = new RegExp(SOURCE_POLICY.weakSourceDomainPattern || '\\b(wikipedia\\.org|facebook\\.com|instagram\\.com|amazon\\.|ebay\\.|aliexpress\\.|reddit\\.com)\\b', 'i');
  const URL = /https?:\/\//i;
  const INTERNAL = /\b(entry_type|identity_confirmed|source_context|utm_source)\b/i;
  const IMPRECISE = /\b(bajo|medio|alto|moderado|normalmente|suele|aproximadamente)\b/i;
  const IDENTIFIERS = new Set(['title','scientific_name','common_names','synonyms','manufacturer','brand','product_code','family','order_name','class_name','category','equipment_type','food_type','culture_type','coral_type','plant_type','test_type','parameter','method','reading_unit','data_type','internal_unit','primary_field','active_ingredient','reagent_code','standard_code','lot']);

  const clean = value => String(value ?? '').trim();
  const unique = list => [...new Set((list || []).map(clean).filter(Boolean))];
  const valueFor = (entry, id) => id === 'summary'
    ? (entry?.summary ?? entry?.sections?.summary)
    : TOP.has(id) ? entry?.[id] : (entry?.data?.[id] ?? entry?.[id]);

  function host(url) {
    try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); }
    catch (_) { return ''; }
  }

  function matchesDomain(hostname, domains) {
    return (domains || []).some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  }

  function sourcePolicy(entryType, raw) {
    const sources = S.normalizeSources(raw);
    const errors = [];
    if (sources.length < MIN_SOURCES) errors.push(`Se requieren al menos ${MIN_SOURCES} fuentes reales con URL completa.`);
    if (sources.some(source => !clean(source.used_for))) errors.push('Cada fuente debe indicar qué datos respalda en used_for.');
    if (BIO.has(entryType) && !sources.some(source => matchesDomain(host(source.url), SPECIALIZED[entryType] || []))) {
      errors.push('Falta una base especializada obligatoria para esta categoría.');
    }
    if (PRODUCT.has(entryType) && !sources.some(source => OFFICIAL.test(`${source.source_type || ''} ${source.name || ''}`) && !WEAK.test(host(source.url)))) {
      errors.push('Falta una fuente oficial del fabricante, manual, prospecto o ficha técnica.');
    }
    const reliableHosts = new Set(sources.map(source => host(source.url)).filter(name => name && !WEAK.test(name)));
    if (reliableHosts.size < MIN_HOSTS) errors.push(`Se requieren al menos ${MIN_HOSTS} dominios fiables independientes.`);
    return { approved: errors.length === 0, errors, sources, source_count: sources.length };
  }

  function concreteScientificName(value) {
    const name = clean(value);
    return /^[A-Z][a-z-]+\s+[a-z][a-z-]+(?:\s+var\.\s+[a-z-]+)?$/.test(name) && !/\b(?:spp?|cf|aff)\.?\b/i.test(name);
  }

  function genusOnlyMicrofauna(entry) {
    if (entry?.entry_type !== 'microfauna') return false;
    const name = clean(entry.scientific_name);
    if (!/^[A-Z][a-z-]+\s+sp\.$/.test(name)) return false;
    const context = `${clean(entry?.data?.culture_type)} ${clean(entry?.data?.identification)} ${clean(entry?.data?.ai_notes)}`;
    return /\b(g[eé]nero|especie no publicada|especie no confirmada|identificad[ao].*g[eé]nero|sp\.)\b/i.test(context);
  }

  function multiTaxonMicrofauna(entry) {
    if (entry?.entry_type !== 'microfauna') return false;
    const taxa = clean(entry.scientific_name).split(/\s*\+\s*/).filter(Boolean);
    if (taxa.length < 2) return false;
    const valid = taxon => concreteScientificName(taxon) || /^[A-Z][a-z-]+(?:\s+spp?\.)?$/.test(taxon);
    const context = `${clean(entry?.data?.culture_type)} ${clean(entry?.data?.identification)}`;
    return taxa.every(valid) && /\b(mezcla|multiespec[ií]fic[ao])\b/i.test(context);
  }

  function flexibleMicrofauna(entry, id) {
    return (multiTaxonMicrofauna(entry) || genusOnlyMicrofauna(entry)) && ['scientific_name','temperature_min','temperature_max','salinity_min','salinity_max'].includes(id);
  }

  function normalizedTemplate(type) {
    return originalTemplateFor(type).map(section => ({
      ...section,
      fields: (section.fields || []).map(field => ({
        ...field,
        type: field.allowed?.length ? 'enum' : field.type,
        minLength: field.allowed?.length ? 1 : (IDENTIFIERS.has(field.id) ? 1 : Number(field.minLength || 1))
      }))
    }));
  }

  function fieldDefinition(type, id) {
    return normalizedTemplate(type).flatMap(section => section.fields).find(field => field.id === id) || null;
  }

  function validateField(entry, field) {
    const value = valueFor(entry, field.id);
    if (field.id === 'sources') return sourcePolicy(entry.entry_type, value).errors.join(' ');
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) return 'Campo obligatorio vacío.';
    if (field.allowed?.length && !field.allowed.includes(clean(value))) return `Valor no permitido. Usa exactamente: ${field.allowed.join(' | ')}.`;
    if (field.validator === 'scientificName' && !flexibleMicrofauna(entry, field.id) && !concreteScientificName(value)) return 'Debe ser un binomio científico válido.';
    const text = clean(typeof value === 'object' ? JSON.stringify(value) : value);
    if (field.type === 'number' && !flexibleMicrofauna(entry, field.id) && !/\d+(?:[.,]\d+)?/.test(text)) return 'Debe incluir un valor numérico o rango concreto.';
    if (field.type !== 'number' && !field.allowed?.length && text.length < Number(field.minLength || 1)) return `Debe tener al menos ${field.minLength || 1} caracteres.`;
    if (URL.test(text)) return 'Las URLs solo pueden aparecer en Fuentes.';
    if (INTERNAL.test(text)) return 'Contiene trazas internas de la aplicación.';
    return '';
  }

  function completeTemplate(type) {
    return normalizedTemplate(type).map(section => ({ ...section, fields: section.fields.map(field => ({ ...field })) }));
  }

  function publicTemplate(type) {
    return completeTemplate(type).map(section => ({
      ...section,
      fields: section.fields.filter(field => !['title','scientific_name'].includes(field.id))
    })).filter(section => section.fields.length);
  }

  function audit(entry) {
    const errors = [];
    const warnings = [];
    const missing = [];
    const invalid = [];
    const type = clean(entry?.entry_type);
    if (!STATUS.has(entry?.status)) errors.push('Estado no permitido.');
    if (!entry?.identity_confirmed) errors.push('Identificación insuficiente.');
    if (BIO.has(type) && !multiTaxonMicrofauna(entry) && !genusOnlyMicrofauna(entry) && !concreteScientificName(entry?.scientific_name)) {
      errors.push('La ficha biológica no tiene una identificación científica válida para su categoría.');
    }
    for (const section of completeTemplate(type)) {
      for (const field of section.fields) {
        const error = validateField(entry, field);
        if (!error) continue;
        const value = valueFor(entry, field.id);
        if (field.id === 'sources' || value == null || value === '' || (Array.isArray(value) && !value.length)) missing.push(field.id);
        else invalid.push(field.id);
        errors.push(`${section.label} · ${field.label}: ${error}`);
      }
    }
    const summary = clean(valueFor(entry, 'summary'));
    if (!summary) { errors.push('Resumen · Resumen: Campo obligatorio vacío.'); missing.push('summary'); }
    else if (summary.length < 20) { errors.push('Resumen · Resumen: Debe tener al menos 20 caracteres.'); invalid.push('summary'); }
    if (URL.test(summary)) errors.push('Resumen · Resumen: Las URLs solo pueden aparecer en Fuentes.');
    const imprecise = JSON.stringify({ summary, data: entry?.data || {} }).match(IMPRECISE);
    if (imprecise) warnings.push(`Revisar expresión contextual: ${imprecise[0]}.`);
    return {
      approved: unique(errors).length === 0,
      errors: unique(errors),
      warnings: unique(warnings),
      missing_fields: unique(missing),
      invalid_fields: unique(invalid),
      poor_fields: [],
      source_count: S.normalizeSources(entry?.sources).length,
      sources: S.normalizeSources(entry?.sources),
      engine: 'library-contract-engine-v2'
    };
  }

  function contractIntegrityReport() {
    const errors = [];
    Object.entries(S.CONTRACTS || {}).forEach(([type, contract]) => {
      const ids = completeTemplate(type).flatMap(section => section.fields.map(field => field.id));
      contract.forEach(id => { if (!ids.includes(id)) errors.push(`${type}: ${id} no aparece en la plantilla.`); });
      ids.forEach(id => { if (!contract.includes(id)) errors.push(`${type}: ${id} no aparece en el contrato.`); });
    });
    return { approved: errors.length === 0, errors, types: Object.keys(S.CONTRACTS || {}).length };
  }

  S.templateFor = publicTemplate;
  S.completeTemplateFor = completeTemplate;
  S.fieldDefinition = fieldDefinition;
  S.validateField = validateField;
  S.validateTemplate = entry => completeTemplate(entry.entry_type).map(section => ({
    ...section,
    required: true,
    valid: section.fields.every(field => !validateField(entry, field)),
    fields: section.fields.map(field => {
      const error = validateField(entry, field);
      return { ...field, required: true, valid: !error, error };
    })
  }));
  S.missingFields = entry => unique(audit(entry).missing_fields);
  S.audit = audit;
  S.sourcePolicy = sourcePolicy;
  S.isConcreteScientificName = concreteScientificName;
  S.isMultiTaxonMicrofauna = multiTaxonMicrofauna;
  S.isGenusOnlyMicrofauna = genusOnlyMicrofauna;
  S.contractIntegrityReport = contractIntegrityReport;
  S.requiredFieldsForType = type => [...(S.CONTRACTS?.[type] || [])];
  S.isRequiredFieldForEntry = (entry, field) => (S.CONTRACTS?.[entry?.entry_type] || []).includes(field) || field === 'summary';
  S.topLevelFields = [...TOP];
  S.__strictContractApplied = true;
})();