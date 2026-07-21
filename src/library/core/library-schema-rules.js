/* AcuarioNexo · contrato estricto y único de Biblioteca */
(function () {
  const S = window.ANX?.LibrarySchema;
  if (!S || S.__strictContractApplied) return;

  const originalAudit = S.audit;
  const originalValidateTemplate = S.validateTemplate;
  const originalMissingFields = S.missingFields;
  const originalTemplateFor = S.templateFor;
  const TOP_LEVEL_FIELDS = new Set(['title', 'scientific_name', 'summary', 'sources']);
  const BIOLOGICAL_TYPES = new Set(S.BIOLOGICAL_TYPES || []);
  const INTERNAL_TRACE_ERROR = /La ficha contiene campos internos o trazas técnicas\./i;
  const MIN_SUMMARY_LENGTH = 20;

  function cleanEntry(entry) {
    const data = { ...(entry?.data || {}) };
    TOP_LEVEL_FIELDS.forEach(field => delete data[field]);
    return { ...(entry || {}), data };
  }

  function unique(list) {
    return [...new Set((list || []).map(value => String(value || '').trim()).filter(Boolean))];
  }

  function summaryError(entry) {
    const summary = String(entry?.summary || entry?.sections?.summary || '').trim();
    if (!summary) return 'Resumen · Resumen: Campo obligatorio vacío.';
    if (summary.length < MIN_SUMMARY_LENGTH) return `Resumen · Resumen: Debe tener al menos ${MIN_SUMMARY_LENGTH} caracteres.`;
    return '';
  }

  function contractIntegrityReport() {
    const errors = [];
    Object.entries(S.CONTRACTS || {}).forEach(([type, contract]) => {
      if (!Array.isArray(contract) || !contract.length) {
        errors.push(`${type}: contrato vacío.`);
        return;
      }
      const duplicates = contract.filter((field, index) => contract.indexOf(field) !== index);
      if (duplicates.length) errors.push(`${type}: campos duplicados: ${unique(duplicates).join(', ')}.`);
      if (!contract.includes('title')) errors.push(`${type}: falta title.`);
      if (!contract.includes('sources')) errors.push(`${type}: falta sources.`);
      if (BIOLOGICAL_TYPES.has(type) && !contract.includes('scientific_name')) errors.push(`${type}: falta scientific_name.`);

      const sections = originalTemplateFor(type);
      const templateFields = sections.flatMap(section => section.fields.map(field => field.id));
      contract.forEach(field => {
        if (!templateFields.includes(field)) errors.push(`${type}: ${field} no aparece en la plantilla.`);
        const definition = sections.flatMap(section => section.fields).find(item => item.id === field);
        if (!definition?.label) errors.push(`${type}: ${field} no tiene etiqueta visible.`);
        if (!definition?.section) errors.push(`${type}: ${field} no tiene apartado.`);
      });
      templateFields.forEach(field => {
        if (!contract.includes(field)) errors.push(`${type}: la plantilla contiene ${field}, pero el contrato no.`);
      });
    });
    return { approved: errors.length === 0, errors, types: Object.keys(S.CONTRACTS || {}).length };
  }

  S.templateFor = function (type) {
    return originalTemplateFor(type).map(section => ({
      ...section,
      fields: section.fields.filter(field => !['title', 'scientific_name'].includes(field.id))
    })).filter(section => section.fields.length);
  };

  S.validateTemplate = function (entry) {
    return originalValidateTemplate(cleanEntry(entry));
  };

  S.missingFields = function (entry) {
    const cleaned = cleanEntry(entry);
    const missing = originalMissingFields(cleaned);
    const summary = String(cleaned.summary || cleaned.sections?.summary || '').trim();
    if (summary.length < MIN_SUMMARY_LENGTH) missing.push('summary');
    return unique(missing);
  };

  S.audit = function (entry) {
    const cleaned = cleanEntry(entry);
    const base = originalAudit(cleaned);
    const errors = (base.errors || []).filter(error => !INTERNAL_TRACE_ERROR.test(String(error)));
    const summaryIssue = summaryError(cleaned);
    if (summaryIssue) errors.push(summaryIssue);

    const integrity = contractIntegrityReport();
    if (!integrity.approved) errors.push(...integrity.errors.map(error => `Contrato interno · ${error}`));

    const missingFields = S.missingFields(cleaned);
    return {
      ...base,
      approved: errors.length === 0,
      errors: unique(errors),
      warnings: unique(base.warnings || []),
      missing_fields: missingFields,
      contract_integrity: integrity
    };
  };

  S.requiredFieldsForType = type => Array.from(S.CONTRACTS?.[type] || []);
  S.isRequiredFieldForEntry = (entry, field) => (S.CONTRACTS?.[entry?.entry_type] || []).includes(field) || field === 'summary';
  S.topLevelFields = Array.from(TOP_LEVEL_FIELDS);
  S.cleanEntryForAudit = cleanEntry;
  S.contractIntegrityReport = contractIntegrityReport;
  S.__strictContractApplied = true;
})();
