/* AcuarioNexo · excepción segura para referencias comerciales multiespecie de invertebrados */
(function () {
  const S = window.ANX?.LibrarySchema;
  if (!S || S.__commercialInvertebrateRulesApplied) return;

  const originalAudit = S.audit.bind(S);
  const originalEffectiveAudit = S.effectiveAudit?.bind(S);
  const originalContractForAI = S.contractForAI?.bind(S);

  function clean(value) { return String(value ?? '').trim(); }

  function hasTmcIdentitySource(entry) {
    return S.normalizeSources(entry?.sources).some(source => {
      const url = clean(source.url).toLowerCase();
      const used = clean(source.used_for).toLowerCase();
      return url.includes('tropicalmarinecentre.com') && /(tax[oó]n|nombre comercial|sku|identidad|identificaci[oó]n)/i.test(used);
    });
  }

  function isCommercialGenusLevelInvertebrate(entry) {
    if (entry?.entry_type !== 'invertebrado') return false;
    const scientific = clean(entry.scientific_name);
    if (!/^[A-Z][a-z-]+\s+spp?\.$/.test(scientific)) return false;
    const notes = clean(entry?.data?.ai_notes);
    const explicitNoInference = /(no asignar especie|no completar especie|no inferir especie|no convertir spp|identificad[oa].*spp?\.)/i.test(notes);
    return explicitNoInference && hasTmcIdentitySource(entry);
  }

  function explicitNonApplicable(value) {
    return /^No aplicable a esta referencia comercial multiespecie\b/i.test(clean(value));
  }

  function suppressibleError(entry, error) {
    if (!isCommercialGenusLevelInvertebrate(entry)) return false;
    const text = clean(error);
    if (text === 'La ficha biológica no tiene una identificación científica válida para su categoría.') return true;
    if (/Identificaci[oó]n\s*·\s*Nombre cient[ií]fico:/.test(text) && /(binomio cient[ií]fico|especie concreta)/i.test(text)) return true;
    if (/Acuario recomendado\s*·\s*Acuario m[ií]nimo:/.test(text) && explicitNonApplicable(entry?.data?.minimum_tank_liters)) return true;
    if (/Identificaci[oó]n\s*·\s*Tama[nñ]o adulto:/.test(text) && explicitNonApplicable(entry?.data?.adult_size_cm)) return true;
    if (/Acuario recomendado\s*·\s*Tama[nñ]o adulto:/.test(text) && explicitNonApplicable(entry?.data?.adult_size_cm)) return true;
    return false;
  }

  function audit(entry) {
    const result = originalAudit(entry);
    if (!isCommercialGenusLevelInvertebrate(entry)) return result;
    const errors = (result.errors || []).filter(error => !suppressibleError(entry, error));
    const suppressedFields = new Set(['scientific_name']);
    if (explicitNonApplicable(entry?.data?.adult_size_cm)) suppressedFields.add('adult_size_cm');
    if (explicitNonApplicable(entry?.data?.minimum_tank_liters)) suppressedFields.add('minimum_tank_liters');
    return {
      ...result,
      approved: errors.length === 0,
      errors,
      missing_fields: (result.missing_fields || []).filter(field => !suppressedFields.has(field)),
      invalid_fields: (result.invalid_fields || []).filter(field => !suppressedFields.has(field)),
      warnings: [...new Set([...(result.warnings || []), 'Referencia comercial identificada solo a nivel de género; no se inventa una especie concreta.'])]
    };
  }

  function effectiveAudit(entry) {
    const current = audit(entry);
    if (current.approved) return current;
    return typeof originalEffectiveAudit === 'function' ? (S.persistedAudit?.(entry) || current) : current;
  }

  S.audit = audit;
  S.effectiveAudit = effectiveAudit;
  S.missingFields = entry => [...new Set(audit(entry).missing_fields || [])];
  S.isCommercialGenusLevelInvertebrate = isCommercialGenusLevelInvertebrate;

  if (originalContractForAI) {
    S.contractForAI = function (type) {
      const contract = originalContractForAI(type);
      if (type !== 'invertebrado') return contract;
      return {
        ...contract,
        global_rules: [
          ...(contract.global_rules || []),
          'Si una referencia comercial TMC identifica el invertebrado únicamente como Genus sp. o Genus spp., conserva ese nivel taxonómico y no inventes una especie. En ese caso, adult_size_cm y minimum_tank_liters pueden indicar de forma explícita que no son aplicables a la referencia multiespecie cuando no exista un valor único respaldado.'
        ]
      };
    };
  }

  S.__commercialInvertebrateRulesApplied = true;
})();
