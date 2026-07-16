/* AcuarioNexo · enlace Ajustes → Soporte */
(function () {
  const originalSettings = window.settings;
  if (typeof originalSettings !== 'function' || originalSettings.__supportLinked) return;

  function injectSupportActions() {
    const sections = Array.from(document.querySelectorAll('.settings-section'));
    const target = sections.find(function (section) {
      return /Diagnóstico y soporte/i.test(section.querySelector('summary')?.textContent || '');
    });
    const body = target?.querySelector('.settings-body');
    if (!body || body.querySelector('[data-support-actions]')) return;
    const block = document.createElement('div');
    block.dataset.supportActions = 'true';
    block.className = 'settings-row settings-support-actions';
    block.innerHTML = '<div><strong>Ayuda y soporte</strong><small>Reporta fallos, propón mejoras y consulta el estado de tus incidencias</small></div><div class="settings-control"><button onclick="support()">Abrir soporte</button></div>';
    body.appendChild(block);
  }

  const wrapped = function () {
    const result = originalSettings.apply(window, arguments);
    requestAnimationFrame(injectSupportActions);
    return result;
  };
  wrapped.__supportLinked = true;
  window.settings = wrapped;
})();