(function () {
  const APP = 'acuarionexo';
  const CURRENT_BUILD = window.ACUARIONEXO_BUILD || 'dev';
  const KEY = APP + ':active-build';
  const LAST_CHECK_KEY = APP + ':last-version-check';
  const CHECK_INTERVAL_MS = 10 * 60 * 1000;
  const MIN_CHECK_GAP_MS = 60 * 1000;
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
    window.location.replace(window.location.pathname + '?v=' + Date.now());
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

  function showUpdateNotice(remoteBuild) {
    if (!remoteBuild || remoteBuild === CURRENT_BUILD) return;
    let box = document.getElementById('anxUpdateNotice');
    if (!box) {
      box = document.createElement('div');
      box.id = 'anxUpdateNotice';
      box.style.position = 'fixed';
      box.style.left = '12px';
      box.style.right = '12px';
      box.style.bottom = '86px';
      box.style.zIndex = '999999';
      box.style.padding = '12px';
      box.style.borderRadius = '16px';
      box.style.background = 'rgba(5, 28, 48, .96)';
      box.style.border = '1px solid rgba(84, 190, 255, .55)';
      box.style.boxShadow = '0 12px 30px rgba(0,0,0,.35)';
      box.style.color = '#fff';
      box.style.fontWeight = '800';
      document.body.appendChild(box);
    }
    box.innerHTML = '<div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span>Hay una versión nueva de AcuarioNexo.</span><button id="anxApplyUpdateBtn" class="primary" style="color:#fff!important">Actualizar ahora</button></div>';
    const btn = document.getElementById('anxApplyUpdateBtn');
    if (btn) btn.onclick = forceReload;
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
      if (manual) return forceReload();
      if (remoteBuild && remoteBuild !== CURRENT_BUILD) showUpdateNotice(remoteBuild);
    } catch (_) {
    } finally {
      checking = false;
    }
  }

  function bindRefreshButton() {
    const btn = document.getElementById('refreshAppBtn');
    if (!btn) return;
    btn.title = 'Actualizar AcuarioNexo';
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
