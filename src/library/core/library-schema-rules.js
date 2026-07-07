/* AcuarioNexo · reglas flexibles de contrato de Biblioteca */
(function () {
  const S = window.ANX?.LibrarySchema;
  if (!S || S.__flexRulesApplied) return;

  const originalAudit = S.audit;
  const originalValidateTemplate = S.validateTemplate;
  const originalMissingFields = S.missingFields;

  const UNKNOWN_PATTERN = /^(no\s+(localizado|encontrado|indicado|declarado|disponible)|sin\s+(dato|datos|informaci[oó]n)|no\s+consta|no\s+aplica)/i;

  const CRITICAL_FIELDS = new Set([
    'title',
    'scientific_name',
    'manufacturer',
    'brand',
    'product_code',
    'entry_type',
    'summary',
    'sources',
    'dose',
    'dose_calculation',
    'use',
    'instructions',
    'warnings',
    'risks',
    'parameter',
    'method',
    'procedure',
    'reading_time',
    'sample_volume',
    'test_type'
  ]);

  const SOFT_UNKNOWN_FIELDS = new Set([
    'common_names','synonyms','family','order_name','class_name','distribution','habitat','depth_range','natural_environment',
    'adult_size_cm','life_expectancy_years','minimum_tank_liters','recommended_tank_liters','tank_maturity','care_level','beginner_suitable',
    'aggressiveness','territoriality','social_behavior','schooling','swimming_zone','reproduction','breeding_notes','common_diseases','health_notes',
    'coral_type','growth_form','sweeper_tentacles','growth_rate','fragging','propagation','pests','adult_size_cm',
    'plant_type','height_cm','substrate','algae_risk','culture_type','target_animals','container','density_control','crash_risks','contamination_risks',
    'composition','active_components','declared_parameters','salinity_reference','maximum_dose','expiry','lot','accuracy','scale_values','device_min_limit','device_max_limit','led_wavelength','standard_code','warranty','spare_parts','source_label','source_manual'
  ]);

  function isUnknown(value) {
    return UNKNOWN_PATTERN.test(String(value || '').trim());
  }

  function valueFor(entry, field) {
    return entry?.data?.[field] ?? entry?.[field];
  }

  function isSoftAcceptable(entry, field) {
    const value = valueFor(entry, field);
    if (!SOFT_UNKNOWN_FIELDS.has(field)) return false;
    if (!isUnknown(value)) return false;
    return S.normalizeSources(entry.sources).length >= 2;
  }

  function isCritical(field) {
    return CRITICAL_FIELDS.has(field);
  }

  function filterAudit(entry, audit) {
    const next = {
      ...audit,
      errors: [],
      warnings: [...(audit.warnings || [])],
      missing_fields: []
    };

    (audit.errors || []).forEach(error => {
      const text = String(error || '');
      const matched = text.match(/·\s*([^:]+):/);
      const label = matched ? matched[1].trim() : '';
      const template = S.validateTemplate(entry);
      let fieldId = '';
      template.forEach(section => section.fields.forEach(field => {
        if (field.label === label) fieldId = field.id;
      }));

      if (fieldId && isSoftAcceptable(entry, fieldId)) {
        next.warnings.push(`${label}: aceptado como no localizado en fuente fiable.`);
        return;
      }
      next.errors.push(error);
    });

    (audit.missing_fields || []).forEach(field => {
      if (isSoftAcceptable(entry, field)) {
        next.warnings.push(`${field}: aceptado como no localizado en fuente fiable.`);
        return;
      }
      next.missing_fields.push(field);
    });

    next.approved = next.errors.length === 0;
    return next;
  }

  S.audit = function (entry) {
    return filterAudit(entry, originalAudit(entry));
  };

  S.validateTemplate = function (entry) {
    const template = originalValidateTemplate(entry);
    return template.map(section => {
      const fields = section.fields.map(field => {
        if (field.valid) return field;
        if (isSoftAcceptable(entry, field.id)) {
          return { ...field, valid: true, error: '' };
        }
        return field;
      });
      return { ...section, fields, valid: fields.every(field => field.valid) };
    });
  };

  S.missingFields = function (entry) {
    return originalMissingFields(entry).filter(field => !isSoftAcceptable(entry, field));
  };

  S.isCriticalField = isCritical;
  S.isSoftUnknownField = field => SOFT_UNKNOWN_FIELDS.has(field);
  S.__flexRulesApplied = true;
})();
