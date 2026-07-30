/* AcuarioNexo · Biblioteca V4 · contrato oficial reforzado */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.ANX = root.ANX || {};
    root.ANX.LibrarySchema = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const STATUSES = ['identified', 'draft', 'review', 'validated', 'published'];
  const BIOLOGICAL_TYPES = ['pez_marino', 'pez_dulce', 'coral', 'invertebrado', 'planta', 'microfauna', 'fitoplancton'];
  const PRODUCT_TYPES = ['producto', 'medicamento', 'sal', 'aditivo', 'alimento', 'test', 'equipamiento'];
  const REEF_SAFE = ['Sí', 'Sí con precaución', 'No'];

  const GENERIC_PATTERNS = [
    /requiere buena calidad de agua/i,
    /mantener par[aá]metros estables/i,
    /alimentaci[oó]n variada/i,
    /compatible con peces pac[ií]ficos/i,
    /\b(bajo|medio|alto|moderado|normalmente|suele|aproximadamente)\b/i
  ];
  const UNCERTAIN_TAXONOMY = /\b(?:spp?|cf|aff)\.?\b/i;
  const INTERNAL_FIELD_PATTERN = /\b(entry_type|order_name|class_name|family|data|sections|identity_confirmed|source_context|utm_source)\b/i;
  const FLEXIBLE_NUMBER_PATTERN = /\d+(?:[.,]\d+)?(?:\s*(?:-|–|—|a|hasta)\s*\d+(?:[.,]\d+)?)?/i;

  const CONTRACTS = {
    pez_marino: ['title','scientific_name','common_names','synonyms','family','order_name','class_name','distribution','habitat','depth_range','natural_environment','adult_size_cm','life_expectancy_years','minimum_tank_liters','recommended_tank_liters','tank_maturity','temperature_min','temperature_max','ph_min','ph_max','kh_min','kh_max','salinity_min','salinity_max','nitrate_max','phosphate_max','diet','feeding_frequency','feeding_notes','behavior','aggressiveness','territoriality','social_behavior','compatibility','fish_compatibility','coral_compatibility','invertebrate_compatibility','reef_safe','reef_safe_notes','care_level','beginner_suitable','acclimation','common_diseases','health_notes','reproduction','purchase_recommendations','common_mistakes','curiosities','ai_notes','user_summary','sources'],
    pez_dulce: ['title','scientific_name','common_names','synonyms','family','order_name','class_name','distribution','habitat','natural_environment','adult_size_cm','life_expectancy_years','minimum_tank_liters','recommended_tank_liters','temperature_min','temperature_max','ph_min','ph_max','gh_min','gh_max','kh_min','kh_max','diet','feeding_frequency','feeding_notes','behavior','aggressiveness','territoriality','schooling','swimming_zone','compatibility','plant_compatibility','invertebrate_compatibility','care_level','beginner_suitable','acclimation','common_diseases','health_notes','reproduction','breeding_notes','purchase_recommendations','common_mistakes','curiosities','ai_notes','user_summary','sources'],
    coral: ['title','scientific_name','common_names','synonyms','family','distribution','habitat','depth_range','natural_environment','coral_type','growth_form','lighting','par_range','flow','placement','aggressiveness','sweeper_tentacles','growth_rate','adult_size_cm','feeding','feeding_frequency','photosynthetic','reef_safe','compatibility','fish_compatibility','invertebrate_compatibility','temperature_min','temperature_max','salinity_min','salinity_max','ph_min','ph_max','kh_min','kh_max','calcium_min','calcium_max','magnesium_min','magnesium_max','nitrate_range','phosphate_range','care_level','beginner_suitable','fragging','propagation','common_problems','pests','purchase_recommendations','common_mistakes','curiosities','ai_notes','user_summary','sources'],
    invertebrado: ['title','scientific_name','common_names','synonyms','family','distribution','habitat','natural_environment','adult_size_cm','minimum_tank_liters','temperature_min','temperature_max','ph_min','ph_max','salinity_min','salinity_max','kh_min','kh_max','diet','feeding','feeding_frequency','behavior','aggressiveness','territoriality','reef_safe','reef_safe_notes','coral_compatibility','fish_compatibility','invertebrate_compatibility','molting','iodine_sensitivity','copper_sensitivity','care_level','beginner_suitable','acclimation','common_problems','reproduction','purchase_recommendations','common_mistakes','curiosities','ai_notes','user_summary','sources'],
    planta: ['title','scientific_name','common_names','synonyms','family','distribution','habitat','natural_environment','plant_type','growth_rate','height_cm','placement','temperature_min','temperature_max','ph_min','ph_max','gh_min','gh_max','kh_min','kh_max','lighting','co2','fertilization','substrate','propagation','maintenance','trimming','compatibility','fish_compatibility','invertebrate_compatibility','care_level','beginner_suitable','common_problems','algae_risk','purchase_recommendations','common_mistakes','curiosities','ai_notes','user_summary','sources'],
    microfauna: ['title','scientific_name','common_names','culture_type','identification','use_in_aquarium','target_animals','culture_method','container','temperature_min','temperature_max','salinity_min','salinity_max','feeding','feeding_frequency','harvest','harvest_frequency','maintenance','water_changes','density_control','crash_risks','contamination_risks','storage','care_level','common_problems','common_mistakes','ai_notes','user_summary','sources'],
    fitoplancton: ['title','scientific_name','common_names','synonyms','family','class_name','phylum','culture_type','identification','cell_size','pigmentation','use_in_aquarium','target_animals','culture_method','container','lighting','photoperiod','temperature_min','temperature_max','salinity_min','salinity_max','feeding','fertilization','aeration','harvest','harvest_frequency','maintenance','water_changes','density_control','crash_risks','contamination_risks','storage','care_level','common_problems','common_mistakes','curiosities','ai_notes','user_summary','sources'],
    producto: ['title','manufacturer','brand','product_code','category','composition','active_components','intended_use','dose','dose_calculation','use','instructions','monitoring','compatibility','risks','warnings','storage','expiry','aquarium_type','source_label','ai_notes','user_summary','sources'],
    sal: ['title','manufacturer','brand','product_code','composition','declared_parameters','salinity_reference','grams_per_liter','mixing','mixing_time','dose','dose_calculation','use','water_change_use','monitoring','compatibility','risks','storage','expiry','aquarium_type','source_label','ai_notes','user_summary','sources'],
    aditivo: ['title','manufacturer','brand','product_code','composition','active_components','what_corrects','parameter_target','dose','dose_calculation','maximum_dose','use','instructions','monitoring','compatibility','risks','warnings','storage','expiry','aquarium_type','source_label','ai_notes','user_summary','sources'],
    alimento: ['title','manufacturer','brand','product_code','food_type','composition','analysis','particle_size','target_species','feeding_frequency','dose','use','instructions','compatibility','risks','storage','expiry','aquarium_type','source_label','ai_notes','user_summary','sources'],
    medicamento: ['title','manufacturer','brand','product_code','active_ingredient','indications','target_diseases','dose','dose_calculation','treatment_days','repeat_treatment','remove_equipment','water_change_after','monitoring','compatibility','contraindications','risks','warnings','storage','expiry','hospital_tank_use','source_label','ai_notes','user_summary','sources'],
    test: ['title','manufacturer','brand','product_code','test_type','intended_use','parameter','measured_ion_or_compound','reading_unit','range','resolution','accuracy','scale_values','device_min_limit','device_max_limit','led_wavelength','compatibility','freshwater_compatible','saltwater_compatible','reef_compatible','use_limitations','included_reagents','reagent_code','reagent_tests','standard_code','expiry','lot','storage','sample_volume','final_cuvette_volume','zero_water_required','procedure','mixing_time','waiting_time','reading_time','cleaning_after_use','method','interpretation','error_messages','interferences','repeat_measurement_if','recommended_min','recommended_max','target_value','alert_min','alert_max','related_parameters','primary_field','internal_unit','data_type','save_date','save_time','save_reagent_lot','save_reagent_expiry','save_observations','user_summary','action_if_value_under_target','action_if_value_over_target','check_before_correction','common_errors','interpretation_risks','correction_risks','ai_notes','do_not_confuse_with','safety_rules','source_label','sources'],
    equipamiento: ['title','manufacturer','brand','product_code','equipment_type','specifications','power','consumption_watts','flow','volume','tank_size_recommended','installation','setup','maintenance','cleaning_frequency','spare_parts','compatibility','risks','warnings','warranty','source_manual','ai_notes','user_summary','sources']
  };

  const LABELS = {
    title: 'Nombre común / producto', scientific_name: 'Nombre científico', common_names: 'Otros nombres comunes', synonyms: 'Sinónimos', manufacturer: 'Fabricante', brand: 'Marca', product_code: 'Modelo / código',
    family: 'Familia', order_name: 'Orden', class_name: 'Clase', phylum: 'Filo', distribution: 'Distribución', habitat: 'Hábitat natural', depth_range: 'Profundidad', natural_environment: 'Entorno natural',
    adult_size_cm: 'Tamaño adulto', height_cm: 'Altura', life_expectancy_years: 'Esperanza de vida', minimum_tank_liters: 'Acuario mínimo', recommended_tank_liters: 'Acuario recomendado', tank_maturity: 'Madurez del acuario',
    temperature_min: 'Temperatura mínima', temperature_max: 'Temperatura máxima', ph_min: 'pH mínimo', ph_max: 'pH máximo', gh_min: 'GH mínimo', gh_max: 'GH máximo', kh_min: 'KH mínimo', kh_max: 'KH máximo', salinity_min: 'Salinidad mínima', salinity_max: 'Salinidad máxima', nitrate_max: 'Nitrato máximo', phosphate_max: 'Fosfato máximo', nitrate_range: 'Rango de nitrato', phosphate_range: 'Rango de fosfato', calcium_min: 'Calcio mínimo', calcium_max: 'Calcio máximo', magnesium_min: 'Magnesio mínimo', magnesium_max: 'Magnesio máximo',
    diet: 'Dieta', feeding: 'Alimentación', feeding_frequency: 'Frecuencia de alimentación', feeding_notes: 'Notas de alimentación', behavior: 'Comportamiento', aggressiveness: 'Agresividad', territoriality: 'Territorialidad', social_behavior: 'Comportamiento social', schooling: 'Cardumen / grupo', swimming_zone: 'Zona de nado',
    compatibility: 'Compatibilidad general', fish_compatibility: 'Compatibilidad con peces', coral_compatibility: 'Compatibilidad con corales', invertebrate_compatibility: 'Compatibilidad con invertebrados', plant_compatibility: 'Compatibilidad con plantas', reef_safe: 'Reef safe', reef_safe_notes: 'Detalle reef safe',
    care_level: 'Nivel de cuidado', beginner_suitable: 'Apto para principiantes', acclimation: 'Aclimatación', common_diseases: 'Enfermedades frecuentes', health_notes: 'Notas de salud', reproduction: 'Reproducción', breeding_notes: 'Notas de cría', purchase_recommendations: 'Antes de comprar', common_mistakes: 'Errores frecuentes', curiosities: 'Curiosidades', ai_notes: 'Notas para IA', user_summary: 'Resumen para usuario',
    coral_type: 'Tipo de coral', growth_form: 'Forma de crecimiento', lighting: 'Iluminación', photoperiod: 'Fotoperiodo', par_range: 'Rango PAR', flow: 'Flujo', placement: 'Ubicación', sweeper_tentacles: 'Tentáculos barredores', growth_rate: 'Crecimiento', photosynthetic: 'Fotosintético', fragging: 'Fragging', propagation: 'Propagación', common_problems: 'Problemas frecuentes', pests: 'Plagas', molting: 'Muda', iodine_sensitivity: 'Sensibilidad al yodo', copper_sensitivity: 'Sensibilidad al cobre',
    plant_type: 'Tipo de planta', co2: 'CO2', fertilization: 'Fertilización', substrate: 'Sustrato', maintenance: 'Mantenimiento', trimming: 'Poda', algae_risk: 'Riesgo de algas',
    culture_type: 'Tipo de cultivo', identification: 'Identificación', cell_size: 'Tamaño celular', pigmentation: 'Pigmentación', use_in_aquarium: 'Uso en acuario', target_animals: 'Animales objetivo', culture_method: 'Método de cultivo', container: 'Recipiente', aeration: 'Aireación', harvest: 'Cosecha', harvest_frequency: 'Frecuencia de cosecha', water_changes: 'Cambios de agua', density_control: 'Control de densidad', crash_risks: 'Riesgos de colapso', contamination_risks: 'Riesgos de contaminación',
    category: 'Categoría', composition: 'Composición', active_components: 'Componentes activos', intended_use: 'Uso previsto', dose: 'Dosis', dose_calculation: 'Cálculo de dosis', use: 'Uso recomendado', instructions: 'Instrucciones', monitoring: 'Seguimiento', risks: 'Riesgos', warnings: 'Advertencias', storage: 'Conservación', expiry: 'Caducidad', aquarium_type: 'Tipo de acuario', source_label: 'Etiqueta de fuente',
    declared_parameters: 'Parámetros declarados', salinity_reference: 'Referencia de salinidad', grams_per_liter: 'Gramos por litro', mixing: 'Preparación / mezcla', mixing_time: 'Tiempo de mezcla', water_change_use: 'Uso en cambios de agua', what_corrects: 'Qué corrige', parameter_target: 'Parámetro objetivo', maximum_dose: 'Dosis máxima',
    food_type: 'Tipo de alimento', analysis: 'Análisis garantizado', particle_size: 'Tamaño de partícula', target_species: 'Especies objetivo', active_ingredient: 'Principio activo', indications: 'Usos indicados', target_diseases: 'Enfermedades objetivo', treatment_days: 'Duración del tratamiento', repeat_treatment: 'Repetición del tratamiento', remove_equipment: 'Retirar durante tratamiento', water_change_after: 'Cambio de agua posterior', contraindications: 'Contraindicaciones', hospital_tank_use: 'Uso en acuario hospital',
    parameter: 'Parámetro medido', method: 'Método', range: 'Rango', resolution: 'Resolución', scale_values: 'Valores de escala', sample_volume: 'Volumen de muestra', reagents: 'Reactivos', procedure: 'Procedimiento', reading_time: 'Tiempo de lectura', interpretation: 'Interpretación', interferences: 'Interferencias', acuarionexo_mapping: 'Mapeo AcuarioNexo', common_errors: 'Errores comunes',
    test_type: 'Tipo de test', measured_ion_or_compound: 'Ion / compuesto medido', reading_unit: 'Unidad de lectura', accuracy: 'Precisión', device_min_limit: 'Límite inferior del equipo', device_max_limit: 'Límite superior del equipo', led_wavelength: 'Longitud de onda / LED', freshwater_compatible: 'Agua dulce', saltwater_compatible: 'Agua marina', reef_compatible: 'Arrecife', use_limitations: 'Limitaciones de uso', included_reagents: 'Reactivos incluidos', reagent_code: 'Código de reactivo', reagent_tests: 'Número de tests por recambio', standard_code: 'Código de estándar / verificación', lot: 'Lote', final_cuvette_volume: 'Volumen final en cubeta', zero_water_required: 'Agua necesaria para cero', waiting_time: 'Tiempo de espera', cleaning_after_use: 'Limpieza posterior', error_messages: 'Mensajes de error', repeat_measurement_if: 'Repetir medición si', recommended_min: 'Valor mínimo recomendado', recommended_max: 'Valor máximo recomendado', target_value: 'Valor objetivo', alert_min: 'Valor de alerta inferior', alert_max: 'Valor de alerta superior', related_parameters: 'Parámetros relacionados', primary_field: 'Campo principal', internal_unit: 'Unidad interna', data_type: 'Tipo de dato', save_date: 'Guardar fecha', save_time: 'Guardar hora', save_reagent_lot: 'Guardar lote', save_reagent_expiry: 'Guardar caducidad', save_observations: 'Guardar observaciones'
  };

  const SECTION_LABELS = { cover: 'Portada', photo: 'Foto principal', summary: 'Resumen', identity: 'Identificación', habitat: 'Hábitat natural', aquarium: 'Acuario recomendado', parameters: 'Parámetros', measurement: 'Medición', behavior: 'Comportamiento', feeding: 'Alimentación', compatibility: 'Compatibilidad', reef_safe: 'Reef safe', breeding: 'Reproducción', health: 'Salud', purchase: 'Antes de comprar', reagents: 'Reactivos', procedure: 'Procedimiento', lighting: 'Iluminación', flow: 'Flujo', placement: 'Ubicación', maintenance: 'Mantenimiento', curiosities: 'Curiosidades', culture: 'Cultivo', harvest: 'Cosecha', use: 'Uso recomendado', nutrition: 'Composición', dose: 'Dosis', monitoring: 'Mediciones / seguimiento', reading: 'Lectura', recommended_values: 'Valores recomendados', mapping: 'Mapeo AcuarioNexo', risks: 'Riesgos', uses: 'Usos indicados', remove: 'Retirar durante tratamiento', range: 'Rangos', specs: 'Especificaciones', ai: 'Notas para IA y usuario', sources: 'Fuentes' };
  const TEMPLATE_ORDER = ['cover','photo','summary','identity','habitat','aquarium','parameters','measurement','behavior','compatibility','feeding','reef_safe','breeding','health','maintenance','curiosities','purchase','reagents','procedure','lighting','flow','placement','culture','harvest','use','nutrition','dose','monitoring','reading','recommended_values','mapping','risks','uses','remove','range','specs','ai','sources'];
  const NUMBER_FIELDS = /(_cm|_years|_liters|_min|_max|_watts|grams_per_liter|treatment_days|power|flow|volume)$/;
  const FORCED_TEXT_FIELDS = new Set(['sample_volume','final_cuvette_volume','reading_time','mixing_time','waiting_time','reagent_tests','device_min_limit','device_max_limit','recommended_min','recommended_max','target_value','alert_min','alert_max','cell_size']);
  const SHORT_TEXT_FIELDS = new Set(['manufacturer','brand','product_code','parameter','method','range','resolution','accuracy','scale_values','sample_volume','final_cuvette_volume','reading_time','mixing_time','waiting_time','expiry','lot','storage','aquarium_type','source_label','food_type','equipment_type','power','flow','volume','warranty','active_ingredient','data_type','internal_unit','reading_unit','primary_field','test_type','intended_use','measured_ion_or_compound','device_min_limit','device_max_limit','led_wavelength','compatibility','freshwater_compatible','saltwater_compatible','reef_compatible','use_limitations','included_reagents','reagent_code','reagent_tests','standard_code','zero_water_required','recommended_min','recommended_max','target_value','alert_min','alert_max','related_parameters','save_date','save_time','save_reagent_lot','save_reagent_expiry','save_observations','phylum','cell_size','pigmentation','photoperiod','aeration']);
  const SHORT_TEXT_MIN_LENGTH = { manufacturer: 2, brand: 2, product_code: 2, parameter: 2, method: 2, range: 2, resolution: 1, accuracy: 1, scale_values: 2, sample_volume: 1, final_cuvette_volume: 1, reading_time: 1, mixing_time: 1, waiting_time: 1, expiry: 2, lot: 2, storage: 2, aquarium_type: 2, source_label: 2, food_type: 2, equipment_type: 2, power: 1, flow: 1, volume: 1, warranty: 2, active_ingredient: 2, data_type: 2, internal_unit: 1, reading_unit: 1, primary_field: 2, test_type: 2, intended_use: 2, measured_ion_or_compound: 2, device_min_limit: 1, device_max_limit: 1, led_wavelength: 2, compatibility: 2, freshwater_compatible: 2, saltwater_compatible: 2, reef_compatible: 2, use_limitations: 2, included_reagents: 2, reagent_code: 2, reagent_tests: 1, standard_code: 2, zero_water_required: 2, recommended_min: 1, recommended_max: 1, target_value: 1, alert_min: 1, alert_max: 1, related_parameters: 2, save_date: 2, save_time: 2, save_reagent_lot: 2, save_reagent_expiry: 2, save_observations: 2, phylum: 2, cell_size: 2, pigmentation: 2, photoperiod: 2, aeration: 2 };

  function sectionFor(field) {
    if (field === 'sources') return 'sources';
    if (['title','scientific_name','common_names','synonyms','manufacturer','brand','product_code','family','order_name','class_name','phylum','category','equipment_type','food_type','culture_type','coral_type','plant_type','identification','cell_size','pigmentation','test_type','intended_use','parameter','measured_ion_or_compound','reading_unit'].includes(field)) return 'identity';
    if (['distribution','habitat','depth_range','natural_environment'].includes(field)) return 'habitat';
    if (['minimum_tank_liters','recommended_tank_liters','tank_maturity','tank_size_recommended','aquarium_type','substrate'].includes(field)) return 'aquarium';
    if (['range','resolution','accuracy','scale_values','device_min_limit','device_max_limit','led_wavelength'].includes(field)) return 'measurement';
    if (/temperature|ph_|gh_|kh_|salinity|nitrate|phosphate|calcium|magnesium|declared_parameters|parameter_target/.test(field)) return 'parameters';
    if (/diet|feeding|composition|analysis|particle_size|target_species/.test(field)) return 'feeding';
    if (/behavior|aggressiveness|territoriality|social|schooling|swimming|growth_form|growth_rate|photosynthetic|sweeper/.test(field)) return 'behavior';
    if (/compatibility|reef_safe|freshwater_compatible|saltwater_compatible|reef_compatible|use_limitations/.test(field)) return field.includes('reef_safe') ? 'reef_safe' : 'compatibility';
    if (/disease|health|problem|pest|molting|iodine|copper|acclimation/.test(field)) return 'health';
    if (/reproduction|breeding|fragging|propagation/.test(field)) return 'breeding';
    if (/lighting|photoperiod|par_range/.test(field)) return 'lighting';
    if (field === 'flow') return 'flow';
    if (/placement/.test(field)) return 'placement';
    if (/maintenance|trimming|fertilization|co2|cleaning_after_use|cleaning_frequency|aeration/.test(field)) return 'maintenance';
    if (/culture|container|water_changes|density|crash|contamination/.test(field)) return 'culture';
    if (/harvest/.test(field)) return 'harvest';
    if (['included_reagents','reagent_code','reagent_tests','standard_code'].includes(field)) return 'reagents';
    if (['sample_volume','final_cuvette_volume','zero_water_required','procedure','mixing_time','waiting_time','reading_time'].includes(field)) return 'procedure';
    if (/use|instruction|intended|mixing|hospital/.test(field)) return 'use';
    if (/dose|maximum|treatment|active_ingredient|indications|target_diseases/.test(field)) return 'dose';
    if (['method','interpretation','error_messages','interferences','repeat_measurement_if'].includes(field) || /monitoring|reading/.test(field)) return 'reading';
    if (['recommended_min','recommended_max','target_value','alert_min','alert_max','related_parameters'].includes(field)) return 'recommended_values';
    if (['primary_field','internal_unit','data_type','save_date','save_time','save_reagent_lot','save_reagent_expiry','save_observations','acuarionexo_mapping'].includes(field)) return 'mapping';
    if (/risk|warning|contraindication|error|mistake|algae/.test(field)) return 'risks';
    if (/purchase|storage|expiry|lot|spare|manual|source_label/.test(field)) return 'purchase';
    if (/curiosities|ai_notes|user_summary|do_not_confuse_with|safety_rules|action_if_value_under_target|action_if_value_over_target|check_before_correction/.test(field)) return 'ai';
    if (/specifications|power|consumption|volume|installation|setup/.test(field)) return 'specs';
    return 'identity';
  }

  function humanLabel(field) { return LABELS[field] || field.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()); }
  function isNumberField(field) { return !FORCED_TEXT_FIELDS.has(field) && NUMBER_FIELDS.test(field); }
  function hasNumericValue(value) { return value != null && !Array.isArray(value) && FLEXIBLE_NUMBER_PATTERN.test(String(value).trim()); }
  function minLengthFor(field) { if (isNumberField(field)) return 1; if (SHORT_TEXT_FIELDS.has(field)) return SHORT_TEXT_MIN_LENGTH[field] || 2; return SHORT_TEXT_MIN_LENGTH[field] || 20; }
  function fieldRule(field) { return { label: humanLabel(field), required: true, type: isNumberField(field) ? 'number' : 'text', minLength: minLengthFor(field), ai: true, public: true, section: sectionFor(field), allowed: field === 'reef_safe' ? REEF_SAFE : undefined, validator: field === 'scientific_name' ? 'scientificName' : undefined }; }

  function templateFor(type = 'general') {
    const fields = CONTRACTS[type] || ['title', 'sources'];
    const sections = new Map();
    fields.forEach(field => {
      const rule = fieldRule(field);
      const sectionId = rule.section || 'identity';
      if (!sections.has(sectionId)) sections.set(sectionId, { id: sectionId, label: SECTION_LABELS[sectionId] || sectionId, order: TEMPLATE_ORDER.indexOf(sectionId) === -1 ? 999 : TEMPLATE_ORDER.indexOf(sectionId) + 1, required: true, ai: true, validation: 'automatic_and_manual', fields: [] });
      sections.get(sectionId).fields.push({ id: field, ...rule });
    });
    return Array.from(sections.values()).sort((a, b) => a.order - b.order);
  }

  function templatePrompt(type, sectionId) {
    const section = templateFor(type).find(item => item.id === sectionId);
    if (!section) return '';
    return [
      `Completa solo el apartado: ${section.label}.`,
      'No rellenes otros apartados.',
      'No inventes datos.',
      'No uses bajo, medio, alto, moderado, suele, normalmente ni aproximadamente.',
      'Usa valores concretos cuando existan.',
      'Redacta los campos visibles con una frase natural y útil, no solo con el número seco, cuando el dato lo permita.',
      'Mantén siempre el número o rango dentro del texto para que la validación pueda comprobarlo.',
      'No adornes con información no contrastada; solo contextualiza lo que esté respaldado por fuentes.',
      'No incluyas JSON, claves internas, nombres de campos internos ni URLs dentro del texto.',
      `Campos obligatorios: ${section.fields.map(field => field.label).join(', ')}.`,
      'Las fuentes deben ir separadas en sources.'
    ].join('\n');
  }

  function extractUrlsFromAny(value, found = []) {
    if (value == null) return found;
    if (typeof value === 'string') { (value.match(/https?:\/\/[^\s<>"')\]]+/gi) || []).forEach(url => found.push(url.replace(/[.,;:]+$/, ''))); return found; }
    if (Array.isArray(value)) { value.forEach(item => extractUrlsFromAny(item, found)); return found; }
    if (typeof value === 'object') Object.values(value).forEach(item => extractUrlsFromAny(item, found));
    return found;
  }
  function cleanUrl(url) { return String(url || '').trim().replace(/[.,;:]+$/, ''); }
  function hasRealUrl(url) { try { const u = new URL(cleanUrl(url)); return ['http:', 'https:'].includes(u.protocol) && u.hostname.includes('.'); } catch (_) { return false; } }
  function normalizeSources(raw) {
    if (!raw) return [];
    if (typeof raw === 'string') raw = extractUrlsFromAny(raw).map(url => ({ url }));
    if (!Array.isArray(raw)) raw = [raw];
    const seen = new Set();
    return raw.map((source, index) => { const item = typeof source === 'string' ? { url: source } : (source || {}); const url = cleanUrl(extractUrlsFromAny(item.url || item)[0] || ''); return { name: String(item.name || item.title || (url ? new URL(url).hostname : `Fuente ${index + 1}`)).trim(), url, source_type: String(item.source_type || item.type || '').trim(), original: item.original || item, used_for: String(item.used_for || '').trim(), confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : null, consulted_at: item.consulted_at || new Date().toISOString() }; }).filter(source => { if (!hasRealUrl(source.url) || seen.has(source.url)) return false; seen.add(source.url); return true; });
  }
  function isConcreteScientificName(value) { const name = String(value || '').trim(); return /^[A-Z][a-z-]+ [a-z][a-z-]+(?:\s+var\.\s+[a-z-]+)?$/.test(name) && !UNCERTAIN_TAXONOMY.test(name); }
  function valueFor(entry, field) {
    const value = entry.data?.[field] ?? entry[field];
    if ((field === 'source_label' || field === 'source_manual') && (value == null || value === '')) {
      const sourceList = normalizeSources(entry.sources);
      if (sourceList.length) return sourceList.map(source => source.name || source.url).filter(Boolean).slice(0, 3).join(', ');
    }
    return value;
  }
  function invalidFieldReason(entry, field) {
    const rule = fieldRule(field);
    if (field === 'sources') return normalizeSources(entry.sources).length >= 3 ? '' : 'Se requieren al menos 3 fuentes reales.';
    const value = valueFor(entry, field);
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) return 'Campo obligatorio vacío.';
    if (rule.type === 'number' && !hasNumericValue(value)) return 'Debe incluir un valor numérico válido.';
    if (rule.allowed && !rule.allowed.includes(value)) return `Valor no permitido: ${value}.`;
    if (rule.validator === 'scientificName' && !isConcreteScientificName(value)) return 'Debe ser una especie concreta.';
    const text = String(value);
    if (rule.type !== 'number' && text.trim().length < rule.minLength) return `Debe tener al menos ${rule.minLength} caracteres.`;
    if (INTERNAL_FIELD_PATTERN.test(text)) return 'Contiene campos internos o parámetros técnicos.';
    if (extractUrlsFromAny(text).length) return 'Contiene URLs dentro del texto; deben ir en Fuentes.';
    if (GENERIC_PATTERNS.some(pattern => pattern.test(text))) return 'Texto genérico o impreciso.';
    return '';
  }
  function missingFields(entry) { const contract = CONTRACTS[entry.entry_type] || ['title', 'sources']; return contract.filter(field => invalidFieldReason(entry, field)); }
  function validateTemplate(entry) { const type = entry.entry_type || 'general'; return templateFor(type).map(section => ({ id: section.id, label: section.label, required: section.required, valid: section.fields.every(field => !invalidFieldReason(entry, field.id)), fields: section.fields.map(field => ({ ...field, valid: !invalidFieldReason(entry, field.id), error: invalidFieldReason(entry, field.id) })) })); }
  function audit(entry) { const errors = []; validateTemplate(entry).forEach(section => section.fields.forEach(field => { if (!field.valid) errors.push(`${section.label} · ${field.label}: ${field.error}`); })); return { approved: errors.length === 0, errors, missing_fields: missingFields(entry), template: validateTemplate(entry), sources: normalizeSources(entry.sources) }; }

  return { STATUSES, BIOLOGICAL_TYPES, PRODUCT_TYPES, REEF_SAFE, CONTRACTS, LABELS, SECTION_LABELS, TEMPLATE_ORDER, fieldRule, sectionFor, templateFor, templatePrompt, normalizeSources, isConcreteScientificName, hasNumericValue, valueFor, invalidFieldReason, missingFields, validateTemplate, audit };
});
