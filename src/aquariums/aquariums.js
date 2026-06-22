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

function loadDashboardStats(_list) {
  // Modo seguro 19/06/2026:
  // No lanzar conteos exactos en paralelo al entrar. En el plan Nano/Free
  // estos COUNT exactos pueden forzar escaneos y dejar Postgres en timeout.
  return {
    animals: 'No calculado',
    photos: 'No calculado',
    measurements: 'No calculado',
    tasks: null
  };
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
        </div>
      </section>
      <section class="panel"><div class="panel-head"><h2>Módulos</h2></div>
        <div class="quick-actions">
          <button onclick="microfauna()"><span>◌</span>Microfauna</button>
          <button onclick="biblioteca()"><span>□</span>Biblioteca</button>
          <button onclick="inventario()"><span>▤</span>Inventario</button>
        </div>
      </section>
      <section class="panel"><div class="panel-head"><h2>Avisos importantes</h2></div>${emptyLine('Métricas desactivadas temporalmente en modo seguro para no cargar Supabase.')}</section>
      <section class="panel"><div class="panel-head"><h2>Actividad reciente</h2></div>
        ${emptyLine('Actividad no calculada automáticamente mientras se investiga el consumo de base de datos.')}
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
  if (mode === 'camera') input.setAttribute('capture', 'environment');
  else input.removeAttribute('capture');
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
      <div><label>Alto urna (cm)</label><input id="tank_height_cm" type="number" step="0.1" value="${safeVal(aq, 'tank_height_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Alto real agua (cm)</label><input id="display_water_height_cm" type="number" step="0.1" value="${safeVal(aq, 'display_water_height_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Roca / decoración (kg)</label><input id="rock_kg" type="number" step="0.1" value="${safeVal(aq, 'rock_kg')}" oninput="calcAqVolumes()"></div>
      <div><label>Arena / sustrato (kg)</label><input id="sand_kg" type="number" step="0.1" value="${safeVal(aq, 'sand_kg')}" oninput="calcAqVolumes()"></div>
    </div>

    <h3>Sump</h3>
    <label class="check"><input id="has_sump" type="checkbox" ${checkbox(aq, 'has_sump')} onchange="calcAqVolumes()"> Tiene sump</label>
    <div class="form-grid">
      <div><label>Largo sump (cm)</label><input id="sump_length_cm" type="number" step="0.1" value="${safeVal(aq, 'sump_length_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Ancho sump (cm)</label><input id="sump_width_cm" type="number" step="0.1" value="${safeVal(aq, 'sump_width_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Alto sump (cm)</label><input id="sump_height_cm" type="number" step="0.1" value="${safeVal(aq, 'sump_height_cm')}" oninput="calcAqVolumes()"></div>
      <div><label>Alto real agua sump (cm)</label><input id="sump_water_height_cm" type="number" step="0.1" value="${safeVal(aq, 'sump_water_height_cm')}" oninput="calcAqVolumes()"></div>
    </div>

    <h3>Refugio y ATO</h3>
    <label class="check"><input id="has_refugium" type="checkbox" ${checkbox(aq, 'has_refugium')} onchange="calcAqVolumes()"> Tiene refugio</label>
    <label>Litros refugio</label><input id="refugium_liters" type="number" step="0.1" value="${safeVal(aq, 'refugium_liters')}" oninput="calcAqVolumes()">
    <label class="check"><input id="has_ato_reservoir" type="checkbox" ${checkbox(aq, 'has_ato_reservoir')} onchange="calcAqVolumes()"> Tiene depósito/cámara ATO</label>
    <label>Litros ATO</label><input id="ato_reservoir_liters" type="number" step="0.1" value="${safeVal(aq, 'ato_reservoir_liters')}" oninput="calcAqVolumes()">

    <h3>Volúmenes calculados</h3>
    <div class="calc-grid">
      <div><small>Bruto urna</small><b id="calcGross">0 L</b></div>
      <div><small>Agua urna</small><b id="calcDisplayWater">0 L</b></div>
      <div><small>Desplazado</small><b id="calcDisplaced">0 L</b></div>
      <div><small>Neto urna</small><b id="calcDisplayNet">0 L</b></div>
      <div><small>Bruto sump</small><b id="calcSumpGross">0 L</b></div>
      <div><small>Neto sump</small><b id="calcSumpNet">0 L</b></div>
      <div><small>Refugio</small><b id="calcRefugium">0 L</b></div>
      <div><small>ATO</small><b id="calcAto">0 L</b></div>
      <div><small>Total sistema</small><b id="calcSystemNet">0 L</b></div>
    </div>
    <label>Litros reales confirmados manualmente</label><input id="manual_real_liters" type="number" step="0.1" value="${safeVal(aq, 'manual_real_liters')}">

    <h3>Fechas</h3>
    <label>Fecha montaje</label><input id="mounted_at" type="date" value="${safeVal(aq, 'mounted_at')}">
    <label>Fecha llenado</label><input id="filled_at" type="date" value="${safeVal(aq, 'filled_at')}">
    <label>Inicio ciclado</label><input id="cycling_start_date" type="date" value="${safeVal(aq, 'cycling_start_date')}">
    <label>Fin ciclado</label><input id="cycling_end_date" type="date" value="${safeVal(aq, 'cycling_end_date')}">

    <h3>Notas</h3>
    <textarea id="aqNotes" placeholder="Notas del sistema">${safeVal(aq, 'notes')}</textarea>
    <button class="primary" onclick="guardarA('${editing ? esc(aq.id) : ''}')">Guardar</button><div id="x"></div></section>`, 'acuarios');
  setTimeout(window.calcAqVolumes, 0);
};

window.guardarA = async function (id) {
  try {
    let cover = val('aqCover') || null;
    const file = byId('aqCoverFile')?.files?.[0];
    if (file) cover = await window.ANX.uploadAquariumImage(file, 'aquarium-covers');
    const c = calcVolumesFromInputs();
    const row = {
      user_id: state.user.id,
      name: val('aqName') || 'Acuario',
      aquarium_type: val('aqType') || 'reef',
      status: val('aqStatus') || 'active',
      location: val('aqLocation') || null,
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
      gross_liters: c.gross,
      display_water_liters: c.displayWater,
      display_net_liters: c.displayNet,
      sump_net_liters: c.sumpNet,
      system_net_liters: c.systemNet,
      real_liters: c.systemNet,
      manual_real_liters: num('manual_real_liters'),
      mounted_at: val('mounted_at') || null,
      filled_at: val('filled_at') || null,
      cycling_start_date: val('cycling_start_date') || null,
      cycling_end_date: val('cycling_end_date') || null,
      notes: val('aqNotes') || null,
      cover_photo_url: cover,
      updated_at: new Date().toISOString()
    };
    if (cover) row.cover_photo_updated_at = new Date().toISOString();
    const result = id ? await supabase.from('aquariums').update(row).eq('id', id) : await supabase.from('aquariums').insert(row);
    if (result.error) throw result.error;
    byId('x').innerHTML = msg('Acuario guardado.', 'success');
    listaAcuarios();
  } catch (e) {
    byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.openA = async function (id) {
  const t = token();
  render(`<section class="panel"><h2>Cargando acuario...</h2></section>`, 'acuarios');
  try {
    const { data, error } = await supabase.from('aquariums').select('*').eq('id', id).single();
    if (error) throw error;
    if (!isCurrent(t)) return;
    state.aquarium = data;
    window.q = data;
    panel();
  } catch (e) {
    if (isCurrent(t)) render(msg(e.message, 'error'), 'acuarios');
  }
};

window.panel = function () {
  const aq = currentAquarium();
  if (!aq) return listaAcuarios();
  const cover = aq.__cover_url || aq.cover_photo_url || aq.cover_url || aq.photo_url || aq.image_url || '';
  const liters = aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters ?? '-';
  render(aqHeader('resumen') + `<section class="panel aq-summary">
    ${cover ? `<figure class="aq-summary-media"><img class="aq-summary-cover" src="${esc(cover)}" alt="${esc(aq.name || 'Acuario')}" loading="lazy"></figure>` : ''}
    <div class="aq-summary-title"><small>${esc(aq.aquarium_type || 'Acuario')}</small><h2>${esc(aq.name || 'Acuario')}</h2><p>${esc(liters)} L · ${esc(aq.status || 'activo')}</p></div>
    <div id="aqSummaryExtra" class="item">
      <p><b>Estado:</b> ${esc(aq.status || '-')}</p>
      <p><b>Tipo:</b> ${esc(aq.aquarium_type || '-')}</p>
      <p><b>Litros reales:</b> ${esc(aq.manual_real_liters || aq.system_net_liters || aq.real_liters || '-')} L</p>
      <p><b>Sump:</b> ${aq.has_sump ? 'Si' : 'No'}</p>
      <p><b>Refugio:</b> ${aq.has_refugium ? 'Si' : 'No'}</p>
      <p><b>ATO:</b> ${aq.has_ato_reservoir ? 'Si' : 'No'}</p>
      <p><b>Montaje:</b> ${esc(aq.mounted_at || '-')}</p>
      <p><b>Llenado:</b> ${esc(aq.filled_at || '-')}</p>
      <p><b>Inicio ciclado:</b> ${esc(aq.cycling_start_date || '-')}</p>
      <p><b>Fin ciclado:</b> ${esc(aq.cycling_end_date || '-')}</p>
    </div>
  </section>
  <section class="panel"><div class="panel-head"><h2>Accesos</h2><button onclick="formA(window.q)">Editar ficha</button></div>
    <div class="quick-actions">
      <button onclick="animales()"><span>🐟</span>Animales</button>
      <button onclick="mapaIA()"><span>◎</span>Mapa IA</button>
      <button onclick="fotos()"><span>▧</span>Fotos</button>
      <button onclick="inventario('aquarium')"><span>▤</span>Inventario</button>
      <button onclick="parametros()"><span>≋</span>Parámetros</button>
      <button onclick="tareas()"><span>♢</span>Tareas</button>
    </div></section>`, 'acuarios');
};

window.openAqSection = function (section) {
  const aq = currentAquarium();
  if (!aq) return listaAcuarios();
  if (section === 'resumen') return panel();
  if (section === 'animales') return animales();
  if (section === 'mapa') return mapaIA();
  if (section === 'fotos') return fotos();
  if (section === 'inventario') return inventario('aquarium');
  if (section === 'parametros') return parametros();
  if (section === 'tareas') return tareas();
};

function afterOpenSection(section, aq) {
  state.aquarium = aq;
  window.q = aq;
  if (!currentAquarium() || currentAquarium().id !== aq.id) return openA(aq.id).then(function () { setTimeout(function () { openAqSection(section); }, 0); });
  return openAqSection(section);
}

window.openAFromDashboard = function (id, section) {
  const aq = state.aquariums.find(a => a.id === id);
  if (aq) return afterOpenSection(section || 'resumen', aq);
  return openA(id);
};

window.ANX.loadAquariums = loadAquariums;
})();