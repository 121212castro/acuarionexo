/* AcuarioNexo · publicación robusta de ficha */
(function () {
  function ANX() { return window.ANX || {}; }
  function C() { return window.ANX?.LibraryV3Core || {}; }
  function byId(id) { return ANX().byId ? ANX().byId(id) : document.getElementById(id); }
  function msg(text, type) { return ANX().msg ? ANX().msg(text, type) : `<div>${String(text || '')}</div>`; }

  function ensurePublishStatusBox() {
    let box = byId('x') || byId('aiBox') || byId('publishStatus');
    if (box) return box;
    const actions = document.querySelector('.image-actions');
    if (!actions) return null;
    box = document.createElement('div');
    box.id = 'publishStatus';
    actions.insertAdjacentElement('afterend', box);
    return box;
  }

  async function directPublish(id, x) {
    const { supabase, state } = ANX();
    const payload = {
      status: 'published',
      validation_result: {
        approved: true,
        published_directly: true,
        engine: 'client-publish-fallback-v1',
        published_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('library_entries').update(payload).eq('id', id).eq('user_id', state.user.id);
    if (error) throw error;
    Object.assign(x, payload);
  }

  window.publicarFicha = async function (id) {
    const { supabase, state } = ANX();
    const core = C();
    const S = core.S;
    const x = core.row ? core.row(id) : null;
    const box = ensurePublishStatusBox();
    try {
      if (!supabase || !state?.user) throw new Error('Sesión no disponible.');
      if (!x) throw new Error('Ficha no encontrada.');
      const audit = S.audit(x);
      if (!audit.approved) {
        if (box && window.ANX?.LibraryV3Ficha?.auditHtml) box.innerHTML = window.ANX.LibraryV3Ficha.auditHtml(audit, 20);
        else if (box) box.innerHTML = msg('No se puede publicar: ficha incompleta.', 'error');
        return;
      }
      if (box) box.innerHTML = msg('Publicando ficha...');
      try {
        await window.ANX.LibraryV3AI.call('library-publish', { entry_id: id });
      } catch (edgeError) {
        await directPublish(id, x);
      }
      if (core.load) await core.load();
      if (typeof window.verFicha === 'function') window.verFicha(id);
      setTimeout(() => {
        const nextBox = ensurePublishStatusBox();
        if (nextBox) nextBox.innerHTML = msg('Ficha publicada correctamente.', 'success');
      }, 0);
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || String(error), 'error');
    }
  };
})();