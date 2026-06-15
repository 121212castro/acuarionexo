/* AcuarioNexo · clean core */
(function () {
  const config = window.ACUARIONEXO_CONFIG || {};
  const app = document.getElementById('app');
  const supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
  const state = {
    user: null,
    aquariums: [],
    aquarium: null,
    section: 'inicio',
    viewToken: 0,
    libraryRows: [],
    libraryView: [],
    libraryModule: null
  };

  window.s = supabase;
  window.state = state;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  function byId(id) { return document.getElementById(id); }
  function val(id) { return (byId(id)?.value || '').trim(); }
  function num(id) { const n = Number(val(id)); return Number.isFinite(n) ? n : null; }
  function msg(text, kind = 'notice') { return `<div class="${kind}">${esc(text)}</div>`; }
  function token() { state.viewToken += 1; return state.viewToken; }
  function isCurrent(t) { return t === state.viewToken; }

  function dateText(value) {
    if (!value) return 'Sin fecha';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Sin fecha';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function currentAquarium() { return state.aquarium || window.q || null; }

  function bottomNav(active) {
    const item = (id, label, icon, fn) => `<button class="${active === id ? 'active' : ''}" onclick="${fn}"><span>${icon}</span><small>${label}</small></button>`;
    return `<nav class="bottom-nav">
      ${item('inicio', 'Inicio', '⌂', 'dashboard()')}
      ${item('acuarios', 'Acuarios', '▣', 'dashboard()')}
      ${item('biblioteca', 'Biblioteca', '□', 'biblioteca()')}
      ${item('avisos', 'Avisos', '♢', 'tareas()')}
      ${item('inventario', 'Inventario', '▤', 'inventario()')}
    </nav>`;
  }

  function render(html, active = 'inicio') {
    document.querySelector('.bottom-nav')?.remove();
    app.innerHTML = html + '<div style="height:140px"></div>';
    document.body.insertAdjacentHTML('beforeend', bottomNav(active));
    window.scrollTo(0, 0);
    requestAnimationFrame(function () {
      const el = document.querySelector('.tank-tabs .active');
      if (el) el.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
  }

  function panel(title, body, active = 'inicio') {
    render(`<section class="panel"><h2>${esc(title)}</h2>${body}</section>`, active);
  }

  function tabButton(id, label) {
    return `<button class="${state.section === id ? 'active' : ''}" onclick="openAqSection('${id}')">${esc(label)}</button>`;
  }

  function aqHeader(section) {
    if (section) state.section = section;
    const aq = currentAquarium();
    if (!aq) return '';
    const liters = aq.real_liters ?? aq.liters ?? '-';
    const type = aq.aquarium_type || aq.type || 'Acuario';
    return `<section class="tank-head">
      <button onclick="dashboard()">←</button>
      <div><h2>${esc(aq.name || 'Acuario')}</h2><p>${esc(liters)} L · ${esc(type)}</p></div>
    </section>
    <nav class="tank-tabs">
      ${tabButton('resumen', 'Resumen')}
      ${tabButton('fichas', 'Fichas')}
      ${tabButton('animales', 'Animales')}
      ${tabButton('mapa', 'Mapa IA')}
      ${tabButton('fotos', 'Fotos')}
      ${tabButton('inventario', 'Inventario')}
      ${tabButton('parametros', 'Parámetros')}
      ${tabButton('tareas', 'Tareas')}
    </nav>`;
  }

  function aquariumIcon(aq) {
    if (aq?.aquarium_type === 'freshwater') return '🌿';
    if (aq?.aquarium_type === 'hospital' || aq?.aquarium_type === 'quarantine') return '🏥';
    return '🐠';
  }

  function photoUrl(row) {
    return row?.image_url || row?.photo_url || row?.public_url || row?.url || row?.cover_url || '';
  }

  const MAP_PREFIX = 'ACUARIONEXO_MAP_V2:';

  function mapKey(aq) {
    return `acuarionexo-map-v2-${aq?.id || 'local'}`;
  }

  function emptyMap(aq) {
    return {
      version: 2,
      photo_url: aq?.map_photo_url || aq?.__cover_url || aq?.cover_url || aq?.photo_url || aq?.image_url || '',
      markers: [],
      selected_id: '',
      updated_at: new Date().toISOString()
    };
  }

  function normalizeMap(raw, aq) {
    const base = emptyMap(aq);
    if (!raw || typeof raw !== 'object') return base;
    const markers = Array.isArray(raw.markers) ? raw.markers : [];
    return {
      ...base,
      ...raw,
      photo_url: raw.photo_url || base.photo_url,
      markers: markers.map(function (m) {
        return {
          id: String(m.id || `mk-${Date.now()}`),
          label: String(m.label || 'Punto'),
          type: String(m.type || 'coral'),
          note: String(m.note || ''),
          x: Math.max(0, Math.min(100, Number(m.x) || 50)),
          y: Math.max(0, Math.min(100, Number(m.y) || 50)),
          z: Math.max(0, Math.min(100, Number(m.z) || 50))
        };
      })
    };
  }

  function readMap(aq) {
    try {
      const local = localStorage.getItem(mapKey(aq));
      if (local) return normalizeMap(JSON.parse(local), aq);
    } catch (_) {}
    try {
      const text = String(aq?.ai_summary || '');
      if (text.startsWith(MAP_PREFIX)) return normalizeMap(JSON.parse(text.slice(MAP_PREFIX.length)), aq);
    } catch (_) {}
    return emptyMap(aq);
  }

  function writeMapLocal(aq, map) {
    const clean = normalizeMap({ ...map, updated_at: new Date().toISOString() }, aq);
    try { localStorage.setItem(mapKey(aq), JSON.stringify(clean)); } catch (_) {}
    window.__aqMap = clean;
    return clean;
  }

  async function uploadAquariumImage(file, folder) {
    const aq = currentAquarium();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${folder}/${state.user.id}/${aq.id}/${Date.now()}.${ext}`;
    for (const bucket of ['aquarium-photos', 'photos', 'animal-photos']) {
      const upload = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (!upload.error) return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
    throw new Error('No se pudo subir la foto. Revisa Storage.');
  }

  async function loadAquariums() {
    const { data, error } = await supabase.from('aquariums').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    const list = data || [];
    try {
      const photos = await supabase.from('aquarium_photos').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(200);
      if (!photos.error) {
        const coverByAq = {};
        (photos.data || []).forEach(function (p) {
          const url = photoUrl(p);
          if (url && p.aquarium_id && !coverByAq[p.aquarium_id]) coverByAq[p.aquarium_id] = url;
        });
        list.forEach(function (aq) { aq.__cover_url = aq.cover_url || aq.photo_url || aq.image_url || coverByAq[aq.id] || ''; });
      }
    } catch (_) {}
    state.aquariums = list;
    return list;
  }

  function aquariumCard(aq) {
    const photo = aq.__cover_url || aq.cover_url || aq.photo_url || aq.image_url || '';
    const liters = aq.real_liters ?? aq.liters ?? '-';
    return `<article class="tank-card" onclick="openA('${esc(aq.id)}')">
      <div class="tank-art">${photo ? `<img src="${esc(photo)}" alt="${esc(aq.name)}" loading="lazy">` : aquariumIcon(aq)}</div>
      <div class="tank-info"><h3>${esc(aq.name || 'Acuario')}</h3><p>${esc(aq.aquarium_type || 'Acuario')}</p><span>${esc(liters)} L</span></div>
      <b>›</b>
    </article>`;
  }

  window.dashboard = async function () {
    if (!state.user) return login();
    const t = token();
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>Cargando sistemas...</p></div><button onclick="formA()">+</button></section>`, 'inicio');
    try {
      const list = await loadAquariums();
      if (!isCurrent(t)) return;
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>${list.length} sistemas activos</p></div><button onclick="formA()">+</button></section>
        <section class="panel"><div class="panel-head"><h2>Acuarios</h2><button onclick="formA()">Nuevo</button></div>
        <div class="tank-list">${list.map(aquariumCard).join('') || '<p class="small">Sin acuarios todavía.</p>'}</div></section>`, 'inicio');
    } catch (e) {
      if (isCurrent(t)) render(msg(e.message, 'error'), 'inicio');
    }
  };

  window.formA = function (aq = {}) {
    const editing = !!aq.id;
    render(`<section class="panel">
      <button onclick="dashboard()">← Volver</button>
      <h2>${editing ? 'Editar acuario' : 'Nuevo acuario'}</h2>
      <label>Nombre</label><input id="aqName" value="${esc(aq.name || '')}">
      <label>Tipo</label><select id="aqType">
        <option value="reef" ${aq.aquarium_type === 'reef' ? 'selected' : ''}>Reef</option>
        <option value="marine" ${aq.aquarium_type === 'marine' ? 'selected' : ''}>Marino</option>
        <option value="freshwater" ${aq.aquarium_type === 'freshwater' ? 'selected' : ''}>Dulce</option>
        <option value="hospital" ${aq.aquarium_type === 'hospital' ? 'selected' : ''}>Hospital</option>
        <option value="quarantine" ${aq.aquarium_type === 'quarantine' ? 'selected' : ''}>Cuarentena</option>
        <option value="other" ${aq.aquarium_type === 'other' ? 'selected' : ''}>Otro</option>
      </select>
      <label>Litros reales</label><input id="aqLiters" type="number" step="0.1" value="${esc(aq.real_liters ?? aq.liters ?? '')}">
      <label>Descripción</label><textarea id="aqDescription">${esc(aq.description || '')}</textarea>
      <button class="primary" onclick="saveA('${esc(aq.id || '')}')">Guardar</button>
      <div id="x"></div>
    </section>`, 'acuarios');
  };

  window.saveA = async function (id = '') {
    try {
      if (!val('aqName')) throw new Error('Pon un nombre al acuario.');
      const row = {
        user_id: state.user.id,
        name: val('aqName'),
        aquarium_type: val('aqType') || 'reef',
        status: 'active',
        real_liters: num('aqLiters'),
        liters: num('aqLiters'),
        description: val('aqDescription') || null
      };
      const result = id ? await supabase.from('aquariums').update(row).eq('id', id) : await supabase.from('aquariums').insert(row);
      if (result.error) throw result.error;
      if (id && currentAquarium()?.id === id) state.aquarium = { ...state.aquarium, ...row, id };
      id && currentAquarium()?.id === id ? panelAcuario() : dashboard();
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  window.editA = async function () {
    const aq = currentAquarium();
    if (!aq) return dashboard();
    window.formA(aq);
  };

  window.openA = async function (id) {
    const t = token();
    render(`<section class="panel">${msg('Abriendo acuario...')}</section>`, 'acuarios');
    try {
      const { data, error } = await supabase.from('aquariums').select('*').eq('id', id).single();
      if (error) throw error;
      if (!isCurrent(t)) return;
      const cached = state.aquariums.find(a => a.id === id) || {};
      state.aquarium = { ...cached, ...data, __cover_url: data.cover_url || data.photo_url || data.image_url || cached.__cover_url || '' };
      window.q = state.aquarium;
      panelAcuario();
    } catch (e) {
      if (isCurrent(t)) render(msg(e.message, 'error'), 'acuarios');
    }
  };

  function panelAcuario() {
    const aq = currentAquarium();
    if (!aq) return dashboard();
    state.section = 'resumen';
    const photo = aq.__cover_url || aq.cover_url || aq.photo_url || aq.image_url || '';
    render(aqHeader('resumen') + `<section class="panel aq-cover">
      ${photo ? `<img class="aq-cover-photo" src="${esc(photo)}" alt="${esc(aq.name)}">` : ''}
      <div class="panel-head"><h2>Resumen</h2><button onclick="editA()">Editar</button></div>
      <h3>${esc(aq.name || 'Acuario')}</h3>
      <p>${esc(aq.description || 'Sistema sin descripción.')}</p>
      <div class="quick-actions">
        <button onclick="openAqSection('fichas')"><span>□</span>Fichas</button>
        <button onclick="openAqSection('animales')"><span>🐟</span>Animales</button>
        <button onclick="openAqSection('mapa')"><span>⌖</span>Mapa IA</button>
        <button onclick="openAqSection('fotos')"><span>📷</span>Fotos</button>
        <button onclick="openAqSection('inventario')"><span>▤</span>Inventario</button>
        <button onclick="openAqSection('parametros')"><span>🧪</span>Parámetros</button>
        <button onclick="openAqSection('tareas')"><span>♢</span>Tareas</button>
      </div>
    </section>`, 'acuarios');
  }
  window.panel = panelAcuario;

  window.openAqSection = function (section) {
    if (!currentAquarium()) return dashboard();
    state.section = section;
    if (section === 'resumen') return panelAcuario();
    if (section === 'fichas') return fichasAcuario();
    if (section === 'animales') return animales();
    if (section === 'mapa') return mapaIA();
    if (section === 'fotos') return fotos();
    if (section === 'inventario') return inventario('aquarium');
    if (section === 'parametros') return parametros();
    if (section === 'tareas') return tareasAcuario();
    return panelAcuario();
  };

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

  function animalCard(a) {
    return `<div class="item">
      ${a.photo_url ? `<img src="${esc(a.photo_url)}" style="width:100%;max-height:170px;object-fit:cover;border-radius:14px;margin-bottom:8px" alt="${esc(a.common_name)}">` : ''}
      <b>${esc(a.common_name || 'Animal')}</b>
      <p>${esc(a.scientific_name || '')}</p>
      <p class="small">${esc(a.category || 'otro')} · ${esc(a.status || 'active')} · Cantidad ${esc(a.quantity || 1)}</p>
      ${a.notes ? `<p>${esc(a.notes)}</p>` : ''}
    </div>`;
  }

  async function animales() {
    const aq = currentAquarium();
    const t = token();
    render(aqHeader('animales') + `<section class="panel"><div class="panel-head"><h2>Animales</h2><button onclick="formAnimal()">Añadir</button></div>${msg('Cargando animales...')}</section>`, 'acuarios');
    try {
      const { data, error } = await supabase.from('animals').select('*').eq('aquarium_id', aq.id).order('created_at', { ascending: false });
      if (error) throw error;
      if (!isCurrent(t)) return;
      render(aqHeader('animales') + `<section class="panel"><div class="panel-head"><h2>Animales</h2><button onclick="formAnimal()">Añadir</button></div>${(data || []).map(animalCard).join('') || msg('Sin animales registrados.')}</section>`, 'acuarios');
    } catch (e) {
      if (isCurrent(t)) render(aqHeader('animales') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
    }
  }

  window.formAnimal = function () {
    render(aqHeader('animales') + `<section class="panel">
      <button onclick="openAqSection('animales')">← Volver</button>
      <h2>Añadir animal</h2>
      <label>Nombre común</label><input id="anName">
      <label>Nombre científico o técnico</label><input id="anSci">
      <label>Tipo</label><select id="anCat"><option value="fish">Pez</option><option value="coral">Coral</option><option value="invertebrate">Invertebrado</option><option value="plant">Planta</option><option value="other">Otro</option></select>
      <label>Cantidad</label><input id="anQty" type="number" min="1" value="1">
      <label>Notas</label><textarea id="anNotes"></textarea>
      <button class="primary" onclick="saveAnimal()">Guardar</button>
      <div id="x"></div>
    </section>`, 'acuarios');
  };

  window.saveAnimal = async function () {
    try {
      const aq = currentAquarium();
      if (!val('anName')) throw new Error('Pon un nombre.');
      const row = {
        user_id: state.user.id,
        aquarium_id: aq.id,
        common_name: val('anName'),
        scientific_name: val('anSci') || val('anName'),
        category: val('anCat') || 'other',
        quantity: Number(val('anQty') || 1),
        status: 'active',
        notes: val('anNotes') || null
      };
      const { error } = await supabase.from('animals').insert(row);
      if (error) throw error;
      animales();
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  function markerTypeLabel(type) {
    return {
      coral: 'Coral',
      plant: 'Planta',
      rock: 'Roca',
      fish: 'Pez',
      equipment: 'Equipo',
      other: 'Otro'
    }[type] || 'Punto';
  }

  function mapMarkerHtml(marker) {
    const selected = window.__aqMap?.selected_id === marker.id ? ' selected' : '';
    return `<button class="map-pin ${esc(marker.type)}${selected}" style="left:${esc(marker.x)}%;top:${esc(marker.y)}%" onclick="selectMapMarker(event,'${esc(marker.id)}')" title="${esc(marker.label)} · profundidad ${esc(marker.z)}%">
      <span>${esc(marker.label.slice(0, 2).toUpperCase())}</span>
    </button>`;
  }

  function mapListHtml(map) {
    if (!map.markers.length) return '<p class="small">Sin puntos todavía. Escribe un nombre y toca la foto para colocar el primer coral, planta o roca.</p>';
    return map.markers.map(function (marker) {
      const active = map.selected_id === marker.id ? ' active' : '';
      return `<button class="map-list-item${active}" onclick="selectMapMarker(event,'${esc(marker.id)}')">
        <b>${esc(marker.label)}</b><span>${esc(markerTypeLabel(marker.type))}</span>
      </button>`;
    }).join('');
  }

  function selectedMapMarker(map) {
    return map.markers.find(m => m.id === map.selected_id) || map.markers[0] || null;
  }

  function mapEditorHtml(map) {
    const selected = selectedMapMarker(map);
    return `<section class="panel map-side">
      <h3>Punto seleccionado</h3>
      <label>Nombre</label><input id="mapMarkerLabel" value="${esc(selected?.label || '')}" placeholder="Ej. Euphyllia, Zoanthus, roca alta...">
      <label>Tipo</label><select id="mapMarkerType">
        <option value="coral" ${selected?.type === 'coral' ? 'selected' : ''}>Coral</option>
        <option value="plant" ${selected?.type === 'plant' ? 'selected' : ''}>Planta</option>
        <option value="rock" ${selected?.type === 'rock' ? 'selected' : ''}>Roca / zona</option>
        <option value="fish" ${selected?.type === 'fish' ? 'selected' : ''}>Pez</option>
        <option value="equipment" ${selected?.type === 'equipment' ? 'selected' : ''}>Equipo</option>
        <option value="other" ${selected?.type === 'other' ? 'selected' : ''}>Otro</option>
      </select>
      <label>Nota IA</label><textarea id="mapMarkerNote" placeholder="Luz media, flujo suave, dejar separación...">${esc(selected?.note || '')}</textarea>
      <label>Izquierda / derecha</label><input id="mapMarkerX" type="range" min="0" max="100" value="${esc(selected?.x ?? 50)}" oninput="previewMapMarkerPosition()">
      <label>Altura</label><input id="mapMarkerY" type="range" min="0" max="100" value="${esc(selected?.y ?? 50)}" oninput="previewMapMarkerPosition()">
      <label>Profundidad</label><input id="mapMarkerZ" type="range" min="0" max="100" value="${esc(selected?.z ?? 50)}" oninput="previewMapMarkerPosition()">
      <div class="map-actions">
        <button class="primary" onclick="updateMapMarker()">Actualizar punto</button>
        <button onclick="newMapMarker()">Nuevo punto</button>
        <button onclick="deleteMapMarker()">Borrar punto</button>
      </div>
      <h3>Colocados</h3>
      <div class="map-list">${mapListHtml(map)}</div>
    </section>`;
  }

  function mapStageHtml(map) {
    if (!map.photo_url) {
      return `<div class="map-empty-photo">
        <b>Falta foto del acuario</b>
        <p class="small">Sube una foto frontal del acuario. La IA 3D la usa como fondo para montar la urna y colocar puntos con profundidad.</p>
      </div>`;
    }
    return `<div class="map-3d-wrap">
      <div class="map-3d-toolbar">
        <button onclick="rotateMap3D(-18)">Girar izquierda</button>
        <button onclick="rotateMap3D(18)">Girar derecha</button>
        <button onclick="resetMap3D()">Frontal</button>
      </div>
      <div id="map3dStage" class="map-3d-stage"></div>
      <div id="mapStage" class="map-photo-stage map-photo-reference" onclick="placeMapMarker(event)">
        <img src="${esc(map.photo_url)}" alt="Foto del acuario para mapa IA">
        ${map.markers.map(mapMarkerHtml).join('')}
      </div>
    </div>`;
  }

  function renderMapIA(map) {
    const aq = currentAquarium();
    window.__aqMap = normalizeMap(map || window.__aqMap || readMap(aq), aq);
    const clean = window.__aqMap;
    render(aqHeader('mapa') + `<section class="panel map-panel">
      <div class="panel-head"><div><h2>Mapa IA</h2><p class="small">Foto real del acuario con puntos de colocación.</p></div><button onclick="saveMapIA()">Guardar</button></div>
      ${mapStageHtml(clean)}
      <label>Foto base del acuario</label><input id="mapPhotoFile" type="file" accept="image/*" onchange="previewMapPhoto()">
      <div id="mapPhotoPreview"></div>
      <button class="primary" onclick="saveMapPhoto()">Usar esta foto en el mapa</button>
      <div id="x"></div>
    </section>${mapEditorHtml(clean)}`, 'acuarios');
    requestAnimationFrame(function () { renderMap3D(clean); });
  }

  function mapaIA() {
    const aq = currentAquarium();
    if (!aq) return dashboard();
    renderMapIA(readMap(aq));
  }
  window.mapaIA = mapaIA;

  window.previewMapPhoto = function () {
    const file = byId('mapPhotoFile')?.files?.[0];
    if (!file || !byId('mapPhotoPreview')) return;
    const url = URL.createObjectURL(file);
    byId('mapPhotoPreview').innerHTML = `<div class="photo-preview"><img src="${url}" alt="Foto base del mapa"></div>`;
  };

  window.saveMapPhoto = async function () {
    try {
      const aq = currentAquarium();
      const file = byId('mapPhotoFile')?.files?.[0];
      if (!file) throw new Error('Selecciona una foto del acuario.');
      byId('x').innerHTML = msg('Subiendo foto del mapa...');
      const publicUrl = await uploadAquariumImage(file, 'map');
      const row = { user_id: state.user.id, aquarium_id: aq.id, title: 'Mapa IA acuario', image_url: publicUrl, photo_url: publicUrl };
      const inserted = await supabase.from('aquarium_photos').insert(row);
      if (inserted.error) throw inserted.error;
      aq.__cover_url = aq.__cover_url || publicUrl;
      const map = writeMapLocal(aq, { ...(window.__aqMap || readMap(aq)), photo_url: publicUrl });
      renderMapIA(map);
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  window.placeMapMarker = function (event) {
    const aq = currentAquarium();
    const stage = byId('mapStage');
    if (!stage || !aq) return;
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const map = window.__aqMap || readMap(aq);
    const label = val('mapMarkerLabel') || `Punto ${map.markers.length + 1}`;
    const type = val('mapMarkerType') || 'coral';
    const note = val('mapMarkerNote') || '';
    const selected = selectedMapMarker(map);
    if (selected && map.selected_id) {
      selected.x = x;
      selected.y = y;
      selected.label = label;
      selected.type = type;
      selected.note = note;
      writeMapLocal(aq, map);
      renderMapIA(map);
      return;
    }
    const marker = { id: `mk-${Date.now()}`, label, type, note, x, y, z: Number(val('mapMarkerZ')) || 50 };
    map.markers.push(marker);
    map.selected_id = marker.id;
    writeMapLocal(aq, map);
    renderMapIA(map);
  };

  function markerColor(type) {
    return {
      coral: 0xf472b6,
      plant: 0x22c55e,
      rock: 0xa3a3a3,
      fish: 0x0e8eff,
      equipment: 0xf59e0b,
      other: 0xe2e8f0
    }[type] || 0xe2e8f0;
  }

  function marker3DPosition(marker) {
    return {
      x: (Number(marker.x) - 50) * 1.2,
      y: (100 - Number(marker.y)) * 0.68 + 2,
      z: (Number(marker.z) - 50) * 0.7
    };
  }

  function containRect(srcW, srcH, boxW, boxH) {
    const ratio = Math.min(boxW / Math.max(1, srcW), boxH / Math.max(1, srcH));
    const w = srcW * ratio;
    const h = srcH * ratio;
    return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
  }

  function tankPhotoPlaneSize(image) {
    const rect = containRect(image?.width || 16, image?.height || 9, 120, 72);
    return { w: rect.w, h: rect.h, y: 36 + (36 - rect.y - rect.h / 2) };
  }

  function renderMap3DFallback(map) {
    const stage = byId('map3dStage');
    if (!stage) return;
    stage.innerHTML = '';
    const width = Math.max(320, stage.clientWidth || 640);
    const height = Math.max(260, Math.round(width * 0.58));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * Math.min(window.devicePixelRatio || 1, 2));
    canvas.height = Math.round(height * Math.min(window.devicePixelRatio || 1, 2));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    stage.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    function drawBase(photo) {
      const pad = 28;
      const front = { x: pad, y: pad + 22, w: width - pad * 2 - 42, h: height - pad * 2 - 34 };
      const depth = 42;
      ctx.clearRect(0, 0, width, height);
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#03101d');
      bg.addColorStop(1, '#06243a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      if (photo) {
        const fit = containRect(photo.naturalWidth || photo.width, photo.naturalHeight || photo.height, front.w, front.h);
        ctx.save();
        ctx.globalAlpha = 0.68;
        ctx.drawImage(photo, front.x + fit.x, front.y + fit.y, fit.w, fit.h);
        ctx.restore();
      }

      const water = ctx.createLinearGradient(front.x, front.y, front.x, front.y + front.h);
      water.addColorStop(0, 'rgba(66, 211, 255, .18)');
      water.addColorStop(0.45, 'rgba(20, 125, 160, .12)');
      water.addColorStop(1, 'rgba(5, 25, 38, .28)');
      ctx.fillStyle = water;
      ctx.fillRect(front.x, front.y, front.w, front.h);

      ctx.fillStyle = 'rgba(160, 230, 255, .18)';
      ctx.fillRect(front.x + 2, front.y + 10, front.w - 4, 4);

      ctx.strokeStyle = 'rgba(125, 211, 252, .75)';
      ctx.lineWidth = 2;
      ctx.strokeRect(front.x, front.y, front.w, front.h);
      ctx.beginPath();
      ctx.moveTo(front.x, front.y);
      ctx.lineTo(front.x + depth, front.y - depth);
      ctx.lineTo(front.x + front.w + depth, front.y - depth);
      ctx.lineTo(front.x + front.w, front.y);
      ctx.moveTo(front.x + front.w, front.y + front.h);
      ctx.lineTo(front.x + front.w + depth, front.y + front.h - depth);
      ctx.lineTo(front.x + front.w + depth, front.y - depth);
      ctx.moveTo(front.x + depth, front.y - depth);
      ctx.lineTo(front.x + depth, front.y + front.h - depth);
      ctx.lineTo(front.x, front.y + front.h);
      ctx.stroke();

      ctx.fillStyle = 'rgba(201, 179, 106, .72)';
      ctx.fillRect(front.x + 2, front.y + front.h - 28, front.w - 4, 26);

      ctx.fillStyle = 'rgba(255, 255, 255, .12)';
      ctx.fillRect(front.x + 10, front.y + 10, 2, front.h - 30);
      ctx.fillRect(front.x + front.w - 14, front.y + 10, 2, front.h - 30);

      map.markers.forEach(function (marker) {
        const x = front.x + (Number(marker.x) / 100) * front.w + ((Number(marker.z) - 50) / 100) * depth;
        const y = front.y + (Number(marker.y) / 100) * front.h - ((Number(marker.z) - 50) / 100) * depth;
        const selected = map.selected_id === marker.id;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(226, 232, 240, .8)';
        ctx.moveTo(x, y);
        ctx.lineTo(x, front.y + front.h - 28);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = `#${markerColor(marker.type).toString(16).padStart(6, '0')}`;
        ctx.arc(x, y, selected ? 9 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = selected ? 4 : 2;
        ctx.strokeStyle = selected ? '#ffffff' : 'rgba(255,255,255,.72)';
        ctx.stroke();
      });
    }

    if (map.photo_url) {
      const photo = new Image();
      photo.crossOrigin = 'anonymous';
      photo.onload = function () { drawBase(photo); };
      photo.onerror = function () { drawBase(null); };
      photo.src = map.photo_url;
    } else {
      drawBase(null);
    }
  }

  function renderMap3D(map) {
    const stage = byId('map3dStage');
    if (!stage) return;
    if (!window.THREE) {
      renderMap3DFallback(map);
      return;
    }
    stage.innerHTML = '';
    const width = Math.max(320, stage.clientWidth || 640);
    const height = Math.max(260, Math.round(width * 0.58));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03101d);
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    const rotation = window.__aqMapRotation || 0;
    const radians = rotation * Math.PI / 180;
    camera.position.set(Math.sin(radians) * 160, 70, Math.cos(radians) * 160);
    camera.lookAt(0, 34, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdffaff, 0x082033, 2.6));
    const light = new THREE.DirectionalLight(0xffffff, 1.4);
    light.position.set(30, 90, 80);
    scene.add(light);

    const tank = new THREE.BoxGeometry(120, 72, 72);
    const edges = new THREE.EdgesGeometry(tank);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.78 }));
    line.position.y = 36;
    scene.add(line);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xbdefff,
      transparent: true,
      opacity: 0.13,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.45,
      depthWrite: false
    });
    const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(120, 72), glassMaterial);
    frontGlass.position.set(0, 36, 36.05);
    scene.add(frontGlass);
    const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(72, 72), glassMaterial);
    leftGlass.rotation.y = Math.PI / 2;
    leftGlass.position.set(-60.05, 36, 0);
    scene.add(leftGlass);
    const rightGlass = leftGlass.clone();
    rightGlass.position.x = 60.05;
    scene.add(rightGlass);

    const water = new THREE.Mesh(
      new THREE.BoxGeometry(118, 64, 70),
      new THREE.MeshPhysicalMaterial({
        color: 0x1ba8d6,
        transparent: true,
        opacity: 0.18,
        roughness: 0.25,
        metalness: 0,
        transmission: 0.18,
        depthWrite: false
      })
    );
    water.position.y = 34;
    scene.add(water);

    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(118, 70),
      new THREE.MeshBasicMaterial({ color: 0x70e0ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 66.4;
    scene.add(surface);

    const sand = new THREE.Mesh(
      new THREE.BoxGeometry(120, 5, 72),
      new THREE.MeshStandardMaterial({ color: 0xc9b36a, roughness: 0.9 })
    );
    sand.position.y = 2.5;
    scene.add(sand);

    if (map.photo_url) {
      const texture = new THREE.TextureLoader().load(map.photo_url, function (loaded) {
        const plane = tankPhotoPlaneSize(loaded.image);
        back.geometry.dispose();
        back.geometry = new THREE.PlaneGeometry(plane.w, plane.h);
        back.position.y = plane.y;
        renderer.render(scene, camera);
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      const back = new THREE.Mesh(
        new THREE.PlaneGeometry(120, 72),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
      );
      back.position.set(0, 36, -36.2);
      scene.add(back);
    }

    map.markers.forEach(function (marker) {
      const pos = marker3DPosition(marker);
      const group = new THREE.Group();
      const selected = map.selected_id === marker.id;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(selected ? 3.8 : 3, 24, 16),
        new THREE.MeshStandardMaterial({ color: markerColor(marker.type), roughness: 0.35, metalness: 0.05 })
      );
      group.add(sphere);
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, Math.max(4, pos.y), 12),
        new THREE.MeshStandardMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.7 })
      );
      stem.position.y = -Math.max(4, pos.y) / 2;
      group.add(stem);
      group.position.set(pos.x, pos.y, pos.z);
      scene.add(group);
    });

    renderer.render(scene, camera);
  }

  window.rotateMap3D = function (delta) {
    window.__aqMapRotation = (window.__aqMapRotation || 0) + delta;
    renderMap3D(window.__aqMap || readMap(currentAquarium()));
  };

  window.resetMap3D = function () {
    window.__aqMapRotation = 0;
    renderMap3D(window.__aqMap || readMap(currentAquarium()));
  };

  window.previewMapMarkerPosition = function () {
    const aq = currentAquarium();
    const map = window.__aqMap || readMap(aq);
    const marker = selectedMapMarker(map);
    if (!marker) return;
    marker.x = Number(val('mapMarkerX')) || marker.x;
    marker.y = Number(val('mapMarkerY')) || marker.y;
    marker.z = Number(val('mapMarkerZ')) || marker.z;
    renderMap3D(map);
  };

  window.selectMapMarker = function (event, id) {
    if (event?.stopPropagation) event.stopPropagation();
    const aq = currentAquarium();
    const map = window.__aqMap || readMap(aq);
    map.selected_id = id;
    writeMapLocal(aq, map);
    renderMapIA(map);
  };

  window.updateMapMarker = function () {
    const aq = currentAquarium();
    const map = window.__aqMap || readMap(aq);
    let marker = selectedMapMarker(map);
    if (!marker) {
      marker = { id: `mk-${Date.now()}`, x: Number(val('mapMarkerX')) || 50, y: Number(val('mapMarkerY')) || 50, z: Number(val('mapMarkerZ')) || 50, label: val('mapMarkerLabel') || 'Punto', type: val('mapMarkerType') || 'coral', note: val('mapMarkerNote') || '' };
      map.markers.push(marker);
      map.selected_id = marker.id;
    } else {
      marker.label = val('mapMarkerLabel') || marker.label;
      marker.type = val('mapMarkerType') || marker.type;
      marker.note = val('mapMarkerNote') || '';
      marker.x = Number(val('mapMarkerX')) || marker.x;
      marker.y = Number(val('mapMarkerY')) || marker.y;
      marker.z = Number(val('mapMarkerZ')) || marker.z;
    }
    writeMapLocal(aq, map);
    renderMapIA(map);
  };

  window.newMapMarker = function () {
    const aq = currentAquarium();
    const map = window.__aqMap || readMap(aq);
    map.selected_id = '';
    writeMapLocal(aq, map);
    renderMapIA(map);
  };

  window.deleteMapMarker = function () {
    const aq = currentAquarium();
    const map = window.__aqMap || readMap(aq);
    map.markers = map.markers.filter(m => m.id !== map.selected_id);
    map.selected_id = map.markers[0]?.id || '';
    writeMapLocal(aq, map);
    renderMapIA(map);
  };

  window.saveMapIA = async function () {
    const aq = currentAquarium();
    const map = writeMapLocal(aq, window.__aqMap || readMap(aq));
    try {
      const payload = MAP_PREFIX + JSON.stringify(map);
      const result = await supabase.from('aquariums').update({ ai_summary: payload }).eq('id', aq.id);
      if (result.error) throw result.error;
      aq.ai_summary = payload;
      renderMapIA(map);
      const x = byId('x');
      if (x) x.innerHTML = msg('Mapa IA guardado.', 'success');
    } catch (e) {
      const x = byId('x');
      if (x) x.innerHTML = msg('Mapa guardado en este dispositivo. Supabase no aceptó el guardado remoto: ' + e.message, 'notice');
    }
  };

  function photoCard(p) {
    const url = photoUrl(p);
    return `<div class="item gallery-card">
      ${url ? `<img src="${esc(url)}" alt="${esc(p.title || 'Foto')}" loading="lazy">` : ''}
      <b>${esc(p.title || p.caption || 'Foto')}</b>
    </div>`;
  }

  async function fotos() {
    const aq = currentAquarium();
    const t = token();
    render(aqHeader('fotos') + `<section class="panel"><div class="panel-head"><h2>Fotos</h2><button class="primary" onclick="formFoto()">Subir</button></div><div id="photoList">${msg('Cargando fotos...')}</div></section>`, 'acuarios');
    try {
      const { data, error } = await supabase.from('aquarium_photos').select('*').eq('aquarium_id', aq.id).order('created_at', { ascending: false }).limit(60);
      if (error) throw error;
      if (!isCurrent(t)) return;
      render(aqHeader('fotos') + `<section class="panel"><div class="panel-head"><h2>Fotos</h2><button class="primary" onclick="formFoto()">Subir</button></div><div class="gallery-grid">${(data || []).map(photoCard).join('') || '<p class="small">Sin fotos todavía.</p>'}</div></section>`, 'acuarios');
    } catch (e) {
      if (isCurrent(t)) render(aqHeader('fotos') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
    }
  }

  window.formFoto = function () {
    render(aqHeader('fotos') + `<section class="panel">
      <button onclick="openAqSection('fotos')">← Volver</button>
      <h2>Subir foto</h2>
      <label>Título</label><input id="photoTitle" placeholder="Vista general, evolución, coral nuevo...">
      <label>Imagen</label><input id="photoFile" type="file" accept="image/*" onchange="previewPhoto()">
      <div id="photoPreview"></div>
      <button class="primary" onclick="saveFoto()">Guardar foto</button>
      <div id="x"></div>
    </section>`, 'acuarios');
  };

  window.previewPhoto = function () {
    const file = byId('photoFile')?.files?.[0];
    if (!file || !byId('photoPreview')) return;
    const url = URL.createObjectURL(file);
    byId('photoPreview').innerHTML = `<div class="photo-preview"><img src="${url}" alt="Previsualización"></div>`;
  };

  window.saveFoto = async function () {
    try {
      const aq = currentAquarium();
      const file = byId('photoFile')?.files?.[0];
      if (!file) throw new Error('Selecciona una imagen.');
      byId('x').innerHTML = msg('Subiendo foto...');
      const publicUrl = await uploadAquariumImage(file, 'gallery');
      const row = { user_id: state.user.id, aquarium_id: aq.id, title: val('photoTitle') || 'Foto de acuario', image_url: publicUrl, photo_url: publicUrl };
      const { error } = await supabase.from('aquarium_photos').insert(row);
      if (error) throw error;
      fotos();
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  async function parametros() {
    const aq = currentAquarium();
    const t = token();
    render(aqHeader('parametros') + `<section class="panel"><div class="panel-head"><h2>Parámetros</h2><button class="primary" onclick="formParametro()">Añadir</button></div>${msg('Cargando parámetros...')}</section>`, 'acuarios');
    try {
      const { data, error } = await supabase.from('aquarium_measurements').select('*').eq('aquarium_id', aq.id).order('measured_at', { ascending: false }).limit(80);
      if (error) throw error;
      if (!isCurrent(t)) return;
      const rows = data || [];
      const html = rows.map(function (r) {
        return `<div class="item"><b>${esc(r.parameter_label || r.parameter_key || r.parameter || 'Parámetro')}</b><p>${esc(r.display_value || r.value || r.raw_text || '-')}</p><p class="small">${dateText(r.measured_at || r.created_at)}${r.notes ? ' · ' + esc(r.notes) : ''}</p></div>`;
      }).join('');
      render(aqHeader('parametros') + `<section class="panel"><div class="panel-head"><h2>Parámetros</h2><button class="primary" onclick="formParametro()">Añadir</button></div>${html || msg('Sin mediciones todavía.')}</section>`, 'acuarios');
    } catch (e) {
      if (isCurrent(t)) render(aqHeader('parametros') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
    }
  }

  window.formParametro = function () {
    render(aqHeader('parametros') + `<section class="panel">
      <button onclick="openAqSection('parametros')">← Volver</button>
      <h2>Nueva medición</h2>
      <label>Parámetro</label><input id="parName" placeholder="KH, NO3, PO4, pH...">
      <label>Valor</label><input id="parValue" placeholder="Ej. 8.2">
      <label>Fecha</label><input id="parDate" type="datetime-local" value="${new Date().toISOString().slice(0, 16)}">
      <label>Notas</label><textarea id="parNotes"></textarea>
      <button class="primary" onclick="saveParametro()">Guardar</button>
      <div id="x"></div>
    </section>`, 'acuarios');
  };

  window.saveParametro = async function () {
    try {
      const aq = currentAquarium();
      if (!val('parName')) throw new Error('Indica el parámetro.');
      const row = {
        user_id: state.user.id,
        aquarium_id: aq.id,
        parameter_key: val('parName').toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        parameter_label: val('parName'),
        display_value: val('parValue'),
        raw_text: val('parValue'),
        measured_at: val('parDate') ? new Date(val('parDate')).toISOString() : new Date().toISOString(),
        notes: val('parNotes') || null
      };
      const { error } = await supabase.from('aquarium_measurements').insert(row);
      if (error) throw error;
      parametros();
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  async function tareasAcuario() {
    const aq = currentAquarium();
    const t = token();
    render(aqHeader('tareas') + `<section class="panel"><div class="panel-head"><h2>Tareas</h2><button class="primary" onclick="formTareaAcuario()">Añadir</button></div>${msg('Cargando tareas...')}</section>`, 'acuarios');
    try {
      const { data, error } = await supabase.from('tasks').select('*').eq('user_id', state.user.id).eq('aquarium_id', aq.id).order('due_at', { ascending: true, nullsFirst: false }).limit(80);
      if (error) throw error;
      if (!isCurrent(t)) return;
      const html = (data || []).map(tareaCard).join('');
      render(aqHeader('tareas') + `<section class="panel"><div class="panel-head"><h2>Tareas</h2><button class="primary" onclick="formTareaAcuario()">Añadir</button></div>${html || msg('Sin tareas pendientes.')}</section>`, 'acuarios');
    } catch (e) {
      if (isCurrent(t)) render(aqHeader('tareas') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
    }
  }
  window.tareasAcuario = tareasAcuario;

  function tareaCard(task) {
    return `<div class="${task.status === 'done' ? 'success' : 'item'}"><b>${esc(task.title || 'Tarea')}</b><p class="small">${dateText(task.due_at)} · ${esc(task.priority || 'normal')} · ${esc(task.status || 'open')}</p>${task.notes ? `<p>${esc(task.notes)}</p>` : ''}</div>`;
  }

  const AI_DAY = 24 * 60 * 60 * 1000;
  const aiMeasurementPlans = {
    marine: { temperature_c: 1, salinity_ppt: 2, ph: 2, kh_dkh: 3, nitrate_no3: 7, phosphate_po4: 7, calcium_ca: 14, magnesium_mg: 14 },
    freshwater: { temperature_c: 1, ph: 7, kh_dkh: 14, gh: 14, ammonia_nh3: 7, nitrite_no2: 7, nitrate_no3: 7, phosphate_po4: 14 }
  };
  const aiParameterLabels = {
    temperature_c: 'Temperatura',
    salinity_ppt: 'Salinidad',
    salinity_sg: 'Salinidad',
    ph: 'pH',
    kh_dkh: 'KH',
    nitrate_no3: 'NO3',
    phosphate_po4: 'PO4',
    calcium_ca: 'Calcio',
    magnesium_mg: 'Magnesio',
    gh: 'GH',
    ammonia_nh3: 'NH3/NH4',
    nitrite_no2: 'NO2'
  };

  function aiAquariumMode(aq) {
    const t = String(aq?.aquarium_type || aq?.type || '').toLowerCase();
    if (/fresh|dulce|plant|betta|angel|discus/.test(t)) return 'freshwater';
    return 'marine';
  }

  function normalizeMeasurementKey(row) {
    const raw = String(row?.parameter_key || row?.parameter || row?.parameter_label || '').toLowerCase();
    const key = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (['temperatura', 'temp', 'temperature', 'temperature_c'].includes(key)) return 'temperature_c';
    if (['salinidad', 'sg', 'densidad', 'specific_gravity', 'salinity_sg'].includes(key)) return 'salinity_sg';
    if (['kh', 'alcalinidad', 'alkalinity', 'kh_dkh'].includes(key)) return 'kh_dkh';
    if (['no3', 'nitrato', 'nitratos', 'nitrate', 'nitrate_no3'].includes(key)) return 'nitrate_no3';
    if (['po4', 'fosfato', 'fosfatos', 'phosphate', 'phosphate_po4'].includes(key)) return 'phosphate_po4';
    if (['calcio', 'ca', 'calcium', 'calcium_ca'].includes(key)) return 'calcium_ca';
    if (['magnesio', 'mg', 'magnesium', 'magnesium_mg'].includes(key)) return 'magnesium_mg';
    if (key === 'ph') return 'ph';
    return key;
  }

  function measurementNumber(row) {
    const source = row?.display_value ?? row?.raw_text ?? row?.value ?? row?.raw_value ?? row?.normalized_value ?? '';
    const match = String(source).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function aiLatestMeasurements(rows) {
    const out = {};
    (rows || []).forEach(function (r) {
      const key = normalizeMeasurementKey(r);
      if (key && !out[key]) out[key] = r;
    });
    return out;
  }

  function aiDueSuggestion(aq, key, freq, row) {
    const label = aiParameterLabels[key] || key;
    if (!row) {
      return {
        type: 'measurement',
        priority: 'high',
        aquarium_id: aq.id,
        aquarium_name: aq.name || 'Acuario',
        title: `Medir ${label} · ${aq.name || 'Acuario'}`,
        due_at: new Date().toISOString(),
        notes: `La IA no encuentra una medición reciente de ${label} en ${aq.name || 'este acuario'}. Medir y registrar para poder detectar riesgos.`
      };
    }
    const measured = new Date(row.measured_at || row.created_at || Date.now());
    const next = new Date(measured.getTime() + freq * AI_DAY);
    if (next <= new Date()) {
      return {
        type: 'measurement',
        priority: 'normal',
        aquarium_id: aq.id,
        aquarium_name: aq.name || 'Acuario',
        title: `Medir ${label} · ${aq.name || 'Acuario'}`,
        due_at: new Date().toISOString(),
        notes: `Toca repetir ${label}. Última medición: ${dateText(row.measured_at || row.created_at)}. Frecuencia orientativa: cada ${freq} días.`
      };
    }
    return null;
  }

  function reefRangeState(key, value) {
    if (!Number.isFinite(value)) return null;
    if (key === 'temperature_c') {
      if (value < 23) return { state: 'crítico bajo', priority: 'high' };
      if (value < 24) return { state: 'bajo', priority: 'normal' };
      if (value <= 27) return null;
      if (value > 28) return { state: 'crítico alto', priority: 'high' };
      return { state: 'alto', priority: 'normal' };
    }
    if (key === 'salinity_sg') {
      if (value > 2) return null;
      if (value < 1.022) return { state: 'crítico bajo', priority: 'high' };
      if (value < 1.024) return { state: 'bajo', priority: 'normal' };
      if (value >= 1.025 && value <= 1.026) return null;
      if (value > 1.028) return { state: 'crítico alto', priority: 'high' };
      return { state: 'alto', priority: 'normal' };
    }
    if (key === 'ph') {
      if (value < 7.8) return { state: 'crítico bajo', priority: 'high' };
      if (value < 8.0) return { state: 'bajo', priority: 'normal' };
      if (value <= 8.4) return null;
      if (value > 8.5) return { state: 'crítico alto', priority: 'high' };
      return { state: 'alto', priority: 'normal' };
    }
    if (key === 'kh_dkh') {
      if (value < 6) return { state: 'crítico bajo', priority: 'high' };
      if (value < 7) return { state: 'bajo', priority: 'normal' };
      if (value <= 9) return null;
      if (value > 12) return { state: 'crítico alto', priority: 'high' };
      return { state: 'alto', priority: 'normal' };
    }
    if (key === 'calcium_ca') {
      if (value < 350) return { state: 'crítico bajo', priority: 'high' };
      if (value < 400) return { state: 'bajo', priority: 'normal' };
      if (value <= 450) return null;
      if (value > 500) return { state: 'crítico alto', priority: 'high' };
      return { state: 'alto', priority: 'normal' };
    }
    if (key === 'magnesium_mg') {
      if (value < 1150) return { state: 'crítico bajo', priority: 'high' };
      if (value < 1250) return { state: 'bajo', priority: 'normal' };
      if (value <= 1400) return null;
      if (value > 1500) return { state: 'crítico alto', priority: 'high' };
      return { state: 'alto', priority: 'normal' };
    }
    if (key === 'nitrate_no3') {
      if (value < 1) return { state: 'muy bajo', priority: 'normal' };
      if (value <= 10) return null;
      if (value > 50) return { state: 'crítico alto', priority: 'high' };
      if (value > 25) return { state: 'alto', priority: 'normal' };
      return null;
    }
    if (key === 'phosphate_po4') {
      if (value < 0.02) return { state: 'muy bajo', priority: 'normal' };
      if (value <= 0.08) return null;
      if (value > 0.20) return { state: 'crítico alto', priority: 'high' };
      if (value > 0.10) return { state: 'alto', priority: 'normal' };
      return null;
    }
    return null;
  }

  function interpretMeasurementValue(aq, measurementRow) {
    if (!measurementRow || aiAquariumMode(aq) !== 'marine') return null;
    const value = measurementNumber(measurementRow);
    let key = normalizeMeasurementKey(measurementRow);
    if (key === 'salinity_ppt' && value !== null && value < 2) key = 'salinity_sg';
    const range = reefRangeState(key, value);
    if (!range) return null;
    const label = aiParameterLabels[key] || key;
    const aqName = aq.name || 'Acuario';
    return {
      type: 'chemistry',
      priority: range.priority,
      aquarium_id: aq.id,
      aquarium_name: aqName,
      title: `${label} ${range.state} · ${aqName}`,
      due_at: new Date().toISOString(),
      notes: `${label}: ${value}. Estado: ${range.state}. Revisar la medición, confirmar con test fiable y actuar según el acuario antes de dosificar.`
    };
  }

  window.interpretMeasurementValue = interpretMeasurementValue;

  function aiInventorySuggestions(items) {
    const suggestions = [];
    const lower = text => String(text || '').toLowerCase();
    const hasCat = word => items.some(i => lower(i.category).includes(word) || lower(i.name).includes(word));
    (items || []).forEach(function (item) {
      const status = inventoryExpiryStatus(item);
      const expiry = inventoryMeta(item).expires_at || item.expires_at || item.expiry_date || '';
      if (status === 'caducado') {
        suggestions.push({
          type: 'inventory',
          priority: 'high',
          title: `Reponer ${item.name || 'producto caducado'}`,
          due_at: new Date().toISOString(),
          notes: `${item.name || 'Producto'} figura caducado${expiry ? ` desde ${expiry}` : ''}. Revisar, retirar si procede y comprar sustituto si se sigue usando.`
        });
      } else if (status === 'caduca pronto') {
        suggestions.push({
          type: 'inventory',
          priority: 'normal',
          title: `Revisar caducidad de ${item.name || 'producto'}`,
          due_at: new Date(Date.now() + 7 * AI_DAY).toISOString(),
          notes: `${item.name || 'Producto'} caduca pronto${expiry ? ` (${expiry})` : ''}. Planificar compra si es necesario.`
        });
      }
      if (Number(item.quantity) <= 0) {
        suggestions.push({
          type: 'inventory',
          priority: 'normal',
          title: `Comprar ${item.name || 'inventario'}`,
          due_at: new Date().toISOString(),
          notes: `${item.name || 'Item'} aparece con cantidad ${item.quantity}. Revisar stock real.`
        });
      }
    });
    if (!hasCat('test')) suggestions.push({ type: 'inventory', priority: 'normal', title: 'Revisar tests disponibles', due_at: new Date().toISOString(), notes: 'No veo tests en inventario general. La IA necesita tests registrados para avisar de mediciones y compras.' });
    if (!hasCat('comida') && !hasCat('alimento')) suggestions.push({ type: 'inventory', priority: 'normal', title: 'Registrar comida disponible', due_at: new Date().toISOString(), notes: 'No veo comida registrada. Añadirla permite controlar stock y compras.' });
    return suggestions;
  }

  function aiSuggestionCard(s) {
    return `<div class="item ai-suggestion ${esc(s.priority || 'normal')}">
      <b>${esc(s.title)}</b>
      <p class="small">${esc(s.aquarium_name || 'General')} · ${esc(s.priority || 'normal')} · ${dateText(s.due_at)}</p>
      <p>${esc(s.notes || '')}</p>
    </div>`;
  }

  async function buildAiMaintenanceReview() {
    const aquariums = state.aquariums.length ? state.aquariums : await loadAquariums();
    const inv = await supabase.from('inventory_items').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(250);
    if (inv.error) throw inv.error;
    const tasks = await supabase.from('tasks').select('*').eq('user_id', state.user.id).neq('status', 'done').limit(250);
    if (tasks.error) throw tasks.error;
    const suggestions = aiInventorySuggestions(inv.data || []);
    for (const aq of aquariums) {
      const measurements = await supabase.from('aquarium_measurements').select('*').eq('aquarium_id', aq.id).order('measured_at', { ascending: false }).limit(120);
      if (measurements.error) throw measurements.error;
      const latest = aiLatestMeasurements(measurements.data || []);
      const plan = aiMeasurementPlans[aiAquariumMode(aq)] || aiMeasurementPlans.marine;
      Object.keys(plan).forEach(function (key) {
        const row = latest[key] || (key === 'salinity_ppt' ? latest.salinity_sg : null);
        const suggestion = aiDueSuggestion(aq, key, plan[key], row);
        if (suggestion) suggestions.push(suggestion);
      });
      Object.values(latest).forEach(function (row) {
        const chemical = interpretMeasurementValue(aq, row);
        if (chemical) suggestions.push(chemical);
      });
    }
    const openTitles = new Set((tasks.data || []).map(t => String(t.title || '').toLowerCase()));
    const filtered = suggestions.filter(s => !openTitles.has(String(s.title || '').toLowerCase()));
    filtered.sort((a, b) => (a.priority === 'high' ? -1 : 1) - (b.priority === 'high' ? -1 : 1));
    return { created_at: new Date().toISOString(), suggestions: filtered.slice(0, 40), existing: suggestions.length - filtered.length };
  }

  window.iaAcuarioNexo = async function () {
    if (!state.user) return login();
    const t = token();
    render(`<section class="panel"><h2>IA AcuarioNexo</h2>${msg('Revisando acuarios, mediciones, inventario y tareas...')}</section>`, 'avisos');
    try {
      const review = await buildAiMaintenanceReview();
      if (!isCurrent(t)) return;
      window.__aiReview = review;
      const html = review.suggestions.map(aiSuggestionCard).join('');
      render(`<section class="panel">
        <div class="panel-head"><div><h2>IA AcuarioNexo</h2><p class="small">Primer cerebro: mediciones, stock, caducidades y avisos.</p></div><button onclick="tareas()">Avisos</button></div>
        ${review.existing ? msg(`${review.existing} avisos ya estaban creados y no se duplican.`, 'notice') : ''}
        ${html || msg('No veo avisos nuevos ahora mismo.', 'success')}
        ${review.suggestions.length ? `<button class="primary" onclick="crearAvisosIA()">Crear estos avisos</button>` : ''}
        <div id="x"></div>
      </section>`, 'avisos');
    } catch (e) {
      if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'avisos');
    }
  };

  window.crearAvisosIA = async function () {
    try {
      const suggestions = window.__aiReview?.suggestions || [];
      if (!suggestions.length) throw new Error('No hay avisos IA para crear.');
      byId('x').innerHTML = msg('Creando avisos...');
      const rows = suggestions.map(s => ({
        user_id: state.user.id,
        aquarium_id: s.aquarium_id || null,
        title: s.title,
        task_type: 'ai',
        due_at: s.due_at || new Date().toISOString(),
        priority: s.priority || 'normal',
        status: 'open',
        notes: s.notes || null
      }));
      const { error } = await supabase.from('tasks').insert(rows);
      if (error) throw error;
      byId('x').innerHTML = msg('Avisos IA creados.', 'success');
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  window.formTareaAcuario = function () {
    render(aqHeader('tareas') + `<section class="panel">
      <button onclick="openAqSection('tareas')">← Volver</button>
      <h2>Nueva tarea</h2>
      <label>Título</label><input id="taskTitle">
      <label>Fecha</label><input id="taskDue" type="datetime-local">
      <label>Notas</label><textarea id="taskNotes"></textarea>
      <button class="primary" onclick="saveTareaAcuario()">Guardar</button>
      <div id="x"></div>
    </section>`, 'acuarios');
  };

  window.saveTareaAcuario = async function () {
    try {
      const aq = currentAquarium();
      if (!val('taskTitle')) throw new Error('Pon un título.');
      const row = { user_id: state.user.id, aquarium_id: aq.id, title: val('taskTitle'), task_type: 'task', due_at: val('taskDue') ? new Date(val('taskDue')).toISOString() : null, priority: 'normal', status: 'open', notes: val('taskNotes') || null };
      const { error } = await supabase.from('tasks').insert(row);
      if (error) throw error;
      tareasAcuario();
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  window.tareas = async function () {
    if (!state.user) return login();
    const t = token();
    render(`<section class="panel"><h2>Avisos</h2>${msg('Cargando tareas...')}</section>`, 'avisos');
    try {
      const { data, error } = await supabase.from('tasks').select('*').eq('user_id', state.user.id).order('due_at', { ascending: true, nullsFirst: false }).limit(120);
      if (error) throw error;
      if (!isCurrent(t)) return;
      render(`<section class="panel"><div class="panel-head"><div><h2>Avisos</h2><p class="small">Tareas y avisos creados por ti o por la IA.</p></div><button class="primary" onclick="iaAcuarioNexo()">Revisar IA</button></div>${(data || []).map(tareaCard).join('') || msg('No hay avisos.')}</section>`, 'avisos');
    } catch (e) {
      if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'avisos');
    }
  };

  const INVENTORY_AQ_PREFIX = 'AcuarioNexoAcuario:';
  const generalInventoryCategories = ['Medicamento', 'Test', 'Comida', 'Material general'];
  const aquariumInventoryCategories = ['Pez', 'Planta', 'Invertebrado', 'Coral', 'Equipo'];

  function inventoryNoteText(item) {
    return String(item.notes || '')
      .replace(/^AcuarioNexoAcuario:[^|\n]+[|\n]\s*/i, '')
      .replace(/^AcuarioNexoMeta:\{[^\n]*\}\n?/i, '')
      .trim();
  }

  function inventoryMeta(item) {
    const text = String(item.notes || '');
    const match = text.match(/^AcuarioNexoMeta:(\{[^\n]*\})/i) || text.match(/\nAcuarioNexoMeta:(\{[^\n]*\})/i);
    if (!match) return {};
    try { return JSON.parse(match[1]); } catch (_) { return {}; }
  }

  function inventoryNotesWithMeta(notes, meta) {
    const clean = String(notes || '').trim();
    const compact = {};
    Object.keys(meta || {}).forEach(function (key) {
      if (meta[key] !== null && meta[key] !== undefined && String(meta[key]).trim() !== '') compact[key] = meta[key];
    });
    const prefix = Object.keys(compact).length ? `AcuarioNexoMeta:${JSON.stringify(compact)}\n` : '';
    return `${prefix}${clean}`.trim() || null;
  }

  function inventoryCover(item) {
    const meta = inventoryMeta(item);
    return item.cover_url || item.image_url || item.photo_url || item.public_url || meta.cover_url || meta.image_url || '';
  }

  function inventoryExpiryStatus(item) {
    const exp = inventoryMeta(item).expires_at || item.expires_at || item.expiry_date || '';
    if (!exp) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(`${exp}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    const days = Math.round((date - today) / 86400000);
    if (days < 0) return 'caducado';
    if (days <= 30) return 'caduca pronto';
    return 'ok';
  }

  function inventoryAqId(item) {
    if (item.aquarium_id) return String(item.aquarium_id);
    const note = String(item.notes || '');
    const match = note.match(/^AcuarioNexoAcuario:([^|\n]+)/i);
    return match ? match[1] : '';
  }

  function inventoryItemHtml(item, aqName) {
    const cleanNotes = inventoryNoteText(item);
    const shortNotes = cleanNotes.length > 180 ? `${cleanNotes.slice(0, 180)}...` : cleanNotes;
    const scope = inventoryAqId(item) ? (aqName || 'Acuario') : 'General';
    const meta = inventoryMeta(item);
    const expiry = meta.expires_at || item.expires_at || item.expiry_date || '';
    const expiryStatus = inventoryExpiryStatus(item);
    const cover = inventoryCover(item);
    return `<button class="item inventory-card inventory-ficha-card" onclick="verInventario('${esc(item.id)}')">
      <div class="inventory-cover">${cover ? `<img src="${esc(cover)}" alt="${esc(item.name || 'Inventario')}" loading="lazy">` : '<span>▤</span>'}</div>
      <div class="inventory-card-body">
        <div class="inventory-card-head">
          <div><b>${esc(item.name || 'Item')}</b><p class="small">${esc(item.category || 'Inventario')} · ${esc(item.quantity ?? '-')} ${esc(item.unit || '')}</p></div>
          <span>${esc(scope)}</span>
        </div>
        ${expiry ? `<p class="small inventory-expiry ${esc(expiryStatus)}">Caducidad: ${esc(expiry)}${expiryStatus ? ` · ${esc(expiryStatus)}` : ''}</p>` : ''}
        ${shortNotes ? `<p>${esc(shortNotes)}</p>` : ''}
      </div>
    </button>`;
  }

  async function insertInventoryRow(row) {
    const first = await supabase.from('inventory_items').insert(row);
    if (!first.error) return first;
    if (!Object.prototype.hasOwnProperty.call(row, 'aquarium_id')) return first;
    if (!/aquarium_id|schema cache|column/i.test(first.error.message || '')) return first;
    const fallback = { ...row };
    const aqId = fallback.aquarium_id;
    delete fallback.aquarium_id;
    fallback.notes = `${INVENTORY_AQ_PREFIX}${aqId}| ${fallback.notes || ''}`.trim();
    return supabase.from('inventory_items').insert(fallback);
  }

  async function updateInventoryRow(id, row) {
    const first = await supabase.from('inventory_items').update(row).eq('id', id).eq('user_id', state.user.id);
    if (!first.error) return first;
    if (!Object.prototype.hasOwnProperty.call(row, 'aquarium_id')) return first;
    if (!/aquarium_id|schema cache|column/i.test(first.error.message || '')) return first;
    const fallback = { ...row };
    const aqId = fallback.aquarium_id;
    delete fallback.aquarium_id;
    fallback.notes = `${INVENTORY_AQ_PREFIX}${aqId}| ${fallback.notes || ''}`.trim();
    return supabase.from('inventory_items').update(fallback).eq('id', id).eq('user_id', state.user.id);
  }

  window.inventario = async function (scope = 'general') {
    if (!state.user) return login();
    const t = token();
    const aq = currentAquarium();
    const isAq = scope === 'aquarium' && aq;
    const active = isAq ? 'acuarios' : 'inventario';
    const head = isAq ? aqHeader('inventario') : '';
    const title = isAq ? `Inventario de ${aq.name || 'acuario'}` : 'Inventario general';
    render(head + `<section class="panel"><div class="panel-head"><h2>${esc(title)}</h2><button class="primary" onclick="formInventario('${isAq ? 'aquarium' : 'general'}')">Añadir</button></div>${msg('Cargando inventario...')}</section>`, active);
    try {
      const { data, error } = await supabase.from('inventory_items').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(120);
      if (error) throw error;
      if (!isCurrent(t)) return;
      const rows = data || [];
      const filtered = isAq
        ? rows.filter(item => inventoryAqId(item) === String(aq.id))
        : rows.filter(item => !inventoryAqId(item));
      const html = filtered.map(item => inventoryItemHtml(item, isAq ? aq.name : '')).join('');
      const tabs = `<div class="inventory-tabs">
        <button class="${isAq ? 'active' : ''}" ${aq ? `onclick="openAqSection('inventario')"` : 'disabled'}>Este acuario</button>
        <button class="${!isAq ? 'active' : ''}" onclick="inventario('general')">General compartido</button>
      </div>`;
      const hint = isAq
        ? '<p class="small inventory-hint">Aqui van habitantes, plantas, invertebrados, corales y equipo que pertenecen solo a este acuario.</p>'
        : '<p class="small inventory-hint">Aqui van medicamentos, tests, comida y material que pueden servir para varios acuarios.</p>';
      render(head + `<section class="panel"><div class="panel-head"><h2>${esc(title)}</h2><button class="primary" onclick="formInventario('${isAq ? 'aquarium' : 'general'}')">Añadir</button></div>${tabs}${hint}${html || msg('Sin inventario todavía.')}</section>`, active);
    } catch (e) {
      if (isCurrent(t)) render(head + `<section class="panel">${msg(e.message, 'error')}</section>`, active);
    }
  };

  window.formInventario = function (scope = 'general') {
    const aq = currentAquarium();
    const isAq = scope === 'aquarium' && aq;
    const active = isAq ? 'acuarios' : 'inventario';
    const head = isAq ? aqHeader('inventario') : '';
    const categories = isAq ? aquariumInventoryCategories : generalInventoryCategories;
    const categoryOptions = categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    render(head + `<section class="panel"><button onclick="${isAq ? "openAqSection('inventario')" : "inventario('general')"}">← Volver</button><h2>${isAq ? 'Nuevo item del acuario' : 'Nuevo item general'}</h2>
      <label>Nombre</label><input id="invName">
      <label>Categoría</label><select id="invCategory">${categoryOptions}</select>
      <label>Cantidad</label><input id="invQty" type="number" step="0.1" value="1">
      <label>Unidad</label><input id="invUnit" value="unidad" placeholder="unidad, ml, g, bote...">
      <label>Caducidad</label><input id="invExpiry" type="date">
      <label>Portada</label><input id="invCover" placeholder="URL de imagen o portada">
      <input id="invScope" type="hidden" value="${isAq ? 'aquarium' : 'general'}">
      <label>Notas</label><textarea id="invNotes"></textarea>
      <button class="primary" onclick="saveInventario()">Guardar</button><div id="x"></div></section>`, active);
  };

  window.saveInventario = async function () {
    try {
      if (!val('invName')) throw new Error('Pon un nombre.');
      const aq = currentAquarium();
      const scope = val('invScope') || 'general';
      const row = {
        user_id: state.user.id,
        name: val('invName'),
        category: val('invCategory') || (scope === 'aquarium' ? 'Equipo' : 'Material general'),
        quantity: num('invQty') ?? 1,
        unit: val('invUnit') || 'unidad',
        notes: inventoryNotesWithMeta(val('invNotes'), { expires_at: val('invExpiry'), cover_url: val('invCover') })
      };
      if (scope === 'aquarium') {
        if (!aq) throw new Error('Abre un acuario para guardar inventario del acuario.');
        row.aquarium_id = aq.id;
      }
      const { error } = await insertInventoryRow(row);
      if (error) throw error;
      scope === 'aquarium' ? inventario('aquarium') : inventario('general');
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  window.verInventario = async function (id) {
    const t = token();
    render(`<section class="panel">${msg('Abriendo ficha de inventario...')}</section>`, 'inventario');
    try {
      const { data, error } = await supabase.from('inventory_items').select('*').eq('id', id).eq('user_id', state.user.id).single();
      if (error) throw error;
      if (!isCurrent(t)) return;
      const aqId = inventoryAqId(data);
      const isAq = !!aqId;
      const aq = isAq && currentAquarium()?.id === aqId ? currentAquarium() : null;
      const active = isAq && aq ? 'acuarios' : 'inventario';
      const head = isAq && aq ? aqHeader('inventario') : '';
      const meta = inventoryMeta(data);
      const cleanNotes = inventoryNoteText(data);
      const expiry = meta.expires_at || data.expires_at || data.expiry_date || '';
      const status = inventoryExpiryStatus(data);
      const cover = inventoryCover(data);
      render(head + `<section class="panel inventory-detail">
        <button onclick="${isAq && aq ? "openAqSection('inventario')" : "inventario('general')"}">← Volver</button>
        ${cover ? `<img class="inventory-detail-cover" src="${esc(cover)}" alt="${esc(data.name || 'Inventario')}">` : '<div class="inventory-detail-cover empty">▤</div>'}
        <div class="inventory-detail-head">
          <div><small>${esc(data.category || 'Inventario')}</small><h2>${esc(data.name || 'Item')}</h2></div>
          ${status ? `<span class="${esc(status)}">${esc(status)}</span>` : ''}
        </div>
        <div class="inventory-fields">
          <div><small>Cantidad</small><b>${esc(data.quantity ?? '-')} ${esc(data.unit || '')}</b></div>
          <div><small>Ámbito</small><b>${esc(isAq ? (aq?.name || 'Acuario') : 'General compartido')}</b></div>
          <div><small>Caducidad</small><b>${esc(expiry || 'Sin fecha')}</b></div>
        </div>
        ${cleanNotes ? `<section class="library-detail-section"><h3>Notas</h3><p>${esc(cleanNotes)}</p></section>` : ''}
        <button class="primary" onclick="editarInventario('${esc(data.id)}')">Editar ficha</button>
      </section>`, active);
    } catch (e) {
      render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'inventario');
    }
  };

  window.editarInventario = async function (id) {
    const t = token();
    render(`<section class="panel">${msg('Cargando editor...')}</section>`, 'inventario');
    try {
      const { data, error } = await supabase.from('inventory_items').select('*').eq('id', id).eq('user_id', state.user.id).single();
      if (error) throw error;
      if (!isCurrent(t)) return;
      const aqId = inventoryAqId(data);
      const isAq = !!aqId;
      const aq = isAq && currentAquarium()?.id === aqId ? currentAquarium() : null;
      const active = isAq && aq ? 'acuarios' : 'inventario';
      const head = isAq && aq ? aqHeader('inventario') : '';
      const categories = isAq ? aquariumInventoryCategories : generalInventoryCategories;
      const categoryOptions = categories.map(c => `<option value="${esc(c)}" ${data.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
      const meta = inventoryMeta(data);
      render(head + `<section class="panel">
        <button onclick="verInventario('${esc(data.id)}')">← Volver</button>
        <h2>Editar ficha</h2>
        <label>Nombre</label><input id="invEditName" value="${esc(data.name || '')}">
        <label>Categoría</label><select id="invEditCategory">${categoryOptions}</select>
        <label>Cantidad</label><input id="invEditQty" type="number" step="0.1" value="${esc(data.quantity ?? 1)}">
        <label>Unidad</label><input id="invEditUnit" value="${esc(data.unit || 'unidad')}">
        <label>Caducidad</label><input id="invEditExpiry" type="date" value="${esc(meta.expires_at || data.expires_at || data.expiry_date || '')}">
        <label>Portada</label><input id="invEditCover" value="${esc(inventoryCover(data))}" placeholder="URL de imagen o portada">
        <label>Notas</label><textarea id="invEditNotes">${esc(inventoryNoteText(data))}</textarea>
        <button class="primary" onclick="guardarInventarioEditado('${esc(data.id)}','${isAq ? 'aquarium' : 'general'}')">Guardar cambios</button>
        <div id="x"></div>
      </section>`, active);
    } catch (e) {
      render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'inventario');
    }
  };

  window.guardarInventarioEditado = async function (id, scope) {
    try {
      const aq = currentAquarium();
      const row = {
        name: val('invEditName'),
        category: val('invEditCategory') || (scope === 'aquarium' ? 'Equipo' : 'Material general'),
        quantity: num('invEditQty') ?? 1,
        unit: val('invEditUnit') || 'unidad',
        notes: inventoryNotesWithMeta(val('invEditNotes'), { expires_at: val('invEditExpiry'), cover_url: val('invEditCover') })
      };
      if (scope === 'aquarium' && aq) row.aquarium_id = aq.id;
      const { error } = await updateInventoryRow(id, row);
      if (error) throw error;
      verInventario(id);
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  function login() {
    render(`<section class="auth-card"><h2>Entrar</h2>
      <label>Email</label><input id="email" type="email" autocomplete="email">
      <label>Contraseña</label><input id="password" type="password" autocomplete="current-password">
      <button class="primary" onclick="iniciar()">Entrar</button>
      <button onclick="crear()">Crear cuenta</button>
      <div id="x"></div>
    </section>`, 'inicio');
  }
  window.login = login;

  window.iniciar = async function () {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: val('email'), password: val('password') });
      if (error) throw error;
      boot();
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  window.crear = async function () {
    try {
      const { error } = await supabase.auth.signUp({ email: val('email'), password: val('password') });
      if (error) throw error;
      byId('x').innerHTML = msg('Cuenta creada. Si Supabase pide confirmación, revisa el email.', 'success');
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };

  async function boot() {
    try {
      const session = await supabase.auth.getSession();
      state.user = session.data.session?.user || null;
      window.u = state.user;
      byId('logoutBtn')?.classList.toggle('hidden', !state.user);
      if (byId('logoutBtn')) {
        byId('logoutBtn').onclick = async function () {
          await supabase.auth.signOut();
          state.user = null;
          state.aquarium = null;
          window.q = null;
          login();
        };
      }
      state.user ? dashboard() : login();
    } catch (e) {
      render(msg(e.message, 'error'), 'inicio');
    }
  }

  byId('version').textContent = config.APP_VERSION || 'AcuarioNexo';
  byId('refreshAppBtn')?.addEventListener('click', function () {
    if (window.AcuarioNexoUpdate?.forceReload) window.AcuarioNexoUpdate.forceReload();
    else location.reload();
  });
  supabase.auth.onAuthStateChange(function (_event, session) {
    state.user = session?.user || null;
    window.u = state.user;
    byId('logoutBtn')?.classList.toggle('hidden', !state.user);
  });

  boot();
})();
