(function () {
  const APP = 'acuarionexo';
  const CURRENT_BUILD = window.ACUARIONEXO_BUILD || 'dev';
  const KEY = APP + ':active-build';
  const LAST_CHECK_KEY = APP + ':last-version-check';
  const UPDATED_KEY = APP + ':updated-build';
  const CHECK_INTERVAL_MS = 5 * 60 * 1000;
  const MIN_CHECK_GAP_MS = 30 * 1000;
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
      localStorage.removeItem(APP + ':hotloaded-build');
      localStorage.removeItem(APP + ':last-forced-reload-build');
    } catch (_) {}
  }

  function reloadUrl(build) {
    const params = new URLSearchParams(window.location.search || '');
    params.set('v', build || CURRENT_BUILD || 'reload');
    params.set('t', String(Date.now()));
    return window.location.pathname + '?' + params.toString();
  }

  function softReload() {
    window.location.replace(reloadUrl(CURRENT_BUILD));
  }

  async function forceReload(remoteBuild) {
    const target = remoteBuild || CURRENT_BUILD;
    try { sessionStorage.setItem(UPDATED_KEY, target); } catch (_) {}
    await clearAppCache();
    window.location.replace(reloadUrl(target));
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
    return remote && remote.build ? String(remote.build) : null;
  }

  function removeNotice() {
    document.getElementById('anxUpdateNotice')?.remove();
  }

  function showUpdateNotice(remoteBuild) {
    if (!remoteBuild || remoteBuild === CURRENT_BUILD) return;
    let box = document.getElementById('anxUpdateNotice');
    if (!box) {
      box = document.createElement('div');
      box.id = 'anxUpdateNotice';
      box.setAttribute('role', 'alertdialog');
      box.setAttribute('aria-modal', 'true');
      box.style.position = 'fixed';
      box.style.inset = '0';
      box.style.zIndex = '999999';
      box.style.display = 'grid';
      box.style.placeItems = 'center';
      box.style.padding = '24px';
      box.style.background = 'rgba(1, 10, 20, .88)';
      box.style.backdropFilter = 'blur(10px)';
      document.body.appendChild(box);
    }
    box.innerHTML = '<section style="width:min(100%,520px);padding:24px;border-radius:24px;background:linear-gradient(180deg,#0d2e4c,#081c30);border:1px solid rgba(84,190,255,.55);box-shadow:0 20px 60px rgba(0,0,0,.55);color:#fff;text-align:center">' +
      '<div style="font-size:42px;margin-bottom:10px">↻</div>' +
      '<h2 style="margin:0 0 10px;font-size:28px">Nueva actualización disponible</h2>' +
      '<p style="margin:0 0 18px;line-height:1.45;color:#cfe4f5">AcuarioNexo necesita actualizarse para cargar todos los cambios correctamente.</p>' +
      '<button id="anxApplyUpdateBtn" class="primary" style="width:100%;min-height:52px;font-size:18px;color:#fff!important">Actualizar ahora</button>' +
      '<p style="margin:12px 0 0;font-size:12px;color:#9fb8cc">No se cerrará tu sesión ni se borrarán tus datos.</p>' +
      '</section>';
    const btn = document.getElementById('anxApplyUpdateBtn');
    if (btn) btn.onclick = async function () {
      btn.disabled = true;
      btn.textContent = 'Actualizando…';
      await forceReload(remoteBuild);
    };
  }

  function showUpdatedConfirmation() {
    let updatedBuild = '';
    try {
      updatedBuild = sessionStorage.getItem(UPDATED_KEY) || '';
      sessionStorage.removeItem(UPDATED_KEY);
    } catch (_) {}
    if (!updatedBuild) return;
    const box = document.createElement('div');
    box.id = 'anxUpdatedConfirmation';
    box.style.position = 'fixed';
    box.style.left = '12px';
    box.style.right = '12px';
    box.style.top = 'calc(12px + env(safe-area-inset-top))';
    box.style.zIndex = '999999';
    box.style.maxWidth = '520px';
    box.style.margin = '0 auto';
    box.style.padding = '14px 16px';
    box.style.borderRadius = '16px';
    box.style.background = 'rgba(8, 48, 66, .97)';
    box.style.border = '1px solid rgba(34,224,131,.55)';
    box.style.boxShadow = '0 12px 30px rgba(0,0,0,.35)';
    box.style.color = '#fff';
    box.style.fontWeight = '800';
    box.textContent = '✓ AcuarioNexo se ha actualizado correctamente.';
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 5000);
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
      if (remoteBuild && remoteBuild !== CURRENT_BUILD) {
        showUpdateNotice(remoteBuild);
        return;
      }
      removeNotice();
      if (manual) return forceReload(remoteBuild || CURRENT_BUILD);
    } catch (_) {
      if (manual) return forceReload(CURRENT_BUILD);
    } finally {
      checking = false;
    }
  }

  function bindRefreshButton() {
    const btn = document.getElementById('refreshAppBtn');
    if (!btn) return;
    btn.title = 'Buscar actualizaciones';
    btn.addEventListener('click', function () {
      checkVersion({ manual: true });
    });
  }

  window.AcuarioNexoUpdate = { checkVersion, forceReload, softReload, clearAppCache, showUpdateNotice };
  window.hardRefreshAcuarioNexo = forceReload;
  window.softRefreshAcuarioNexo = softReload;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindRefreshButton();
      showUpdatedConfirmation();
    });
  } else {
    bindRefreshButton();
    showUpdatedConfirmation();
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) checkVersion();
  });
  window.addEventListener('focus', checkVersion);
  window.addEventListener('pageshow', checkVersion);
  window.addEventListener('online', checkVersion);
  setTimeout(checkVersion, 800);
  setInterval(checkVersion, CHECK_INTERVAL_MS);
})();