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

  window.ANX.LibraryIdentify.functionErrorMessage = functionErrorMessage;
})();
