/* AcuarioNexo · Asistente IA · contrato oficial Fase 1 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.ANX = root.ANX || {};
    root.ANX.AssistantContract = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const VERSION = '1.0.0';

  const MODES = Object.freeze({
    GENERAL: 'general',
    AQUARIUM: 'aquarium'
  });

  const INTENTS = Object.freeze([
    'library_search',
    'compatibility_check',
    'feeding_recommendation',
    'water_parameter_interpretation',
    'product_selection',
    'dose_calculation',
    'maintenance_guidance',
    'health_triage',
    'equipment_guidance',
    'inventory_check',
    'general_aquarium_question'
  ]);

  const SOURCE_PRIORITY = Object.freeze([
    'published_library_entry',
    'validated_library_entry',
    'selected_aquarium_context',
    'user_inventory',
    'recent_measurements',
    'maintenance_history',
    'external_verified_source'
  ]);

  const PUBLIC_LIBRARY_STATUSES = Object.freeze(['published']);
  const ADMIN_LIBRARY_STATUSES = Object.freeze(['published', 'validated', 'review']);

  const CONFIDENCE_STATES = Object.freeze({
    CONFIRMED: 'confirmed_by_library',
    COMPATIBLE: 'compatible_with_available_data',
    INSUFFICIENT: 'insufficient_information',
    HUMAN_REVIEW: 'human_review_required',
    CONFLICT: 'source_conflict'
  });

  const REQUIRED_RESPONSE_FIELDS = Object.freeze([
    'answer',
    'confidence_state',
    'library_entries_used',
    'aquarium_context_used',
    'missing_information',
    'warnings'
  ]);

  const SAFETY_RULES = Object.freeze([
    'Never invent products, organisms, compatibility, doses, references or measurements.',
    'Never recommend a private review entry to a public user.',
    'Never calculate a product dose without exact product/version, target purpose and verified system volume.',
    'Never infer compatibility from a partial word match alone.',
    'Never conceal conflicts between library data, aquarium context or verified sources.',
    'Never present external knowledge as if it came from the AcuarioNexo library.',
    'Never diagnose disease conclusively from symptoms alone.',
    'Never recommend medication without checking species, system type, active ingredient, contraindications and treatment context.'
  ]);

  const REQUIRED_CONTEXT_BY_INTENT = Object.freeze({
    library_search: [],
    compatibility_check: ['target_entities'],
    feeding_recommendation: ['target_entities', 'life_stage_or_size'],
    water_parameter_interpretation: ['parameter', 'measured_value', 'measurement_method', 'aquarium_type'],
    product_selection: ['target_problem', 'aquarium_type'],
    dose_calculation: ['exact_product', 'exact_product_version', 'verified_system_volume', 'target_purpose'],
    maintenance_guidance: ['selected_aquarium'],
    health_triage: ['target_entities', 'observed_symptoms', 'aquarium_type'],
    equipment_guidance: ['exact_equipment_or_requirement'],
    inventory_check: ['selected_aquarium_or_inventory'],
    general_aquarium_question: []
  });

  const LIBRARY_SELECTION_RULES = Object.freeze({
    publicStatuses: PUBLIC_LIBRARY_STATUSES,
    adminStatuses: ADMIN_LIBRARY_STATUSES,
    exactEntityFirst: true,
    requireEcosystemMatch: true,
    requireEnvironmentMatchWhenDeclared: true,
    requireLifeStageMatchWhenRelevant: true,
    requireParticleOrPhysicalFitWhenRelevant: true,
    rejectExplicitRiskConflict: true,
    rejectStatusOutsideScope: true,
    maximumEntriesSentToModel: 12,
    explainSelection: true
  });

  const RESPONSE_POLICY = Object.freeze({
    citeLibraryEntries: true,
    showAquariumContextUsed: true,
    showMissingInformation: true,
    showWarnings: true,
    separateExternalKnowledge: true,
    provideDirectAnswerFirst: true,
    avoidFalseCertainty: true
  });

  function statusesForRole(isAdmin) {
    return isAdmin ? [...ADMIN_LIBRARY_STATUSES] : [...PUBLIC_LIBRARY_STATUSES];
  }

  function requiredContext(intent) {
    return [...(REQUIRED_CONTEXT_BY_INTENT[intent] || [])];
  }

  function validateResponseShape(value) {
    const errors = [];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { approved: false, errors: ['Response must be an object.'] };
    }
    REQUIRED_RESPONSE_FIELDS.forEach(field => {
      if (!(field in value)) errors.push(`Missing response field: ${field}`);
    });
    if (value.confidence_state && !Object.values(CONFIDENCE_STATES).includes(value.confidence_state)) {
      errors.push('Invalid confidence_state.');
    }
    if (!Array.isArray(value.library_entries_used)) errors.push('library_entries_used must be an array.');
    if (!Array.isArray(value.missing_information)) errors.push('missing_information must be an array.');
    if (!Array.isArray(value.warnings)) errors.push('warnings must be an array.');
    return { approved: errors.length === 0, errors };
  }

  return Object.freeze({
    VERSION,
    MODES,
    INTENTS,
    SOURCE_PRIORITY,
    PUBLIC_LIBRARY_STATUSES,
    ADMIN_LIBRARY_STATUSES,
    CONFIDENCE_STATES,
    REQUIRED_RESPONSE_FIELDS,
    SAFETY_RULES,
    REQUIRED_CONTEXT_BY_INTENT,
    LIBRARY_SELECTION_RULES,
    RESPONSE_POLICY,
    statusesForRole,
    requiredContext,
    validateResponseShape
  });
});
