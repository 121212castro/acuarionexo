/* AcuarioNexo · Biblioteca V3 IA */
(function () {
  const { supabase, state, esc, byId, val, msg, render } = window.ANX;
  const { types, libraryInfoNotice } = window.ANX.LibraryV3Core;

  async function call(fn, body) {
    const r = await supabase.functions.invoke(fn, { body });
    if (r.error) throw new Error(r.error.message || 'Error en función IA.');
    return r.data;
  }

  window.nuevaFichaV3 = function () {
    render(`<section class="panel">${libraryInfoNotice()}<button onclick="biblioteca()">← Biblioteca</button><h2>Identificar nueva entrada</h2><label>Tipo</label><select id="entryType">${types.filter(([k]) => k !== 'all').map(([k,n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select><label>Nombre, descripción o producto</label><textarea id="identifyText" placeholder="Ej. Amphiprion ocellaris, sal Red Sea, test NO3..."></textarea><button class="primary" onclick="buscarIdentify()">Identificar</button><div id="aiBox"></div></section>`, 'biblioteca');
  };

  window.buscarIdentify = async function () {
    const box = byId('aiBox');
    try {
      box.innerHTML = msg('Identificando...');
      const data = await call('library-identify', { entry_type: val('entryType'), text: val('identifyText') });
      state.lastIdentify = data.result || data;
      box.innerHTML = `${msg('Identificación lista. Revisa antes de generar ficha.', 'success')}<pre>${esc(JSON.stringify(state.lastIdentify, null, 2))}</pre><button class="primary" onclick="crearBorradorV3()">Crear borrador</button>`;
    } catch (e) {
      box.innerHTML = msg(e.message, 'error');
    }
  };

  window.crearBorradorV3 = async function () {
    const box = byId('aiBox');
    try {
      box.innerHTML = msg('Generando borrador completo...');
      const data = await call('library-generate-draft', { identity: state.lastIdentify, entry_type: val('entryType') });
      await biblioteca();
      formFicha(data.data.id);
      const saved = (state.libraryRows || []).find(x => String(x.id) === String(data.data.id));
      const statusBox = byId('x');
      if (saved && window.ANX.LibraryV3Ficha?.assertComplete) {
        try {
          window.ANX.LibraryV3Ficha.assertComplete(saved, 'La IA no puede dejar campos vacíos');
          if (statusBox) statusBox.innerHTML = msg('Borrador completo creado por IA.', 'success');
        } catch (auditError) {
          if (statusBox) statusBox.innerHTML = window.ANX.LibraryV3Ficha.auditHtml(auditError.audit, 10);
        }
      }
    } catch (e) {
      box.innerHTML = msg(e.message, 'error');
    }
  };

  window.ANX.LibraryV3AI = {
    call
  };
})();
