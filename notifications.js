(function () {
  const CHECK_INTERVAL_MS = 15 * 60 * 1000;
  const TOKEN_KEY = 'acuarionexo:push-token';
  let checking = false;
  let enabling = false;
  let nativePushStarted = false;

  function canNotify() {
    return 'Notification' in window;
  }

  function capacitorPlatform() {
    try {
      return window.Capacitor?.getPlatform ? window.Capacitor.getPlatform() : '';
    } catch (_) {
      return '';
    }
  }

  function nativePushPlugin() {
    return window.Capacitor?.Plugins?.PushNotifications || null;
  }

  function isNativePush() {
    const platform = capacitorPlatform();
    return (platform === 'ios' || platform === 'android') && !!nativePushPlugin();
  }

  async function saveDeviceToken(token, platformOverride, providerOverride) {
    if (!token || !window.s || !window.state?.user) return;
    const platform = platformOverride || (/iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'web');
    const provider = providerOverride || (platform === 'ios-app' ? 'apns' : 'fcm');
    const row = {
      user_id: window.state.user.id,
      provider,
      token,
      platform,
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

  async function registerNativePush() {
    if (!isNativePush() || nativePushStarted) return null;
    nativePushStarted = true;
    const platform = capacitorPlatform();
    const PushNotifications = nativePushPlugin();
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return null;

    await PushNotifications.addListener('registration', async function (token) {
      const value = token?.value || token?.token || '';
      if (!value) return;
      if (platform === 'ios') await saveDeviceToken(value, 'ios-app', 'apns');
      else await saveDeviceToken(value, 'android-app', 'fcm');
    });

    await PushNotifications.addListener('registrationError', function (error) {
      console.warn('AcuarioNexo push registration error', error);
    });

    await PushNotifications.addListener('pushNotificationReceived', function (notification) {
      console.info('AcuarioNexo push received', notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', function () {
      try { window.tareas ? window.tareas() : location.assign(location.pathname + '?avisos=1'); } catch (_) {}
    });

    await PushNotifications.register();
    return true;
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
    if (token) await saveDeviceToken(token, 'web-fcm', 'fcm');
    messaging.onMessage(function (payload) {
      const title = payload?.notification?.title || 'AcuarioNexo';
      const body = payload?.notification?.body || payload?.data?.title || 'Aviso pendiente';
      if (Notification.permission === 'granted') new Notification(title, {
        body,
        tag: payload?.data?.task_id || body,
        silent: false,
        renotify: true
      });
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
          requireInteraction: t.priority === 'high',
          silent: false,
          renotify: true
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
    if (enabling) return false;
    enabling = true;
    try {
      if (isNativePush()) {
        await registerNativePush();
        return true;
      }
      if (!canNotify()) return false;
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

  window.AcuarioNexoNotifications = {
    enable: enableNotifications,
    checkDueTasks,
    registerNativePush,
    registerFirebaseMessaging
  };
  window.addEventListener('load', start);
})();