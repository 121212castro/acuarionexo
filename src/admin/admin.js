/* AcuarioNexo · Admin restringido */
(function () {
  const { supabase, state, esc, byId, msg, render } = window.ANX;

  function loadScriptOnce(src, module) {
    if (document.querySelector(`script[data-module="${module}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.dataset.module = module;
    document.head.appendChild(script);
  }
  loadScriptOnce('src/admin/admin-extra.js?v=pez-marino-contract-20260702', 'admin-extra');
  loadScriptOnce('src/admin/report-issue.js?v=pez-marino-contract-20260702', 'report-issue');

  const ADMIN_ROLES = new Set(['owner', 'admin', 'trusted_admin']);

  function adminAllowed() {
    return !!state.user && ADMIN_ROLES.has(state.adminRole?.role);
  }

  function roleLabel(role) {
    return ({ owner: 'Propietario', admin: 'Admin', trusted_admin: 'Usuario de confianza' })[role] || 'Sin permiso';
  }

  async function loadAdminRole() {
    state.adminRole = null;
    state.isAdmin = false;
    if (!state.user?.id) return null;
    const { data, error } = await supabase
      .from('admin_roles')
      .select('user_id,role,active,notes,created_at')
      .eq('user_id', state.user.id)
      .eq('active', true)
      .maybeSingle();
    if (error) {
      if (/relation .*admin_roles|does not exist/i.test(error.message || '')) return null;
      throw error;
    }
    state.adminRole = data || null;
    state.isAdmin = !!data && ADMIN_ROLES.has(data.role);
    return state.adminRole;
  }

  async function countTable(table, filter) {
    let query = supabase.from(table).select('id', { count: 'exact', head: true });
    if (filter) query = filter(query);
    const { count, error } = await query;
    if (error) return 'Error';
    return count ?? 0;
  }

  async function adminStats() {
    const [libraryReview, libraryValidated, aquariums, inventory, microfauna, reports] = await Promise.all([
      countTable('library_entries', q => q.in('status', ['review', 'draft', 'identified'])),
      countTable('library_entries', q => q.in('status', ['validated', 'published'])),
      countTable('aquariums'),
      countTable('inventory_items'),
      countTable('microfauna_cultures'),
      countTable('admin_reports', q => q.in('status', ['open', 'reviewing']))
    ]);
    return { libraryReview, libraryValidated, aquariums, inventory, microfauna, reports };
  }

  function adminBlocked() {
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Admin</h2><p>Acceso restringido</p></div></section>
      <section class="panel">${msg('No tienes permiso para abrir el panel Admin.', 'error')}<button onclick="dashboard()">Volver</button></section>`, 'inicio');
  }

  window.refreshAdminAccess = async function () {
    try { await loadAdminRole(); }
    catch (_) { state.adminRole = null; state.isAdmin = false; }
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
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Gestión</h2></div>
          <div class="quick-actions">
            <button onclick="adminUsers()"><span>👥</span>Usuarios</button>
            <button onclick="adminReports()"><span>⚠</span>Fallos</button>
            <button onclick="adminGrantForm()"><span>＋</span>Dar Admin</button>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Herramientas</h2></div>
          <div class="quick-actions">
            <button onclick="biblioteca()"><span>□</span>Biblioteca</button>
            <button onclick="inventario()"><span>▤</span>Inventario</button>
            <button onclick="microfauna()"><span>◌</span>Microfauna</button>
            <button onclick="tareas()"><span>♢</span>Avisos</button>
          </div>
          <p class="small">Este panel solo aparece con rol activo en Supabase. Las acciones sensibles deben mantenerse protegidas por RLS y funciones seguras.</p>
        </section>`, 'admin');
    } catch (e) {
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Admin</h2><p>Error</p></div></section><section class="panel">${msg(e.message, 'error')}</section>`, 'inicio');
    }
  };

  window.ANX.Admin = { loadAdminRole, adminAllowed, roleLabel };
})();
