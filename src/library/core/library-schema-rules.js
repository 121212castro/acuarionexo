/* AcuarioNexo · contrato estricto y único de Biblioteca */
(function () {
  const S = window.ANX?.LibrarySchema;
  if (!S || S.__strictContractApplied) return;

  const originalTemplateFor = S.templateFor;
  const TOP_LEVEL_FIELDS = new Set(['title', 'scientific_name', 'summary', 'sources']);
  const BIOLOGICAL_TYPES = new Set(S.BIOLOGICAL_TYPES || []);
  const STATUSES = new Set(S.STATUSES || []);
  const MIN_SUMMARY_LENGTH = 20;
  const FORBIDDEN_TEXT = /\b(bajo|medio|alto|moderado|normalmente|suele|aproximadamente)\b/i;
  const INTERNAL_TRACE = /\b(entry_type|identity_confirmed|source_context|utm_source)\b/i;
  const URL_PATTERN = /https?:\/\//i;

  function cleanEntry(entry) {
    const data = { ...(entry?.data || {}) };
    TOP_LEVEL_FIELDS.forEach(field => delete data[field]);
    return { ...(entry || {}), data };
  }

  function unique(list) {
    return [...new Set((list || []).map(value => String(value || '').trim()).filter(Boolean))];
  }

  function valueFor(entry, field) {
    if (field === 'title') return entry?.title;
    if (field === 'scientific_name') return entry?.scientific_name;
    if (field === 'summary') return entry?.summary ?? entry?.sections?.summary;
    if (field === 'sources') return entry?.sources;
    return entry?.data?.[field] ?? entry?.[field];
  }

  function normalizedTemplate(type) {
    return originalTemplateFor(type).map(section => ({
      ...section,
      fields: section.fields.map(field => ({
        ...field,
        type: field.allowed?.length ? 'enum' : field.type,
        minLength: field.allowed?.length ? 1 : Number(field.minLength || 1)
      }))
    }));
  }

  function fieldDefinition(type, fieldId) {
    return normalizedTemplate(type).flatMap(section => section.fields).find(field => field.id === fieldId) || null;
  }

  function validateField(entry, field) {
    const value = valueFor(entry, field.id);
    if (field.id === 'sources') {
      return S.normalizeSources(value).length >= 2 ? '' : 'Se requieren al menos 2 fuentes reales con URL completa.';
    }
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return 'Campo obligatorio vacío.';
    if (field.allowed?.length && !field.allowed.includes(String(value).trim())) {
      return `Valor no permitido. Usa exactamente: ${field.allowed.join(' | ')}.`;
    }
    if (field.validator === 'scientificName' && !S.isConcreteScientificName(value)) return 'Debe ser una especie concreta con binomio científico válido.';
    const text = String(value).trim();
    if (field.type === 'number' && !S.hasNumericValue(value)) return 'Debe incluir un valor numérico o rango concreto.';
    if (field.type !== 'number' && !field.allowed?.length && text.length < Number(field.minLength || 1)) {
      return `Debe tener al menos ${Number(field.minLength || 1)} caracteres.`;
    }
    if (field.id !== 'sources' && URL_PATTERN.test(text)) return 'Las URLs solo pueden aparecer en Fuentes.';
    if (!field.allowed?.length && FORBIDDEN_TEXT.test(text)) return 'Contiene una expresión imprecisa prohibida.';
    if (INTERNAL_TRACE.test(text)) return 'Contiene trazas internas de la aplicación.';
    return '';
  }

  function completeTemplate(type) {
    return normalizedTemplate(type).map(section => ({
      ...section,
      fields: section.fields.map(field => ({ ...field }))
    }));
  }

  function publicTemplate(type) {
    return completeTemplate(type).map(section => ({
      ...section,
      fields: section.fields.filter(field => !['title', 'scientific_name'].includes(field.id))
    })).filter(section => section.fields.length);
  }

  function validateTemplate(entry) {
    return completeTemplate(entry?.entry_type || 'producto').map(section => ({
      id: section.id,
      label: section.label,
      required: true,
      valid: section.fields.every(field => !validateField(entry, field)),
      fields: section.fields.map(field => {
        const error = validateField(entry, field);
        return { ...field, required: true, valid: !error, error };
      })
    }));
  }

  function missingFields(entry) {
    const missing = validateTemplate(entry)
      .flatMap(section => section.fields)
      .filter(field => !field.valid)
      .map(field => field.id);
    const summary = String(valueFor(entry, 'summary') || '').trim();
    if (summary.length < MIN_SUMMARY_LENGTH) missing.push('summary');
    return unique(missing);
  }

  function contractIntegrityReport() {
    const errors = [];
    Object.entries(S.CONTRACTS || {}).forEach(([type, contract]) => {
      const template = completeTemplate(type);
      const fields = template.flatMap(section => section.fields);
      const ids = fields.map(field => field.id);
      const duplicates = contract.filter((field, index) => contract.indexOf(field) !== index);
      if (!Array.isArray(contract) || !contract.length) errors.push(`${type}: contrato vacío.`);
      if (duplicates.length) errors.push(`${type}: campos duplicados: ${unique(duplicates).join(', ')}.`);
      contract.forEach(field => {
        if (!ids.includes(field)) errors.push(`${type}: ${field} no aparece en la plantilla.`);
        const definition = fields.find(item => item.id === field);
        if (!definition?.label) errors.push(`${type}: ${field} no tiene etiqueta visible.`);
        if (!definition?.section) errors.push(`${type}: ${field} no tiene apartado.`);
        if (definition?.allowed?.length && definition.minLength !== 1) errors.push(`${type}: ${field} mezcla valores cerrados con longitud textual.`);
      });
      ids.forEach(field => { if (!contract.includes(field)) errors.push(`${type}: la plantilla contiene ${field}, pero el contrato no.`); });
      if (!contract.includes('title')) errors.push(`${type}: falta title.`);
      if (!contract.includes('sources')) errors.push(`${type}: falta sources.`);
      if (BIOLOGICAL_TYPES.has(type) && !contract.includes('scientific_name')) errors.push(`${type}: falta scientific_name.`);
    });
    return { approved: errors.length === 0, errors, types: Object.keys(S.CONTRACTS || {}).length };
  }

  function audit(entry) {
    const cleaned = cleanEntry(entry);
    const errors = [];
    const warnings = [];
    if (!STATUSES.has(cleaned.status)) errors.push('Estado no permitido.');
    if (!cleaned.identity_confirmed) errors.push('Identificación insuficiente.');
    if (BIOLOGICAL_TYPES.has(cleaned.entry_type) && !S.isConcreteScientificName(cleaned.scientific_name)) errors.push('La ficha biológica no tiene una especie concreta.');

    validateTemplate(cleaned).forEach(section => section.fields.forEach(field => {
      if (!field.valid) errors.push(`${section.label} · ${field.label}: ${field.error}`);
    }));

    const summary = String(valueFor(cleaned, 'summary') || '').trim();
    if (!summary) errors.push('Resumen · Resumen: Campo obligatorio vacío.');
    else if (summary.length < MIN_SUMMARY_LENGTH) errors.push(`Resumen · Resumen: Debe tener al menos ${MIN_SUMMARY_LENGTH} caracteres.`);
    if (URL_PATTERN.test(summary)) errors.push('Resumen · Resumen: Las URLs solo pueden aparecer en Fuentes.');
    if (FORBIDDEN_TEXT.test(summary)) errors.push('Resumen · Resumen: Contiene una expresión imprecisa prohibida.');

    const integrity = contractIntegrityReport();
    if (!integrity.approved) errors.push(...integrity.errors.map(error => `Contrato interno · ${error}`));
    if (cleaned.entry_type === 'pez_marino' && /\bGH\b/i.test(JSON.stringify(cleaned.data || {}))) errors.push('GH no es un parámetro contractual para pez marino.');

    const sources = S.normalizeSources(cleaned.sources);
    return {
      approved: unique(errors).length === 0,
      errors: unique(errors),
      warnings: unique(warnings),
      missing_fields: missingFields(cleaned),
      source_count: sources.length,
      sources,
      template: validateTemplate(cleaned),
      contract_integrity: integrity
    };
  }

  S.templateFor = publicTemplate;
  S.completeTemplateFor = completeTemplate;
  S.fieldDefinition = fieldDefinition;
  S.validateField = validateField;
  S.validateTemplate = validateTemplate;
  S.missingFields = missingFields;
  S.audit = audit;
  S.requiredFieldsForType = type => Array.from(S.CONTRACTS?.[type] || []);
  S.isRequiredFieldForEntry = (entry, field) => (S.CONTRACTS?.[entry?.entry_type] || []).includes(field) || field === 'summary';
  S.topLevelFields = Array.from(TOP_LEVEL_FIELDS);
  S.cleanEntryForAudit = cleanEntry;
  S.contractIntegrityReport = contractIntegrityReport;
  S.__strictContractApplied = true;
})();