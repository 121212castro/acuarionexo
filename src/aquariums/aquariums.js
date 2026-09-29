/* AcuarioNexo · aquariums */
(function () {
  const { supabase, state, esc, byId, msg, token, isCurrent, currentAquarium, render, aqHeader } = window.ANX;
  const { loadAquariums, aquariumCard, dashboardStat, emptyLine, dashboardAlertCard, dashboardActivityCard, loadDashboardStats, refreshAdminForDashboard, aquariumTypeLabel } = window.ANX.AquariumsCore;

  window.openDashboardAviso = async function (id) {
    if (!state.user) return login();
    try {
      if (window.ANX.loadModuleGroup) await window.ANX.loadModuleGroup('tareas');
      if (typeof window.verAviso !== 'function') throw new Error('No se pudo cargar el detalle del aviso.');
      return window.verAviso(id);
    } catch (error) {
      render(msg(error.message || error, 'error'), 'inicio');
    }
  };

  window.abrirIdentificadorFoto = async function () {
    if (!state.user) return login();
    render(`<section class="panel">${msg('Cargando identificación por foto...')}</section>`, 'inicio');
    try {
      if (window.ANX.loadModuleGroup) await window.ANX.loadModuleGroup('biblioteca');
      if (typeof window.identificarPorFoto !== 'function') {
        await new Promise(function (resolve, reject) {
          const existing = document.querySelector('script[data-module="photo-identify"]');
          if (existing) {
            if (typeof window.identificarPorFoto === 'function') return resolve();
            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', reject, { once: true });
            return;
          }
          const script = document.createElement('script');
          const version = encodeURIComponent(window.ANX_ASSET_VERSION || window.ACUARIONEXO_BUILD || 'dev');
          script.src = `src/library/photo-identify.js?v=${version}`;
          script.dataset.module = 'photo-identify';
          script.onload = resolve;
          script.onerror = () => reject(new Error('No se pudo cargar el identificador por foto.'));
          document.body.appendChild(script);
        });
      }
      if (typeof window.identificarPorFoto !== 'function') throw new Error('El identificador por foto no quedó disponible.');
      return window.identificarPorFoto();
    } catch (error) {
      render(`<section class="panel">${msg(error.message || error, 'error')}<button onclick="dashboard()">Volver</button></section>`, 'inicio');
    }
  };

  window.abrirDisenador3DDesdeInicio = async function () {
    if (!state.user) return login();
    render(`<section class="panel">${msg('Cargando diseñador de acuario 3D...')}</section>`, 'inicio');
    try {
      if (window.ANX.loadModuleGroup) await window.ANX.loadModuleGroup('mapa');
      const standalone = window.ANX.MapStandalone;
      if (!standalone || typeof standalone.open !== 'function') throw new Error('No se pudo cargar el diseñador 3D.');
      return standalone.open();
    } catch (error) {
      render(`<section class="panel">${msg(error.message || error, 'error')}<button onclick="dashboard()">Volver</button></section>`, 'inicio');
    }
  };


  function recoveryHexToBytes(hex, expectedBytes = 32) {
    const clean = String(hex || '').trim().replace(/\s+/g, '');
    if (!new RegExp('^[0-9a-fA-F]{' + (expectedBytes * 2) + '}    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return out;
  }

  function recoveryBase64ToBytes(value) {
    const clean = String(value || '').replace(/\s+/g, '');
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  window.restaurarDatosLocales = async function () {
    if (!state.localMode || !window.ANXLocalBackend) return;
    const secret = prompt('Pega la clave de recuperación de AcuarioNexo:');
    if (!secret) return;
    try {
      const response = await fetch('data/local-recovery.enc.json?v=' + encodeURIComponent(window.ANX_ACTIVE_BUILD || Date.now()), { cache:'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar la copia cifrada.');
      const backup = await response.json();
      const keyBytes = recoveryHexToBytes(secret, 32);
      const ivBytes = recoveryHexToBytes(backup.iv, 16);
      const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name:'AES-CBC' }, false, ['decrypt']);
      const plain = await crypto.subtle.decrypt({ name:'AES-CBC', iv:ivBytes }, cryptoKey, recoveryBase64ToBytes(backup.ciphertext));
      const payload = JSON.parse(new TextDecoder().decode(plain));
      const imported = window.ANXLocalBackend.importBackup(payload);
      state.aquariums = [];
      state.aquarium = null;
      alert('Copia restaurada: ' + imported + ' registros. AcuarioNexo se recargará ahora.');
      location.reload();
    } catch (error) {
      alert('No se pudo restaurar la copia: ' + (error?.message || error));
    }
  };

  window.dashboard = async function () {
    if (!state.user) return login();
    const t = token();
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Cargando resumen...</p></div></section>`, 'inicio');
    try {
      await refreshAdminForDashboard();
      const list = await loadAquariums();
      const stats = await loadDashboardStats(list);
      if (!isCurrent(t)) return;
      const liters = list.reduce(function (total, aq) { return total + (Number(aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters) || 0); }, 0);
      const alertsHtml = (stats.alerts || []).map(dashboardAlertCard).join('') || emptyLine('Sin avisos importantes.');
      const activityHtml = (stats.recentActivity || []).map(dashboardActivityCard).join('') || emptyLine('Sin actividad reciente.');
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Resumen general de la app</p></div></section>
        ${state.localMode ? '<section class="panel"><div class="notice"><b>Modo local temporal.</b><br>Supabase está desconectado. Tus datos pueden funcionar desde este navegador sin depender del servicio bloqueado.</div><button class="primary" onclick="restaurarDatosLocales()">Restaurar mis datos guardados</button></section>' : ''}
        <section class="panel"><div class="panel-head"><div><h2>Diseña tu acuario en 3D</h2><p class="small">Crea una urna a escala real, coloca rocas, corales, plantas, peces y equipos y guárdala después como un nuevo acuario.</p></div></div><button class="primary" onclick="abrirDisenador3DDesdeInicio()"><span>▣</span> Diseñar acuario 3D</button></section>
        <section class="panel"><div class="panel-head"><h2>Identificar por foto</h2></div><p>Haz una foto o elige una imagen. AcuarioNexo identificará el elemento, buscará su ficha y podrás añadirlo al Inventario indicando en qué acuario está.</p><button class="primary" onclick="abrirIdentificadorFoto()"><span>⌾</span> Identificar y añadir</button></section>
        <section class="panel"><div class="panel-head"><h2>Asistente AcuarioNexo</h2></div><p>Consulta la biblioteca o analiza uno de tus acuarios con sus datos reales.</p><button class="primary assistant-home-button" onclick="assistantPortal()">Hablar con AcuarioNexo IA</button></section>
        <section class="panel"><div class="panel-head"><h2>Estado general</h2></div><div class="quick-actions">
          ${dashboardStat('Acuarios activos', String(list.length))}
          ${dashboardStat('Litros gestionados', liters ? `${liters.toFixed(1)} L` : 'Sin datos')}
          ${dashboardStat('Animales registrados', String(stats.animals))}
        </div></section>
        <section class="panel"><div class="panel-head"><h2>Módulos</h2></div><div class="quick-actions">
          <button onclick="microfauna()"><span>◌</span>Microfauna</button>
          <button onclick="biblioteca()"><span>□</span>Biblioteca</button>
          <button onclick="inventario()"><span>▤</span>Inventario</button>
        </div></section>
        <section class="panel"><div class="panel-head"><h2>Avisos importantes</h2><button onclick="tareas()">Ver todos</button></div>${alertsHtml}</section>
        <section class="panel"><div class="panel-head"><h2>Actividad reciente</h2><button onclick="tareas()">Ver historial</button></div>${activityHtml}</section>`, 'inicio');
    } catch (e) { if (isCurrent(t)) render(msg(e.message, 'error'), 'inicio'); }
  };

  window.acuariosHome = function () {
    if (!state.user) return login();
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Acuarios</h2><p>Gestiona tus sistemas desde un apartado propio.</p></div></section>
      <section class="panel"><div class="panel-head"><h2>Acuarios</h2></div><div class="quick-actions">
        <button onclick="listaAcuarios()"><span>▣</span>Mis acuarios</button>
        <button onclick="formA()"><span>＋</span>Nuevo acuario</button>
      </div></section>`, 'acuarios');
  };

  window.listaAcuarios = async function () {
    if (!state.user) return login();
    const t = token();
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>Cargando sistemas...</p></div></section>`, 'acuarios');
    try {
      const list = await loadAquariums();
      if (!isCurrent(t)) return;
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>${list.length} sistemas activos</p></div></section>
        <section class="panel"><div class="panel-head"><h2>Lista de acuarios</h2><button onclick="acuariosHome()">Volver</button></div>
        ${state.localMode && !list.length ? '<div class="notice">La copia local está vacía en este navegador. Restaura la copia cifrada para recuperar tus acuarios.</div><button class="primary" onclick="restaurarDatosLocales()">Restaurar mis datos</button>' : ''}
        <div class="tank-list">${list.map(aquariumCard).join('') || '<p class="small">Sin acuarios cargados en este navegador.</p>'}</div></section>`, 'acuarios');
    } catch (e) { if (isCurrent(t)) render(msg(e.message, 'error'), 'acuarios'); }
  };

  function resumenAcuario() {
    const aq = currentAquarium();
    if (!aq) return listaAcuarios();
    const liters = aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters ?? '-';
    const type = aquariumTypeLabel(aq.aquarium_type || aq.type || 'Acuario');
    const created = aq.created_at ? new Date(aq.created_at).toLocaleDateString('es-ES') : 'Sin fecha';
    render(aqHeader('resumen') + `<section class="panel">
      <div class="panel-head"><h2>Resumen</h2><div><button onclick="editarAcuario()">Editar acuario</button><button onclick="borrarAcuario()">Borrar acuario</button><button onclick="listaAcuarios()">Volver</button></div></div>
      <div class="quick-actions">${dashboardStat('Tipo', type)}${dashboardStat('Litros', `${liters} L`)}${dashboardStat('Alta', created)}</div>
      ${aq.notes ? `<p>${esc(aq.notes)}</p>` : '<p class="small">Sin nota del acuario.</p>'}
      <div id="deleteAqStatus"></div>
    </section>`, 'acuarios');
  }

  window.resumenAcuario = resumenAcuario;

  window.borrarAcuario = async function () {
    const aq = currentAquarium();
    const box = byId('deleteAqStatus');
    if (!state.user) return login();
    if (!aq) return listaAcuarios();
    if (!confirm('¿Seguro que quieres borrar este acuario? Esta acción no se puede deshacer.')) return;
    try {
      if (box) box.innerHTML = msg('Borrando acuario...', 'notice');
      const { error } = await supabase.from('aquariums').delete().eq('id', aq.id).eq('user_id', state.user.id);
      if (error) throw error;
      state.aquariums = (state.aquariums || []).filter(function (item) { return String(item.id) !== String(aq.id); });
      state.aquarium = null;
      window.q = null;
      listaAcuarios();
    } catch (e) { if (box) box.innerHTML = msg(e.message, 'error'); }
  };

  window.openA = function (id) {
    const aq = (state.aquariums || []).find(function (item) { return String(item.id) === String(id); });
    if (!aq) { render(msg('No se encontró este acuario. Vuelve a cargar la lista.', 'error'), 'acuarios'); return; }
    state.aquarium = aq;
    window.q = aq;
    state.section = 'resumen';
    resumenAcuario();
  };

  window.openAqSection = function (section) {
    const aq = currentAquarium();
    if (!aq) return listaAcuarios();
    state.section = section || 'resumen';
    const routes = { resumen: resumenAcuario, animales: window.animales, mapa: window.mapaIA, fotos: window.fotos, inventario: function () { return window.inventario('aquarium'); }, parametros: window.parametros, tareas: window.tareasAcuario };
    const fn = routes[state.section] || resumenAcuario;
    if (typeof fn === 'function') return fn();
    render(aqHeader(state.section) + `<section class="panel">${msg('Este módulo no está disponible todavía.', 'notice')}</section>`, 'acuarios');
  };
})();).test(clean)) throw new Error('La clave de recuperación no es válida.');
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return out;
  }

  function recoveryBase64ToBytes(value) {
    const clean = String(value || '').replace(/\s+/g, '');
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  window.restaurarDatosLocales = async function () {
    if (!state.localMode || !window.ANXLocalBackend) return;
    const secret = prompt('Pega la clave de recuperación de AcuarioNexo:');
    if (!secret) return;
    try {
      const response = await fetch('data/local-recovery.enc.json?v=' + encodeURIComponent(window.ANX_ACTIVE_BUILD || Date.now()), { cache:'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar la copia cifrada.');
      const backup = await response.json();
      const keyBytes = recoveryHexToBytes(secret);
      const ivBytes = recoveryHexToBytes(String(backup.iv || '') + '0'.repeat(32)).slice(0, 16);
      const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name:'AES-CBC' }, false, ['decrypt']);
      const plain = await crypto.subtle.decrypt({ name:'AES-CBC', iv:ivBytes }, cryptoKey, recoveryBase64ToBytes(backup.ciphertext));
      const payload = JSON.parse(new TextDecoder().decode(plain));
      const imported = window.ANXLocalBackend.importBackup(payload);
      state.aquariums = [];
      state.aquarium = null;
      alert('Copia restaurada: ' + imported + ' registros. AcuarioNexo se recargará ahora.');
      location.reload();
    } catch (error) {
      alert('No se pudo restaurar la copia: ' + (error?.message || error));
    }
  };

  window.dashboard = async function () {
    if (!state.user) return login();
    const t = token();
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Cargando resumen...</p></div></section>`, 'inicio');
    try {
      await refreshAdminForDashboard();
      const list = await loadAquariums();
      const stats = await loadDashboardStats(list);
      if (!isCurrent(t)) return;
      const liters = list.reduce(function (total, aq) { return total + (Number(aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters) || 0); }, 0);
      const alertsHtml = (stats.alerts || []).map(dashboardAlertCard).join('') || emptyLine('Sin avisos importantes.');
      const activityHtml = (stats.recentActivity || []).map(dashboardActivityCard).join('') || emptyLine('Sin actividad reciente.');
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Resumen general de la app</p></div></section>
        ${state.localMode ? '<section class="panel"><div class="notice"><b>Modo local temporal.</b><br>Supabase está desconectado. Tus acuarios, parámetros, inventario y tareas se guardan únicamente en este navegador hasta volver a conectar el backend.</div></section>' : ''}
        <section class="panel"><div class="panel-head"><div><h2>Diseña tu acuario en 3D</h2><p class="small">Crea una urna a escala real, coloca rocas, corales, plantas, peces y equipos y guárdala después como un nuevo acuario.</p></div></div><button class="primary" onclick="abrirDisenador3DDesdeInicio()"><span>▣</span> Diseñar acuario 3D</button></section>
        <section class="panel"><div class="panel-head"><h2>Identificar por foto</h2></div><p>Haz una foto o elige una imagen. AcuarioNexo identificará el elemento, buscará su ficha y podrás añadirlo al Inventario indicando en qué acuario está.</p><button class="primary" onclick="abrirIdentificadorFoto()"><span>⌾</span> Identificar y añadir</button></section>
        <section class="panel"><div class="panel-head"><h2>Asistente AcuarioNexo</h2></div><p>Consulta la biblioteca o analiza uno de tus acuarios con sus datos reales.</p><button class="primary assistant-home-button" onclick="assistantPortal()">Hablar con AcuarioNexo IA</button></section>
        <section class="panel"><div class="panel-head"><h2>Estado general</h2></div><div class="quick-actions">
          ${dashboardStat('Acuarios activos', String(list.length))}
          ${dashboardStat('Litros gestionados', liters ? `${liters.toFixed(1)} L` : 'Sin datos')}
          ${dashboardStat('Animales registrados', String(stats.animals))}
        </div></section>
        <section class="panel"><div class="panel-head"><h2>Módulos</h2></div><div class="quick-actions">
          <button onclick="microfauna()"><span>◌</span>Microfauna</button>
          <button onclick="biblioteca()"><span>□</span>Biblioteca</button>
          <button onclick="inventario()"><span>▤</span>Inventario</button>
        </div></section>
        <section class="panel"><div class="panel-head"><h2>Avisos importantes</h2><button onclick="tareas()">Ver todos</button></div>${alertsHtml}</section>
        <section class="panel"><div class="panel-head"><h2>Actividad reciente</h2><button onclick="tareas()">Ver historial</button></div>${activityHtml}</section>`, 'inicio');
    } catch (e) { if (isCurrent(t)) render(msg(e.message, 'error'), 'inicio'); }
  };

  window.acuariosHome = function () {
    if (!state.user) return login();
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Acuarios</h2><p>Gestiona tus sistemas desde un apartado propio.</p></div></section>
      <section class="panel"><div class="panel-head"><h2>Acuarios</h2></div><div class="quick-actions">
        <button onclick="listaAcuarios()"><span>▣</span>Mis acuarios</button>
        <button onclick="formA()"><span>＋</span>Nuevo acuario</button>
      </div></section>`, 'acuarios');
  };

  window.listaAcuarios = async function () {
    if (!state.user) return login();
    const t = token();
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>Cargando sistemas...</p></div></section>`, 'acuarios');
    try {
      const list = await loadAquariums();
      if (!isCurrent(t)) return;
      render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>${list.length} sistemas activos</p></div></section>
        <section class="panel"><div class="panel-head"><h2>Lista de acuarios</h2><button onclick="acuariosHome()">Volver</button></div>
        <div class="tank-list">${list.map(aquariumCard).join('') || '<p class="small">Sin acuarios todavía.</p>'}</div></section>`, 'acuarios');
    } catch (e) { if (isCurrent(t)) render(msg(e.message, 'error'), 'acuarios'); }
  };

  function resumenAcuario() {
    const aq = currentAquarium();
    if (!aq) return listaAcuarios();
    const liters = aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters ?? '-';
    const type = aquariumTypeLabel(aq.aquarium_type || aq.type || 'Acuario');
    const created = aq.created_at ? new Date(aq.created_at).toLocaleDateString('es-ES') : 'Sin fecha';
    render(aqHeader('resumen') + `<section class="panel">
      <div class="panel-head"><h2>Resumen</h2><div><button onclick="editarAcuario()">Editar acuario</button><button onclick="borrarAcuario()">Borrar acuario</button><button onclick="listaAcuarios()">Volver</button></div></div>
      <div class="quick-actions">${dashboardStat('Tipo', type)}${dashboardStat('Litros', `${liters} L`)}${dashboardStat('Alta', created)}</div>
      ${aq.notes ? `<p>${esc(aq.notes)}</p>` : '<p class="small">Sin nota del acuario.</p>'}
      <div id="deleteAqStatus"></div>
    </section>`, 'acuarios');
  }

  window.resumenAcuario = resumenAcuario;

  window.borrarAcuario = async function () {
    const aq = currentAquarium();
    const box = byId('deleteAqStatus');
    if (!state.user) return login();
    if (!aq) return listaAcuarios();
    if (!confirm('¿Seguro que quieres borrar este acuario? Esta acción no se puede deshacer.')) return;
    try {
      if (box) box.innerHTML = msg('Borrando acuario...', 'notice');
      const { error } = await supabase.from('aquariums').delete().eq('id', aq.id).eq('user_id', state.user.id);
      if (error) throw error;
      state.aquariums = (state.aquariums || []).filter(function (item) { return String(item.id) !== String(aq.id); });
      state.aquarium = null;
      window.q = null;
      listaAcuarios();
    } catch (e) { if (box) box.innerHTML = msg(e.message, 'error'); }
  };

  window.openA = function (id) {
    const aq = (state.aquariums || []).find(function (item) { return String(item.id) === String(id); });
    if (!aq) { render(msg('No se encontró este acuario. Vuelve a cargar la lista.', 'error'), 'acuarios'); return; }
    state.aquarium = aq;
    window.q = aq;
    state.section = 'resumen';
    resumenAcuario();
  };

  window.openAqSection = function (section) {
    const aq = currentAquarium();
    if (!aq) return listaAcuarios();
    state.section = section || 'resumen';
    const routes = { resumen: resumenAcuario, animales: window.animales, mapa: window.mapaIA, fotos: window.fotos, inventario: function () { return window.inventario('aquarium'); }, parametros: window.parametros, tareas: window.tareasAcuario };
    const fn = routes[state.section] || resumenAcuario;
    if (typeof fn === 'function') return fn();
    render(aqHeader(state.section) + `<section class="panel">${msg('Este módulo no está disponible todavía.', 'notice')}</section>`, 'acuarios');
  };
})();