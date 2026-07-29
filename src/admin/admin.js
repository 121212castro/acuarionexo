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
  loadScriptOnce('src/admin/admin-library-generator.js?v=admin-library-generator-auto-20260729', 'admin-library-generator');

  async function requireAdmin() {
    if (!state.user) { login(); return false; }
    await loadAdminRole();
    if (!adminAllowed()) { adminBlocked(); return false; }
    return true;
  }

  async function loadLibraryAdminTools() {
    if (!await requireAdmin()) return false;
    if (window.ANX.loadModuleGroup) await window.ANX.loadModuleGroup('biblioteca');
    return true;
  }

  function adminMetricCard(label, value, action, description) {
    return `<article class="summary-card" role="button" tabindex="0" onclick="${action}()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${action}();}" aria-label="${esc(description || label)}"><div><small>${esc(label)}</small><h2>${esc(value)}</h2><p>${esc(description || 'Abrir')}</p></div></article>`;
  }

  window.refreshAdminAccess = async function () {
    try { await loadAdminRole(); }
    catch (_) { state.adminRole = null; state.isAdmin = false; }
  };

  window.adminCrearFicha = async function () {
    if (!await loadLibraryAdminTools()) return;
    render(`<section class="panel">${msg('Abriendo creador de fichas...')}</section>`, 'admin');
    if (typeof window.nuevaFichaV3 === 'function') return window.nuevaFichaV3();
    render(`<section class="panel">${msg('No se pudo abrir el creador de fichas.', 'error')}</section>`, 'admin');
  };

  window.adminCrearFichaDesdeChat = async function () {
    if (!await loadLibraryAdminTools()) return;
    render(`<section class="summary-card"><div><small>Admin</small><h2>Crear ficha desde Chat</h2><p>Importación validada y restringida</p></div></section>
      <section class="panel"><button onclick="adminPanel()">← Admin</button><div id="adminChatImportHost"></div></section>`, 'admin');
    if (typeof window.mostrarCrearFichaDesdeChat === 'function') return window.mostrarCrearFichaDesdeChat();
    render(`<section class="panel">${msg('No se pudo cargar la importación desde Chat.', 'error')}</section>`, 'admin');
  };

  window.adminPlantillaChat = async function () {
    if (!await loadLibraryAdminTools()) return;
    const types = window.ANX.LibraryV3Core?.types || [];
    const options = types.filter(([key]) => key !== 'all').map(([key, name]) => `<option value="${esc(key)}">${esc(name)}</option>`).join('');
    render(`<section class="summary-card"><div><small>Admin</small><h2>Plantilla para Chat</h2><p>Preparación de fichas verificables</p></div></section>
      <section class="panel"><button onclick="adminPanel()">← Admin</button>
        <div class="form-grid">
          <div><label>Tipo de ficha</label><select id="templateCopyType" onchange="actualizarCamposPlantillaChat()">${options}</select></div>
          <div><label>Nombre común, comercial o modelo</label><input id="templateCopySubject" placeholder="Ej.: pez ángel enano africano"></div>
          <div id="templateScientificField"><label>Nombre científico exacto</label><input id="templateCopyScientificName" placeholder="Ej.: Centropyge acanthops"></div>
          <div><label>&nbsp;</label><button class="primary" onclick="copiarApartadosFicha()">Copiar apartados para Chat</button></div>
        </div><div id="templateCopyStatus"></div>
      </section>`, 'admin');
    requestAnimationFrame(() => window.actualizarCamposPlantillaChat?.());
  };

  window.adminRevisarFichas = async function () {
    if (!await loadLibraryAdminTools()) return;
    if (typeof window.biblioteca !== 'function') {
      render(`<section class="panel">${msg('No se pudo abrir la revisión de fichas.', 'error')}</section>`, 'admin');
      return;
    }
    return window.biblioteca({ statusFilter: ['review', 'draft', 'identified'], adminReturn: true });
  };

  window.adminBibliotecaCompleta = async function () {
    if (!await loadLibraryAdminTools()) return;
    return window.biblioteca({ adminReturn: true });
  };

  window.adminFichasValidadas = async function () {
    if (!await loadLibraryAdminTools()) return;
    return window.biblioteca({ statusFilter: ['validated', 'published'], adminReturn: true });
  };

  window.adminAcuarios = async function () {
    if (!await requireAdmin()) return;
    if (typeof window.listaAcuarios === 'function') return window.listaAcuarios();
    render(`<section class="panel">${msg('No se pudo abrir la lista de acuarios.', 'error')}</section>`, 'admin');
  };

  window.adminInventario = async function () {
    if (!await requireAdmin()) return;
    if (typeof window.inventario === 'function') return window.inventario();
    render(`<section class="panel">${msg('No se pudo abrir el inventario.', 'error')}</section>`, 'admin');
  };

  window.adminMicrofauna = async function () {
    if (!await requireAdmin()) return;
    if (typeof window.microfauna === 'function') return window.microfauna();
    render(`<section class="panel">${msg('No se pudo abrir Microfauna.', 'error')}</section>`, 'admin');
  };

  window.adminPanel = async function () {
    if (!await requireAdmin()) return;
    try {
      render(`<section class="panel">${msg('Cargando panel Admin...')}</section>`, 'admin');
      const stats = await adminStats();
      const ownerControls = state.adminRole?.role === 'owner'
        ? '<button onclick="adminGrantForm()"><span>＋</span>Autorizar usuario</button>'
        : '';
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Admin</h2><p>${esc(roleLabel(state.adminRole.role))}</p></div></section>
        <section class="panel">
          <div class="panel-head"><h2>Control general</h2></div>
          <div class="quick-actions">
            ${adminMetricCard('Fichas a revisar', stats.libraryReview, 'adminRevisarFichas', 'Abrir revisión')}
            ${adminMetricCard('Fichas validadas/publicadas', stats.libraryValidated, 'adminFichasValidadas', 'Abrir fichas validadas y publicadas')}
            ${adminMetricCard('Acuarios', stats.aquariums, 'adminAcuarios', 'Abrir lista de acuarios')}
            ${adminMetricCard('Inventario', stats.inventory, 'adminInventario', 'Abrir inventario')}
            ${adminMetricCard('Microfauna', stats.microfauna, 'adminMicrofauna', 'Abrir cultivos de microfauna')}
            ${adminMetricCard('Reportes abiertos', stats.reports, 'adminReports', 'Abrir reportes')}
            ${adminMetricCard('Consumos IA', stats.aiUsage, 'adminAiUsage', 'Abrir consumo de IA')}
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Gestión de Biblioteca</h2></div>
          <div class="quick-actions">
            <button onclick="adminCrearFicha()"><span>＋</span>Crear ficha manual</button>
            <button onclick="adminCrearFichaDesdeChat()"><span>✦</span>Crear ficha desde Chat</button>
            <button onclick="adminGenerator()"><span>⚙</span>Generador de fichas</button>
            <button onclick="adminPlantillaChat()"><span>▣</span>Plantilla para Chat</button>
            <button onclick="adminRevisarFichas()"><span>□</span>Revisar fichas pendientes</button>
            <button onclick="adminBibliotecaCompleta()"><span>▦</span>Biblioteca completa</button>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Administración</h2></div>
          <div class="quick-actions">
            <button onclick="adminUsers()"><span>👥</span>Usuarios</button>
            <button onclick="adminReports()"><span>⚠</span>Fallos</button>
            <button onclick="adminAiUsage()"><span>◈</span>Consumo IA</button>
            ${ownerControls}
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Herramientas</h2></div>
          <div class="quick-actions">
            <button onclick="adminInventario()"><span>▤</span>Inventario</button>
            <button onclick="adminMicrofauna()"><span>◌</span>Microfauna</button>
            <button onclick="tareas()"><span>♢</span>Avisos</button>
          </div>
          <p class="small">Este panel solo está disponible para propietario, administradores y usuarios de confianza autorizados.</p>
        </section>`, 'admin');
    } catch (e) {
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Admin</h2><p>Error</p></div></section><section class="panel">${msg(e.message, 'error')}</section>`, 'inicio');
    }
  };

  window.adminAiUsage = async function () {
    if (!await requireAdmin()) return;
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

  window.ANX.Admin = { loadAdminRole, adminAllowed, roleLabel, requireAdmin, loadLibraryAdminTools };
})();