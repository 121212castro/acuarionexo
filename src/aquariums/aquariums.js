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
    <div class="tank-info"><h3>${esc(aq.name || 'Acuario')}</h3><p>${esc(aq.aquarium_type || 'Acuario')} · ${esc(liters)} L</p></div>
    <b>›</b>
  </article>`;
}

function dashboardStat(label, value) {
  return `<article class="summary-card"><div><small>${esc(label)}</small><h2>${esc(value)}</h2></div></article>`;
}
function calcStat(label, id) {
  return `<article class="summary-card"><div><small>${esc(label)}</small><h2 id="${esc(id)}">0.0 L</h2></div></article>`;
}

function emptyLine(text) {
  return `<p class="small">${esc(text || 'Sin datos todavía')}</p>`;
}

function loadDashboardStats(_list) {
  return { animals: 'Próximamente', photos: 'No calculado', measurements: 'No calculado', tasks: null };
}

async function refreshAdminForDashboard() {
  try { if (window.refreshAdminAccess) await window.refreshAdminAccess(); } catch (_) {}
}

window.dashboard = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Cargando resumen...</p></div></section>`, 'inicio');
  try {
    await refreshAdminForDashboard();
    const list = await loadAquariums();
    const stats = await loadDashboardStats(list);
    if (!isCurrent(t)) return;
    const liters = list.reduce(function (total, aq) { return total + (Number(aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters) || 0); }, 0);
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Resumen general de la app</p></div></section>
      <section class="panel"><div class="panel-head"><h2>Estado general</h2></div><div class="quick-actions">
        ${dashboardStat('Acuarios activos', String(list.length))}
        ${dashboardStat('Litros gestionados', liters ? `${liters.toFixed(1)} L` : 'Sin datos')}
        ${dashboardStat('Animales registrados', String(stats.animals))}
      </div></section>
      <section class="panel"><div class="panel-head"><h2>Módulos</h2></div><div class="quick-actions">
        <button onclick="microfauna()"><span>◌</span>Microfauna</button>
        <button onclick="biblioteca()"><span>□</span>Biblioteca</button>
        <button onclick="inventario()"><span>▤</span>Inventario</button>
        ${state.isAdmin ? '<button onclick="adminPanel()"><span>⚙</span>Admin</button>' : ''}
      </div></section>
      <section class="panel"><div class="panel-head"><h2>Avisos importantes</h2></div>${emptyLine('Sin avisos importantes.')}</section>
      <section class="panel"><div class="panel-head"><h2>Actividad reciente</h2></div>${emptyLine('Sin actividad reciente.')}</section>`, 'inicio');
  } catch (e) { if (isCurrent(t)) render(msg(e.message, 'error'), 'inicio'); }
};

window.acuariosHome = function () {
  if (!state.user) return login();
  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Acuarios</h2><p>Gestiona tus sistemas desde un apartado propio.</p></div></section>
    <section class="panel"><div class="panel-head"><h2>Acuarios</h2></div><div class="quick-actions">
      <button onclick="listaAcuarios()"><span>▣</span>Mis acuarios</button>
      <button onclick="formA()"><span>＋</span>Nuevo acuario</button>
    </div></section>`, 'acuarios');
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
  } catch (e) { if (isCurrent(t)) render(msg(e.message, 'error'), 'acuarios'); }
};

function resumenAcuario() {
  const aq = currentAquarium();
  if (!aq) return listaAcuarios();
  const liters = aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters ?? '-';
  const type = aq.aquarium_type || aq.type || 'Acuario';
  const created = aq.created_at ? new Date(aq.created_at).toLocaleDateString('es-ES') : 'Sin fecha';
  render(aqHeader('resumen') + `<section class="panel">
    <div class="panel-head"><h2>Resumen</h2><div><button onclick="editarAcuario()">Editar acuario</button><button onclick="borrarAcuario()">Borrar acuario</button><button onclick="listaAcuarios()">Volver</button></div></div>
    <div class="quick-actions">${dashboardStat('Tipo', type)}${dashboardStat('Litros', `${liters} L`)}${dashboardStat('Alta', created)}</div>
    ${aq.notes ? `<p>${esc(aq.notes)}</p>` : '<p class="small">Sin nota del acuario.</p>'}
    <div id="deleteAqStatus"></div>
  </section>`, 'acuarios');
}

function selectTypeOptions(current) {
  return [['reef','reef'],['freshwater','freshwater'],['hospital','hospital'],['quarantine','quarantine'],['other','other']].map(function (item) { return `<option value="${esc(item[0])}" ${String(current || '') === item[0] ? 'selected' : ''}>${esc(item[1])}</option>`; }).join('');
}
function dateValue(value) { return value ? String(value).slice(0, 10) : ''; }
function fnum(id, label, value) { return `<label>${esc(label)}</label><input id="${esc(id)}" type="number" step="0.1" inputmode="decimal" value="${esc(value ?? '')}" oninput="calcAqVolumes()">`; }
function fdate(id, label, value) { return `<label>${esc(label)}</label><input id="${esc(id)}" type="date" value="${esc(dateValue(value))}">`; }
function fcheck(id, label, value) { return `<label><input id="${esc(id)}" type="checkbox" ${value ? 'checked' : ''} onchange="calcAqVolumes()"> ${esc(label)}</label>`; }
function nval(id) { const raw = val(id); if (raw === '') return null; const n = Number(String(raw).replace(',', '.')); return Number.isFinite(n) ? n : null; }
function dval(id) { return val(id) || null; }

window.formA = function () {
  if (!state.user) return login();
  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Nuevo acuario</h2><p>Crear un sistema nuevo.</p></div></section>
    <section class="panel aquarium-form">
    <div class="panel-head"><h2>Nuevo acuario</h2><button onclick="acuariosHome()">Cancelar</button></div>
    <h3>Datos generales</h3>
    <label>Nombre</label><input id="editAqName" placeholder="Nombre del acuario">
    <label>Tipo</label><select id="editAqType">${selectTypeOptions('reef')}</select>
    <label>Ubicación</label><input id="editAqLocation" placeholder="Ubicación">
    ${fdate('mounted_at','Fecha de montaje',null)}${fdate('filled_at','Fecha de llenado',null)}${fdate('cycling_start_date','Inicio de ciclado',null)}${fdate('cycling_end_date','Fin de ciclado',null)}
    <h3>Medidas de la urna</h3>
    ${fnum('tank_length_cm','Largo urna (cm)',null)}${fnum('tank_width_cm','Ancho urna (cm)',null)}${fnum('tank_height_cm','Alto urna (cm)',null)}${fnum('display_water_height_cm','Altura real de agua (cm)',null)}${fnum('rock_kg','Roca (kg)',null)}${fnum('sand_kg','Arena (kg)',null)}
    <h3>Sump / refugio / relleno</h3>
    ${fcheck('has_sump','Tiene sump',false)}${fnum('sump_length_cm','Largo sump (cm)',null)}${fnum('sump_width_cm','Ancho sump (cm)',null)}${fnum('sump_height_cm','Alto sump (cm)',null)}${fnum('sump_water_height_cm','Altura agua sump (cm)',null)}${fcheck('has_refugium','Tiene refugio',false)}${fnum('refugium_liters','Litros refugio',null)}${fcheck('has_ato_reservoir','Tiene depósito de relleno',false)}${fnum('ato_reservoir_liters','Litros depósito relleno',null)}
    <h3>Litros</h3>
    ${fnum('editAqLiters','Litros reales manuales',null)}
    <div class="quick-actions">${calcStat('Brutos urna','calcGross')}${calcStat('Display neto','calcDisplayNet')}${calcStat('Sump neto','calcSumpNet')}${calcStat('Sistema neto','calcSystemNet')}</div>
    <h3>Notas</h3><label>Nota</label><textarea id="editAqNotes"></textarea>
    <button class="primary" onclick="guardarNuevoAcuario()">Crear acuario</button><div id="editAqStatus"></div>
  </section>`, 'acuarios');
  setTimeout(function () { if (window.calcAqVolumes) window.calcAqVolumes(); }, 0);
};

window.guardarNuevoAcuario = async function () {
  const box = byId('editAqStatus');
  if (!state.user) return login();
  try {
    const name = val('editAqName');
    if (!name) throw new Error('El nombre del acuario es obligatorio.');
    const c = calcVolumesFromInputs();
    const manual = nval('editAqLiters');
    const insert = {
      user_id: state.user.id,
      name,
      aquarium_type: val('editAqType') || 'reef',
      type: val('editAqType') || 'reef',
      location: val('editAqLocation') || null,
      tank_length_cm: nval('tank_length_cm'), tank_width_cm: nval('tank_width_cm'), tank_height_cm: nval('tank_height_cm'), display_water_height_cm: nval('display_water_height_cm'), rock_kg: nval('rock_kg'), sand_kg: nval('sand_kg'),
      has_sump: !!byId('has_sump')?.checked, sump_length_cm: nval('sump_length_cm'), sump_width_cm: nval('sump_width_cm'), sump_height_cm: nval('sump_height_cm'), sump_water_height_cm: nval('sump_water_height_cm'),
      has_refugium: !!byId('has_refugium')?.checked, refugium_liters: nval('refugium_liters'), has_ato_reservoir: !!byId('has_ato_reservoir')?.checked, ato_reservoir_liters: nval('ato_reservoir_liters'),
      gross_liters: c.gross, display_water_liters: c.displayWater, display_net_liters: c.displayNet, sump_net_liters: c.sumpNet, system_net_liters: c.systemNet,
      real_liters: manual ?? c.systemNet, manual_real_liters: manual, liters: manual ?? c.systemNet, volume_liters: c.systemNet,
      mounted_at: dval('mounted_at'), filled_at: dval('filled_at'), cycling_start_date: dval('cycling_start_date'), cycling_end_date: dval('cycling_end_date'), notes: val('editAqNotes') || null
    };
    if (box) box.innerHTML = msg('Creando acuario...', 'notice');
    const { data, error } = await supabase.from('aquariums').insert(insert).select('*').single();
    if (error) throw error;
    const saved = data || insert;
    state.aquariums = [saved].concat(state.aquariums || []);
    state.aquarium = saved;
    window.q = saved;
    resumenAcuario();
  } catch (e) { if (box) box.innerHTML = msg(e.message, 'error'); }
};

window.editarAcuario = function () {
  const aq = currentAquarium();
  if (!aq) return listaAcuarios();
  render(aqHeader('resumen') + `<section class="panel aquarium-form">
    <div class="panel-head"><h2>Editar acuario</h2><button onclick="openAqSection('resumen')">Cancelar</button></div>
    <h3>Datos generales</h3>
    <label>Nombre</label><input id="editAqName" value="${esc(aq.name || '')}">
    <label>Tipo</label><select id="editAqType">${selectTypeOptions(aq.aquarium_type || aq.type || 'reef')}</select>
    <label>Ubicación</label><input id="editAqLocation" value="${esc(aq.location || '')}">
    ${fdate('mounted_at','Fecha de montaje',aq.mounted_at)}${fdate('filled_at','Fecha de llenado',aq.filled_at)}${fdate('cycling_start_date','Inicio de ciclado',aq.cycling_start_date)}${fdate('cycling_end_date','Fin de ciclado',aq.cycling_end_date)}
    <h3>Medidas de la urna</h3>
    ${fnum('tank_length_cm','Largo urna (cm)',aq.tank_length_cm)}${fnum('tank_width_cm','Ancho urna (cm)',aq.tank_width_cm)}${fnum('tank_height_cm','Alto urna (cm)',aq.tank_height_cm)}${fnum('display_water_height_cm','Altura real de agua (cm)',aq.display_water_height_cm)}${fnum('rock_kg','Roca (kg)',aq.rock_kg)}${fnum('sand_kg','Arena (kg)',aq.sand_kg)}
    <h3>Sump / refugio / relleno</h3>
    ${fcheck('has_sump','Tiene sump',aq.has_sump)}${fnum('sump_length_cm','Largo sump (cm)',aq.sump_length_cm)}${fnum('sump_width_cm','Ancho sump (cm)',aq.sump_width_cm)}${fnum('sump_height_cm','Alto sump (cm)',aq.sump_height_cm)}${fnum('sump_water_height_cm','Altura agua sump (cm)',aq.sump_water_height_cm)}${fcheck('has_refugium','Tiene refugio',aq.has_refugium)}${fnum('refugium_liters','Litros refugio',aq.refugium_liters)}${fcheck('has_ato_reservoir','Tiene depósito de relleno',aq.has_ato_reservoir)}${fnum('ato_reservoir_liters','Litros depósito relleno',aq.ato_reservoir_liters)}
    <h3>Litros</h3>
    ${fnum('editAqLiters','Litros reales manuales',aq.manual_real_liters ?? aq.real_liters ?? aq.system_net_liters ?? aq.liters)}
    <div class="quick-actions">${calcStat('Brutos urna','calcGross')}${calcStat('Display neto','calcDisplayNet')}${calcStat('Sump neto','calcSumpNet')}${calcStat('Sistema neto','calcSystemNet')}</div>
    <h3>Notas</h3><label>Nota</label><textarea id="editAqNotes">${esc(aq.notes || '')}</textarea>
    <button class="primary" onclick="guardarAcuarioEditado()">Guardar cambios</button><div id="editAqStatus"></div>
  </section>`, 'acuarios');
  setTimeout(function () { if (window.calcAqVolumes) window.calcAqVolumes(); }, 0);
};

window.guardarAcuarioEditado = async function () {
  const aq = currentAquarium();
  const box = byId('editAqStatus');
  if (!aq) return listaAcuarios();
  try {
    const name = val('editAqName');
    if (!name) throw new Error('El nombre del acuario es obligatorio.');
    const c = calcVolumesFromInputs();
    const manual = nval('editAqLiters');
    const update = {
      name,
      aquarium_type: val('editAqType') || 'reef',
      location: val('editAqLocation') || null,
      tank_length_cm: nval('tank_length_cm'), tank_width_cm: nval('tank_width_cm'), tank_height_cm: nval('tank_height_cm'), display_water_height_cm: nval('display_water_height_cm'), rock_kg: nval('rock_kg'), sand_kg: nval('sand_kg'),
      has_sump: !!byId('has_sump')?.checked, sump_length_cm: nval('sump_length_cm'), sump_width_cm: nval('sump_width_cm'), sump_height_cm: nval('sump_height_cm'), sump_water_height_cm: nval('sump_water_height_cm'),
      has_refugium: !!byId('has_refugium')?.checked, refugium_liters: nval('refugium_liters'), has_ato_reservoir: !!byId('has_ato_reservoir')?.checked, ato_reservoir_liters: nval('ato_reservoir_liters'),
      gross_liters: c.gross, display_water_liters: c.displayWater, display_net_liters: c.displayNet, sump_net_liters: c.sumpNet, system_net_liters: c.systemNet,
      real_liters: manual ?? c.systemNet, manual_real_liters: manual, liters: manual ?? c.systemNet, volume_liters: c.systemNet,
      mounted_at: dval('mounted_at'), filled_at: dval('filled_at'), cycling_start_date: dval('cycling_start_date'), cycling_end_date: dval('cycling_end_date'), notes: val('editAqNotes') || null, updated_at: new Date().toISOString()
    };
    if (box) box.innerHTML = msg('Guardando cambios...', 'notice');
    const { data, error } = await supabase.from('aquariums').update(update).eq('id', aq.id).eq('user_id', state.user.id).select('*').single();
    if (error) throw error;
    const saved = data || { ...aq, ...update };
    state.aquarium = { ...aq, ...saved };
    window.q = state.aquarium;
    state.aquariums = (state.aquariums || []).map(function (item) { return String(item.id) === String(aq.id) ? { ...item, ...saved } : item; });
    resumenAcuario();
  } catch (e) { if (box) box.innerHTML = msg(e.message, 'error'); }
};

window.editarNotaAcuario = window.editarAcuario;

window.borrarAcuario = async function () {
  const aq = currentAquarium();
  if (!aq || !state.user) return listaAcuarios();
  const name = aq.name || 'este acuario';
  if (!window.confirm(`Borrar acuario "${name}"?\n\nEsta acción no se puede deshacer.`)) return;
  const box = byId('deleteAqStatus');
  try {
    if (box) box.innerHTML = msg('Borrando acuario...', 'notice');
    const { error } = await supabase.from('aquariums').delete().eq('id', aq.id).eq('user_id', state.user.id);
    if (error) throw error;
    state.aquariums = (state.aquariums || []).filter(function (item) { return String(item.id) !== String(aq.id); });
    state.aquarium = null;
    window.q = null;
    await listaAcuarios();
  } catch (e) {
    if (box) box.innerHTML = msg('No se pudo borrar el acuario: ' + e.message, 'error');
  }
};

window.openA = function (id) {
  const aq = (state.aquariums || []).find(function (item) { return String(item.id) === String(id); });
  if (!aq) { render(msg('No se encontró este acuario. Vuelve a cargar la lista.', 'error'), 'acuarios'); return; }
  state.aquarium = aq;
  window.q = aq;
  state.section = 'resumen';
  resumenAcuario();
};

window.openAqSection = function (section) {
  const aq = currentAquarium();
  if (!aq) return listaAcuarios();
  state.section = section || 'resumen';
  const routes = { resumen: resumenAcuario, animales: window.animales, mapa: window.mapaIA, fotos: window.fotos, inventario: function () { return window.inventario('aquarium'); }, parametros: window.parametros, tareas: window.tareas };
  const fn = routes[state.section] || resumenAcuario;
  if (typeof fn === 'function') return fn();
  render(aqHeader(state.section) + `<section class="panel">${msg('Este módulo no está disponible todavía.', 'notice')}</section>`, 'acuarios');
};

function lDisplay(a, b, h) { return ((Number(a) || 0) * (Number(b) || 0) * (Number(h) || 0) / 1000) || 0; }
function displacement(rock, sand) { return ((Number(rock) || 0) * 0.65) + ((Number(sand) || 0) * 0.40); }
function calcVolumesFromInputs() {
  const gross = lDisplay(val('tank_length_cm'), val('tank_width_cm'), val('tank_height_cm'));
  const displayWater = lDisplay(val('tank_length_cm'), val('tank_width_cm'), val('display_water_height_cm'));
  const displaced = displacement(val('rock_kg'), val('sand_kg'));
  const displayNet = Math.max(0, displayWater - displaced);
  const sumpGross = lDisplay(val('sump_length_cm'), val('sump_width_cm'), val('sump_height_cm'));
  const sumpNet = byId('has_sump')?.checked ? lDisplay(val('sump_length_cm'), val('sump_width_cm'), val('sump_water_height_cm')) : 0;
  const systemNet = displayNet + sumpNet;
  return { gross, displayWater, displaced, displayNet, sumpGross, sumpNet, systemNet };
}
window.calcAqVolumes = function () {
  const c = calcVolumesFromInputs();
  const set = (id, value) => { if (byId(id)) byId(id).textContent = `${value.toFixed(1)} L`; };
  set('calcGross', c.gross); set('calcDisplayNet', c.displayNet); set('calcSumpNet', c.sumpNet); set('calcSystemNet', c.systemNet);
};
})();