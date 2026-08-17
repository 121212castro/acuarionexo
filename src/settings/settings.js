/* AcuarioNexo · Ajustes */
(function () {
  const ANX = window.ANX;
  const { state, render, esc, msg } = ANX;
  const STORAGE_KEY = 'acuarionexo:settings:v1';

  const defaults = {
    language: 'es',
    theme: 'system',
    textSize: 'normal',
    reducedMotion: false,
    units: 'metric',
    temperature: 'celsius',
    dateFormat: 'ddmmyyyy',
    notificationMode: 'summary',
    notificationsEnabled: true,
    criticalImmediate: true,
    sound: true,
    badge: true,
    quietHoursEnabled: false,
    quietFrom: '22:00',
    quietTo: '08:00',
    analytics: false,
    errorReports: true,
    aiEnabled: false,
    plan: 'free'
  };

  function loadSettings() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch (_) {
      return { ...defaults };
    }
  }

  function saveSettings(next) {
    const value = { ...loadSettings(), ...next };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    applyAppearance(value);
    window.AcuarioNexoSettingsState = value;
    return value;
  }

  function applyAppearance(settings) {
    const root = document.documentElement;
    root.dataset.anxTheme = settings.theme;
    root.dataset.anxTextSize = settings.textSize;
    root.classList.toggle('anx-reduced-motion', !!settings.reducedMotion);
    if (settings.theme === 'dark') root.style.colorScheme = 'dark';
    else if (settings.theme === 'light') root.style.colorScheme = 'light';
    else root.style.colorScheme = 'light dark';
  }

  function checked(value) { return value ? ' checked' : ''; }
  function selected(current, value) { return current === value ? ' selected' : ''; }

  function section(title, icon, body, note) {
    return `<details class="settings-section" open>
      <summary><span class="settings-icon">${icon}</span><strong>${esc(title)}</strong><span class="settings-chevron">›</span></summary>
      <div class="settings-body">${note ? `<p class="settings-note">${esc(note)}</p>` : ''}${body}</div>
    </details>`;
  }

  function row(label, control, description) {
    return `<div class="settings-row"><div><strong>${esc(label)}</strong>${description ? `<small>${esc(description)}</small>` : ''}</div><div class="settings-control">${control}</div></div>`;
  }

  function toggle(id, value, action) {
    return `<label class="settings-switch"><input id="${id}" type="checkbox"${checked(value)} onchange="${action}"><span></span></label>`;
  }

  function select(id, value, options, action) {
    return `<select id="${id}" onchange="${action}">${options.map(([key, label]) => `<option value="${key}"${selected(value, key)}>${esc(label)}</option>`).join('')}</select>`;
  }

  function premiumCard(settings) {
    const active = settings.plan !== 'free';
    return `<article class="settings-premium ${active ? 'active' : ''}">
      <div><span class="premium-badge">${active ? 'INTERNO' : 'BETA'}</span><h3>${active ? 'Inteligencia artificial habilitada' : 'Beta cerrada'}</h3>
      <p>${active ? 'Las funciones IA están habilitadas internamente para esta cuenta.' : 'El acceso es gratuito por aprobación. Durante la beta no se ofrecen suscripciones ni se realizan cobros.'}</p></div>
      <button onclick="settingsPlanInfo()">${active ? 'Ver acceso' : 'Estado de la beta'}</button>
    </article>`;
  }

  window.settings = function () {
    if (!state.user) return window.login?.();
    const s = loadSettings();
    applyAppearance(s);
    const email = state.user?.email || 'Cuenta activa';
    const pushDiagnostic = window.AcuarioNexoNotifications?.diagnostic?.() || window.AcuarioNexoPushDiagnostic || null;
    const pushState = pushDiagnostic?.stage === 'token-saved' ? 'Dispositivo registrado' : 'Registro disponible al abrir la app';

    const html = `<section class="panel settings-page">
      <div class="settings-header"><button class="settings-back" onclick="dashboard()">←</button><div><h2>Ajustes</h2><p>Cuenta, aplicación, avisos y privacidad</p></div></div>
      ${section('Cuenta', '👤',
        row('Usuario', `<span class="settings-value">${esc(email)}</span>`, 'Sesión actual de AcuarioNexo') +
        row('Acceso actual', `<span class="settings-value">${s.plan === 'free' ? 'Beta gratuita' : 'Interno con IA'}</span>`, 'No hay ninguna suscripción ni cobro activo') +
        row('Cambiar contraseña', '<button onclick="settingsPassword()">Cambiar</button>', 'Recibirás el flujo seguro de cambio de contraseña') +
        row('Cerrar sesión', '<button class="danger-outline" onclick="document.getElementById(\'logoutBtn\')?.click()">Salir</button>', '')
      )}
      ${section('Beta e IA', '✨', premiumCard(s), 'Las funciones comerciales y de IA permanecerán cerradas hasta completar pagos, condiciones y soporte.')}
      ${section('Notificaciones', '🔔',
        row('Permitir avisos', toggle('setNotifications', s.notificationsEnabled, "settingsChange('notificationsEnabled',this.checked)"), pushState) +
        row('Formato de avisos', select('setNotificationMode', s.notificationMode, [['summary','Un único resumen'],['individual','Avisos individuales']], "settingsChange('notificationMode',this.value)"), 'El resumen único será el modo recomendado') +
        row('Avisos críticos inmediatos', toggle('setCritical', s.criticalImmediate, "settingsChange('criticalImmediate',this.checked)"), 'Los riesgos graves pueden saltarse el resumen') +
        row('Sonido', toggle('setSound', s.sound, "settingsChange('sound',this.checked)"), 'Depende también de los ajustes del sistema') +
        row('Contador en el icono', toggle('setBadge', s.badge, "settingsChange('badge',this.checked)"), 'Muestra tareas pendientes en el icono') +
        row('Horario silencioso', toggle('setQuiet', s.quietHoursEnabled, "settingsChange('quietHoursEnabled',this.checked);settings()"), 'Evita avisos no críticos durante el descanso') +
        (s.quietHoursEnabled ? row('Desde / hasta', `<div class="settings-times"><input type="time" value="${esc(s.quietFrom)}" onchange="settingsChange('quietFrom',this.value)"><input type="time" value="${esc(s.quietTo)}" onchange="settingsChange('quietTo',this.value)"></div>`, '') : '') +
        row('Comprobar registro', '<button onclick="settingsTestPushRegistration()">Comprobar</button>', 'Solicita permiso y actualiza el dispositivo')
      )}
      ${section('Idioma y región', '🌐',
        row('Idioma', select('setLanguage', s.language, [['es','Español'],['gl','Galego'],['en','English'],['pt','Português'],['fr','Français'],['de','Deutsch'],['it','Italiano']], "settingsLanguage(this.value)"), 'La selección queda guardada; la traducción completa se activará cuando existan los diccionarios') +
        row('Unidades', select('setUnits', s.units, [['metric','Litros y sistema métrico'],['imperial','Galones y sistema imperial']], "settingsChange('units',this.value)"), '') +
        row('Temperatura', select('setTemperature', s.temperature, [['celsius','Celsius (°C)'],['fahrenheit','Fahrenheit (°F)']], "settingsChange('temperature',this.value)"), '') +
        row('Formato de fecha', select('setDateFormat', s.dateFormat, [['ddmmyyyy','Día / mes / año'],['mmddyyyy','Mes / día / año'],['yyyyMMdd','Año / mes / día']], "settingsChange('dateFormat',this.value)"), '')
      )}
      ${section('Apariencia y accesibilidad', '🎨',
        row('Tema', select('setTheme', s.theme, [['system','Automático'],['light','Claro'],['dark','Oscuro']], "settingsChange('theme',this.value);settings()"), '') +
        row('Tamaño del texto', select('setTextSize', s.textSize, [['normal','Normal'],['large','Grande'],['xlarge','Muy grande']], "settingsChange('textSize',this.value)"), '') +
        row('Reducir movimiento', toggle('setMotion', s.reducedMotion, "settingsChange('reducedMotion',this.checked)"), 'Reduce animaciones y desplazamientos')
      )}
      ${section('Datos y almacenamiento', '💾',
        row('Descargar mis datos', '<button onclick="settingsExportData()">Descargar</button>', 'Crea un archivo JSON con tu cuenta, acuarios, registros y preferencias') +
        row('Limpiar caché', '<button onclick="settingsClearCache()">Limpiar</button>', 'No elimina acuarios ni información guardada en Supabase') +
        row('Restablecer ajustes', '<button class="danger-outline" onclick="settingsReset()">Restablecer</button>', 'Devuelve únicamente estas preferencias a sus valores iniciales')
      )}
      ${section('Privacidad', '🔐',
        row('Analítica de uso', toggle('setAnalytics', s.analytics, "settingsChange('analytics',this.checked)"), 'Desactivada por defecto') +
        row('Enviar informes de errores', toggle('setErrors', s.errorReports, "settingsChange('errorReports',this.checked)"), 'No incluye contraseñas ni tokens') +
        row('Permisos del dispositivo', '<button onclick="settingsPermissions()">Ver estado</button>', 'Notificaciones, cámara y fotografías') +
        row('Eliminación de cuenta', '<button class="danger-outline" onclick="settingsAccountDeletion()">Gestionar</button>', 'Envía o cancela una solicitud segura; no se borra nada de inmediato')
      )}
      ${section('Diagnóstico y soporte', '🛠️',
        row('Versión', `<span class="settings-value">${esc((ANX.config && ANX.config.APP_VERSION) || 'AcuarioNexo')}</span>`, '') +
        row('Compilación web', `<span class="settings-value settings-code">${esc(window.ACUARIONEXO_BUILD || 'dev')}</span>`, '') +
        row('Plataforma', `<span class="settings-value">${esc(window.Capacitor?.getPlatform?.() || 'web')}</span>`, '') +
        row('Estado de avisos', `<span class="settings-value">${esc(pushDiagnostic?.stage || 'sin diagnóstico')}</span>`, '') +
        row('Copiar diagnóstico', '<button onclick="settingsCopyDiagnostic()">Copiar</button>', 'Útil para soporte técnico')
      )}
      ${state.isAdmin ? section('Desarrollo', '⚙️',
        row('Panel de administración', '<button onclick="adminPanel()">Abrir</button>', 'Visible únicamente para administradores') +
        row('Forzar sincronización visual', '<button onclick="location.reload()">Recargar</button>', '')
      , 'Herramientas internas protegidas por el rol de administrador.') : ''}
      <div id="settingsMessage"></div>
    </section>`;
    render(html, 'inicio');
  };

  window.settingsChange = function (key, value) {
    saveSettings({ [key]: value });
    const box = document.getElementById('settingsMessage');
    if (box) box.innerHTML = msg('Ajuste guardado.', 'success');
  };

  window.settingsLanguage = function (value) {
    saveSettings({ language: value });
    alert('Idioma guardado. La traducción completa se activará cuando estén incorporados los diccionarios de interfaz.');
  };

  window.settingsPlanInfo = function () {
    alert('AcuarioNexo está en beta cerrada y no realiza cobros. Avisaremos cuando exista una suscripción real con condiciones claras y gestión segura del pago.');
  };

  window.settingsPassword = function () {
    const email = state.user?.email;
    if (!email) return;
    ANX.supabase.auth.resetPasswordForEmail(email, { redirectTo: ANX.authRedirectUrl() }).then(function (result) {
      alert(result.error ? result.error.message : 'Enlace enviado al correo de la cuenta.');
    });
  };

  window.settingsTestPushRegistration = async function () {
    const ok = await window.AcuarioNexoNotifications?.enable?.();
    alert(ok ? 'Registro de notificaciones solicitado correctamente.' : 'No se pudo iniciar el registro de notificaciones en este dispositivo.');
  };

  window.settingsExportData = async function () {
    const box = document.getElementById('settingsMessage');
    try {
      if (box) box.innerHTML = msg('Preparando la descarga...', 'notice');
      const { data, error } = await ANX.supabase.rpc('export_my_data');
      if (error) throw error;
      const exportData = { ...data, local_preferences: loadSettings() };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `acuarionexo-datos-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      if (box) box.innerHTML = msg('Copia de datos descargada.', 'success');
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo preparar la descarga.', 'error');
    }
  };

  window.settingsExport = function () {
    const blob = new Blob([JSON.stringify(loadSettings(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'acuarionexo-ajustes.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };

  window.settingsAccountDeletion = async function () {
    const box = document.getElementById('settingsMessage');
    try {
      const current = await ANX.supabase.rpc('my_account_deletion_request');
      if (current.error) throw current.error;
      const request = Array.isArray(current.data) ? current.data[0] : current.data;

      if (request?.status === 'pending') {
        if (!confirm('Ya existe una solicitud de eliminación pendiente. ¿Quieres cancelarla?')) return;
        const cancelled = await ANX.supabase.rpc('cancel_account_deletion');
        if (cancelled.error) throw cancelled.error;
        if (box) box.innerHTML = msg('Solicitud de eliminación cancelada.', 'success');
        return;
      }

      if (!confirm('¿Enviar una solicitud para eliminar tu cuenta y sus datos? No se borrará nada de inmediato y podrás cancelarla mientras siga pendiente.')) return;
      const confirmation = prompt('Para confirmar, escribe ELIMINAR');
      if (confirmation !== 'ELIMINAR') {
        if (box) box.innerHTML = msg('Solicitud no enviada.', 'notice');
        return;
      }

      const reason = prompt('Motivo de la solicitud (opcional)') || null;
      const created = await ANX.supabase.rpc('request_account_deletion', { p_reason: reason });
      if (created.error) throw created.error;
      if (box) box.innerHTML = msg('Solicitud enviada. La cuenta seguirá activa hasta que se complete el proceso.', 'success');
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo gestionar la solicitud.', 'error');
    }
  };

  window.settingsClearCache = async function () {
    if (!confirm('¿Limpiar la caché local sin borrar datos de Supabase?')) return;
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (key) { return caches.delete(key); }));
    }
    alert('Caché limpiada.');
  };

  window.settingsReset = function () {
    if (!confirm('¿Restablecer todos los ajustes de la aplicación?')) return;
    localStorage.removeItem(STORAGE_KEY);
    applyAppearance(defaults);
    window.settings();
  };

  window.settingsPermissions = function () {
    const permission = typeof Notification !== 'undefined' ? Notification.permission : 'gestionado por el sistema';
    alert('Notificaciones: ' + permission + '\nCámara y fotos: iOS, Android o macOS los muestran en los ajustes del sistema cuando la app los solicita.');
  };

  window.settingsCopyDiagnostic = async function () {
    const data = {
      version: ANX.config?.APP_VERSION || null,
      build: window.ACUARIONEXO_BUILD || null,
      platform: window.Capacitor?.getPlatform?.() || 'web',
      user: state.user?.id || null,
      admin: !!state.isAdmin,
      push: window.AcuarioNexoNotifications?.diagnostic?.() || window.AcuarioNexoPushDiagnostic || null,
      settings: loadSettings(),
      generated_at: new Date().toISOString()
    };
    await navigator.clipboard?.writeText?.(JSON.stringify(data, null, 2));
    alert('Diagnóstico copiado.');
  };

  const initial = loadSettings();
  applyAppearance(initial);
  window.AcuarioNexoSettings = { load: loadSettings, save: saveSettings, apply: applyAppearance, defaults };
})();
