/* AcuarioNexo · control centralizado de acceso a IA */
(function () {
  const ANX = window.ANX = window.ANX || {};
  let cached = null;
  let cachedAt = 0;

  function roleName() {
    return String(ANX.state?.adminRole?.role || '').trim().toLowerCase();
  }

  function isOwner() {
    return !!ANX.state?.isAdmin && roleName() === 'owner';
  }

  async function refreshAccess(force) {
    const now = Date.now();
    if (!force && cached && now - cachedAt < 30000) return cached;
    if (!ANX.state?.user || !ANX.supabase) {
      cached = { allowed: false, source: 'signed_out', plan: 'none', label: 'Sin acceso', note: 'Inicia sesión.' };
      cachedAt = now;
      return cached;
    }
    try {
      const { data, error } = await ANX.supabase.rpc('app_entitlements');
      if (error) throw error;
      cached = {
        allowed: data?.ai_allowed === true,
        source: data?.admin ? 'admin' : String(data?.plan || 'free'),
        plan: String(data?.plan || 'free'),
        label: data?.ai_allowed ? (data?.admin ? 'Administrador' : 'Acceso interno') : 'Beta',
        note: data?.ai_allowed
          ? 'Las funciones de IA están habilitadas para esta cuenta.'
          : 'La IA no está disponible durante la beta cerrada. Biblioteca y funciones manuales siguen disponibles.'
      };
    } catch (_) {
      cached = {
        allowed: isOwner(),
        source: isOwner() ? 'owner-fallback' : 'free-fallback',
        plan: isOwner() ? 'pro' : 'free',
        label: isOwner() ? 'Propietario' : 'Beta',
        note: isOwner() ? 'Acceso interno de propietario.' : 'No se pudo validar el acceso; IA bloqueada por seguridad.'
      };
    }
    cachedAt = now;
    return cached;
  }

  function deny() {
    const text = 'Esta función usa IA/API y no está disponible durante la beta cerrada. Puedes seguir usando la Biblioteca y tu acuario de forma manual.';
    if (typeof ANX.render === 'function' && typeof ANX.msg === 'function') {
      ANX.render('<section class="panel"><h2>IA no disponible en beta</h2>' + ANX.msg(text, 'error') + '<button onclick="dashboard()">Volver</button></section>', 'inicio');
    } else {
      alert(text);
    }
    return false;
  }

  function patchAI() {
    ['iaAcuarioNexo', 'crearAvisosIA'].forEach(function (name) {
      const original = window[name];
      if (typeof original !== 'function' || original.__anxAiAccessWrapped) return;
      const wrapped = async function () {
        const current = await refreshAccess();
        if (!current.allowed) return deny();
        return original.apply(this, arguments);
      };
      wrapped.__anxAiAccessWrapped = true;
      window[name] = wrapped;
    });
  }

  function patchSettings() {
    const original = window.settings;
    if (typeof original !== 'function' || original.__anxAiAccessWrapped) return;
    const wrapped = function () {
      const result = original.apply(this, arguments);
      setTimeout(async function () {
        const current = await refreshAccess(true);
        const card = document.querySelector('.settings-premium');
        if (!card) return;
        card.classList.toggle('active', current.allowed);
        const badge = card.querySelector('.premium-badge');
        const description = card.querySelector('p');
        const button = card.querySelector('button');
        if (badge) badge.textContent = current.allowed ? current.label.toUpperCase() : 'BETA';
        if (description) description.textContent = current.note;
        if (button && current.allowed && current.source === 'admin') {
          button.textContent = 'Acceso completo';
          button.classList.remove('primary');
          button.disabled = true;
        }
      }, 0);
      return result;
    };
    wrapped.__anxAiAccessWrapped = true;
    window.settings = wrapped;
  }

  function patchStatus() {
    const core = ANX.StatusCore;
    if (!core || typeof core.collect !== 'function' || core.collect.__anxAiAccessWrapped) return;
    const original = core.collect;
    const wrapped = async function () {
      const data = await original.apply(this, arguments);
      const current = await refreshAccess();
      data.ai = {
        ...(data.ai || {}),
        level: current.allowed ? 'ok' : 'warning',
        enabled: current.allowed,
        plan: current.plan,
        accessSource: current.source,
        note: current.note
      };
      return data;
    };
    wrapped.__anxAiAccessWrapped = true;
    core.collect = wrapped;
  }

  function install() {
    patchAI();
    patchSettings();
    patchStatus();
  }

  ANX.AIAccess = { refresh: refreshAccess, isOwner, install };
  install();
  window.setInterval(install, 1000);
})();
