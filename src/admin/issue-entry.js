/* AcuarioNexo · acceso visible a incidencias */
(function () {
  function addIssueEntry() {
    if (!window.state?.user) return;
    if (document.getElementById('issueEntryBtn')) return;
    const heads = Array.from(document.querySelectorAll('.panel-head h2'));
    const title = heads.find(h => /Módulos|Modulos/i.test(h.textContent || ''));
    const actions = title?.closest('.panel')?.querySelector('.quick-actions');
    if (!actions || typeof window.reportIssueForm !== 'function') return;
    const btn = document.createElement('button');
    btn.id = 'issueEntryBtn';
    btn.innerHTML = '<span>⚠</span>Incidencia';
    btn.onclick = window.reportIssueForm;
    actions.appendChild(btn);
  }
  new MutationObserver(addIssueEntry).observe(document.body, { childList: true, subtree: true });
  setInterval(addIssueEntry, 1500);
  setTimeout(addIssueEntry, 500);
})();
