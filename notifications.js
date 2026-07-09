(function () {
  const CHECK_INTERVAL_MS = 15 * 60 * 1000;
  const TOKEN_KEY = 'acuarionexo:fcm-token';
  let checking = false;
  let enabling = false;
  let nativeAndroidStarted = false;

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

  function isAndroidNative() {
    return capacitorPlatform() === 'android' && !!window.Capacitor?.Plugins?.PushNotifications;
  }

  async function saveDeviceToken(token, platformOverride) {
    if (!token || !window.s || !window.state?.user) return;
    const row = {
      user_id: window.state.user.id,
      provider: 'fcm',
      token,
      platform: platformOverride || (/iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'web'),
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

  async function registerNativeAndroidPush() {
    if (!isAndroidNative() || nativeAndroidStarted) return null;
    nativeAndroidStarted = true;
    const PushNotifications = window.Capacitor.Plugins.PushNotifications;
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return null;

    await PushNotifications.addListener('registration', async function (token) {
      const value = token?.value || token?.token || '';
      if (value) await saveDeviceToken(value, 'android-app');
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
    if (token) await saveDeviceToken(token, 'web-fcm');
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
    if (enabling) return false;
    enabling = true;
    try {
      if (isAndroidNative()) {
        await registerNativeAndroidPush();
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

  window.AcuarioNexoNotifications = { enable: enableNotifications, checkDueTasks, registerNativeAndroidPush, registerFirebaseMessaging };
  window.addEventListener('load', start);
})();

(function () {
  function ANX() { return window.ANX || {}; }
  function core() { return ANX().LibraryV3Core || {}; }
  function schema() { return ANX().LibrarySchema || {}; }
  function ficha() { return ANX().LibraryV3Ficha || {}; }
  function el(id) { return document.getElementById(id); }
  function val(id) { return (el(id)?.value || '').trim(); }
  function set(id, value) { const node = el(id); if (!node) return false; node.value = String(value ?? '').trim(); return true; }
  function notice(text, kind) { return ANX().msg ? ANX().msg(text, kind) : '<div class="' + (kind || 'notice') + '">' + String(text) + '</div>'; }
  function getJson(text) { const m = String(text || '').match(/ACUARIONEXO_JSON_START\s*([\s\S]*?)\s*ACUARIONEXO_JSON_END/i); return m ? JSON.parse(m[1]) : null; }
  function normSources(raw) { return schema().normalizeSources ? schema().normalizeSources(raw || []) : (Array.isArray(raw) ? raw : []); }
  function sourceText(raw) { return normSources(raw).map(s => [s.name || s.title || '', s.url || '', s.used_for || ''].join(' | ')).join('\n'); }
  function firstSourceName(raw) { const s = normSources(raw)[0]; return s ? String(s.name || s.title || 'Fuente 1').trim() : ''; }
  function cleanKey(key) { return ({ sourceLabel: 'source_label', etiqueta_fuente: 'source_label', etiquetaFuente: 'source_label' })[key] || key; }
  function setData(key, value) { key = cleanKey(key); const node = el('libData_' + key); if (!node || value == null || value === '') return false; node.value = Array.isArray(value) ? value.join(', ') : String(value); return true; }
  function applySourceLabel(preferred) { const node = el('libData_source_label'); if (!node || node.value.trim()) return false; const label = String(preferred || firstSourceName(ficha().parseSourcesRaw ? ficha().parseSourcesRaw(val('libSourcesRaw')) : []) || '').trim(); if (!label) return false; node.value = label; return true; }
  function applyJson(parsed, entry) {
    let count = 0;
    if (parsed.title && set('libTitle', parsed.title)) count++;
    if (parsed.scientific_name && core().biologicalTypes?.has(entry.entry_type) && set('libScientific', parsed.scientific_name)) count++;
    if (parsed.summary && set('libSummary', parsed.summary)) count++;
    if (Array.isArray(parsed.tags) && set('libTags', parsed.tags.join(', '))) count++;
    if (Array.isArray(parsed.sources) && parsed.sources.length && set('libSourcesRaw', sourceText(parsed.sources))) count++;
    const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
    Object.entries(data).forEach(([key, value]) => { if (setData(key, value)) count++; });
    if (applySourceLabel(data.source_label || data.sourceLabel || data.etiqueta_fuente || data.etiquetaFuente || firstSourceName(parsed.sources))) count++;
    return count;
  }
  const oldPaste = window.aplicarFichaChat;
  window.aplicarFichaChat = function (id) {
    const box = el('chatPasteStatus');
    try {
      const parsed = getJson(val('chatPasteText'));
      if (!parsed) return oldPaste ? oldPaste(id) : undefined;
      const entry = core().row ? core().row(id) : null;
      if (!entry) throw new Error('Ficha no encontrada.');
      const count = applyJson(parsed, entry);
      if (!count) throw new Error('No pude repartir el JSON de la ficha.');
      if (box) box.innerHTML = notice('Ficha repartida: ' + count + ' campos rellenados. Guarda la ficha completa.', 'success');
    } catch (e) {
      if (box) box.innerHTML = notice(e.message, 'error');
    }
  };
  window.guardarFicha = async function (id) {
    const box = el('x');
    try {
      const entry = core().row ? core().row(id) : null;
      if (!entry) throw new Error('Ficha no encontrada.');
      const payload = ficha().read(entry);
      payload.data = payload.data || {};
      if (!String(payload.data.source_label || '').trim()) payload.data.source_label = firstSourceName(payload.sources);
      const merged = { ...entry, ...payload };
      ficha().assertComplete(merged, 'No se puede guardar');
      const r = await ANX().supabase.from('library_entries').update(payload).eq('id', id).eq('user_id', ANX().state.user.id);
      if (r.error) throw r.error;
      Object.assign(entry, payload);
      if (box) box.innerHTML = notice('Ficha guardada completa.', 'success');
    } catch (e) {
      if (box) box.innerHTML = e.audit ? ficha().auditHtml(e.audit) : notice(e.message, 'error');
    }
  };
})();
