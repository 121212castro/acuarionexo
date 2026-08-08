/* AcuarioNexo · planes y derechos de cuenta */
(function () {
  const ANX = window.ANX = window.ANX || {};
  let pending = null;

  function fallback() {
    const role = String(ANX.state?.adminRole?.role || '').toLowerCase();
    const admin = !!ANX.state?.isAdmin && ['owner', 'admin', 'trusted_admin'].includes(role);
    return {
      authenticated: !!ANX.state?.user,
      plan: admin ? 'pro' : 'free',
      ai_allowed: admin,
      aquarium_limit: admin ? null : 1,
      admin,
      role: role || null
    };
  }

  async function refresh(force) {
    if (!ANX.state?.user || !ANX.supabase) {
      ANX.state.entitlements = fallback();
      return ANX.state.entitlements;
    }
    if (!force && ANX.state.entitlements?.authenticated) return ANX.state.entitlements;
    if (pending) return pending;
    pending = (async function () {
      try {
        const { data, error } = await ANX.supabase.rpc('app_entitlements');
        if (error) throw error;
        ANX.state.entitlements = data || fallback();
      } catch (_) {
        ANX.state.entitlements = fallback();
      } finally {
        pending = null;
      }
      return ANX.state.entitlements;
    })();
    return pending;
  }

  function current() {
    return ANX.state?.entitlements || fallback();
  }

  function canUseAI() {
    return current().ai_allowed === true;
  }

  function aquariumLimit() {
    const value = current().aquarium_limit;
    return value === null || value === undefined ? null : Number(value);
  }

  ANX.PlanAccess = { refresh, current, canUseAI, aquariumLimit };
})();
