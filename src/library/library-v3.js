/* AcuarioNexo · Biblioteca V3 coordinador */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const core = ANX.LibraryV3Core;
  const schema = core?.S || ANX.LibrarySchema;

  const recambioContract = [
    'title',
    'manufacturer',
    'brand',
    'product_code',
    'equipment_type',
    'specifications',
    'intended_use',
    'compatibility',
    'use_limitations',
    'installation',
    'maintenance',
    'cleaning_frequency',
    'purchase_recommendations',
    'warranty',
    'source_manual',
    'source_label',
    'risks',
    'warnings',
    'ai_notes',
    'user_summary',
    'sources'
  ];

  if (schema?.CONTRACTS && !schema.CONTRACTS.recambio) schema.CONTRACTS.recambio = recambioContract;
  if (Array.isArray(schema?.PRODUCT_TYPES) && !schema.PRODUCT_TYPES.includes('recambio')) schema.PRODUCT_TYPES.push('recambio');

  if (core) {
    if (Array.isArray(core.types) && !core.types.some(([key]) => key === 'recambio')) core.types.push(['recambio', 'Repuesto / Recambio']);
    if (core.labels) core.labels.recambio = 'Repuesto / Recambio';
  }

  ANX.LibraryV3 = {
    core: ANX.LibraryV3Core,
    template: ANX.LibraryV3Template,
    images: ANX.LibraryV3Images,
    ai: ANX.LibraryV3AI,
    ficha: ANX.LibraryV3Ficha
  };
})();
