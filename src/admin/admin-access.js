/* AcuarioNexo · solicitudes de acceso */
(function () {
  const ANX = window.ANX;
  if (!ANX) return;

  function esc(value) { return ANX.esc ? ANX.esc(value) : String(value ?? ''); }

  function statusLabel(status) {
    return ({ pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' })[status] || status;
  }

  window.adminAccessRequests = async function () {
    const requireAdmin = window.ANX.Admin?.requireAdmin;
    if (typeof requireAdmin === 'function' && !await requireAdmin()) return;
    ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Solicitudes de acceso</h2><p>Control de nuevas altas</p></div></section>
      <section class="panel"><button onclick="adminPanel()">← Admin</button>${ANX.msg('Cargando solicitudes...')}</section>`, 'admin');
    try {
      const { data, error } = await ANX.supabase.rpc('admin_access_requests');
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const pending = rows.filter(r => r.status === 'pending');
      const history = rows.filter(r => r.status !== 'pending');
      const requestHtml = pending.length ? pending.map(function (r) {
        return `<article class="summary-card"><div>
          <small>${esc(new Date(r.created_at).toLocaleString('es-ES'))}</small>
          <h3>${esc(r.name || 'Sin nombre')}</h3>
          <p><strong>${esc(r.email)}</strong></p>
          ${r.message ? `<p>${esc(r.message)}</p>` : ''}
          <div class="quick-actions">
            <button class="primary" onclick="adminResolveAccess('${esc(r.id)}','approved')">Aprobar</button>
            <button onclick="adminResolveAccess('${esc(r.id)}','rejected')">Rechazar</button>
          </div>
        </div></article>`;
      }).join('') : '<p class="small">No hay solicitudes pendientes.</p>';

      const historyHtml = history.length ? history.slice(0, 25).map(function (r) {
        return `<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(128,128,128,.18)">
          <span>${esc(r.email)}</span><strong>${esc(statusLabel(r.status))}</strong>
        </div>`;
      }).join('') : '<p class="small">Todavía no hay historial.</p>';

      ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Solicitudes de acceso</h2><p>${pending.length} pendientes</p></div></section>
        <section class="panel"><div class="panel-head"><h2>Pendientes</h2><button onclick="adminPanel()">← Admin</button></div>${requestHtml}</section>
        <section class="panel"><div class="panel-head"><h2>Historial reciente</h2></div>${historyHtml}</section>`, 'admin');
    } catch (e) {
      ANX.render(`<section class="panel"><button onclick="adminPanel()">← Admin</button>${ANX.msg(e.message || 'No se pudieron cargar las solicitudes.', 'error')}</section>`, 'admin');
    }
  };

  window.adminResolveAccess = async function (id, status) {
    if (!confirm(status === 'approved' ? '¿Aprobar esta solicitud?' : '¿Rechazar esta solicitud?')) return;
    try {
      const { error } = await ANX.supabase.rpc('admin_set_access_request', { p_request_id: id, p_status: status });
      if (error) throw error;
      await adminAccessRequests();
    } catch (e) {
      alert(e.message || 'No se pudo actualizar la solicitud.');
    }
  };

  function injectButton() {
    if (document.getElementById('adminAccessRequestsButton')) return;
    const headings = Array.from(document.querySelectorAll('.panel-head h2'));
    const targetHeading = headings.find(node => /Administración/i.test(node.textContent || ''));
    const actions = targetHeading?.closest('.panel')?.querySelector('.quick-actions');
    if (!actions) return;
    const button = document.createElement('button');
    button.id = 'adminAccessRequestsButton';
    button.setAttribute('onclick', 'adminAccessRequests()');
    button.innerHTML = '<span>🔐</span>Solicitudes de acceso';
    actions.appendChild(button);
  }

  const observer = new MutationObserver(injectButton);
  observer.observe(document.body, { childList: true, subtree: true });
  injectButton();
})();
