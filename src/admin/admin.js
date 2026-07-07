/* AcuarioNexo · Admin restringido */
(function () {
  const { state, esc, msg, render } = window.ANX;
  const { loadAdminRole, adminAllowed, roleLabel, adminStats, adminBlocked } = window.ANX;

  function loadScriptOnce(src, module) {
    if (document.querySelector(`script[data-module="${module}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.dataset.module = module;
    document.head.appendChild(script);
  }
  loadScriptOnce('src/admin/admin-extra.js?v=admin-tools-20260702', 'admin-extra');
  loadScriptOnce('src/admin/report-issue.js?v=incidencia-20260702-2', 'report-issue');
  loadScriptOnce('src/admin/issue-entry.js?v=incidencia-20260702-2', 'issue-entry');

  window.refreshAdminAccess = async function () {
    try { await loadAdminRole(); }
    catch (_) { state.adminRole = null; state.isAdmin = false; }
  };

  window.adminCrearFicha = async function () {
    if (!state.user) return login();
    await loadAdminRole();
    if (!adminAllowed()) return adminBlocked();
    render(`<section class="panel">${msg('Abriendo creador de fichas...')}</section>`, 'admin');
    if (window.ANX.loadModuleGroup) await window.ANX.loadModuleGroup('biblioteca');
    if (typeof window.nuevaFichaV3 === 'function') return window.nuevaFichaV3();
    render(`<section class="panel">${msg('No se pudo abrir el creador de fichas.', 'error')}</section>`, 'admin');
  };

  window.adminPanel = async function () {
    if (!state.user) return login();
    try {
      await loadAdminRole();
      if (!adminAllowed()) return adminBlocked();
      render(`<section class="panel">${msg('Cargando panel Admin...')}</section>`, 'admin');
      const stats = await adminStats();
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Admin</h2><p>${esc(roleLabel(state.adminRole.role))}</p></div></section>
        <section class="panel">
          <div class="panel-head"><h2>Control general</h2></div>
          <div class="quick-actions">
            <article class="summary-card"><div><small>Fichas a revisar</small><h2>${esc(stats.libraryReview)}</h2></div></article>
            <article class="summary-card"><div><small>Fichas validadas/publicadas</small><h2>${esc(stats.libraryValidated)}</h2></div></article>
            <article class="summary-card"><div><small>Acuarios</small><h2>${esc(stats.aquariums)}</h2></div></article>
            <article class="summary-card"><div><small>Inventario</small><h2>${esc(stats.inventory)}</h2></div></article>
            <article class="summary-card"><div><small>Microfauna</small><h2>${esc(stats.microfauna)}</h2></div></article>
            <article class="summary-card"><div><small>Reportes abiertos</small><h2>${esc(stats.reports)}</h2></div></article>
            <article class="summary-card"><div><small>Consumos IA</small><h2>${esc(stats.aiUsage)}</h2></div></article>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Gestión</h2></div>
          <div class="quick-actions">
            <button onclick="adminCrearFicha()"><span>＋</span>Crear ficha</button>
            <button onclick="biblioteca()"><span>□</span>Revisar biblioteca</button>
            <button onclick="adminUsers()"><span>👥</span>Usuarios</button>
            <button onclick="adminReports()"><span>⚠</span>Fallos</button>
            <button onclick="adminAiUsage()"><span>◈</span>Consumo IA</button>
            <button onclick="adminGrantForm()"><span>＋</span>Dar Admin</button>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Herramientas</h2></div>
          <div class="quick-actions">
            <button onclick="inventario()"><span>▤</span>Inventario</button>
            <button onclick="microfauna()"><span>◌</span>Microfauna</button>
            <button onclick="tareas()"><span>♢</span>Avisos</button>
          </div>
          <p class="small">La creación de fichas queda restringida al panel Admin. La Biblioteca pública queda como zona de consulta limpia.</p>
        </section>`, 'admin');
    } catch (e) {
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Admin</h2><p>Error</p></div></section><section class="panel">${msg(e.message, 'error')}</section>`, 'inicio');
    }
  };

  window.adminAiUsage = async function () {
    if (!state.user) return login();
    await loadAdminRole();
    if (!adminAllowed()) return adminBlocked();
    render(`<section class="summary-card"><div><small>Admin</small><h2>Consumo IA</h2><p>Registro de actividad y coste</p></div></section>
      <section class="panel"><button onclick="adminPanel()">← Admin</button>
        <div class="quick-actions">
          <article class="summary-card"><div><small>Acciones IA</small><h2>0</h2></div></article>
          <article class="summary-card"><div><small>Tokens</small><h2>Pendiente</h2></div></article>
          <article class="summary-card"><div><small>Coste estimado</small><h2>Pendiente</h2></div></article>
        </div>
        <p class="small">La tabla ai_usage_logs está creada. Los datos aparecerán aquí cuando conectemos cada acción IA al registrador de consumo.</p>
      </section>`, 'admin');
  };

  window.ANX.Admin = { loadAdminRole, adminAllowed, roleLabel };
})();