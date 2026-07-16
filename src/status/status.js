/* AcuarioNexo · Centro de Estado */
(function () {
  const ANX = window.ANX = window.ANX || {};

  window.statusCenter = async function () {
    if (!ANX.state?.user) return window.login?.();
    ANX.render(`<section class="panel status-page"><div class="status-loading"><strong>Comprobando el estado de AcuarioNexo...</strong><span>Cuenta, servicios, avisos y versión</span></div></section>`, 'inicio');
    try {
      const data = await ANX.StatusCore.collect();
      ANX.render(ANX.StatusUI.render(data), 'inicio');
      window.AcuarioNexoStatusSnapshot = data;
      return data;
    } catch (error) {
      ANX.render(`<section class="panel"><h2>Centro de Estado</h2>${ANX.msg(error?.message || 'No se pudo completar la comprobación.', 'error')}<button onclick="settings()">Volver a Ajustes</button></section>`, 'inicio');
      return null;
    }
  };

  ANX.Status = { open: window.statusCenter };
})();