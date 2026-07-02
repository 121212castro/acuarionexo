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

function authMessage(error) {
  const text = String(error?.message || error || '');
  if (/load failed|failed to fetch|network|timeout|522/i.test(text)) {
    return 'Supabase no está respondiendo ahora mismo. El proyecto recibe la petición, pero Auth/Postgres termina en timeout 522.';
  }
  return text || 'No se pudo completar la operación.';
}

function withAuthTimeout(promise, seconds = 18) {
  let timeoutId;
  const timeout = new Promise(function (_resolve, reject) {
    timeoutId = setTimeout(function () {
      reject(new Error('timeout'));
    }, seconds * 1000);
  });
  return Promise.race([promise, timeout]).finally(function () {
    clearTimeout(timeoutId);
  });
}

async function refreshAdminSafe() {
  try {
    if (window.refreshAdminAccess) await window.refreshAdminAccess();
  } catch (_) {
    state.adminRole = null;
    state.isAdmin = false;
  }
}

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
    if (byId('x')) byId('x').innerHTML = msg(authMessage(e), 'error');
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
    state.adminRole = null;
    state.isAdmin = false;
    updateSessionHeader();
    render(`<section class="auth-card"><h2>Contraseña actualizada</h2>
      ${msg('Ya puedes entrar con la contraseña nueva.', 'success')}
      <button class="primary" onclick="login()">Entrar</button>
    </section>`, 'inicio', false);
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(authMessage(e), 'error');
  }
};

window.iniciar = async function () {
  try {
    const { error } = await withAuthTimeout(supabase.auth.signInWithPassword({ email: val('email'), password: val('password') }));
    if (error) throw error;
    boot();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(authMessage(e), 'error');
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
    if (byId('x')) byId('x').innerHTML = msg(authMessage(e), 'error');
  }
};

async function boot() {
  try {
    const session = await withAuthTimeout(supabase.auth.getSession(), 8);
    state.user = session.data.session?.user || null;
    window.u = state.user;
    if (state.user) await refreshAdminSafe();
    else {
      state.adminRole = null;
      state.isAdmin = false;
    }
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
        state.adminRole = null;
        state.isAdmin = false;
        window.q = null;
        updateSessionHeader();
        login();
      };
    }
    state.user ? dashboard() : login();
  } catch (e) {
    render(msg(authMessage(e), 'error'), 'inicio', false);
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
supabase.auth.onAuthStateChange(async function (_event, session) {
  state.user = session?.user || null;
  window.u = state.user;
  if (state.user) await refreshAdminSafe();
  else {
    state.adminRole = null;
    state.isAdmin = false;
  }
  updateSessionHeader();
  if (_event === 'PASSWORD_RECOVERY') passwordRecoveryForm();
});

boot();
})();
