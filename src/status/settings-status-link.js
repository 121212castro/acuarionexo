/* AcuarioNexo · enlace Ajustes → Centro de Estado */
(function () {
  function inject() {
    const page = document.querySelector('.settings-page');
    if (!page || page.querySelector('[data-status-link]')) return;
    const sections = Array.from(page.querySelectorAll('.settings-section'));
    const target = sections.find(section => /Diagnóstico y soporte/i.test(section.textContent || ''));
    const body = target?.querySelector('.settings-body');
    if (!body) return;
    const row = document.createElement('div');
    row.className = 'settings-row';
    row.dataset.statusLink = 'true';
    row.innerHTML = '<div><strong>Centro de Estado</strong><small>Versión, cuenta, conexión, notificaciones, soporte e IA</small></div><div class="settings-control"><button onclick="statusCenter()">Abrir</button></div>';
    body.appendChild(row);
  }

  const observer = new MutationObserver(inject);
  observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  inject();
  window.AcuarioNexoStatusLink = { inject };
})();