/* AcuarioNexo · Biblioteca V3 IA */
(function () {
  const { supabase, state, esc, byId, val, msg, render } = window.ANX;
  const { types, libraryInfoNotice, S } = window.ANX.LibraryV3Core;

  async function call(fn, body) {
    const r = await supabase.functions.invoke(fn, { body });
    if (r.error) throw new Error(r.error.message || 'Error en función IA.');
    return r.data;
  }

  function requiredContract(entryType) {
    const fields = S.CONTRACTS[entryType] || [];
    const labels = Object.fromEntries(S.templateFor(entryType).flatMap(section => section.fields.map(field => [field.id, field.label])));
    return fields.map(id => ({ id, label: labels[id] || id }));
  }

  function draftInstructions(entryType) {
    const required = requiredContract(entryType);
    return {
      mode: 'complete_required_contract',
      entry_type: entryType,
      required_fields: required,
      hard_rules: [
        'Todos los campos de required_fields son obligatorios.',
        'No devuelvas campos vacíos, null, undefined, pendiente, desconocido, no indicado ni sin datos.',
        'Si no puedes contrastar un campo con fuentes reales, no crees el borrador y devuelve error.',
        'Cada valor debe ser concreto y útil para AcuarioNexo.',
        'No uses bajo, medio, alto, moderado, suele, normalmente ni aproximadamente.',
        'No incluyas URLs dentro de campos de texto; las URLs solo pueden ir en sources.',
        'sources debe contener al menos 3 fuentes reales con URL completa y dato que justifica: una oficial o primaria, una base especializada adecuada a la categoría y una tercera fuente fiable.'
      ]
    };
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
      box.innerHTML = `${msg('Identificación lista. Revisa antes de generar ficha.', 'success')}<pre>${esc(JSON.stringify(state.lastIdentify, null, 2))}</pre><button class="primary" onclick="crearBorradorV3()">Crear borrador completo obligatorio</button>`;
    } catch (e) {
      box.innerHTML = msg(e.message, 'error');
    }
  };

  window.crearBorradorV3 = async function () {
    const box = byId('aiBox');
    try {
      const entryType = val('entryType');
      const contract = draftInstructions(entryType);
      box.innerHTML = msg(`Generando borrador completo obligatorio: ${contract.required_fields.length} campos...`);
      const data = await call('library-generate-draft', {
        identity: state.lastIdentify,
        entry_type: entryType,
        contract,
        required_fields: contract.required_fields,
        require_complete: true,
        reject_empty_fields: true,
        minimum_sources: 3
      });
      await biblioteca();
      formFicha(data.data.id);
      const saved = (state.libraryRows || []).find(x => String(x.id) === String(data.data.id));
      const statusBox = byId('x');
      if (saved && window.ANX.LibraryV3Ficha?.assertComplete) {
        try {
          window.ANX.LibraryV3Ficha.assertComplete(saved, 'La IA no puede dejar campos vacíos');
          if (statusBox) statusBox.innerHTML = msg('Borrador completo creado por IA.', 'success');
        } catch (auditError) {
          if (statusBox) statusBox.innerHTML = `${msg('La IA dejó campos obligatorios vacíos. Borrador bloqueado.', 'error')}${window.ANX.LibraryV3Ficha.auditHtml(auditError.audit, 10)}`;
        }
      }
    } catch (e) {
      box.innerHTML = msg(e.message, 'error');
    }
  };

  window.ANX.LibraryV3AI = {
    call,
    requiredContract,
    draftInstructions
  };
})();
