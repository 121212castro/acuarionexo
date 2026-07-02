/* AcuarioNexo · Admin extra */
(function () {
  const A = () => window.ANX || {};
  const { supabase, state, esc, byId, val, msg, render } = A();

  function allowed() {
    return !!state.user && !!state.isAdmin;
  }

  async function guard() {
    if (window.refreshAdminAccess) await window.refreshAdminAccess();
    if (!allowed()) {
      render(`<section class="panel">${msg('Acceso Admin no disponible.', 'error')}</section>`, 'inicio');
      return false;
    }
    return true;
  }

  function roleName(role) {
    return ({ owner: 'Propietario', admin: 'Admin', trusted_admin: 'Confianza' })[role] || 'Sin rol';
  }

  window.adminGrantForm = async function () {
    if (!await guard()) return;
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Dar Admin</h2><p>Alta de usuario de confianza</p></div></section>
      <section class="panel">
        <button onclick="adminPanel()">← Admin</button>
        <label>Email</label><input id="adminGrantEmail" type="email" placeholder="correo@ejemplo.com">
        <label>Rol</label><select id="adminGrantRole"><option value="trusted_admin">Usuario de confianza</option><option value="admin">Admin</option><option value="owner">Propietario</option></select>
        <button class="primary" onclick="adminGrantRole()">Guardar rol</button>
        <div id="adminMsg"></div>
      </section>`, 'admin');
  };

  window.adminGrantRole = async function () {
    const box = byId('adminMsg');
    try {
      if (!await guard()) return;
      const email = val('adminGrantEmail');
      const role = val('adminGrantRole') || 'trusted_admin';
      if (!email) throw new Error('Pon el email del usuario.');
      if (box) box.innerHTML = msg('Guardando rol...', 'notice');
      const { data, error } = await supabase.rpc('admin_set_role_by_email', { target_email: email, new_role: role, make_active: true });
      if (error) throw error;
      if (box) box.innerHTML = msg(`Rol guardado: ${esc(data?.[0]?.email || email)}`, 'success');
    } catch (e) {
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  window.adminUsers = async function () {
    try {
      if (!await guard()) return;
      render(`<section class="panel">${msg('Cargando usuarios...')}</section>`, 'admin');
      const { data, error } = await supabase.rpc('admin_list_users');
      if (error) throw error;
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Usuarios</h2><p>${(data || []).length} cuentas</p></div></section>
        <section class="panel"><button onclick="adminPanel()">← Admin</button><h2>Usuarios registrados</h2>
        ${(data || []).map(u => `<article class="item"><b>${esc(u.email || 'Sin email')}</b><p class="small">${esc(roleName(u.role))} · ${u.active ? 'activo' : 'sin rol'}</p><button onclick="adminUserHistory('${esc(u.user_id)}','${esc(u.email || '')}')">Historial</button></article>`).join('') || '<p class="small">Sin usuarios.</p>'}
        </section>`, 'admin');
    } catch (e) {
      render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'admin');
    }
  };

  window.adminUserHistory = async function (userId, email) {
    try {
      if (!await guard()) return;
      const { data, error } = await supabase.rpc('admin_get_user_history', { target: userId });
      if (error) throw error;
      render(`<section class="summary-card"><div><small>Historial</small><h2>${esc(email || 'Usuario')}</h2><p>${(data || []).length} eventos</p></div></section>
        <section class="panel"><button onclick="adminUsers()">← Usuarios</button>
        ${(data || []).map(h => `<article class="item"><b>${esc(h.action)}</b><p class="small">${esc(h.created_at || '')}</p><pre>${esc(JSON.stringify(h.details || {}, null, 2))}</pre></article>`).join('') || '<p class="small">Sin historial todavía.</p>'}
        </section>`, 'admin');
    } catch (e) {
      render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'admin');
    }
  };

  window.adminReports = async function () {
    try {
      if (!await guard()) return;
      const { data, error } = await supabase.from('admin_reports').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Fallos</h2><p>${(data || []).length} reportes</p></div></section>
        <section class="panel"><button onclick="adminPanel()">← Admin</button>
        ${(data || []).map(r => `<article class="item"><b>${esc(r.title)}</b><p class="small">${esc(r.status)} · ${esc(r.severity)}</p><p>${esc(r.details || '')}</p></article>`).join('') || '<p class="small">Sin reportes todavía.</p>'}
        </section>`, 'admin');
    } catch (e) {
      render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'admin');
    }
  };
})();
