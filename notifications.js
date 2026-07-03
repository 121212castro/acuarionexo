(function () {
  const CHECK_INTERVAL_MS = 15 * 60 * 1000;
  const TOKEN_KEY = 'acuarionexo:fcm-token';
  const MAP_PREFIX = 'ACUARIONEXO_MAP_V2:';
  let checking = false;
  let enabling = false;
  let mapPointerStart = null;

  function installFichaCss() {
    if (document.getElementById('anx-ficha-css')) return;
    const css = '.library-detail-cover{position:relative;width:100%;height:190px;max-height:190px;min-height:150px;overflow:hidden;border-radius:20px;margin:0 0 12px;display:block}.library-detail-cover img{width:100%;max-height:190px;height:auto;display:block}.library-cover-title{position:absolute;left:12px;right:12px;bottom:10px;z-index:2;text-shadow:0 2px 10px rgba(0,0,0,.75)}.library-cover-title h2{font-size:26px;line-height:1.03;margin:0}.ficha-maestra .library-detail-photo{width:100%;max-height:310px}.ficha-maestra .library-detail-section{margin:10px 0;padding:12px}.ficha-maestra .quick-actions{grid-template-columns:1fr 1fr}.ficha-maestra .quick-actions button{min-height:54px}';
    const style = document.createElement('style');
    style.id = 'anx-ficha-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function clamp(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function setMapInput(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = String(value);
  }

  function mapInput(id, fallback) {
    const el = document.getElementById(id);
    const value = el ? el.value : '';
    return value === '' ? fallback : value;
  }

  function readDraftMap(aq) {
    if (window.__aqMap && typeof window.__aqMap === 'object') return window.__aqMap;
    try {
      const text = String(aq?.ai_summary || '');
      if (text.startsWith(MAP_PREFIX)) return JSON.parse(text.slice(MAP_PREFIX.length));
    } catch (_) {}
    return { version: 2, photo_url: '', photos: { front: '', left: '', right: '', top: '' }, markers: [], selected_id: '', updated_at: new Date().toISOString() };
  }

  function writeDraftMap(aq, map) {
    map.version = 2;
    map.markers = Array.isArray(map.markers) ? map.markers : [];
    map.updated_at = new Date().toISOString();
    window.__aqMap = map;
    if (aq) aq.ai_summary = MAP_PREFIX + JSON.stringify(map);
  }

  function placeMapPointFrom3D(event) {
    const stage = document.getElementById('map3dStage');
    const canvas = stage?.querySelector('canvas');
    const aq = window.ANX?.currentAquarium ? window.ANX.currentAquarium() : window.state?.aquarium;
    if (!stage || !canvas || !aq || !stage.contains(event.target)) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    const z = clamp(mapInput('mapMarkerZ', 50), 0, 100);
    const size = clamp(mapInput('mapMarkerSize', 14), 6, 32);
    const map = readDraftMap(aq);
    map.markers = Array.isArray(map.markers) ? map.markers : [];

    let marker = map.selected_id ? map.markers.find(function (item) { return String(item.id) === String(map.selected_id); }) : null;
    if (!marker) {
      marker = { id: 'mk-' + Date.now(), label: '', type: 'coral', note: '', x, y, z, size };
      map.markers.push(marker);
      map.selected_id = marker.id;
    }

    marker.label = mapInput('mapMarkerLabel', '') || ('Punto ' + map.markers.length);
    marker.type = mapInput('mapMarkerType', 'coral') || 'coral';
    marker.note = mapInput('mapMarkerNote', '') || '';
    marker.x = x;
    marker.y = y;
    marker.z = z;
    marker.size = size;

    setMapInput('mapMarkerX', Math.round(x));
    setMapInput('mapMarkerY', Math.round(y));
    setMapInput('mapMarkerZ', Math.round(z));
    setMapInput('mapMarkerSize', Math.round(size));
    writeDraftMap(aq, map);

    if (typeof window.updateMapMarker === 'function') window.updateMapMarker();
    else if (typeof window.mapaIA === 'function') window.mapaIA();
  }

  function installMap3DPointPlacement() {
    document.addEventListener('pointerdown', function (event) {
      const stage = document.getElementById('map3dStage');
      if (!stage || !stage.contains(event.target)) return;
      mapPointerStart = { x: event.clientX, y: event.clientY, t: Date.now(), target: event.target };
    }, true);

    document.addEventListener('pointerup', function (event) {
      const start = mapPointerStart;
      mapPointerStart = null;
      const stage = document.getElementById('map3dStage');
      if (!start || !stage || !stage.contains(event.target)) return;
      const dx = Math.abs(event.clientX - start.x);
      const dy = Math.abs(event.clientY - start.y);
      const dt = Date.now() - start.t;
      if (dx <= 8 && dy <= 8 && dt <= 650) placeMapPointFrom3D(event);
    }, true);
  }

  installFichaCss();
  installMap3DPointPlacement();

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
    installFichaCss();
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