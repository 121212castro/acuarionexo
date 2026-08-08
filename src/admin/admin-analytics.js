/* AcuarioNexo · panel de analítica privado */
(function () {
  const ANX = window.ANX;
  if (!ANX) return;

  function esc(value) {
    return ANX.esc ? ANX.esc(value) : String(value ?? '');
  }

  function metric(label, value, description) {
    return `<article class="summary-card"><div><small>${esc(label)}</small><h2>${esc(value)}</h2><p>${esc(description || '')}</p></div></article>`;
  }

  function listRows(items, labelKey, valueKey) {
    if (!Array.isArray(items) || !items.length) return '<p class="small">Aún no hay datos.</p>';
    return `<div class="admin-analytics-list">${items.map(function (item) {
      return `<div class="admin-analytics-row"><span>${esc(item[labelKey] || 'Sin dato')}</span><strong>${esc(item[valueKey] ?? 0)}</strong></div>`;
    }).join('')}</div>`;
  }

  function dailyRows(items) {
    if (!Array.isArray(items) || !items.length) return '<p class="small">Aún no hay datos diarios.</p>';
    const max = Math.max.apply(null, items.map(function (item) { return Number(item.views) || 0; }).concat([1]));
    return `<div class="admin-analytics-daily">${items.map(function (item) {
      const width = Math.max(4, Math.round(((Number(item.views) || 0) / max) * 100));
      return `<div class="admin-analytics-day"><span>${esc(item.date)}</span><div class="admin-analytics-bar-wrap"><div class="admin-analytics-bar" style="width:${width}%"></div></div><strong>${esc(item.views || 0)}</strong><small>${esc(item.sessions || 0)} sesiones</small></div>`;
    }).join('')}</div>`;
  }

  function analyticsStyles() {
    if (document.getElementById('adminAnalyticsStyles')) return;
    const style = document.createElement('style');
    style.id = 'adminAnalyticsStyles';
    style.textContent = `
      .admin-analytics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
      .admin-analytics-list{display:grid;gap:8px}
      .admin-analytics-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(128,128,128,.18)}
      .admin-analytics-row:last-child{border-bottom:0}
      .admin-analytics-daily{display:grid;gap:10px}
      .admin-analytics-day{display:grid;grid-template-columns:90px minmax(120px,1fr) 50px 90px;align-items:center;gap:10px}
      .admin-analytics-bar-wrap{height:10px;border-radius:999px;background:rgba(128,128,128,.16);overflow:hidden}
      .admin-analytics-bar{height:100%;border-radius:999px;background:currentColor;opacity:.72}
      @media(max-width:640px){.admin-analytics-day{grid-template-columns:78px 1fr 36px}.admin-analytics-day small{grid-column:2/4}}
    `;
    document.head.appendChild(style);
  }

  window.adminAnalytics = async function () {
    const requireAdmin = window.ANX.Admin?.requireAdmin;
    if (typeof requireAdmin === 'function' && !await requireAdmin()) return;
    analyticsStyles();
    ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Analítica</h2><p>Actividad de AcuarioNexo</p></div></section>
      <section class="panel"><button onclick="adminPanel()">← Admin</button>${ANX.msg ? ANX.msg('Cargando analítica...') : '<p>Cargando...</p>'}</section>`, 'admin');

    try {
      const { data, error } = await ANX.supabase.rpc('admin_analytics_summary');
      if (error) throw error;
      const d = data || {};
      ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Analítica</h2><p>Datos propios de AcuarioNexo · solo con consentimiento</p></div></section>
        <section class="panel">
          <div class="panel-head"><h2>Resumen</h2><button onclick="adminPanel()">← Admin</button></div>
          <div class="quick-actions">
            ${metric('Activos ahora', d.activeNow || 0, 'Sesiones con actividad en los últimos 5 min')}
            ${metric('Visitas hoy', d.visitsToday || 0, `${d.sessionsToday || 0} sesiones`)}
            ${metric('Visitas 7 días', d.visits7d || 0, `${d.sessions7d || 0} sesiones`)}
            ${metric('Visitas 30 días', d.visits30d || 0, `${d.sessions30d || 0} sesiones`)}
          </div>
          <p class="small">Estos datos son recogidos por AcuarioNexo después de que el visitante acepte analítica. Google Analytics continúa funcionando por separado.</p>
        </section>
        <section class="panel"><div class="panel-head"><h2>Últimos 14 días</h2></div>${dailyRows(d.daily)}</section>
        <section class="admin-analytics-grid">
          <section class="panel"><div class="panel-head"><h2>Páginas</h2></div>${listRows(d.topPages, 'page', 'views')}</section>
          <section class="panel"><div class="panel-head"><h2>Dispositivos</h2></div>${listRows(d.devices, 'device', 'views')}</section>
          <section class="panel"><div class="panel-head"><h2>Origen</h2></div>${listRows(d.referrers, 'source', 'views')}</section>
          <section class="panel"><div class="panel-head"><h2>Países</h2></div>${listRows(d.countries, 'country', 'views')}</section>
        </section>
        <section class="panel">
          <div class="quick-actions">
            <button onclick="adminAnalytics()"><span>↻</span>Actualizar</button>
            <button onclick="window.open('https://analytics.google.com/analytics/web/','_blank','noopener')"><span>↗</span>Abrir Google Analytics</button>
          </div>
        </section>`, 'admin');
    } catch (e) {
      ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Analítica</h2><p>Error</p></div></section>
        <section class="panel"><button onclick="adminPanel()">← Admin</button>${ANX.msg ? ANX.msg(e.message || 'No se pudo cargar la analítica.', 'error') : `<p>${esc(e.message)}</p>`}</section>`, 'admin');
    }
  };

  function injectButton() {
    if (document.getElementById('adminAnalyticsButton')) return;
    const headings = Array.from(document.querySelectorAll('.panel-head h2'));
    const targetHeading = headings.find(function (node) { return /Administración|Control general/i.test(node.textContent || ''); });
    const panel = targetHeading?.closest('.panel');
    const actions = panel?.querySelector('.quick-actions');
    if (!actions) return;
    const button = document.createElement('button');
    button.id = 'adminAnalyticsButton';
    button.setAttribute('onclick', 'adminAnalytics()');
    button.innerHTML = '<span>▥</span>Analítica';
    actions.appendChild(button);
  }

  const observer = new MutationObserver(injectButton);
  observer.observe(document.body, { childList: true, subtree: true });
  injectButton();
})();
