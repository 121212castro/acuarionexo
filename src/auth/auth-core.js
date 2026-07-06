/* AcuarioNexo · Auth core */
(function () {
  function authMessage(error) {
    const text = String(error?.message || error || '');
    if (/load failed|failed to fetch|network|timeout|522/i.test(text)) {
      return 'Supabase no está respondiendo ahora mismo. El proyecto recibe la petición, pero Auth/Postgres termina en timeout 522.';
    }
    return text || 'No se pudo completar la operación.';
  }

  function withAuthTimeout(promise, seconds = 18) {
    let timeoutId;
    const timeout = new Promise(function (_resolve, reject) {
      timeoutId = setTimeout(function () { reject(new Error('timeout')); }, seconds * 1000);
    });
    return Promise.race([promise, timeout]).finally(function () { clearTimeout(timeoutId); });
  }

  async function refreshAdminSafe() {
    const { state } = window.ANX;
    try {
      if (window.refreshAdminAccess) await window.refreshAdminAccess();
    } catch (_) {
      state.adminRole = null;
      state.isAdmin = false;
    }
  }

  function clearAuthState() {
    const { state } = window.ANX;
    state.user = null;
    state.adminRole = null;
    state.isAdmin = false;
  }

  function updateSessionHeader() {
    const { byId, state } = window.ANX;
    byId('logoutBtn')?.classList.toggle('hidden', !state.user);
    const text = byId('connectionText');
    if (text) text.textContent = state.user ? 'Conectado a Supabase' : 'Sin sesión';
  }

  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { authMessage, withAuthTimeout, refreshAdminSafe, clearAuthState, updateSessionHeader });
  window.ANX.AuthCore = { authMessage, withAuthTimeout, refreshAdminSafe, clearAuthState, updateSessionHeader };
})();