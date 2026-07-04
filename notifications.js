(function () {
  const CHECK_INTERVAL_MS = 15 * 60 * 1000;
  const TOKEN_KEY = 'acuarionexo:fcm-token';
  let checking = false;
  let enabling = false;

  function escText(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  function injectFallbackParameterAi() {
    const screen = document.querySelector('.param-screen');
    if (!screen || screen.querySelector('.param-ai-card')) return;
    const tiles = Array.from(screen.querySelectorAll('.param-latest'));
    if (!tiles.length) return;
    const missing = [];
    const risk = [];
    const alert = [];
    const caution = [];
    tiles.forEach(function (tile) {
      const name = (tile.querySelector('b')?.textContent || '').trim();
      const value = (tile.querySelector('strong')?.textContent || '').trim();
      const state = (tile.querySelector('.status-pill')?.textContent || '').trim();
      const text = name + (value ? ': ' + value : '');
      if (/sin datos|pendiente/i.test(state) || /pendiente/i.test(value)) missing.push(name);
      else if (/riesgo/i.test(state)) risk.push(text);
      else if (/alerta/i.test(state)) alert.push(text);
      else if (/precaución|precaucion/i.test(state)) caution.push(text);
    });
    const title = risk.length ? 'Riesgo detectado' : alert.length ? 'Alertas pendientes' : missing.length ? 'Faltan mediciones para decidir' : caution.length ? 'Revisión recomendada' : 'Sin urgencias detectadas';
    const cls = risk.length ? 'error' : (alert.length || missing.length || caution.length ? 'notice' : 'success');
    const lines = [];
    if (missing.length) lines.push('Faltan mediciones: ' + missing.slice(0, 8).join(', ') + (missing.length > 8 ? '...' : '') + '.');
    if (risk.length) lines.push('Riesgo: ' + risk.slice(0, 6).join(' · ') + '.');
    if (alert.length) lines.push('Alerta: ' + alert.slice(0, 6).join(' · ') + '.');
    if (caution.length) lines.push('Revisar: ' + caution.slice(0, 6).join(' · ') + '.');
    if (!lines.length) lines.push('Mantén la rutina y registra cambios de agua, aditivos e incidencias.');
    const html = `<div class="param-aq-card param-ai-card">
      <h3>Análisis IA</h3>
      <div class="${cls}"><b>${escText(title)}</b><br>${escText(lines.join(' '))}</div>
      <section class="param-ai-block"><h4>Consejos seguros</h4><ul>
        <li>Antes de aditar o corregir, repite los parámetros marcados y confirma el método/test usado.</li>
        <li>Si faltan mediciones, mide primero; no tomes decisiones con datos incompletos.</li>
        <li>Anota cambios recientes: agua, salinidad, alimentación, aditivos, bajas o limpieza.</li>
      </ul></section>
    </div>`;
    const cycle = Array.from(screen.querySelectorAll('.param-aq-card')).find(function (card) {
      return /Ciclos de medición/i.test(card.textContent || '');
    });
    if (cycle) cycle.insertAdjacentHTML('beforebegin', html);
    else screen.insertAdjacentHTML('beforeend', html);
  }

  function installParameterAiFallback() {
    const run = function () { try { injectFallbackParameterAi(); } catch (_) {} };
    setInterval(run, 1200);
    document.addEventListener('click', function () { setTimeout(run, 350); }, true);
    window.addEventListener('focus', run);
  }

  installParameterAiFallback();

  function canNotify() {
    return 'Notification' in window;
  }

  async function saveDeviceToken(token) {
    if (!token || !window.s || !window.state?.user) return;
    const row = {
      user_id: window.state.user.id,
      provider: 'fcm',
      token,
      platform: /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'web',
      user_agent: navigator.userAgent || null,
      enabled: true,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await window.s
      .from('notification_devices')
      .upsert(row, { onConflict: 'user_id,provider,token' });
    if (error) throw error;
    localStorage.setItem(TOKEN_KEY, token);
  }

  async function registerFirebaseMessaging() {
    const cfg = window.ACUARIONEXO_CONFIG || {};
    if (!cfg.FIREBASE_CONFIG || !cfg.FIREBASE_VAPID_KEY || !window.firebase || !navigator.serviceWorker) return null;
    const registration = await navigator.serviceWorker.register('firebase-messaging-sw.js?v=' + (window.ACUARIONEXO_BUILD || Date.now()));
    const apps = window.firebase.apps || [];
    const app = apps.length ? apps[0] : window.firebase.initializeApp(cfg.FIREBASE_CONFIG);
    const messaging = window.firebase.messaging(app);
    const token = await messaging.getToken({
      vapidKey: cfg.FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    if (token) await saveDeviceToken(token);
    messaging.onMessage(function (payload) {
      const title = payload?.notification?.title || 'AcuarioNexo';
      const body = payload?.notification?.body || payload?.data?.title || 'Aviso pendiente';
      if (Notification.permission === 'granted') new Notification(title, { body, tag: payload?.data?.task_id || body });
    });
    return token;
  }

  async function checkDueTasks() {
    if (checking || !window.s || !window.state?.user || !canNotify() || Notification.permission !== 'granted') return;
    checking = true;
    try {
      const now = new Date().toISOString();
      const r = await window.s
        .from('tasks')
        .select('id,title,due_at,status,priority,notes')
        .eq('user_id', window.state.user.id)
        .neq('status', 'done')
        .lte('due_at', now)
        .limit(20);
      if (r.error || !r.data) return;
      const shown = JSON.parse(localStorage.getItem('acuarionexo_notified') || '[]');
      const set = new Set(shown);
      let changed = false;
      r.data.forEach(function (t) {
        if (set.has(t.id)) return;
        new Notification('AcuarioNexo', {
          body: t.title || 'Aviso pendiente',
          tag: t.id,
          data: { task_id: t.id },
          requireInteraction: t.priority === 'high'
        });
        set.add(t.id);
        changed = true;
      });
      if (changed) localStorage.setItem('acuarionexo_notified', JSON.stringify(Array.from(set).slice(-200)));
    } catch (_) {
    } finally {
      checking = false;
    }
  }

  async function enableNotifications() {
    if (enabling || !canNotify()) return false;
    enabling = true;
    try {
      if (Notification.permission === 'default') await Notification.requestPermission();
      if (Notification.permission !== 'granted') return false;
      try { await registerFirebaseMessaging(); } catch (_) {}
      await checkDueTasks();
      return true;
    } finally {
      enabling = false;
    }
  }

  function start() {
    installParameterAiFallback();
    if (!canNotify()) return;
    setTimeout(enableNotifications, 3500);
    setTimeout(checkDueTasks, 30000);
    setInterval(checkDueTasks, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        enableNotifications();
        checkDueTasks();
      }
    });
    window.addEventListener('focus', function () {
      enableNotifications();
      checkDueTasks();
    });
  }

  window.AcuarioNexoNotifications = { enable: enableNotifications, checkDueTasks };
  window.addEventListener('load', start);
})();
