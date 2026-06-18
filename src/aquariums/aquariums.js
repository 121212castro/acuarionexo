/* AcuarioNexo · aquariums */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, currentAquarium, render, aqHeader, aquariumIcon, photoUrl } = window.ANX;

async function loadAquariums() {
  const { data, error } = await supabase.from('aquariums').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false });
  if (error) throw error;
  const list = data || [];
  try {
    const ids = list.map(function (aq) { return aq.id; }).filter(Boolean);
    const photos = ids.length ? await supabase.from('aquarium_photos')
      .select('aquarium_id,image_url,photo_url,created_at')
      .eq('user_id', state.user.id)
      .in('aquarium_id', ids)
      .order('created_at', { ascending: false })
      .limit(120) : { data: [] };
    if (!photos.error) {
      const coverByAq = {};
      (photos.data || []).forEach(function (p) {
        const url = photoUrl(p);
        if (url && p.aquarium_id && !coverByAq[p.aquarium_id]) coverByAq[p.aquarium_id] = url;
      });
      list.forEach(function (aq) { aq.__cover_url = aq.cover_photo_url || aq.cover_url || aq.photo_url || aq.image_url || coverByAq[aq.id] || ''; });
    }
  } catch (_) {}
  state.aquariums = list;
  return list;
}

function aquariumCard(aq) {
  const photo = aq.__cover_url || aq.cover_photo_url || aq.cover_url || aq.photo_url || aq.image_url || '';
  const liters = aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters ?? '-';
  return `<article class="tank-card" onclick="openA('${esc(aq.id)}')">
    <div class="tank-art">${photo ? `<img src="${esc(photo)}" alt="${esc(aq.name)}" loading="lazy">` : aquariumIcon(aq)}</div>
    <div class="tank-info"><h3>${esc(aq.name || 'Acuario')}</h3><p>${esc(aq.aquarium_type || 'Acuario')}</p><span>${esc(liters)} L</span></div>
    <b>›</b>
  </article>`;
}

function dashboardStat(label, value) {
  return `<article class="summary-card"><div><small>${esc(label)}</small><h2>${esc(value)}</h2></div></article>`;
}

function emptyLine(text) {
  return `<p class="small">${esc(text || 'Sin datos todavía')}</p>`;
}

async function countRows(table, buildQuery) {
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true });
    if (buildQuery) query = buildQuery(query);
    const { count, error } = await query;
    if (error) throw error;
    return Number(count) || 0;
  } catch (_) {
    return 0;
  }
}

async function loadDashboardStats(list) {
  const aquariumIds = list.map(aq => aq.id).filter(Boolean);
  const [animals, userFichas, creatorFichas, photos, measurements, tasks] = await Promise.all([
    countRows('animals', q => q.eq('user_id', state.user.id)),
    countRows('library_entries', q => q.eq('user_id', state.user.id)),
    countRows('fichas_creator'),
    aquariumIds.length ? countRows('aquarium_photos', q => q.eq('user_id', state.user.id).in('aquarium_id', aquariumIds)) : 0,
    aquariumIds.length ? countRows('aquarium_measurements', q => q.in('aquarium_id', aquariumIds)) : 0,
    countRows('tasks', q => q.eq('user_id', state.user.id).neq('status', 'done'))
  ]);
  return { animals, fichas: userFichas + creatorFichas, photos, measurements, tasks };
}

window.dashboard = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Cargando resumen...</p></div></section>`, 'inicio');
  try {
    const list = await loadAquariums();
    const stats = await loadDashboardStats(list);
    if (!isCurrent(t)) return;
    const liters = list.reduce(function (total, aq) { return total + (Number(aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters) || 0); }, 0);
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Resumen general de la app</p></div></section>
      <section class="panel"><div class="panel-head"><h2>Estado general</h2></div>
        <div class="quick-actions">
          ${dashboardStat('Acuarios activos', String(list.length))}
          ${dashboardStat('Litros gestionados', liters ? `${liters.toFixed(1)} L` : 'Sin datos')}
          ${dashboardStat('Animales registrados', String(stats.animals))}
          ${dashboardStat('Fichas visibles', String(stats.fichas))}
        </div>
      </section>
      <section class="panel"><div class="panel-head"><h2>Avisos importantes</h2></div>${emptyLine(stats.tasks ? `${stats.tasks} avisos pendientes.` : 'Sin avisos pendientes.')}</section>
      <section class="panel"><div class="panel-head"><h2>Actividad reciente</h2></div>
        ${emptyLine(`${stats.measurements} mediciones registradas.`)}
        ${emptyLine(`${stats.animals} animales registrados.`)}
        ${emptyLine(`${stats.photos} fotos guardadas.`)}
        ${emptyLine(`${stats.tasks} tareas o avisos pendientes.`)}
      </section>`, 'inicio');
  } catch (e) {
    if (isCurrent(t)) render(msg(e.message, 'error'), 'inicio');
  }
};

window.acuariosHome = function () {
  if (!state.user) return login();
  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Acuarios</h2><p>Gestiona tus sistemas desde un apartado propio.</p></div></section>
    <section class="panel"><div class="panel-head"><h2>Acuarios</h2></div>
      <div class="quick-actions">
        <button onclick="listaAcuarios()"><span>▣</span>Mis acuarios</button>
        <button onclick="formA()"><span>＋</span>Nuevo acuario</button>
      </div>
    </section>`, 'acuarios');
};

window.listaAcuarios = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>Cargando sistemas...</p></div></section>`, 'acuarios');
  try {
    const list = await loadAquariums();
    if (!isCurrent(t)) return;
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>${list.length} sistemas activos</p></div></section>
      <section class="panel"><div class="panel-head"><h2>Lista de acuarios</h2><button onclick="acuariosHome()">Volver</button></div>
      <div class="tank-list">${list.map(aquariumCard).join('') || '<p class="small">Sin acuarios todavía.</p>'}</div></section>`, 'acuarios');
  } catch (e) {
    if (isCurrent(t)) render(msg(e.message, 'error'), 'acuarios');
  }
};

function safeVal(aq, key) { return esc(aq[key] ?? ''); }
function checkbox(aq, key) { return aq[key] ? 'checked' : ''; }
function lDisplay(a, b, h) { return ((Number(a) || 0) * (Number(b) || 0) * (Number(h) || 0) / 1000) || 0; }
function displacement(rock, sand) { return ((Number(rock) || 0) * 0.65) + ((Number(sand) || 0) * 0.40); }
function calcVolumesFromInputs() {
  const gross = lDisplay(val('tank_length_cm'), val('tank_width_cm'), val('tank_height_cm'));
  const displayWater = lDisplay(val('tank_length_cm'), val('tank_width_cm'), val('display_water_height_cm'));
  const displaced = displacement(val('rock_kg'), val('sand_kg'));
  const displayNet = Math.max(0, displayWater - displaced);
  const sumpGross = lDisplay(val('sump_length_cm'), val('sump_width_cm'), val('sump_height_cm'));
  const sumpNet = byId('has_sump')?.checked ? lDisplay(val('sump_length_cm'), val('sump_width_cm'), val('sump_water_height_cm')) : 0;
  const refugium = byId('has_refugium')?.checked ? (num('refugium_liters') || 0) : 0;
  const ato = byId('has_ato_reservoir')?.checked ? (num('ato_reservoir_liters') || 0) : 0;
  const systemNet = displayNet + sumpNet;
  return { gross, displayWater, displaced, displayNet, sumpGross, sumpNet, refugium, ato, systemNet };
}
window.calcAqVolumes = function () {
  const c = calcVolumesFromInputs();
  const set = (id, value) => { if (byId(id)) byId(id).textContent = `${value.toFixed(1)} L`; };
  set('calcGross', c.gross);
  set('calcDisplayWater', c.displayWater);
  set('calcDisplaced', c.displaced);
  set('calcDisplayNet', c.displayNet);
  set('calcSumpGross', c.sumpGross);
  set('calcSumpNet', c.sumpNet);
  set('calcRefugium', c.refugium);
  set('calcAto', c.ato);
  set('calcSystemNet', c.systemNet);
};

window.pickAqCover = function (mode) {
  const input = byId('aqCoverFile');
  if (!input) return;
  input.setAttribute('capture', mode === 'camera' ? 'environment' : '');
  input.click();
};
window.previewAqCover = function () {
  const input = byId('aqCoverFile');
  const img = byId('aqCoverPreview');
  const file = input?.files?.[0];
  if (!file || !img) return;
  img.src = URL.createObjectURL(file);
  img.classList.remove('hidden');
};
window.clearAqCover = function () {
  if (byId('aqCoverFile')) byId('aqCoverFile').value = '';
  if (byId('aqCover')) byId('aqCover').value = '';
  if (byId('aqCoverPreview')) byId('aqCoverPreview').classList.add('hidden');
};

window.formA = function (aq = {}) {
  const editing = !!aq.id;
  const cover = aq.cover_photo_url || aq.__cover_url || '';
  render(`<section class="panel">
    <button onclick="${editing ? 'panel()' : 'acuariosHome()'}">← Volver</button>
    <h2>${editing ? 'Editar ficha del acuario' : 'Nuevo acuario'}</h2>

    <h3>Identificación</h3>
    <label>Nombre</label><input id="aqName" value="${esc(aq.name || '')}">
    <label>Tipo</label><select id="aqType">
      <option value="reef" ${aq.aquarium_type === 'reef' ? 'selected' : ''}>Reef</option>
      <option value="marine" ${aq.aquarium_type === 'marine' ? 'selected' : ''}>Marino</option>
      <option value="freshwater" ${aq.aquarium_type === 'freshwater' ? 'selected' : ''}>Dulce</option>
      <option value="planted" ${aq.aquarium_type === 'planted' ? 'selected' : ''}>Plantado / Gambario</option>
      <option value="hospital" ${aq.aquarium_type === 'hospital' ? 'selected' : ''}>Hospital</option>
      <option value="quarantine" ${aq.aquarium_type === 'quarantine' ? 'selected' : ''}>Cuarentena</option>
      <option value="other" ${aq.aquarium_type === 'other' ? 'selected' : ''}>Otro</option>
    </select>
    <label>Estado</label><select id="aqStatus">
      <option value="active" ${aq.status === 'active' ? 'selected' : ''}>Activo</option>
      <option value="paused" ${aq.status === 'paused' ? 'selected' : ''}>Pausado</option>
      <option value="archived" ${aq.status === 'archived' ? 'selected' : ''}>Archivado / desmontado</option>
    </select>
    <label>Ubicación</label><input id="aqLocation" value="${safeVal(aq, 'location')}" placeholder="Salón, tienda, cliente...">

    <h3>Foto de portada</h3>
    <input id="aqCover" type="hidden" value="${esc(cover)}">
    <input id="aqCoverFile" class="hidden" type="file" accept="image/*" onchange="previewAqCover()">
    <img id="aqCoverPreview" class="aq-cover-photo ${cover ? '' : 'hidden'}" src="${esc(cover)}" alt="Portada">
    <div class="quick-actions">
      <button type="button" onclick="pickAqCover('camera')"><span>📷</span>Tomar foto</button>
      <button type="button" onclick="pickAqCover('gallery')"><span>🖼</span>Galería</button>
      <button type="button" onclick="clearAqCover()"><span>🗑</span>Quitar</button>
    </div>

    <h3>Urna principal</h3>
    <div class="form-grid">
      <div><label>Largo (cm)</label><input id="tank_length_cm" type="number" step="0.1" value="${safeVal(aq, 'tank_length_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Ancho (cm)</label><input id="tank_width_cm" type="number" step="0.1" value="${safeVal(aq, 'tank_width_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Alto total (cm)</label><input id="tank_height_cm" type="number" step="0.1" value="${safeVal(aq, 'tank_height_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Altura real de agua (cm)</label><input id="display_water_height_cm" type="number" step="0.1" value="${safeVal(aq, 'display_water_height_cm')}" oninput="calcAqVolumes()"></div>
    </div>

    <h3>Roca y sustrato</h3>
    <div class="form-grid">
      <div><label>Kg roca / decoración</label><input id="rock_kg" type="number" step="0.1" value="${safeVal(aq, 'rock_kg')}" oninput="calcAqVolumes()"></div>
      <div><label>Kg arena / sustrato</label><input id="sand_kg" type="number" step="0.1" value="${safeVal(aq, 'sand_kg')}" oninput="calcAqVolumes()"></div>
    </div>

    <h3>Sump y auxiliares</h3>
    <label><input id="has_sump" type="checkbox" ${checkbox(aq, 'has_sump')} onchange="calcAqVolumes()"> Tiene sump</label>
    <div class="form-grid">
      <div><label>Largo sump (cm)</label><input id="sump_length_cm" type="number" step="0.1" value="${safeVal(aq, 'sump_length_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Ancho sump (cm)</label><input id="sump_width_cm" type="number" step="0.1" value="${safeVal(aq, 'sump_width_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Alto sump (cm)</label><input id="sump_height_cm" type="number" step="0.1" value="${safeVal(aq, 'sump_height_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Altura agua sump (cm)</label><input id="sump_water_height_cm" type="number" step="0.1" value="${safeVal(aq, 'sump_water_height_cm')}" oninput="calcAqVolumes()"></div>
    </div>
    <label><input id="has_refugium" type="checkbox" ${checkbox(aq, 'has_refugium')} onchange="calcAqVolumes()"> Tiene refugio</label>
    <label>Litros refugio</label><input id="refugium_liters" type="number" step="0.1" value="${safeVal(aq, 'refugium_liters')}" oninput="calcAqVolumes()">
    <label><input id="has_ato_reservoir" type="checkbox" ${checkbox(aq, 'has_ato_reservoir')} onchange="calcAqVolumes()"> Tiene cámara / depósito de relleno ATO</label>
    <label>Litros cámara / depósito ATO</label><input id="ato_reservoir_liters" type="number" step="0.1" value="${safeVal(aq, 'ato_reservoir_liters')}" oninput="calcAqVolumes()">

    <h3>Volumen calculado</h3>
    <div class="item">
      <p>Litros brutos urna: <b id="calcGross">0.0 L</b></p>
      <p>Litros con altura real: <b id="calcDisplayWater">0.0 L</b></p>
      <p>Desplazamiento estimado: <b id="calcDisplaced">0.0 L</b></p>
      <p>Litros útiles urna: <b id="calcDisplayNet">0.0 L</b></p>
      <p>Litros brutos sump: <b id="calcSumpGross">0.0 L</b></p>
      <p>Litros útiles sump: <b id="calcSumpNet">0.0 L</b></p>
      <p>Litros refugio: <b id="calcRefugium">0.0 L</b></p>
      <p>Litros ATO: <b id="calcAto">0.0 L</b></p>
      <p>Litros útiles sistema: <b id="calcSystemNet">0.0 L</b></p>
    </div>
    <label>Litros reales confirmados manualmente</label><input id="manual_real_liters" type="number" step="0.1" value="${safeVal(aq, 'manual_real_liters')}">

    <h3>Fechas</h3>
    <div class="form-grid">
      <div><label>Montaje</label><input id="mounted_at" type="date" value="${safeVal(aq, 'mounted_at')}"></div>
      <div><label>Llenado</label><input id="filled_at" type="date" value="${safeVal(aq, 'filled_at')}"></div>
      <div><label>Inicio ciclado</label><input id="cycling_start_date" type="date" value="${safeVal(aq, 'cycling_start_date') || safeVal(aq, 'start_date')}"></div>
      <div><label>Fin ciclado</label><input id="cycling_end_date" type="date" value="${safeVal(aq, 'cycling_end_date')}"></div>
    </div>

    <h3>Observaciones</h3>
    <label>Descripción</label><textarea id="aqDescription">${esc(aq.description || '')}</textarea>
    <label>Objetivos</label><textarea id="aqGoals">${esc(aq.goals || '')}</textarea>
    <button class="primary" onclick="saveA('${esc(aq.id || '')}')">Guardar ficha</button>
    <div id="x"></div>
  </section>`, 'acuarios');
  setTimeout(window.calcAqVolumes, 0);
};

window.saveA = async function (id = '') {
  try {
    if (!val('aqName')) throw new Error('Pon un nombre al acuario.');
    const c = calcVolumesFromInputs();
    let cover = val('aqCover') || null;
    const file = byId('aqCoverFile')?.files?.[0];
    if (file) {
      if (!id) throw new Error('Guarda primero el acuario y después cambia la portada.');
      cover = await window.ANX.uploadAquariumImage(file, 'aquarium-covers');
    }
    const row = {
      user_id: state.user.id,
      name: val('aqName'),
      aquarium_type: val('aqType') || 'reef',
      status: val('aqStatus') || 'active',
      location: val('aqLocation') || null,
      cover_photo_url: cover,
      cover_photo_updated_at: cover ? new Date().toISOString() : null,
      tank_length_cm: num('tank_length_cm'),
      tank_width_cm: num('tank_width_cm'),
      tank_height_cm: num('tank_height_cm'),
      display_water_height_cm: num('display_water_height_cm'),
      rock_kg: num('rock_kg'),
      sand_kg: num('sand_kg'),
      has_sump: !!byId('has_sump')?.checked,
      sump_length_cm: num('sump_length_cm'),
      sump_width_cm: num('sump_width_cm'),
      sump_height_cm: num('sump_height_cm'),
      sump_water_height_cm: num('sump_water_height_cm'),
      has_refugium: !!byId('has_refugium')?.checked,
      refugium_liters: num('refugium_liters'),
      has_ato_reservoir: !!byId('has_ato_reservoir')?.checked,
      ato_reservoir_liters: num('ato_reservoir_liters'),
      gross_liters: Number(c.gross.toFixed(1)),
      display_net_liters: Number(c.displayNet.toFixed(1)),
      sump_net_liters: Number(c.sumpNet.toFixed(1)),
      system_net_liters: Number(c.systemNet.toFixed(1)),
      manual_real_liters: num('manual_real_liters'),
      real_liters: num('manual_real_liters') ?? Number(c.systemNet.toFixed(1)),
      liters: num('manual_real_liters') ?? Number(c.systemNet.toFixed(1)),
      mounted_at: val('mounted_at') || null,
      filled_at: val('filled_at') || null,
      cycling_start_date: val('cycling_start_date') || null,
      start_date: val('cycling_start_date') || null,
      cycling_end_date: val('cycling_end_date') || null,
      description: val('aqDescription') || null,
      goals: val('aqGoals') || null
    };
    const result = id ? await supabase.from('aquariums').update(row).eq('id', id) : await supabase.from('aquariums').insert(row);
    if (result.error) throw result.error;
    if (id && currentAquarium()?.id === id) state.aquarium = { ...state.aquarium, ...row, id, __cover_url: cover || state.aquarium.__cover_url };
    id && currentAquarium()?.id === id ? panelAcuario() : listaAcuarios();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.editA = async function () {
  const aq = currentAquarium();
  if (!aq) return acuariosHome();
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
    state.aquarium = { ...cached, ...data, __cover_url: data.cover_photo_url || data.cover_url || data.photo_url || data.image_url || cached.__cover_url || '' };
    window.q = state.aquarium;
    panelAcuario();
  } catch (e) {
    if (isCurrent(t)) render(msg(e.message, 'error'), 'acuarios');
  }
};

function panelAcuario() {
  const aq = currentAquarium();
  if (!aq) return acuariosHome();
  state.section = 'resumen';
  const photo = aq.__cover_url || aq.cover_photo_url || aq.cover_url || aq.photo_url || aq.image_url || '';
  const liters = aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters ?? '-';
  render(aqHeader('resumen') + `<section class="panel aq-cover">
    ${photo ? `<img class="aq-cover-photo" src="${esc(photo)}" alt="${esc(aq.name)}">` : ''}
    <div class="panel-head"><h2>Resumen</h2><button onclick="editA()">Editar</button></div>
    <h3>${esc(aq.name || 'Acuario')}</h3>
    <p>${esc(liters)} L útiles · ${esc(aq.location || 'Sin ubicación')}</p>
    <p>${esc(aq.description || 'Sistema sin descripción.')}</p>
  </section>`, 'acuarios');
}
window.panel = panelAcuario;

window.openQuickAqSection = function (section) {
  const aq = currentAquarium() || (state.aquariums || [])[0];
  if (!aq) return acuariosHome();
  if (!currentAquarium() || currentAquarium().id !== aq.id) return openA(aq.id).then(function () { setTimeout(function () { openAqSection(section); }, 0); });
  return openAqSection(section);
};

window.openAqSection = function (section) {
  if (!currentAquarium()) return acuariosHome();
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

  window.ANX.loadAquariums = loadAquariums;
  window.ANX.panelAcuario = panelAcuario;
})();
