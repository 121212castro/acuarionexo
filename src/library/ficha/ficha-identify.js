/* AcuarioNexo · Biblioteca · ficha-identify */
(function () {
  const { supabase, esc, byId, val, msg, render } = window.ANX;
  const productTypes = new Set(['medicamento', 'sal', 'aditivo', 'alimento', 'equipamiento', 'test']);

  window.ANX.LibraryIdentify = window.ANX.LibraryIdentify || {};

  async function functionErrorMessage(error) {
    const fallback = error?.message || 'No se pudo generar la ficha con IA real.';
    try {
      const context = error?.context;
      if (context && typeof context.json === 'function') {
        const body = await context.json();
        return body?.message || body?.error || fallback;
      }
    } catch (_) {}
    return fallback;
  }

  window.mostrarIdentify = function () {
    const nombreComun = val('libTitle');
    const nombreCientifico = val('libScientific');
    const marca = val('libManufacturer') || (productTypes.has(val('libType')) ? val('libScientific') : '');
    render(`<section class="panel library-detail identify-v1"><button onclick="formFicha()">Volver</button>
      <h2>Identificar organismo/producto</h2>
      <div class="notice">
        <p><b>Sin identificar</b> = No ficha</p>
        <p><b>Sin investigar</b> = No ficha</p>
        <p><b>Sin validar</b> = No publicacion</p>
      </div>
      <label>Nombre comun</label><input id="identifyCommonName" value="${esc(nombreComun)}" placeholder="Ej. Pez payaso, Sal marina, Test de calcio...">
      <label>Nombre cientifico</label><input id="identifyScientificName" value="${esc(nombreCientifico)}" placeholder="Ej. Amphiprion ocellaris">
      <label>Marca</label><input id="identifyBrand" value="${esc(marca)}" placeholder="Solo productos: marca/fabricante">
      <button class="primary" type="button" onclick="buscarIdentify()">Buscar</button>
      <div id="identifyBox"></div>
    </section>`, 'biblioteca');
  };

  window.buscarIdentify = async function () {
    const nombreComun = val('identifyCommonName');
    const nombreCientifico = val('identifyScientificName');
    const marca = val('identifyBrand');
    const box = byId('identifyBox');
    if (!nombreComun && !nombreCientifico && !marca) {
      if (box) box.innerHTML = msg('Introduce al menos nombre comun, nombre cientifico o marca para empezar la identificacion.', 'error');
      return;
    }

    try {
      if (box) box.innerHTML = msg('Identificando con IA real...', 'notice');

      const { data, error } = await supabase.functions.invoke('library-generate-card', {
        body: {
          mode: 'identify',
          title: nombreComun,
          scientific_name: nombreCientifico,
          entry_type: val('libType') || 'general',
          notes: marca,
          source_context: {
            manufacturer: marca,
            source_notes: marca
          }
        }
      });

      if (error) throw new Error(await functionErrorMessage(error));

      const result = data?.data || data || {};
      window.ANX.LibraryIdentify.lastIdentifyResult = result;
      if (!result.identity_confirmed) {
        if (box) box.innerHTML = msg('Identificacion no validada. No se puede crear ficha.', 'error');
        return;
      }

      if (byId('libTitle')) byId('libTitle').value = result.title || nombreComun;
      if (byId('libScientific')) byId('libScientific').value = result.scientific_name || nombreCientifico;

      if (box) box.innerHTML = `<div class="success">
        Identificacion validada.<br>
        <b>${esc(result.title || '')}</b><br>
        ${esc(result.scientific_name || '')}<br><br>
        <button type="button" onclick="formFicha('', '${esc(result.entry_type || val('libType') || 'general')}')">Crear borrador</button>
      </div>`;
    } catch (e) {
      if (box) box.innerHTML = msg(e.message || 'Error en identificacion.', 'error');
    }
  };

  window.ANX.LibraryIdentify.functionErrorMessage = functionErrorMessage;
})();