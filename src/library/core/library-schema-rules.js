/* AcuarioNexo · reglas flexibles de contrato de Biblioteca */
(function () {
  const S = window.ANX?.LibrarySchema;
  if (!S || S.__flexRulesApplied) return;

  const originalAudit = S.audit;
  const originalValidateTemplate = S.validateTemplate;
  const originalMissingFields = S.missingFields;

  const UNKNOWN_PATTERN = /^(no\s+(localizado|encontrado|indicado|declarado|disponible)|sin\s+(dato|datos|informaci[oó]n)|no\s+consta|no\s+aplica)/i;
  const MIN_LENGTH_ERROR_PATTERN = /Debe tener al menos\s+\d+\s+caracteres\./i;
  const NUMBER_ERROR_PATTERN = /Debe ser un valor numérico\./i;
  const FLEXIBLE_NUMBER_PATTERN = /\d+(?:[.,]\d+)?(?:\s*(?:-|–|—|a|hasta)\s*\d+(?:[.,]\d+)?)?/i;

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

  const FLEXIBLE_MIN_LENGTH_FIELDS = new Map([
    ['title', 2],
    ['scientific_name', 2],
    ['common_names', 2],
    ['synonyms', 2],
    ['family', 2],
    ['order_name', 2],
    ['class_name', 2],
    ['category', 2],
    ['coral_type', 2],
    ['plant_type', 2],
    ['culture_type', 2],
    ['care_level', 2],
    ['beginner_suitable', 2],
    ['reef_safe', 2],
    ['aggressiveness', 2],
    ['territoriality', 2],
    ['schooling', 2],
    ['swimming_zone', 2],
    ['growth_form', 2],
    ['growth_rate', 2],
    ['photosynthetic', 2],
    ['fragging', 2],
    ['propagation', 2],
    ['placement', 2],
    ['lighting', 2],
    ['flow', 1],
    ['co2', 2],
    ['fertilization', 2],
    ['substrate', 2],
    ['trimming', 2],
    ['algae_risk', 2],
    ['molting', 2],
    ['iodine_sensitivity', 2],
    ['copper_sensitivity', 2],
    ['storage', 2],
    ['expiry', 2],
    ['lot', 2]
  ]);

  function isUnknown(value) {
    return UNKNOWN_PATTERN.test(String(value || '').trim());
  }

  function hasNumericValue(value) {
    if (value === null || value === undefined || Array.isArray(value)) return false;
    return FLEXIBLE_NUMBER_PATTERN.test(String(value).trim());
  }

  function valueFor(entry, field) {
    return entry?.data?.[field] ?? entry?.[field];
  }

  function fieldIdFromLabel(entry, label) {
    let fieldId = '';
    S.validateTemplate(entry).forEach(section => section.fields.forEach(field => {
      if (field.label === label) fieldId = field.id;
    }));
    return fieldId;
  }

  function isSoftAcceptable(entry, field) {
    const value = valueFor(entry, field);
    if (!SOFT_UNKNOWN_FIELDS.has(field)) return false;
    if (!isUnknown(value)) return false;
    return S.normalizeSources(entry.sources).length >= 2;
  }

  function isMinLengthAcceptable(entry, field) {
    if (!FLEXIBLE_MIN_LENGTH_FIELDS.has(field)) return false;
    const value = valueFor(entry, field);
    if (value == null || Array.isArray(value)) return false;
    return String(value).trim().length >= FLEXIBLE_MIN_LENGTH_FIELDS.get(field);
  }

  function isNumberErrorAcceptable(entry, field) {
    const value = valueFor(entry, field);
    return hasNumericValue(value);
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
      const fieldId = label ? fieldIdFromLabel(entry, label) : '';

      if (fieldId && isSoftAcceptable(entry, fieldId)) {
        next.warnings.push(`${label}: aceptado como no localizado en fuente fiable.`);
        return;
      }
      if (fieldId && MIN_LENGTH_ERROR_PATTERN.test(text) && isMinLengthAcceptable(entry, fieldId)) {
        next.warnings.push(`${label}: aceptado con texto corto porque el dato real no requiere 20 caracteres.`);
        return;
      }
      if (fieldId && NUMBER_ERROR_PATTERN.test(text) && isNumberErrorAcceptable(entry, fieldId)) {
        next.warnings.push(`${label}: aceptado con número, rango o unidad.`);
        return;
      }
      next.errors.push(error);
    });

    (audit.missing_fields || []).forEach(field => {
      if (isSoftAcceptable(entry, field)) {
        next.warnings.push(`${field}: aceptado como no localizado en fuente fiable.`);
        return;
      }
      if (isMinLengthAcceptable(entry, field)) {
        next.warnings.push(`${field}: aceptado con texto corto porque el dato real no requiere 20 caracteres.`);
        return;
      }
      if (isNumberErrorAcceptable(entry, field)) {
        next.warnings.push(`${field}: aceptado con número, rango o unidad.`);
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
        if (MIN_LENGTH_ERROR_PATTERN.test(String(field.error || '')) && isMinLengthAcceptable(entry, field.id)) {
          return { ...field, valid: true, error: '' };
        }
        if (NUMBER_ERROR_PATTERN.test(String(field.error || '')) && isNumberErrorAcceptable(entry, field.id)) {
          return { ...field, valid: true, error: '' };
        }
        return field;
      });
      return { ...section, fields, valid: fields.every(field => field.valid) };
    });
  };

  S.missingFields = function (entry) {
    return originalMissingFields(entry).filter(field => !isSoftAcceptable(entry, field) && !isMinLengthAcceptable(entry, field) && !isNumberErrorAcceptable(entry, field));
  };

  S.hasNumericValue = hasNumericValue;
  S.isCriticalField = isCritical;
  S.isSoftUnknownField = field => SOFT_UNKNOWN_FIELDS.has(field);
  S.isFlexibleMinLengthField = field => FLEXIBLE_MIN_LENGTH_FIELDS.has(field);
  S.__flexRulesApplied = true;
})();