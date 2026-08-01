/* AcuarioNexo · herramientas de tipo de ficha */
(function () {
  function core() { return window.ANX?.LibraryV3Core; }
  function esc(value) { return window.ANX?.esc ? window.ANX.esc(value) : String(value ?? ''); }
  function byId(id) { return window.ANX?.byId ? window.ANX.byId(id) : document.getElementById(id); }

  function injectTypeEditor(id) {
    const C = core();
    const x = C?.row?.(id);
    if (!C || !x || byId('libraryTypeEditor')) return;
    const h2 = Array.from(document.querySelectorAll('h2')).find(el => /Editar ficha/i.test(el.textContent || ''));
    if (!h2 || !h2.parentNode) return;
    const options = C.types
      .filter(([key]) => key !== 'all')
      .map(([key, label]) => `<option value="${esc(key)}" ${key === x.entry_type ? 'selected' : ''}>${esc(label)}</option>`)
      .join('');
    const box = document.createElement('div');
    box.id = 'libraryTypeEditor';
    box.className = 'notice';
    box.innerHTML = `<b>Tipo de ficha actual:</b><br><select id="libEntryType">${options}</select><button onclick="guardarTipoFicha('${esc(id)}')">Aplicar tipo</button><p class="small">Si una ficha de pez pide Fabricante, Marca o Componentes activos, el tipo está mal asignado. Cambia aquí a Pez marino o Pez de agua dulce.</p><div id="typeStatus"></div>`;
    h2.insertAdjacentElement('afterend', box);
  }

  window.guardarTipoFicha = async function (id) {
    const ANX = window.ANX;
    const C = core();
    const box = byId('typeStatus');
    const x = C?.row?.(id);
    const entryType = byId('libEntryType')?.value;
    try {
      if (!ANX?.supabase || !ANX?.state?.user) throw new Error('Sesión no disponible.');
      if (!x) throw new Error('Ficha no encontrada.');
      if (!entryType || !C.labels[entryType]) throw new Error('Tipo de ficha no válido.');
      if (box) box.innerHTML = ANX.msg('Actualizando tipo de ficha...');
      const payload = {
        entry_type: entryType,
        data: {},
        sections: { summary: x.summary || '' },
        status: 'review',
        validation_result: null,
        validated_by: null,
        validated_at: null,
        published_at: null,
        updated_at: new Date().toISOString()
      };
      const { error } = await ANX.supabase.from('library_entries').update(payload).eq('id', id).eq('user_id', ANX.state.user.id);
      if (error) throw error;
      Object.assign(x, payload);
      if (box) box.innerHTML = ANX.msg(`Tipo cambiado a ${C.typeName(entryType)}. Pega ahora la ficha correcta.`, 'success');
      if (typeof window.formFicha === 'function') setTimeout(() => window.formFicha(id), 350);
    } catch (error) {
      if (box) box.innerHTML = ANX?.msg ? ANX.msg(error.message, 'error') : error.message;
    }
  };

  const originalFormFicha = window.formFicha;
  if (typeof originalFormFicha === 'function' && !originalFormFicha.__typeToolsWrapped) {
    const wrapped = function (id) {
      const result = originalFormFicha.apply(this, arguments);
      setTimeout(() => injectTypeEditor(id), 0);
      return result;
    };
    wrapped.__typeToolsWrapped = true;
    window.formFicha = wrapped;
  }
})();
