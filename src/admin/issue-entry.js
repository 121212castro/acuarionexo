/* AcuarioNexo · acceso visible a incidencias */
(function () {
  function addIssueEntry() {
    if (!window.state?.user) return;
    const heads = Array.from(document.querySelectorAll('.panel-head h2'));
    const title = heads.find(h => /Módulos|Modulos/i.test(h.textContent || ''));
    const actions = title?.closest('.panel')?.querySelector('.quick-actions');
    if (!actions) return;
    if (!document.getElementById('issueEntryBtn') && typeof window.reportIssueForm === 'function') {
      const btn = document.createElement('button');
      btn.id = 'issueEntryBtn';
      btn.innerHTML = '<span>⚠</span>Incidencia';
      btn.onclick = window.reportIssueForm;
      actions.appendChild(btn);
    }
    if (!document.getElementById('testerInfoBtn')) {
      const info = document.createElement('button');
      info.id = 'testerInfoBtn';
      info.innerHTML = '<span>ⓘ</span>Versión';
      info.onclick = window.testerInfoPanel;
      actions.appendChild(info);
    }
  }

  window.testerInfoPanel = function () {
    const build = window.ACUARIONEXO_BUILD || 'sin build';
    const version = window.ACUARIONEXO_CONFIG?.APP_VERSION || 'AcuarioNexo';
    const stored = localStorage.getItem('acuarionexo:active-build') || 'sin registro';
    window.ANX.render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Versión</h2><p>Información para tester</p></div></section>
      <section class="panel">
        <button onclick="dashboard()">← Volver</button>
        <p><b>Build cargado:</b><br>${window.ANX.esc(build)}</p>
        <p><b>Versión:</b><br>${window.ANX.esc(version)}</p>
        <p><b>Build registrado:</b><br>${window.ANX.esc(stored)}</p>
        <button class="primary" onclick="AcuarioNexoUpdate?.forceReload?.()">Limpiar caché y recargar</button>
      </section>`, 'inicio');
  };

  new MutationObserver(addIssueEntry).observe(document.body, { childList: true, subtree: true });
  setInterval(addIssueEntry, 1500);
  setTimeout(addIssueEntry, 500);
})();
