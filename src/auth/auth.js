/* AcuarioNexo · auth */
(function () {
  const { config, supabase, state, esc, byId, val, msg, isPasswordRecoveryUrl, authRedirectUrl, render } = window.ANX;

function login() {
  render(`<section class="auth-card"><h2>Entrar</h2>
    <label>Email</label><input id="email" type="email" autocomplete="email">
    <label>Contraseña</label><input id="password" type="password" autocomplete="current-password">
    <button class="primary" onclick="iniciar()">Entrar</button>
    <button onclick="crear()">Crear cuenta</button>
    <button onclick="recuperarPassword()">Olvidé mi contraseña</button>
    <div id="x"></div>
  </section>`, 'inicio', false);
}
window.login = login;

window.recuperarPassword = function () {
  render(`<section class="auth-card"><h2>Recuperar contraseña</h2>
    <p class="small">Escribe tu email y te enviaremos un enlace para crear una contraseña nueva.</p>
    <label>Email</label><input id="recoveryEmail" type="email" autocomplete="email">
    <button class="primary" onclick="enviarRecuperacionPassword()">Enviar enlace</button>
    <button onclick="login()">Volver</button>
    <div id="x"></div>
  </section>`, 'inicio', false);
};

window.enviarRecuperacionPassword = async function () {
  try {
    const email = val('recoveryEmail');
    if (!email) throw new Error('Pon el email de la cuenta.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl() });
    if (error) throw error;
    byId('x').innerHTML = msg('Te enviamos un enlace para cambiar la contraseña. Revisa el email.', 'success');
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

function passwordRecoveryForm() {
  state.passwordRecovery = true;
  render(`<section class="auth-card"><h2>Nueva contraseña</h2>
    <p class="small">Introduce una contraseña nueva para esta cuenta.</p>
    <label>Nueva contraseña</label><input id="newPassword" type="password" autocomplete="new-password">
    <label>Repetir contraseña</label><input id="newPassword2" type="password" autocomplete="new-password">
    <button class="primary" onclick="guardarNuevaPassword()">Guardar contraseña</button>
    <div id="x"></div>
  </section>`, 'inicio', false);
}

window.guardarNuevaPassword = async function () {
  try {
    const password = val('newPassword');
    if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
    if (password !== val('newPassword2')) throw new Error('Las contraseñas no coinciden.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    state.passwordRecovery = false;
    history.replaceState(null, '', authRedirectUrl());
    await supabase.auth.signOut();
    state.user = null;
    updateSessionHeader();
    render(`<section class="auth-card"><h2>Contraseña actualizada</h2>
      ${msg('Ya puedes entrar con la contraseña nueva.', 'success')}
      <button class="primary" onclick="login()">Entrar</button>
    </section>`, 'inicio', false);
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.iniciar = async function () {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: val('email'), password: val('password') });
    if (error) throw error;
    boot();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.crear = async function () {
  try {
    const email = val('email');
    const password = val('password');
    if (!email) throw new Error('Pon el email de la cuenta.');
    if (!password) throw new Error('Pon la contraseña.');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authRedirectUrl() }
    });
    if (error) throw error;
    byId('x').innerHTML = msg('Cuenta creada. Si Supabase pide confirmación, revisa el email.', 'success');
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.adminPanel = function () {
  if (!state.user) {
    if (byId('x')) byId('x').innerHTML = msg('Primero entra con tu cuenta. Después aparecerá Admin en la barra inferior.', 'notice');
    return;
  }
  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Admin</h2><p>Panel de administración</p></div></section>
    <section class="panel"><div class="panel-head"><h2>Accesos admin</h2></div>
      <div class="quick-actions">
        <button onclick="tareas()"><span>♢</span>Avisos</button>
        <button onclick="inventario()"><span>▤</span>Inventario</button>
        <button onclick="dashboard()"><span>⌂</span>Inicio</button>
      </div>
      <p class="small">Admin queda visible. Las acciones sensibles siguen protegidas por las políticas reales de Supabase.</p>
    </section>`, 'admin');
};

async function boot() {
  try {
    const session = await supabase.auth.getSession();
    state.user = session.data.session?.user || null;
    window.u = state.user;
    updateSessionHeader();
    if (isPasswordRecoveryUrl() && state.user) {
      passwordRecoveryForm();
      return;
    }
    if (byId('logoutBtn')) {
      byId('logoutBtn').onclick = async function () {
        await supabase.auth.signOut();
        state.user = null;
        state.aquarium = null;
        window.q = null;
        updateSessionHeader();
        login();
      };
    }
    state.user ? dashboard() : login();
  } catch (e) {
    render(msg(e.message, 'error'), 'inicio', false);
  }
}

function updateSessionHeader() {
  byId('logoutBtn')?.classList.toggle('hidden', !state.user);
  const text = byId('connectionText');
  if (text) text.textContent = state.user ? 'Conectado a Supabase' : 'Sin sesión';
}

byId('version').textContent = config.APP_VERSION || 'AcuarioNexo';
byId('refreshAppBtn')?.addEventListener('click', function () {
  if (window.AcuarioNexoUpdate?.forceReload) window.AcuarioNexoUpdate.forceReload();
  else location.reload();
});
supabase.auth.onAuthStateChange(function (_event, session) {
  state.user = session?.user || null;
  window.u = state.user;
  updateSessionHeader();
  if (_event === 'PASSWORD_RECOVERY') passwordRecoveryForm();
});

boot();
})();
