/* AcuarioNexo · Centro de Estado · interfaz */
(function () {
  const ANX = window.ANX = window.ANX || {};

  function esc(value) {
    return ANX.esc ? ANX.esc(value) : String(value ?? '');
  }

  function icon(level) {
    return ({ ok: '●', warning: '●', error: '●' })[level] || '●';
  }

  function label(level) {
    return ({ ok: 'Correcto', warning: 'Atención', error: 'Error' })[level] || 'Sin comprobar';
  }

  function metric(name, value) {
    return `<div class="status-metric"><span>${esc(name)}</span><strong>${esc(value)}</strong></div>`;
  }

  function card(title, subtitle, level, body, action) {
    return `<article class="status-card status-${esc(level)}">
      <header><div><span class="status-dot">${icon(level)}</span><div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div></div><span class="status-label">${label(level)}</span></header>
      <div class="status-card-body">${body}</div>
      ${action || ''}
    </article>`;
  }

  function render(data) {
    const app = data.application;
    const account = data.account;
    const connection = data.connection;
    const notifications = data.notifications;
    const support = data.support;
    const ai = data.ai;
    const storage = data.storage;

    const cards = [
      card('Aplicación', app.current ? 'La versión instalada coincide con la publicada' : 'Revisión de versión necesaria', app.level,
        metric('Versión', app.appVersion) +
        metric('Build instalado', app.installedBuild) +
        metric('Build publicado', app.publishedBuild),
        `<button onclick="window.AcuarioNexoUpdate?.checkVersion?.({manual:true})">Comprobar actualización</button>`),
      card('Cuenta', account.email, account.level,
        metric('Rol', account.role) + metric('Plan', account.plan === 'free' ? 'Gratis' : 'Pro')),
      card('Conexión', connection.online ? 'Dispositivo conectado' : 'Sin conexión a internet', connection.level,
        metric('Plataforma', connection.platform) + metric('Supabase', connection.supabase ? 'Cliente disponible' : 'No disponible')),
      card('Notificaciones', notifications.registered ? 'Dispositivo registrado para avisos' : 'No hay dispositivo registrado', notifications.level,
        metric('Dispositivos', notifications.devices) +
        metric('Proveedor', notifications.provider) +
        metric('Última actividad', notifications.lastSeen) +
        metric('Último envío', notifications.lastDelivery) +
        metric('Resultado', notifications.lastDeliveryStatus),
        `<button onclick="window.AcuarioNexoNotifications?.enable?.().then(()=>statusCenter())">Actualizar registro</button>`),
      card('Soporte', support.open ? `${support.open} incidencia(s) abierta(s)` : 'No hay incidencias abiertas', support.level,
        metric('Reportes totales', support.total) + metric('Último reporte', support.latest),
        `<button onclick="support()">Abrir soporte</button>`),
      card('Inteligencia artificial', ai.enabled ? 'Acceso habilitado localmente' : 'Acceso restringido', ai.level,
        metric('Plan', ai.plan === 'free' ? 'Gratis' : 'Pro') + metric('Acciones registradas', ai.usage) + `<p class="status-note">${esc(ai.note)}</p>`),
      card('Almacenamiento local', 'Estado del navegador o contenedor nativo', storage.level,
        metric('Caché', storage.cacheAvailable ? 'Disponible' : 'No disponible') + metric('Preferencias', storage.localStorageAvailable ? 'Disponible' : 'Bloqueado'))
    ];

    if (data.admin) {
      cards.push(card('Administración', 'Resumen visible solo para administradores', 'ok',
        metric('Acuarios', data.admin.aquariums) +
        metric('Dispositivos activos', data.admin.devices) +
        metric('Reportes abiertos', data.admin.reports) +
        metric('Fichas', data.admin.library) +
        metric('Usos IA', data.admin.aiUsage),
        `<button onclick="adminPanel()">Abrir Admin</button>`));
    }

    return `<section class="panel status-page">
      <div class="status-head"><button onclick="settings()">←</button><div><h2>Centro de Estado</h2><p>Comprobación real de aplicación, cuenta y servicios</p></div><button onclick="statusCenter()" title="Actualizar estado">↻</button></div>
      <div class="status-summary"><strong>${cards.filter(Boolean).length}</strong><span>áreas comprobadas</span><small>Actualizado: ${esc(new Date(data.generatedAt).toLocaleString('es-ES'))}</small></div>
      <div class="status-grid">${cards.join('')}</div>
      <div id="statusMessage"></div>
    </section>`;
  }

  ANX.StatusUI = { render };
})();