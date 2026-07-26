/* AcuarioNexo · compatibilidad del contrato simplificado de invertebrados */
(function () {
  let attempts = 0;

  function applyContract() {
    const S = window.ANX?.LibrarySchema;
    if (!S || !S.__strictContractApplied) return false;
    if (S.__invertebrateSimplifiedContractApplied) return true;

    const type = 'invertebrado';
    const redundantFields = new Set(['feeding', 'iodine_sensitivity', 'user_summary']);
    if (Array.isArray(S.CONTRACTS?.[type])) {
      S.CONTRACTS[type] = S.CONTRACTS[type].filter(field => !redundantFields.has(field));
    }

    function normalizedEntry(entry) {
      const copy = { ...(entry || {}), data: { ...(entry?.data || {}) } };
      const d = copy.data;
      if (!d.copper_sensitivity && d.medication_sensitivity) d.copper_sensitivity = d.medication_sensitivity;
      if (!d.common_problems) d.common_problems = d.common_diseases || d.health_notes || '';
      const reef = String(d.reef_safe || '').trim().replace(/[\s.,;:]+$/g, '');
      if (/^s[ií]$/i.test(reef)) d.reef_safe = 'Sí';
      else if (/^s[ií]\s+con\s+precauci[oó]n$/i.test(reef)) d.reef_safe = 'Sí con precaución';
      else if (/^no$/i.test(reef)) d.reef_safe = 'No';
      return copy;
    }

    const originalAudit = S.audit.bind(S);
    const originalValidateTemplate = S.validateTemplate.bind(S);
    const originalMissingFields = S.missingFields.bind(S);

    S.audit = entry => originalAudit(normalizedEntry(entry));
    S.validateTemplate = entry => originalValidateTemplate(normalizedEntry(entry));
    S.missingFields = entry => originalMissingFields(normalizedEntry(entry));
    S.requiredFieldsForType = entryType => Array.from(S.CONTRACTS?.[entryType] || []);
    S.__invertebrateSimplifiedContractApplied = true;
    return true;
  }

  function boot() {
    if (applyContract()) return;
    attempts += 1;
    if (attempts < 200) setTimeout(boot, 100);
  }

  boot();
})();
