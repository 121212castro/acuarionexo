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
  return {
    animals: 'Próximamente',
    photos: 'No calculado',
    measurements: 'No calculado',
    tasks: null
  };
}

async function refreshAdminForDashboard() {
  try {
    if (window.refreshAdminAccess) await window.refreshAdminAccess();
  } catch (_) {}
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
          ${state.isAdmin ? '<button onclick="adminPanel()"><span>⚙</span>Admin</button>' : ''}
        </div>
      </section>
      <section class="panel"><div class="panel-head"><h2>Avisos importantes</h2></div>${emptyLine('Sin avisos importantes.')}</section>
      <section class="panel"><div class="panel-head"><h2>Actividad reciente</h2></div>
        ${emptyLine('Sin actividad reciente.')}
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

function resumenAcuario() {
  const aq = currentAquarium();
  if (!aq) return listaAcuarios();
  const liters = aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters ?? '-';
  const type = aq.aquarium_type || aq.type || 'Acuario';
  const created = aq.created_at ? new Date(aq.created_at).toLocaleDateString('es-ES') : 'Sin fecha';
  render(aqHeader('resumen') + `<section class="panel">
    <div class="panel-head"><h2>Resumen</h2><button onclick="listaAcuarios()">Volver</button></div>
    <div class="quick-actions">
      ${dashboardStat('Tipo', type)}
      ${dashboardStat('Litros', `${liters} L`)}
      ${dashboardStat('Alta', created)}
    </div>
    ${aq.notes ? `<p>${esc(aq.notes)}</p>` : '<p class="small">Selecciona una pestaña para gestionar animales, mapa, fotos, inventario, parámetros o tareas.</p>'}
  </section>`, 'acuarios');
}

window.openA = function (id) {
  const aq = (state.aquariums || []).find(function (item) { return String(item.id) === String(id); });
  if (!aq) {
    render(msg('No se encontró este acuario. Vuelve a cargar la lista.', 'error'), 'acuarios');
    return;
  }
  state.aquarium = aq;
  window.q = aq;
  state.section = 'resumen';
  resumenAcuario();
};

window.openAqSection = function (section) {
  const aq = currentAquarium();
  if (!aq) return listaAcuarios();
  state.section = section || 'resumen';
  const routes = {
    resumen: resumenAcuario,
    animales: window.animales,
    mapa: window.mapaIA,
    fotos: window.fotos,
    inventario: function () { return window.inventario('aquarium'); },
    parametros: window.parametros,
    tareas: window.tareas
  };
  const fn = routes[state.section] || resumenAcuario;
  if (typeof fn === 'function') return fn();
  render(aqHeader(state.section) + `<section class="panel">${msg('Este módulo no está disponible todavía.', 'notice')}</section>`, 'acuarios');
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
  set('calcSystemNet', c.systemNet);
};
})();