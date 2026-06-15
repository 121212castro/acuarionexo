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
      ${tabButton('fotos', 'Fotos')}
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
        <button onclick="openAqSection('fotos')"><span>📷</span>Fotos</button>
        <button onclick="openAqSection('parametros')"><span>🧪</span>Parámetros</button>
        <button onclick="openAqSection('tareas')"><span>♢</span>Tareas</button>
        <button onclick="inventario()"><span>▤</span>Inventario</button>
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
    if (section === 'fotos') return fotos();
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

  const librarySections = [
    ['Resumen rápido', ['resumen_rapido', 'resumenRapido', 'resumen', 'summary', 'description', 'descripcion', 'descripcion_detallada']],
    ['Identificación', ['identificacion', 'identification', 'taxonomia', 'taxonomy']],
    ['Hábitat natural', ['habitat_natural', 'habitatNatural', 'habitat', 'natural_habitat', 'origen', 'distribucion', 'distribution']],
    ['Acuario recomendado', ['acuario_recomendado', 'acuarioRecomendado', 'aquarium_recommended', 'tank', 'acuario', 'tamano_acuario', 'litros_minimos', 'min_tank_liters', 'ubicacion']],
    ['Parámetros', ['parametros', 'parameters', 'parametros_agua', 'water_parameters', 'water', 'agua']],
    ['Comportamiento', ['comportamiento', 'behavior', 'temperamento', 'temperament']],
    ['Alimentación', ['alimentacion', 'feeding', 'diet', 'dieta']],
    ['Compatibilidad', ['compatibilidad', 'compatibility']],
    ['Reef Safe', ['reef_safe', 'reefSafe', 'reef']],
    ['Salud y enfermedades', ['salud_enfermedades', 'saludYEnfermedades', 'salud', 'enfermedades', 'health']],
    ['Antes de comprar', ['antes_comprar', 'antesDeComprar', 'before_buying', 'compra']],
    ['Errores frecuentes', ['errores_frecuentes', 'erroresFrecuentes', 'common_mistakes', 'errores']],
    ['Curiosidades', ['curiosidades', 'curiosities']],
    ['Fuentes', ['fuentes', 'sources', 'references_text', 'referencias']]
  ];

  function normText(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function hasAny(text, words) {
    return words.some(word => text.includes(word));
  }

  function normalizeFicha(row) {
    const raw = row || {};
    const nested = raw.ficha || raw.ficha_normalizada || raw.fichaNormalizada || raw.data || {};
    return {
      id: raw.id || raw.uuid || raw.slug || '',
      nombre: raw.title || raw.nombre || raw.nombre_comun || raw.common_name || nested.title || nested.nombre || raw.scientific_name || 'Ficha',
      cientifico: raw.scientific_name || raw.nombre_cientifico || raw.scientific || nested.scientific_name || nested.nombre_cientifico || '',
      categoria: nested.category || raw.category || raw.creator_category || raw.tipo || raw.tipo_ficha || raw.grupo || raw.seccion || 'general',
      foto: raw.photo_url || raw.image_url || raw.cover_url || raw.foto_url || raw.foto || raw.imagen || raw.url_foto || nested.photo_url || nested.image_url || nested.foto || '',
      descripcion: raw.resumen_rapido || raw.resumen || raw.description || raw.descripcion || raw.descripcion_detallada || raw.notes || nested.resumen || nested.description || nested.descripcion || '',
      raw
    };
  }

  function fichaModulo(f) {
    const raw = f?.raw || {};
    const category = normText(raw?.ficha?.category || raw?.ficha_normalizada?.category || raw?.creator_category || raw?.tipo_ficha || raw?.tipo || raw?.category || f?.categoria || '');
    const name = normText([f?.nombre, f?.cientifico].filter(Boolean).join(' '));
    const all = normText([f?.nombre, f?.cientifico, f?.descripcion, category].filter(Boolean).join(' '));
    if (hasAny(category, ['pez_marino', 'marine_fish', 'fish_marine', 'marino'])) return 'pez_marino';
    if (hasAny(category, ['pez_dulce', 'freshwater_fish', 'fish_freshwater', 'dulce'])) return 'pez_dulce';
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
      return fieldValue(value.texto || value.text || value.contenido || value.content || value.valor || value.value || value.descripcion || value.description || '');
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
    const pools = [raw, raw.apartados, raw.bloques, raw.modulos, raw.modules, raw.sections, raw.secciones, raw.data, raw.ficha, raw.ficha_normalizada, raw.fichaNormalizada, raw.ficha_tecnica, raw.fichaTecnica, raw.ai_result, raw.ai, raw.generated, raw.internet].filter(Boolean);
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
    if (title === 'Identificación') {
      return [`Nombre comun: ${f.nombre}`, f.cientifico ? `Nombre cientifico: ${f.cientifico}` : '', `Apartado: ${fichaModuleLabel(f)}`, raw.care_level ? `Dificultad: ${raw.care_level}` : ''].filter(Boolean).join('\n');
    }
    if (title === 'Acuario recomendado') return [raw.min_tank_liters ? `Litros minimos: ${raw.min_tank_liters} L` : '', raw.aquarium_zone ? `Zona: ${raw.aquarium_zone}` : ''].filter(Boolean).join('\n');
    if (title === 'Parámetros') return fieldValue(raw.parameters).trim();
    if (title === 'Comportamiento') return raw.temperament || '';
    if (title === 'Alimentación') return raw.feeding || raw.diet || '';
    if (title === 'Compatibilidad') return raw.compatibility || '';
    if (title === 'Reef Safe') return raw.reef_safe != null ? String(raw.reef_safe) : '';
    if (title === 'Fuentes') return [raw.references_text, raw.source_url ? `Fuente interna: ${raw.source_url}` : ''].filter(Boolean).join('\n');
    return '';
  }

  function fichaSectionsHtml(f) {
    return librarySections.map(function ([title, keys], index) {
      const text = fichaField(f, keys) || derivedSectionText(f, title);
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
    const resumen = fichaResumen(f);
    return `<article class="library-card library-cover-card" onclick="${inAq ? 'verFichaAcuario' : 'verFichaBiblioteca'}(${index})">
      ${f.foto ? `<img class="library-card-cover" src="${esc(f.foto)}" alt="${esc(f.nombre)}" loading="lazy">` : '<div class="library-card-cover library-no-photo">□</div>'}
      <div class="library-card-body">
        <small>${esc(fichaModuleLabel(f))}</small>
        <h3>${esc(f.nombre)}</h3>
        ${f.cientifico ? `<p class="scientific">${esc(f.cientifico)}</p>` : ''}
        ${resumen ? `<p>${esc(resumen).slice(0, 180)}${resumen.length > 180 ? '…' : ''}</p>` : ''}
      </div>
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
    return `<section class="panel library-detail">
      <button onclick="${backFn}">← Volver</button>
      ${f.foto ? `<img class="library-detail-photo" src="${esc(f.foto)}" alt="${esc(f.nombre)}">` : ''}
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
        photo_url: f.foto || null,
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
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `gallery/${state.user.id}/${aq.id}/${Date.now()}.${ext}`;
      let publicUrl = '';
      for (const bucket of ['aquarium-photos', 'photos', 'animal-photos']) {
        const upload = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
        if (!upload.error) {
          publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
          break;
        }
      }
      if (!publicUrl) throw new Error('No se pudo subir la foto. Revisa Storage.');
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
      render(`<section class="panel"><h2>Avisos</h2>${(data || []).map(tareaCard).join('') || msg('No hay avisos.')}</section>`, 'avisos');
    } catch (e) {
      if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'avisos');
    }
  };

  window.inventario = async function () {
    if (!state.user) return login();
    const t = token();
    render(`<section class="panel"><div class="panel-head"><h2>Inventario</h2><button class="primary" onclick="formInventario()">Añadir</button></div>${msg('Cargando inventario...')}</section>`, 'inventario');
    try {
      const { data, error } = await supabase.from('inventory_items').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(120);
      if (error) throw error;
      if (!isCurrent(t)) return;
      const html = (data || []).map(item => `<div class="item"><b>${esc(item.name || 'Item')}</b><p class="small">${esc(item.category || 'Inventario')} · ${esc(item.quantity ?? '-')} ${esc(item.unit || '')}</p>${item.notes ? `<p>${esc(item.notes)}</p>` : ''}</div>`).join('');
      render(`<section class="panel"><div class="panel-head"><h2>Inventario</h2><button class="primary" onclick="formInventario()">Añadir</button></div>${html || msg('Sin inventario todavía.')}</section>`, 'inventario');
    } catch (e) {
      if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'inventario');
    }
  };

  window.formInventario = function () {
    render(`<section class="panel"><button onclick="inventario()">← Volver</button><h2>Nuevo item</h2>
      <label>Nombre</label><input id="invName">
      <label>Categoría</label><input id="invCategory" placeholder="Equipo, test, comida...">
      <label>Cantidad</label><input id="invQty" type="number" step="0.1" value="1">
      <label>Notas</label><textarea id="invNotes"></textarea>
      <button class="primary" onclick="saveInventario()">Guardar</button><div id="x"></div></section>`, 'inventario');
  };

  window.saveInventario = async function () {
    try {
      if (!val('invName')) throw new Error('Pon un nombre.');
      const row = { user_id: state.user.id, name: val('invName'), category: val('invCategory') || 'General', quantity: num('invQty') ?? 1, unit: 'unidad', notes: val('invNotes') || null };
      const { error } = await supabase.from('inventory_items').insert(row);
      if (error) throw error;
      inventario();
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
