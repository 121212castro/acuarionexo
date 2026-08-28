/* AcuarioNexo · Admin core */
(function () {
  const ADMIN_ROLES = new Set(['owner', 'admin', 'trusted_admin']);

  function adminAllowed() {
    const { state } = window.ANX;
    return !!state.user && ADMIN_ROLES.has(state.adminRole?.role);
  }

  function roleLabel(role) {
    return ({ owner: 'Propietario', admin: 'Admin', trusted_admin: 'Usuario de confianza' })[role] || 'Sin permiso';
  }

  async function loadAdminRole() {
    const { supabase, state } = window.ANX;
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
    const { supabase } = window.ANX;
    let query = supabase.from(table).select('id', { count: 'exact', head: true });
    if (filter) query = filter(query);
    const { count, error } = await query;
    if (error) return 'Error';
    return count ?? 0;
  }

  async function adminStats() {
    const { data, error } = await window.ANX.supabase.rpc('admin_dashboard_stats');
    if (error) throw error;
    const d = data || {};
    return {
      libraryReview: Number(d.libraryReview) || 0,
      libraryValidated: Number(d.libraryValidated) || 0,
      aquariums: Number(d.aquariums) || 0,
      inventory: Number(d.inventory) || 0,
      microfauna: Number(d.microfauna) || 0,
      reports: Number(d.reports) || 0,
      aiUsage: Number(d.aiUsage) || 0,
      generationPending: Number(d.generationPending) || 0,
      generationErrors: Number(d.generationErrors) || 0
    };
  }

  async function syncOpenAiUsage() {
    if (!window.ANX?.supabase || !adminAllowed()) return null;
    try {
      const { data, error } = await window.ANX.supabase.functions.invoke('admin-sync-openai-usage', { body: {} });
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.warn('OPENAI_USAGE_SYNC_FAILED', error);
      return null;
    }
  }

  function installRuntimeGuards() {
    let lastAiUsage = null;
    let lastRetry = null;
    setInterval(function () {
      const aiUsage = window.adminAiUsage;
      if (typeof aiUsage === 'function' && aiUsage !== lastAiUsage && !aiUsage.__anxUsageWrapped) {
        const original = aiUsage;
        const wrapped = async function () {
          await syncOpenAiUsage();
          return original.apply(window, arguments);
        };
        wrapped.__anxUsageWrapped = true;
        lastAiUsage = wrapped;
        window.adminAiUsage = wrapped;
      }

      const retry = window.adminGeneratorRetry;
      if (typeof retry === 'function' && retry !== lastRetry && !retry.__anxResumeWrapped) {
        const wrappedRetry = async function (id) {
          if (window.ANX?.Admin?.requireAdmin && !await window.ANX.Admin.requireAdmin()) return;
          const { data, error } = await window.ANX.supabase.rpc('admin_resume_library_generation_job', { p_job_id: id });
          if (error) {
            if (window.ANX?.AdminLibraryGenerator?.renderQueue) return window.ANX.AdminLibraryGenerator.renderQueue(error.message || 'No se pudo reanudar.');
            throw error;
          }
          if (window.ANX?.AdminLibraryGenerator?.renderQueue) {
            const row = Array.isArray(data) ? data[0] : data;
            return window.ANX.AdminLibraryGenerator.renderQueue(row?.status === 'generating' ? 'Trabajo reanudado desde el checkpoint guardado.' : 'Trabajo devuelto a la cola.');
          }
        };
        wrappedRetry.__anxResumeWrapped = true;
        lastRetry = wrappedRetry;
        window.adminGeneratorRetry = wrappedRetry;
      }
    }, 500);
  }

  function adminBlocked() {
    const { msg, render } = window.ANX;
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Admin</h2><p>Acceso restringido</p></div></section>
      <section class="panel">${msg('No tienes permiso para abrir el panel Admin.', 'error')}<button onclick="dashboard()">Volver</button></section>`, 'inicio');
  }

  installRuntimeGuards();
  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { ADMIN_ROLES, adminAllowed, roleLabel, loadAdminRole, countTable, adminStats, adminBlocked, syncOpenAiUsage });
  window.ANX.AdminCore = { ADMIN_ROLES, adminAllowed, roleLabel, loadAdminRole, countTable, adminStats, adminBlocked, syncOpenAiUsage };
})();