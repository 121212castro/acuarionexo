/* AcuarioNexo · auth */
(function () {
  const { config, supabase, state, byId, val, msg, isPasswordRecoveryUrl, authRedirectUrl, render } = window.ANX;
  const { authMessage, withAuthTimeout, refreshAdminSafe, clearAuthState, updateSessionHeader } = window.ANX;

const PASSWORD_RULE = 'La contraseña debe tener al menos 12 caracteres, mayúscula, minúscula, número y símbolo.';
const LEGAL_VERSION = '2026-08-17';

function assertStrongPassword(password) {
  const value = String(password || '');
  if (value.length < 12 || !/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9\s]/.test(value)) {
    throw new Error(PASSWORD_RULE);
  }
}

function login() {
  render(`<section class="auth-card"><h2>Entrar</h2>
    <label>Email</label><input id="email" type="email" autocomplete="email">
    <label>Contraseña</label><input id="password" type="password" autocomplete="current-password">
    <button class="primary" onclick="iniciar()">Entrar</button>
    <button onclick="solicitarAcceso()">Solicitar acceso</button>
    <button onclick="activarAccesoForm()">Ya tengo acceso aprobado</button>
    <button onclick="recuperarPassword()">Olvidé mi contraseña</button>
    <div id="x"></div>
  </section>`, 'inicio', false);
  window.ANXAnalytics?.trackEvent?.('access_landing_view', 'acceso');
}
window.login = login;

window.solicitarAcceso = function () {
  render(`<section class="auth-card"><h2>Solicitar acceso</h2>
    <p class="small">AcuarioNexo está en beta cerrada, sin suscripciones ni cobros. Las nuevas cuentas requieren aprobación.</p>
    <label>Nombre</label><input id="accessName" type="text" autocomplete="name">
    <label>Email</label><input id="accessEmail" type="email" autocomplete="email">
    <label>Mensaje (opcional)</label><textarea id="accessMessage" rows="4" placeholder="Cuéntanos brevemente para qué quieres utilizar AcuarioNexo"></textarea>
    <label class="small legal-check"><input id="accessLegalAccepted" type="checkbox"><span>Acepto las <a href="condiciones.html" target="_blank" rel="noopener">condiciones de uso</a> y he leído la <a href="privacidad.html" target="_blank" rel="noopener">política de privacidad</a>.</span></label>
    <button class="primary" onclick="enviarSolicitudAcceso()">Enviar solicitud</button>
    <button onclick="login()">Volver</button>
    <div id="x"></div>
  </section>`, 'inicio', false);
  window.ANXAnalytics?.trackEvent?.('access_form_open', 'acceso');
};

window.enviarSolicitudAcceso = async function () {
  try {
    const email = val('accessEmail');
    const name = val('accessName');
    const messageText = val('accessMessage');
    if (!email) throw new Error('Pon tu email.');
    if (!byId('accessLegalAccepted')?.checked) throw new Error('Debes aceptar las condiciones y leer la política de privacidad.');
    const { error } = await supabase.rpc('submit_access_request', { p_email: email, p_name: name || null, p_message: messageText || null, p_legal_version: LEGAL_VERSION, p_legal_accepted: true });
    if (error) throw error;
    byId('x').innerHTML = msg('Solicitud enviada. Te avisaremos cuando el acceso haya sido aprobado.', 'success');
    window.ANXAnalytics?.trackEvent?.('access_request_submitted', 'acceso');
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(authMessage(e), 'error');
  }
};

window.activarAccesoForm = function () {
  render(`<section class="auth-card"><h2>Activar acceso aprobado</h2>
    <p class="small">Usa esta opción únicamente cuando tu solicitud ya haya sido aprobada.</p>
    <label>Email</label><input id="approvedEmail" type="email" autocomplete="email">
    <label>Contraseña</label><input id="approvedPassword" type="password" autocomplete="new-password" minlength="12">
    <p class="small">Mínimo 12 caracteres con mayúscula, minúscula, número y símbolo.</p>
    <label class="small legal-check"><input id="approvedLegalAccepted" type="checkbox"><span>Acepto las <a href="condiciones.html" target="_blank" rel="noopener">condiciones de uso</a> y he leído la <a href="privacidad.html" target="_blank" rel="noopener">política de privacidad</a>.</span></label>
    <button class="primary" onclick="activarAccesoAprobado()">Crear mi cuenta</button>
    <button onclick="login()">Volver</button>
    <div id="x"></div>
  </section>`, 'inicio', false);
};

window.activarAccesoAprobado = async function () {
  try {
    const email = val('approvedEmail');
    const password = val('approvedPassword');
    if (!email) throw new Error('Pon el email aprobado.');
    assertStrongPassword(password);
    if (!byId('approvedLegalAccepted')?.checked) throw new Error('Debes aceptar las condiciones y leer la política de privacidad.');
    const check = await supabase.rpc('can_register_email', { p_email: email });
    if (check.error) throw check.error;
    if (!check.data) throw new Error('Este email todavía no tiene el acceso aprobado.');
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: authRedirectUrl(), data: { legal_version: LEGAL_VERSION, terms_accepted: true, privacy_acknowledged: true } } });
    if (error) throw error;
    byId('x').innerHTML = msg('Cuenta creada. Revisa tu email si se solicita confirmación.', 'success');
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(authMessage(e), 'error');
  }
};

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
    <label>Nueva contraseña</label><input id="newPassword" type="password" autocomplete="new-password" minlength="12">
    <label>Repetir contraseña</label><input id="newPassword2" type="password" autocomplete="new-password" minlength="12">
    <p class="small">Mínimo 12 caracteres con mayúscula, minúscula, número y símbolo.</p>
    <button class="primary" onclick="guardarNuevaPassword()">Guardar contraseña</button>
    <div id="x"></div>
  </section>`, 'inicio', false);
}

window.guardarNuevaPassword = async function () {
  try {
    const password = val('newPassword');
    assertStrongPassword(password);
    if (password !== val('newPassword2')) throw new Error('Las contraseñas no coinciden.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    state.passwordRecovery = false;
    history.replaceState(null, '', authRedirectUrl());
    await supabase.auth.signOut();
    clearAuthState();
    updateSessionHeader();
    render(`<section class="auth-card"><h2>Contraseña actualizada</h2>
      ${msg('Ya puedes entrar con la contraseña nueva.', 'success')}
      <button class="primary" onclick="login()">Entrar</button>
    </section>`, 'inicio', false);
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(authMessage(e), 'error');
  }
};

async function userHasAppAccess() {
  if (!state.user) return false;
  const { data, error } = await supabase.rpc('has_app_access');
  if (error) throw error;
  return data === true;
}

window.iniciar = async function () {
  try {
    const { error } = await withAuthTimeout(supabase.auth.signInWithPassword({ email: val('email'), password: val('password') }));
    if (error) throw error;
    const session = await withAuthTimeout(supabase.auth.getSession(), 8);
    state.user = session.data.session?.user || null;
    if (!await userHasAppAccess()) {
      await supabase.auth.signOut();
      clearAuthState();
      throw new Error('Esta cuenta no tiene acceso aprobado a AcuarioNexo.');
    }
    boot();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(authMessage(e), 'error');
  }
};

async function boot() {
  try {
    const session = await withAuthTimeout(supabase.auth.getSession(), 8);
    state.user = session.data.session?.user || null;
    window.u = state.user;
    if (state.user) {
      const allowed = await userHasAppAccess();
      if (!allowed) {
        await supabase.auth.signOut();
        clearAuthState();
        state.user = null;
        window.u = null;
        updateSessionHeader();
        render(`<section class="auth-card"><h2>Acceso pendiente</h2>${msg('Esta cuenta no tiene acceso aprobado.', 'error')}<button class="primary" onclick="login()">Volver</button></section>`, 'inicio', false);
        return;
      }
      await refreshAdminSafe();
    } else {
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
        clearAuthState();
        state.aquarium = null;
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

byId('version').textContent = config.APP_VERSION || 'AcuarioNexo';
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
