/* AcuarioNexo · aquariums */
(function () {
  const { supabase, state, esc, byId, msg, token, isCurrent, currentAquarium, render, aqHeader } = window.ANX;
  const { loadAquariums, aquariumCard, dashboardStat, emptyLine, loadDashboardStats, refreshAdminForDashboard, aquariumTypeLabel } = window.ANX.AquariumsCore;

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
    const type = aquariumTypeLabel(aq.aquarium_type || aq.type || 'Acuario');
    const created = aq.created_at ? new Date(aq.created_at).toLocaleDateString('es-ES') : 'Sin fecha';
    render(aqHeader('resumen') + `<section class="panel">
      <div class="panel-head"><h2>Resumen</h2><div><button onclick="editarAcuario()">Editar acuario</button><button onclick="borrarAcuario()">Borrar acuario</button><button onclick="listaAcuarios()">Volver</button></div></div>
      <div class="quick-actions">${dashboardStat('Tipo', type)}${dashboardStat('Litros', `${liters} L`)}${dashboardStat('Alta', created)}</div>
      ${aq.notes ? `<p>${esc(aq.notes)}</p>` : '<p class="small">Sin nota del acuario.</p>'}
      <div id="deleteAqStatus"></div>
    </section>`, 'acuarios');
  }

  window.resumenAcuario = resumenAcuario;

  window.borrarAcuario = async function () {
    const aq = currentAquarium();
    const box = byId('deleteAqStatus');
    if (!state.user) return login();
    if (!aq) return listaAcuarios();
    if (!confirm('¿Seguro que quieres borrar este acuario? Esta acción no se puede deshacer.')) return;
    try {
      if (box) box.innerHTML = msg('Borrando acuario...', 'notice');
      const { error } = await supabase.from('aquariums').delete().eq('id', aq.id).eq('user_id', state.user.id);
      if (error) throw error;
      state.aquariums = (state.aquariums || []).filter(function (item) { return String(item.id) !== String(aq.id); });
      state.aquarium = null;
      window.q = null;
      listaAcuarios();
    } catch (e) { if (box) box.innerHTML = msg(e.message, 'error'); }
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
    const routes = { resumen: resumenAcuario, animales: window.animales, mapa: window.mapaIA, fotos: window.fotos, inventario: function () { return window.inventario('aquarium'); }, parametros: window.parametros, tareas: window.tareasAcuario };
    const fn = routes[state.section] || resumenAcuario;
    if (typeof fn === 'function') return fn();
    render(aqHeader(state.section) + `<section class="panel">${msg('Este módulo no está disponible todavía.', 'notice')}</section>`, 'acuarios');
  };
})();
