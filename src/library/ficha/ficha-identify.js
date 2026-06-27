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

  window.ANX.LibraryIdentify.functionErrorMessage = functionErrorMessage;
})();
