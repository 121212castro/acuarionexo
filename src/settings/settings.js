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
      <div><span class="premium-badge">${active ? 'PRO' : 'GRATIS'}</span><h3>Inteligencia artificial</h3>
      <p>${active ? 'Las funciones IA están habilitadas para esta cuenta.' : 'Identificación, análisis de parámetros, diagnóstico visual y planes inteligentes requieren un plan de pago.'}</p></div>
      <button class="${active ? '' : 'primary'}" onclick="settingsPlanInfo()">${active ? 'Gestionar plan' : 'Ver funciones Pro'}</button>
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
        row('Plan actual', `<span class="settings-value">${s.plan === 'free' ? 'Gratis' : 'Pro'}</span>`, 'Las funciones premium se validarán también en el servidor') +
        row('Cambiar contraseña', '<button onclick="settingsPassword()">Cambiar</button>', 'Recibirás el flujo seguro de cambio de contraseña') +
        row('Cerrar sesión', '<button class="danger-outline" onclick="document.getElementById(\'logoutBtn\')?.click()">Salir</button>', '')
      )}
      ${section('Suscripción e IA', '✨', premiumCard(s), 'La interfaz queda preparada para restringir la IA por plan; la autorización definitiva deberá comprobarse en Supabase.')}
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
        row('Exportar preferencias', '<button onclick="settingsExport()">Exportar</button>', 'Descarga una copia de la configuración local') +
        row('Limpiar caché', '<button onclick="settingsClearCache()">Limpiar</button>', 'No elimina acuarios ni información guardada en Supabase') +
        row('Restablecer ajustes', '<button class="danger-outline" onclick="settingsReset()">Restablecer</button>', 'Devuelve únicamente estas preferencias a sus valores iniciales')
      )}
      ${section('Privacidad', '🔐',
        row('Analítica de uso', toggle('setAnalytics', s.analytics, "settingsChange('analytics',this.checked)"), 'Desactivada por defecto') +
        row('Enviar informes de errores', toggle('setErrors', s.errorReports, "settingsChange('errorReports',this.checked)"), 'No incluye contraseñas ni tokens') +
        row('Permisos del dispositivo', '<button onclick="settingsPermissions()">Ver estado</button>', 'Notificaciones, cámara y fotografías')
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
    alert('AcuarioNexo Pro está preparado para controlar el acceso a IA. Antes del lanzamiento se conectará con la suscripción y la validación segura en Supabase.');
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

  window.settingsExport = function () {
    const blob = new Blob([JSON.stringify(loadSettings(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'acuarionexo-ajustes.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
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