/* AcuarioNexo · analítica propia con consentimiento */
(function () {
  const ANX = window.ANX;
  if (!ANX || typeof ANX.render !== 'function') return;

  const COLLECT_URL = 'https://vqpxhozavfzgtkqscncs.supabase.co/functions/v1/analytics-collect';
  const CONSENT_KEY = 'anx_analytics_consent';
  const SESSION_KEY = 'anx_analytics_session';
  const ADMIN_DEVICE_KEY = 'anx_analytics_admin_device';
  const ALLOWED_EVENTS = new Set(['page_view', 'access_landing_view', 'access_form_open', 'access_request_submitted']);
  const recentEvents = new Map();

  function consentGranted() {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  }

  function sessionId() {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : 'anx-' + Date.now() + '-' + Math.random().toString(36).slice(2));
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function deviceType() {
    const ua = navigator.userAgent || '';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))) return 'tablet';
    if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  function referrerHost() {
    try {
      if (!document.referrer) return '';
      return new URL(document.referrer).hostname || '';
    } catch (_) {
      return '';
    }
  }

  function actorType() {
    if (ANX.state?.isAdmin) {
      localStorage.setItem(ADMIN_DEVICE_KEY, '1');
      return 'admin';
    }
    if (localStorage.getItem(ADMIN_DEVICE_KEY) === '1') return 'admin';
    return ANX.state?.user ? 'user' : 'visitor';
  }

  async function trackEvent(eventName, page) {
    if (!consentGranted()) return;
    const safeEvent = String(eventName || '').trim();
    if (!ALLOWED_EVENTS.has(safeEvent)) return;
    const safePage = String(page || 'inicio').slice(0, 120);
    const signature = safeEvent + '|' + safePage + '|' + location.pathname + location.search;
    const now = Date.now();
    if (now - Number(recentEvents.get(signature) || 0) < 2500) return;
    recentEvents.set(signature, now);

    try {
      await fetch(COLLECT_URL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: 'granted',
          sessionId: sessionId(),
          eventName: safeEvent,
          page: safePage,
          path: location.pathname + location.search,
          referrerHost: referrerHost(),
          device: deviceType(),
          actorType: actorType()
        }),
        keepalive: true
      });
    } catch (_) {
      // La analítica nunca debe bloquear el uso de la aplicación.
    }
  }

  function trackPage(page) {
    return trackEvent('page_view', page);
  }

  const originalRender = ANX.render;
  ANX.render = function (html, active, showNav) {
    const result = originalRender(html, active, showNav);
    setTimeout(function () { trackPage(active || 'inicio'); }, 0);
    return result;
  };

  const accept = document.getElementById('anxCookieAccept');
  if (accept) accept.addEventListener('click', function () {
    setTimeout(function () {
      trackPage(ANX.state?.section || 'inicio');
      if (!ANX.state?.user) trackEvent('access_landing_view', 'acceso');
    }, 50);
  });

  window.ANXAnalytics = { trackPage, trackEvent, consentGranted };
})();
