/* AcuarioNexo · control centralizado de acceso a IA */
(function () {
  const ANX = window.ANX = window.ANX || {};

  function roleName() {
    return String(ANX.state?.adminRole?.role || '').trim().toLowerCase();
  }

  function isOwner() {
    return !!ANX.state?.isAdmin && roleName() === 'owner';
  }

  function settings() {
    return window.AcuarioNexoSettings?.load?.() || { plan: 'free' };
  }

  function access() {
    const current = settings();
    if (isOwner()) {
      return {
        allowed: true,
        source: 'owner',
        plan: current.plan || 'free',
        label: 'Propietario',
        note: 'Acceso completo concedido por el rol owner, sin depender de una suscripción.'
      };
    }
    if (current.plan && current.plan !== 'free') {
      return {
        allowed: true,
        source: 'subscription',
        plan: current.plan,
        label: 'Pro',
        note: 'Acceso habilitado por el plan de la cuenta.'
      };
    }
    return {
      allowed: false,
      source: 'free',
      plan: current.plan || 'free',
      label: 'Gratis',
      note: 'Las funciones de IA requieren un plan de pago.'
    };
  }

  function deny() {
    const text = 'La inteligencia artificial requiere un plan Pro para esta cuenta.';
    if (typeof ANX.render === 'function' && typeof ANX.msg === 'function') {
      ANX.render('<section class="panel"><h2>IA AcuarioNexo</h2>' + ANX.msg(text, 'error') + '</section>', 'avisos');
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
        if (!access().allowed) return deny();
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
      const apply = function () {
        const current = access();
        if (!current.allowed || current.source !== 'owner') return;
        const card = document.querySelector('.settings-premium');
        if (!card) return;
        card.classList.add('active');
        const badge = card.querySelector('.premium-badge');
        const description = card.querySelector('p');
        const button = card.querySelector('button');
        if (badge) badge.textContent = 'OWNER';
        if (description) description.textContent = current.note;
        if (button) {
          button.textContent = 'Acceso completo';
          button.classList.remove('primary');
          button.disabled = true;
        }
      };
      setTimeout(apply, 0);
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
      const current = access();
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

  function patchLoader() {
    const original = ANX.loadModuleGroup;
    if (typeof original !== 'function' || original.__anxAiAccessWrapped) return;
    const wrapped = async function () {
      const result = await original.apply(this, arguments);
      install();
      return result;
    };
    wrapped.__anxAiAccessWrapped = true;
    ANX.loadModuleGroup = wrapped;
  }

  ANX.AIAccess = { access, isOwner, install };
  install();
  patchLoader();
})();
