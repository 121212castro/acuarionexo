(function () {
  const APP = 'acuarionexo';
  const BUILD = window.ACUARIONEXO_BUILD || 'dev';
  const KEY = APP + ':active-build';

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
    } catch (_) {}
  }

  async function forceReload() {
    await clearAppCache();
    const base = location.pathname || './';
    location.replace(base + '?v=' + encodeURIComponent(BUILD) + '-' + Date.now());
  }

  async function checkVersion() {
    try {
      const res = await fetch('app-version.json?v=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;
      const remote = await res.json();
      if (!remote || !remote.build) return;
      if (remote.build !== BUILD) {
        localStorage.setItem(KEY, remote.build);
        await forceReload();
        return;
      }
      const stored = localStorage.getItem(KEY);
      if (!stored) {
        localStorage.setItem(KEY, remote.build);
        return;
      }
      if (stored !== remote.build) {
        localStorage.setItem(KEY, remote.build);
        await forceReload();
      }
    } catch (_) {}
  }

  window.AcuarioNexoUpdate = { checkVersion, forceReload, clearAppCache };
  window.hardRefreshAcuarioNexo = forceReload;

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) checkVersion();
  });
  window.addEventListener('online', checkVersion);
  setTimeout(checkVersion, 800);
})();
