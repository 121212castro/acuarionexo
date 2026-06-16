/* AcuarioNexo · library */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;

const libraryModules = [
  { key: 'pez_marino', label: 'Peces marinos', desc: 'Peces de arrecife, marinos y compatibilidad.', icon: '🐠' },
  { key: 'pez_dulce', label: 'Peces de agua dulce', desc: 'Especies y variedades de dulce.', icon: '🐟' },
  { key: 'coral', label: 'Corales', desc: 'SPS, LPS, blandos, luz, flujo y ubicacion.', icon: '🪸' },
  { key: 'invertebrado', label: 'Invertebrados', desc: 'Gambas, caracoles, cangrejos, estrellas y erizos.', icon: '🦐' },
  { key: 'planta', label: 'Plantas y algas', desc: 'Plantas de dulce, macroalgas y algas utiles.', icon: '🌿' },
  { key: 'microfauna', label: 'Microfauna', desc: 'Copepodos, rotiferos, artemia y fitoplancton.', icon: '∞' },
  { key: 'medicamento', label: 'Medicamentos', desc: 'Tratamientos, cuarentena, dosis y observaciones.', icon: '💊' },
  { key: 'sal', label: 'Sales', desc: 'Sales, mezclas y parametros objetivo.', icon: '🧂' },
  { key: 'test', label: 'Tests', desc: 'Tests, lectura, rango y mantenimiento.', icon: '🧪' },
  { key: 'alimento', label: 'Alimentos', desc: 'Alimentacion, dosis, especies y conservacion.', icon: '🍽️' },
  { key: 'equipamiento', label: 'Equipamiento', desc: 'Bombas, luces, filtros, skimmer y material tecnico.', icon: '⚙️' }
];

const sectionLabels = {
  summary: 'Resumen rápido',
  identity: 'Identificación',
  habitat: 'Hábitat natural',
  aquarium: 'Acuario recomendado',
  parameters: 'Parámetros',
  behavior: 'Comportamiento',
  feeding: 'Alimentación',
  compatibility: 'Compatibilidad',
  reef_safe: 'Reef Safe',
  health: 'Salud y enfermedades',
  purchase: 'Antes de comprar',
  mistakes: 'Errores frecuentes',
  curiosities: 'Curiosidades',
  sources: 'Fuentes',
  breeding: 'Reproducción',
  lighting: 'Iluminación',
  flow: 'Flujo',
  placement: 'Ubicación',
  co2: 'CO2 y nutrientes',
  maintenance: 'Mantenimiento',
  culture: 'Cultivo',
  use: 'Uso recomendado',
  problems: 'Problemas frecuentes',
  uses: 'Usos indicados',
  dose: 'Dosis',
  remove: 'Retirar durante tratamiento',
  risks: 'Riesgos y advertencias',
  aftercare: 'Después del tratamiento',
  inventory_logic: 'Lógica AcuarioNexo',
  mixing: 'Preparación',
  nutrition: 'Composición',
  acuarionexo_plan: 'Plan AcuarioNexo',
  specs: 'Especificaciones',
  installation: 'Instalación',
  reading: 'Lectura',
  range: 'Rangos',
  storage: 'Conservación'
};

const categorySections = {
  pez_marino: ['summary', 'identity', 'habitat', 'aquarium', 'parameters', 'behavior', 'feeding', 'compatibility', 'reef_safe', 'health', 'purchase', 'mistakes', 'curiosities', 'sources'],
  pez_dulce: ['summary', 'identity', 'habitat', 'aquarium', 'parameters', 'behavior', 'feeding', 'compatibility', 'breeding', 'health', 'purchase', 'mistakes', 'curiosities', 'sources'],
  coral: ['summary', 'identity', 'habitat', 'aquarium', 'parameters', 'lighting', 'flow', 'placement', 'feeding', 'compatibility', 'reef_safe', 'health', 'purchase', 'mistakes', 'curiosities', 'sources'],
  invertebrado: ['summary', 'identity', 'habitat', 'aquarium', 'parameters', 'behavior', 'feeding', 'compatibility', 'reef_safe', 'health', 'purchase', 'mistakes', 'curiosities', 'sources'],
  planta: ['summary', 'identity', 'habitat', 'aquarium', 'parameters', 'lighting', 'co2', 'maintenance', 'compatibility', 'health', 'purchase', 'mistakes', 'curiosities', 'sources'],
  microfauna: ['summary', 'identity', 'culture', 'parameters', 'feeding', 'maintenance', 'use', 'problems', 'mistakes', 'sources'],
  medicamento: ['summary', 'identity', 'uses', 'dose', 'compatibility', 'remove', 'risks', 'aftercare', 'inventory_logic', 'sources'],
  sal: ['summary', 'identity', 'parameters', 'mixing', 'use', 'risks', 'sources'],
  alimento: ['summary', 'identity', 'nutrition', 'use', 'compatibility', 'risks', 'acuarionexo_plan', 'sources'],
  equipamiento: ['summary', 'identity', 'specs', 'installation', 'maintenance', 'compatibility', 'risks', 'sources'],
  test: ['summary', 'identity', 'parameters', 'reading', 'range', 'use', 'risks', 'storage', 'sources'],
  general: ['summary', 'identity', 'aquarium', 'parameters', 'feeding', 'compatibility', 'risks', 'sources']
};

const sectionAliases = {
  summary: ['resumen_rapido', 'resumenRapido', 'resumen', 'summary', 'description', 'descripcion', 'descripcion_detallada'],
  identity: ['identificacion', 'identification', 'identity', 'taxonomia', 'taxonomy'],
  habitat: ['habitat_natural', 'habitatNatural', 'habitat', 'natural_habitat', 'origen', 'distribucion', 'distribution'],
  aquarium: ['acuario_recomendado', 'acuarioRecomendado', 'aquarium', 'aquarium_recommended', 'recommended_aquarium', 'requisitos_acuario', 'tank', 'tank_size', 'minimum_tank_size', 'min_tank_size', 'acuario', 'tamano_acuario', 'tamano_minimo', 'litros_minimos', 'litros_recomendados', 'min_tank_liters', 'minimum_liters', 'ubicacion', 'aquarium_zone'],
  parameters: ['parametros', 'parameters', 'parametros_agua', 'water_parameters', 'water', 'agua', 'rango_parametros', 'rangos', 'ranges'],
  behavior: ['comportamiento', 'behavior', 'temperamento', 'temperament'],
  feeding: ['alimentacion', 'feeding', 'diet', 'dieta'],
  compatibility: ['compatibilidad', 'compatibility'],
  reef_safe: ['reef_safe', 'reefSafe', 'reef', 'riesgo_reef'],
  health: ['salud_enfermedades', 'saludYEnfermedades', 'salud', 'enfermedades', 'health', 'problemas'],
  purchase: ['antes_comprar', 'antesDeComprar', 'before_buying', 'buying', 'purchase', 'compra'],
  mistakes: ['errores_frecuentes', 'erroresFrecuentes', 'common_mistakes', 'mistakes', 'errores'],
  curiosities: ['curiosidades', 'curiosities'],
  sources: ['fuentes', 'sources', 'references_text', 'referencias'],
  breeding: ['reproduccion', 'breeding'],
  lighting: ['iluminacion', 'lighting', 'light', 'luz'],
  flow: ['flujo', 'flow', 'corriente'],
  placement: ['ubicacion', 'placement', 'colocacion'],
  co2: ['co2', 'co2_nutrientes', 'nutrientes', 'nutrients'],
  maintenance: ['mantenimiento', 'maintenance', 'poda'],
  culture: ['cultivo', 'culture'],
  use: ['uso', 'use', 'uso_recomendado', 'uso_acuario'],
  problems: ['problemas', 'problems', 'problemas_frecuentes'],
  uses: ['usos', 'uses', 'usos_indicados'],
  dose: ['dosis', 'dose'],
  remove: ['retirar', 'remove', 'retirar_durante_tratamiento'],
  risks: ['riesgos', 'risks', 'riesgos_advertencias', 'advertencias'],
  aftercare: ['despues_tratamiento', 'aftercare', 'seguimiento'],
  inventory_logic: ['logica_acuarionexo', 'inventory_logic'],
  mixing: ['preparacion', 'mixing'],
  nutrition: ['composicion', 'nutrition'],
  acuarionexo_plan: ['plan_acuarionexo', 'acuarionexo_plan'],
  specs: ['especificaciones', 'specs', 'technical_specs'],
  installation: ['instalacion', 'installation'],
  reading: ['lectura', 'reading', 'interpretacion'],
  range: ['rango', 'range', 'rangos'],
  storage: ['conservacion', 'storage', 'almacenamiento']
};

function normText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function hasAny(text, words) {
  return words.some(word => text.includes(word));
}

function isImageUrl(value) {
  const text = String(value || '').trim();
  return /^https?:\/\//i.test(text) && (/\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i.test(text) || /supabase|storage|images|photo|foto|cover|portada/i.test(text));
}

function firstImageFromKeys(root, keys) {
  const wanted = keys.map(fieldKey);
  const seen = new Set();
  function scan(value) {
    if (typeof value === 'string') return isImageUrl(value) ? value.trim() : '';
    if (!value || typeof value !== 'object' || seen.has(value)) return '';
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const out = scan(item);
        if (out) return out;
      }
      return '';
    }
    for (const [key, child] of Object.entries(value)) {
      if (wanted.includes(fieldKey(key))) {
        const out = scan(child);
        if (out) return out;
      }
    }
    for (const child of Object.values(value)) {
      const out = scan(child);
      if (out) return out;
    }
    return '';
  }
  return scan(root);
}

function humanLabel(key) {
  return String(key || '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/^./, c => c.toUpperCase());
}

function findFirstDeep(root, keys) {
  const wanted = keys.map(fieldKey);
  const seen = new Set();
  function walk(value) {
    if (!value || typeof value !== 'object' || seen.has(value)) return '';
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const out = walk(item);
        if (out) return out;
      }
      return '';
    }
    for (const [key, child] of Object.entries(value)) {
      if (wanted.includes(fieldKey(key))) {
        const out = fieldValue(child).trim();
        if (out) return out;
      }
    }
    for (const child of Object.values(value)) {
      const out = walk(child);
      if (out) return out;
    }
    return '';
  }
  return walk(root);
}

function findImageDeep(root) {
  const priority = ['cover_photo_url', 'cover_image', 'cover_url', 'portada_url', 'coverPhoto', 'coverImage', 'main_image', 'featured_image', 'portada', 'cover', 'species_photo_url', 'species_photo', 'speciesPhoto', 'real_photo', 'photo_url', 'image_url', 'foto_url', 'imagen_url', 'url_foto', 'foto', 'imagen', 'image', 'photo', 'thumbnail', 'media', 'imagenes', 'images', 'photos', 'gallery', 'url', 'src'];
  const seen = new Set();
  function candidate(value) {
    if (typeof value === 'string' && isImageUrl(value)) return value.trim();
    if (Array.isArray(value)) {
      for (const item of value) {
        const out = candidate(item) || walk(item);
        if (out) return out;
      }
    }
    if (value && typeof value === 'object') return walk(value);
    return '';
  }
  function walk(value) {
    if (!value || typeof value !== 'object' || seen.has(value)) return '';
    seen.add(value);
    if (Array.isArray(value)) return candidate(value);
    for (const key of priority) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const out = candidate(value[key]);
        if (out) return out;
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (/foto|photo|imagen|image|cover|portada|media|thumbnail|gallery/i.test(key)) {
        const out = candidate(child);
        if (out) return out;
      }
    }
    for (const child of Object.values(value)) {
      const out = walk(child);
      if (out) return out;
    }
    return '';
  }
  return walk(root);
}

function normalizeFicha(row) {
  const raw = row || {};
  const fichaJson = raw.ficha_json || raw.fichaJson || raw.ficha || raw.ficha_normalizada || raw.fichaNormalizada || raw.data || {};
  const sections = fichaJson.sections || raw.sections || raw.secciones || {};
  const cover = raw.cover_photo_url || raw.cover_image || raw.cover_url ||
    fichaJson.cover_photo_url || fichaJson.cover_image || fichaJson.coverPhoto || fichaJson.cover ||
    firstImageFromKeys(raw, ['cover_photo_url', 'cover_image', 'cover_url', 'portada_url', 'coverPhoto', 'coverImage', 'portada', 'cover']);
  const speciesPhoto = raw.species_photo_url || raw.species_photo || raw.photo_url ||
    fichaJson.species_photo_url || fichaJson.species_photo || fichaJson.speciesPhoto || fichaJson.real_photo || fichaJson.photo_url ||
    firstImageFromKeys(raw, ['species_photo_url', 'species_photo', 'speciesPhoto', 'real_photo', 'photo_url', 'image_url', 'foto_url']);
  const foto = cover || speciesPhoto || findImageDeep(raw);
  return {
    id: raw.id || raw.uuid || raw.slug || '',
    nombre: raw.title || raw.nombre || raw.nombre_comun || raw.common_name || fichaJson.title || fichaJson.common_name || fichaJson.commonName || fichaJson.nombre || raw.scientific_name || 'Ficha',
    cientifico: raw.scientific_name || raw.nombre_cientifico || raw.scientific || fichaJson.scientific_name || fichaJson.scientificName || fichaJson.nombre_cientifico || '',
    categoria: fichaJson.category || raw.source_category || raw.category || raw.creator_category || raw.tipo || raw.tipo_ficha || raw.grupo || raw.seccion || 'general',
    foto,
    cover,
    speciesPhoto,
    descripcion: raw.description || raw.resumen_rapido || raw.resumen || raw.descripcion || raw.descripcion_detallada || raw.notes || sections.summary || fichaJson.summary || fichaJson.description || fichaJson.descripcion || '',
    raw
  };
}

function fichaModulo(f) {
  const raw = f?.raw || {};
  const fj = raw.ficha_json || raw.fichaJson || {};
  const category = normText(fj.category || raw?.ficha?.category || raw?.ficha_normalizada?.category || raw?.source_category || raw?.creator_category || raw?.tipo_ficha || raw?.tipo || raw?.category || f?.categoria || '');
  const name = normText([f?.nombre, f?.cientifico].filter(Boolean).join(' '));
  const all = normText([f?.nombre, f?.cientifico, f?.descripcion, category].filter(Boolean).join(' '));
  if (hasAny(category, ['pez_marino', 'pezmarino', 'fish_marine', 'fishmarine', 'marine_fish', 'marinefish', 'marino'])) return 'pez_marino';
  if (hasAny(category, ['pez_dulce', 'pezdulce', 'fish_freshwater', 'fishfreshwater', 'freshwater_fish', 'freshwaterfish', 'dulce'])) return 'pez_dulce';
  if (hasAny(category, ['invertebrado', 'invertebrate', 'crust', 'molus'])) return 'invertebrado';
  if (hasAny(category, ['planta', 'plant', 'alga'])) return 'planta';
  if (hasAny(category, ['medicamento', 'medicine', 'medic'])) return 'medicamento';
  if (hasAny(category, ['equipamiento', 'equipment', 'equipo', 'equip'])) return 'equipamiento';
  if (hasAny(category, ['sal', 'salt'])) return 'sal';
  if (hasAny(category, ['test'])) return 'test';
  if (hasAny(category, ['alimento', 'food', 'feeding'])) return 'alimento';
  if (hasAny(category, ['microfauna'])) return 'microfauna';
  if (hasAny(category, ['coral'])) return 'coral';
  if (hasAny(name, ['anubia', 'cryptocoryne', 'echinodorus', 'bucephalandra', 'vallisneria', 'hygrophila', 'rotala', 'limnophila', 'microsorum', 'musgo', 'planta', 'macroalga', 'alga'])) return 'planta';
  if (hasAny(name, ['camaron', 'gamba', 'shrimp', 'caracol', 'snail', 'cangrejo', 'crab', 'erizo', 'urchin', 'estrella', 'starfish', 'lysmata', 'caridina', 'neocaridina', 'turbo', 'trochus', 'nassarius'])) return 'invertebrado';
  if (hasAny(name, ['coral', 'acropora', 'euphyllia', 'zoanthus', 'montipora', 'sarcophyton', 'palythoa', 'duncanopsammia'])) return 'coral';
  if (all.includes('dulce') || all.includes('freshwater')) return 'pez_dulce';
  if (all.includes('marin') || all.includes('arrecife') || all.includes('reef') || all.includes('pez') || all.includes('fish')) return 'pez_marino';
  return 'general';
}

function fichaModuleLabel(f) {
  const key = typeof f === 'string' ? f : fichaModulo(f);
  return libraryModules.find(m => m.key === key)?.label || 'Ficha';
}

function fieldKey(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
}

function fieldValue(value) {
  if (value == null || value === '') return '';
  if (Array.isArray(value)) return value.map(fieldValue).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    const direct = fieldValue(value.texto || value.text || value.contenido || value.content || value.valor || value.value || value.descripcion || value.description || '');
    if (direct) return direct;
    return Object.entries(value).map(function ([key, child]) {
      if (child == null || child === '') return '';
      if (/^id$|uuid|created|updated|user_id|raw|payload/i.test(key)) return '';
      const out = fieldValue(child).trim();
      return out ? `${humanLabel(key)}: ${out}` : '';
    }).filter(Boolean).join('\n');
  }
  return String(value);
}

function fieldFromObject(obj, keys, seen = new Set()) {
  if (!obj || typeof obj !== 'object' || seen.has(obj)) return '';
  seen.add(obj);
  const wanted = keys.map(fieldKey);
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (!item || typeof item !== 'object') continue;
      const title = item.titulo || item.title || item.nombre || item.name || item.key || item.id || item.label || item.apartado || item.modulo || item.seccion || item.heading || item.campo;
      if (wanted.includes(fieldKey(title))) {
        const out = fieldValue(item).trim();
        if (out) return out;
      }
      const nested = fieldFromObject(item, keys, seen);
      if (nested) return nested;
    }
    return '';
  }
  for (const [k, v] of Object.entries(obj)) {
    if (wanted.includes(fieldKey(k))) {
      const out = fieldValue(v).trim();
      if (out) return out;
    }
    const nested = fieldFromObject(v, keys, seen);
    if (nested) return nested;
  }
  return '';
}

function fichaField(f, keys) {
  const raw = f.raw || {};
  const fj = raw.ficha_json || raw.fichaJson || {};
  const pools = [fj.sections, raw.sections, raw.secciones, fj, raw, raw.apartados, raw.bloques, raw.modulos, raw.modules, raw.data, raw.ficha, raw.ficha_normalizada, raw.fichaNormalizada, raw.ficha_tecnica, raw.fichaTecnica, raw.ai_result, raw.ai, raw.generated, raw.internet].filter(Boolean);
  for (const pool of pools) {
    const out = fieldFromObject(pool, keys);
    if (out) return out;
  }
  return '';
}

function fichaResumen(f) {
  return fichaField(f, ['resumen_rapido', 'resumenRapido', 'resumen', 'summary', 'description', 'descripcion', 'descripcion_detallada']) || f.descripcion || '';
}

function derivedSectionText(f, title) {
  const raw = f.raw || {};
  const fj = raw.ficha_json || raw.fichaJson || {};
  const sections = fj.sections || raw.sections || {};
  if (title === 'Identificación') {
    return [`Nombre comun: ${f.nombre}`, f.cientifico ? `Nombre cientifico: ${f.cientifico}` : '', `Apartado: ${fichaModuleLabel(f)}`, raw.care_level || fj.care_level ? `Dificultad: ${raw.care_level || fj.care_level}` : ''].filter(Boolean).join('\n');
  }
  if (title === 'Acuario recomendado') {
    const deep = sections.aquarium || findFirstDeep(raw, ['acuario_recomendado', 'aquarium', 'aquarium_recommended', 'recommended_aquarium', 'requisitos_acuario', 'tank_size', 'minimum_tank_size', 'min_tank_liters', 'minimum_liters', 'litros_minimos', 'litros_recomendados', 'aquarium_zone', 'ubicacion']);
    if (deep) return deep;
    return [raw.min_tank_liters || fj.min_tank_liters ? `Litros minimos: ${raw.min_tank_liters || fj.min_tank_liters} L` : '', raw.minimum_liters || fj.minimum_liters ? `Litros minimos: ${raw.minimum_liters || fj.minimum_liters} L` : '', raw.aquarium_zone || fj.aquarium_zone ? `Zona: ${raw.aquarium_zone || fj.aquarium_zone}` : ''].filter(Boolean).join('\n');
  }
  if (title === 'Parámetros') return findFirstDeep(raw, ['parametros', 'parameters', 'water_parameters', 'rango_parametros', 'rangos', 'ranges']) || fieldValue(raw.parameters).trim();
  if (title === 'Comportamiento') return findFirstDeep(raw, ['comportamiento', 'behavior', 'temperamento', 'temperament']) || raw.temperament || '';
  if (title === 'Alimentación') return findFirstDeep(raw, ['alimentacion', 'feeding', 'diet', 'dieta']) || raw.feeding || raw.diet || '';
  if (title === 'Compatibilidad') return findFirstDeep(raw, ['compatibilidad', 'compatibility']) || raw.compatibility || '';
  if (title === 'Reef Safe') return findFirstDeep(raw, ['reef_safe', 'reefSafe', 'reef']) || (raw.reef_safe != null ? String(raw.reef_safe) : '');
  if (title === 'Fuentes') return findFirstDeep(raw, ['fuentes', 'sources', 'references_text', 'referencias']) || [raw.references_text, raw.source_url ? `Fuente interna: ${raw.source_url}` : ''].filter(Boolean).join('\n');
  return '';
}

function fichaSectionsHtml(f) {
  const module = fichaModulo(f);
  const keys = categorySections[module] || categorySections.general;
  return keys.map(function (sectionKey, index) {
    const title = sectionLabels[sectionKey] || humanLabel(sectionKey);
    const aliases = [sectionKey].concat(sectionAliases[sectionKey] || []);
    const text = fichaField(f, aliases) || derivedSectionText(f, title);
    const open = index < 3 ? ' open' : '';
    const body = text ? `<p>${esc(text).replaceAll('\n', '<br>')}</p>` : `<p class="small">Pendiente de completar en la ficha original.</p>`;
    return `<details class="library-detail-section"${open}><summary>${esc(title)}</summary>${body}</details>`;
  }).join('');
}

function moduleButtons(rows, handler) {
  const html = libraryModules.map(function (m) {
    const count = rows.filter(f => fichaModulo(f) === m.key).length;
    return `<button class="${state.libraryModule === m.key ? 'active' : ''}" onclick="${handler}('${esc(m.key)}')"><b>${esc(m.icon)} ${count}</b><span>${esc(m.label)}</span><small>${esc(m.desc)}</small></button>`;
  }).join('');
  return `<div class="library-section-title"><h3>Apartados</h3><p class="small">Entra por categoria para no tener fichas sueltas.</p></div><div class="library-modules">${html}</div>`;
}

function fichaCard(f, index, inAq) {
  const cover = f.cover || f.foto;
  return `<article class="library-card library-cover-card" onclick="${inAq ? 'verFichaAcuario' : 'verFichaBiblioteca'}(${index})">
    ${cover ? `<img class="library-card-cover" src="${esc(cover)}" alt="${esc(f.nombre)}" loading="lazy">` : '<div class="library-card-cover library-no-photo">□</div>'}
  </article>`;
}

async function loadLibrary(search = '') {
  const clean = search.replace(/[%,]/g, ' ').trim();
  let query = supabase.from('library_entries').select('*').limit(clean ? 120 : 80);
  if (clean) query = query.or(`title.ilike.%${clean}%,scientific_name.ilike.%${clean}%,description.ilike.%${clean}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeFicha).filter(f => f.nombre && (f.cientifico || f.descripcion || f.foto));
}

window.biblioteca = async function () {
  const t = token();
  render(`<section class="panel library-panel">
    <div class="panel-head"><div><h2>Biblioteca</h2><p class="small">Fichas reales guardadas en Supabase.</p></div></div>
    <div class="library-search"><input id="librarySearch" placeholder="Buscar pez, coral, producto..."><button class="primary" onclick="buscarBiblioteca()">Buscar</button></div>
    <div id="libraryList">${msg('Cargando fichas...')}</div>
  </section>`, 'biblioteca');
  try {
    const rows = await loadLibrary('');
    if (!isCurrent(t)) return;
    state.libraryRows = rows;
    state.libraryModule = null;
    renderLibrary('libraryList', rows, false);
  } catch (e) {
    if (isCurrent(t) && byId('libraryList')) byId('libraryList').innerHTML = msg(e.message, 'error');
  }
};

window.buscarBiblioteca = async function () {
  const t = state.viewToken;
  const box = byId('libraryList');
  if (box) box.innerHTML = msg('Buscando fichas...');
  try {
    const rows = await loadLibrary(val('librarySearch'));
    if (!isCurrent(t)) return;
    state.libraryRows = rows;
    state.libraryModule = null;
    renderLibrary('libraryList', rows, false);
  } catch (e) {
    if (box) box.innerHTML = msg(e.message, 'error');
  }
};

function renderLibrary(containerId, rows, inAq) {
  const box = byId(containerId);
  if (!box) return;
  const filtered = state.libraryModule ? rows.filter(f => fichaModulo(f) === state.libraryModule) : rows;
  const title = state.libraryModule ? fichaModuleLabel(state.libraryModule) : 'Fichas disponibles';
  box.innerHTML = rows.length
    ? `${moduleButtons(rows, inAq ? 'filtrarFichasAcuarioModulo' : 'filtrarBibliotecaModulo')}<div class="library-section-title"><h3>${esc(title)}</h3><p class="small">${filtered.length} fichas.</p></div><div class="library-grid">${filtered.map((f, i) => fichaCard(f, i, inAq)).join('')}</div>`
    : msg('No encontré fichas con esa búsqueda.');
  state.libraryView = filtered;
}

function fichaDetail(f, backFn, addButton) {
  const cover = f.cover || f.foto;
  const speciesPhoto = f.speciesPhoto && f.speciesPhoto !== cover ? f.speciesPhoto : '';
  return `<section class="panel library-detail">
    <button onclick="${backFn}">← Volver</button>
    ${cover ? `<img class="library-detail-photo" src="${esc(cover)}" alt="${esc(f.nombre)}">` : ''}
    ${speciesPhoto ? `<img class="library-detail-photo species-detail-photo" src="${esc(speciesPhoto)}" alt="Foto real de ${esc(f.nombre)}">` : ''}
    <p class="small">${esc(fichaModuleLabel(f))}</p>
    <h2>${esc(f.nombre)}</h2>
    ${f.cientifico ? `<p class="scientific">${esc(f.cientifico)}</p>` : ''}
    ${addButton || ''}
    ${fichaSectionsHtml(f)}
  </section>`;
}

window.filtrarBibliotecaModulo = function (module) {
  state.libraryModule = state.libraryModule === module ? null : module;
  renderLibrary('libraryList', state.libraryRows, false);
};

window.verFichaBiblioteca = function (index) {
  const f = state.libraryView[index];
  if (!f) return;
  render(fichaDetail(f, 'biblioteca()', ''), 'biblioteca');
};

async function fichasAcuario() {
  const t = token();
  render(aqHeader('fichas') + `<section class="panel library-panel">
    <div class="panel-head"><div><h2>Fichas</h2><p class="small">Consulta e importa fichas al acuario.</p></div></div>
    <div class="library-search"><input id="aqFichaSearch" placeholder="Buscar pez, coral, producto..."><button class="primary" onclick="buscarFichasAcuario()">Buscar</button></div>
    <div id="aqFichaList">${msg('Cargando fichas...')}</div>
  </section>`, 'acuarios');
  try {
    const rows = await loadLibrary('');
    if (!isCurrent(t)) return;
    state.libraryRows = rows;
    state.libraryModule = null;
    renderLibrary('aqFichaList', rows, true);
  } catch (e) {
    if (isCurrent(t) && byId('aqFichaList')) byId('aqFichaList').innerHTML = msg(e.message, 'error');
  }
}
window.fichasAcuario = fichasAcuario;

window.buscarFichasAcuario = async function () {
  const t = state.viewToken;
  const box = byId('aqFichaList');
  if (box) box.innerHTML = msg('Buscando fichas...');
  try {
    const rows = await loadLibrary(val('aqFichaSearch'));
    if (!isCurrent(t)) return;
    state.libraryRows = rows;
    state.libraryModule = null;
    renderLibrary('aqFichaList', rows, true);
  } catch (e) {
    if (box) box.innerHTML = msg(e.message, 'error');
  }
};

window.filtrarFichasAcuarioModulo = function (module) {
  state.libraryModule = state.libraryModule === module ? null : module;
  renderLibrary('aqFichaList', state.libraryRows, true);
};

window.verFichaAcuario = function (index) {
  const f = state.libraryView[index];
  if (!f) return;
  const add = `<div class="quick-actions"><button class="primary" onclick="importarFichaAnimal(${index})"><span>＋</span>Añadir al acuario</button></div><div id="x"></div>`;
  render(aqHeader('fichas') + fichaDetail(f, 'fichasAcuario()', add), 'acuarios');
};

window.importarFichaAnimal = async function (index) {
  const f = state.libraryView[index];
  const aq = currentAquarium();
  if (!f || !aq) return;
  try {
    const row = {
      user_id: state.user.id,
      aquarium_id: aq.id,
      common_name: f.nombre,
      scientific_name: f.cientifico || f.nombre,
      category: fichaModulo(f) === 'coral' ? 'coral' : fichaModulo(f) === 'invertebrado' ? 'invertebrate' : fichaModulo(f) === 'planta' ? 'plant' : 'other',
      quantity: 1,
      status: 'active',
      photo_url: f.speciesPhoto || f.cover || f.foto || null,
      notes: f.descripcion || null
    };
    const { error } = await supabase.from('animals').insert(row);
    if (error) throw error;
    byId('x').innerHTML = msg('Ficha añadida al acuario.', 'success');
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

})();
