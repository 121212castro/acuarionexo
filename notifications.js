/* AcuarioNexo · Notificaciones push FCM · Fase inicial */
(function () {
  const cfg = window.ACUARIONEXO_CONFIG || {};
  const firebaseConfig = cfg.FIREBASE_CONFIG;
  const vapidKey = cfg.FIREBASE_VAPID_KEY;

  function ready() {
    return !!(firebaseConfig && vapidKey && 'serviceWorker' in navigator && 'Notification' in window && window.firebase);
  }

  function statusText() {
    if (!('Notification' in window)) return 'Este navegador no permite notificaciones web.';
    if (!('serviceWorker' in navigator)) return 'Este navegador no permite service workers.';
    if (!firebaseConfig || !vapidKey) return 'Falta configuración de Firebase Messaging.';
    if (!window.firebase) return 'Firebase Messaging no se ha cargado todavía.';
    if (Notification.permission === 'granted') return 'Notificaciones permitidas en este dispositivo.';
    if (Notification.permission === 'denied') return 'Notificaciones bloqueadas en este dispositivo.';
    return 'Notificaciones pendientes de activar.';
  }

  async function saveToken(token) {
    try {
      if (!window.s || !window.state?.user?.id) return { saved: false, reason: 'Sin sesión de usuario.' };
      const row = {
        user_id: window.state.user.id,
        token,
        platform: 'web',
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString()
      };
      const r = await window.s.from('notification_tokens').upsert(row, { onConflict: 'token' });
      if (r.error) return { saved: false, reason: r.error.message };
      return { saved: true };
    } catch (e) {
      return { saved: false, reason: e.message };
    }
  }

  async function enablePushNotifications() {
    if (!ready()) throw new Error(statusText());

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Permiso de notificaciones no concedido.');

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging(app);
    const token = await messaging.getToken({ vapidKey, serviceWorkerRegistration: registration });
    if (!token) throw new Error('Firebase no devolvió token para este dispositivo.');

    const saved = await saveToken(token);
    window.AcuarioNexoNotifications.lastToken = token;
    window.AcuarioNexoNotifications.lastSave = saved;
    return { token, saved };
  }

  function renderButton() {
    const target = document.querySelector('.top-actions');
    if (!target || document.getElementById('notifyBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'notifyBtn';
    btn.className = 'ghost';
    btn.innerHTML = '🔔<small>Avisos</small>';
    btn.title = statusText();
    btn.addEventListener('click', async () => {
      try {
        btn.disabled = true;
        btn.innerHTML = '…<small>Avisos</small>';
        const result = await enablePushNotifications();
        const txt = result.saved?.saved ? 'Notificaciones activadas y token guardado.' : 'Notificaciones activadas. Token no guardado todavía: ' + (result.saved?.reason || 'sin detalle');
        alert(txt);
      } catch (e) {
        alert(e.message || String(e));
      } finally {
        btn.disabled = false;
        btn.innerHTML = '🔔<small>Avisos</small>';
        btn.title = statusText();
      }
    });
    target.prepend(btn);
  }

  window.AcuarioNexoNotifications = { statusText, enablePushNotifications, renderButton, lastToken: null, lastSave: null };
  document.addEventListener('DOMContentLoaded', renderButton);
  setTimeout(renderButton, 1000);
})();
