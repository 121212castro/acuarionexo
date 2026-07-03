(function () {
  const APP = 'acuarionexo';
  const CURRENT_BUILD = window.ACUARIONEXO_BUILD || 'dev';
  const KEY = APP + ':active-build';
  const LAST_CHECK_KEY = APP + ':last-version-check';
  const CHECK_INTERVAL_MS = 30 * 60 * 1000;
  const MIN_CHECK_GAP_MS = 5 * 60 * 1000;
  let checking = false;

  async function clearAppCache() {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(function (key) { return caches.delete(key); }));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function (reg) { return reg.unregister(); }));
      }
      localStorage.removeItem(APP + ':last-forced-reload-build');
      localStorage.removeItem(APP + ':hotloaded-build');
    } catch (_) {}
  }

  async function forceReload() {
    await clearAppCache();
    window.location.reload();
  }

  async function fetchRemoteVersion() {
    const res = await fetch('app-version.json?v=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    });
    if (!res.ok) return null;
    const remote = await res.json();
    return remote && remote.build ? remote.build : null;
  }

  async function checkVersion(options) {
    const manual = !!(options && options.manual);
    if (checking) return;
    const lastCheck = Date.parse(localStorage.getItem(LAST_CHECK_KEY) || '');
    if (!manual && Number.isFinite(lastCheck) && Date.now() - lastCheck < MIN_CHECK_GAP_MS) return;
    checking = true;
    try {
      localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
      const remoteBuild = await fetchRemoteVersion();
      if (remoteBuild) localStorage.setItem(KEY, remoteBuild);
      if (manual) await forceReload();
    } catch (_) {
    } finally {
      checking = false;
    }
  }

  function bindRefreshButton() {
    const btn = document.getElementById('refreshAppBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      checkVersion({ manual: true });
    });
  }

  window.AcuarioNexoUpdate = { checkVersion, forceReload, clearAppCache };
  window.hardRefreshAcuarioNexo = forceReload;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindRefreshButton);
  } else {
    bindRefreshButton();
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) checkVersion();
  });
  window.addEventListener('focus', checkVersion);
  window.addEventListener('online', checkVersion);
  setTimeout(checkVersion, 800);
  setInterval(checkVersion, CHECK_INTERVAL_MS);
})();