(function () {
  const CHECK_INTERVAL_MS = 15 * 60 * 1000;
  const TOKEN_KEY = 'acuarionexo:push-token';
  const PENDING_TOKEN_KEY = 'acuarionexo:pending-push-token';
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

  async function resolveUserId() {
    const stateUserId = window.state?.user?.id;
    if (stateUserId) return stateUserId;
    try {
      const result = await window.s?.auth?.getUser?.();
      return result?.data?.user?.id || null;
    } catch (_) {
      return null;
    }
  }

  function rememberPendingToken(token, platform, provider) {
    try {
      localStorage.setItem(PENDING_TOKEN_KEY, JSON.stringify({
        token,
        platform,
        provider,
        saved_at: new Date().toISOString()
      }));
    } catch (_) {}
  }

  async function saveDeviceToken(token, platformOverride, providerOverride) {
    if (!token) return false;
    const platform = platformOverride || (/iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'web');
    const provider = providerOverride || (platform === 'ios-app' ? 'apns' : 'fcm');
    const userId = await resolveUserId();

    if (!window.s || !userId) {
      rememberPendingToken(token, platform, provider);
      return false;
    }

    const row = {
      user_id: userId,
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
    if (error) {
      rememberPendingToken(token, platform, provider);
      throw error;
    }
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(PENDING_TOKEN_KEY);
    return true;
  }

  async function flushPendingToken() {
    let pending = null;
    try {
      pending = JSON.parse(localStorage.getItem(PENDING_TOKEN_KEY) || 'null');
    } catch (_) {}
    if (!pending?.token) return false;
    try {
      return await saveDeviceToken(pending.token, pending.platform, pending.provider);
    } catch (error) {
      console.warn('AcuarioNexo pending push token save error', error);
      return false;
    }
  }

  async function registerNativePush() {
    if (!isNativePush() || nativePushStarted) {
      await flushPendingToken();
      return null;
    }
    nativePushStarted = true;
    const platform = capacitorPlatform();
    const PushNotifications = nativePushPlugin();
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return null;

    await PushNotifications.addListener('registration', async function (token) {
      const value = token?.value || token?.token || '';
      if (!value) return;
      try {
        if (platform === 'ios') await saveDeviceToken(value, 'ios-app', 'apns');
        else await saveDeviceToken(value, 'android-app', 'fcm');
      } catch (error) {
        console.warn('AcuarioNexo push token save error', error);
      }
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
      await flushPendingToken();
      if (isNativePush()) {
        await registerNativePush();
        setTimeout(flushPendingToken, 1500);
        setTimeout(flushPendingToken, 5000);
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
    setTimeout(flushPendingToken, 8000);
    setTimeout(checkDueTasks, 30000);
    setInterval(checkDueTasks, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        enableNotifications();
        flushPendingToken();
        checkDueTasks();
      }
    });
    window.addEventListener('focus', function () {
      enableNotifications();
      flushPendingToken();
      checkDueTasks();
    });
  }

  window.AcuarioNexoNotifications = {
    enable: enableNotifications,
    checkDueTasks,
    registerNativePush,
    registerFirebaseMessaging,
    flushPendingToken
  };
  window.addEventListener('load', start);
})();