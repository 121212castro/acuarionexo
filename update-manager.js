(function () {
  const APP = 'acuarionexo';
  const CURRENT_BUILD = window.ACUARIONEXO_BUILD || 'dev';
  const KEY = APP + ':active-build';
  const LAST_CHECK_KEY = APP + ':last-version-check';
  const CHECK_INTERVAL_MS = 60000;

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

  async function forceReload(nextBuild) {
    await clearAppCache();
    const build = nextBuild || CURRENT_BUILD || Date.now();
    const base = location.pathname || './';
    location.replace(base + '?v=' + encodeURIComponent(build) + '-' + Date.now());
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

  async function checkVersion() {
    try {
      localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
      const remoteBuild = await fetchRemoteVersion();
      if (!remoteBuild) return;

      const storedBuild = localStorage.getItem(KEY);
      if (!storedBuild) localStorage.setItem(KEY, remoteBuild);

      if (remoteBuild !== CURRENT_BUILD || (storedBuild && storedBuild !== remoteBuild)) {
        localStorage.setItem(KEY, remoteBuild);
        return;
      }
    } catch (_) {}
  }

  window.AcuarioNexoUpdate = { checkVersion, forceReload, clearAppCache };
  window.hardRefreshAcuarioNexo = forceReload;

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) checkVersion();
  });
  window.addEventListener('focus', checkVersion);
  window.addEventListener('online', checkVersion);
  setTimeout(checkVersion, 800);
  setInterval(checkVersion, CHECK_INTERVAL_MS);
})();
