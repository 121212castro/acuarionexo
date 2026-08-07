/* AcuarioNexo · Contrato universal de representación 3D para la biblioteca */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.ANX = root.ANX || {};
    root.ANX.Library3DProfile = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const VERSION = '1.0.0';
  const STATUSES = Object.freeze(['inferred', 'reviewed', 'verified']);
  const EXACTNESS = Object.freeze(['placeholder', 'family_level', 'species_level', 'model_level', 'variant_level']);
  const REPRESENTATION_TYPES = Object.freeze([
    'fish', 'coral', 'invertebrate', 'plant', 'microfauna', 'phytoplankton',
    'equipment', 'package', 'rock', 'wood', 'substrate', 'decoration', 'generic'
  ]);
  const REQUIRED_FIELDS = Object.freeze([
    'profile_version', 'status', 'exactness', 'representation_type', 'asset_family',
    'asset_variant', 'real_dimensions_cm', 'orientation', 'mounting', 'source_basis',
    'needs_asset_review', 'needs_dimension_review', 'notes'
  ]);

  function text(value, fallback = '') {
    const result = String(value == null ? '' : value).trim();
    return result || fallback;
  }

  function positiveNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function list(value) {
    return Array.isArray(value) ? value.map(item => text(item)).filter(Boolean) : [];
  }

  function dimensions(value = {}) {
    return {
      width: positiveNumber(value.width),
      height: positiveNumber(value.height),
      depth: positiveNumber(value.depth),
      length: positiveNumber(value.length)
    };
  }

  function normalize(value = {}) {
    const representationType = REPRESENTATION_TYPES.includes(value.representation_type)
      ? value.representation_type
      : 'generic';
    const status = STATUSES.includes(value.status) ? value.status : 'inferred';
    const exactness = EXACTNESS.includes(value.exactness) ? value.exactness : 'placeholder';
    return {
      profile_version: VERSION,
      status,
      exactness,
      representation_type: representationType,
      asset_family: text(value.asset_family, representationType),
      asset_variant: text(value.asset_variant, 'default'),
      model_url: text(value.model_url) || null,
      texture_url: text(value.texture_url) || null,
      real_dimensions_cm: dimensions(value.real_dimensions_cm),
      orientation: text(value.orientation, 'upright'),
      mounting: text(value.mounting, 'free'),
      connection_points: list(value.connection_points),
      movement_profile: text(value.movement_profile, 'static'),
      primary_colors: list(value.primary_colors),
      pattern: text(value.pattern, 'sin confirmar'),
      morphology: text(value.morphology, 'sin confirmar'),
      source_basis: list(value.source_basis),
      needs_asset_review: value.needs_asset_review !== false,
      needs_dimension_review: value.needs_dimension_review !== false,
      notes: text(value.notes)
    };
  }

  function validate(value = {}) {
    const profile = normalize(value);
    const errors = [];
    REQUIRED_FIELDS.forEach(field => {
      if (!(field in profile)) errors.push(`Falta ${field}.`);
    });
    if (profile.status === 'verified' && profile.needs_asset_review) {
      errors.push('Un perfil verificado no puede mantener needs_asset_review=true.');
    }
    if (profile.exactness === 'model_level' && !profile.model_url && profile.needs_asset_review === false) {
      errors.push('Un perfil de modelo exacto necesita model_url o revisión pendiente.');
    }
    return { approved: errors.length === 0, errors, profile };
  }

  function templateFor(entryType) {
    const biological = {
      pez_marino: 'fish', pez_dulce: 'fish', coral: 'coral', invertebrado: 'invertebrate',
      planta: 'plant', microfauna: 'microfauna', fitoplancton: 'phytoplankton'
    };
    const representationType = biological[entryType] || (entryType === 'equipamiento' ? 'equipment' : 'package');
    return normalize({
      representation_type: representationType,
      asset_family: representationType,
      source_basis: [],
      notes: 'Completar con medidas, forma, montaje y referencia visual verificadas para la entrada exacta.'
    });
  }

  return Object.freeze({
    VERSION, STATUSES, EXACTNESS, REPRESENTATION_TYPES, REQUIRED_FIELDS,
    normalize, validate, templateFor
  });
});
