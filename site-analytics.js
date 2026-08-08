/* AcuarioNexo · analítica propia con consentimiento */
(function () {
  const ANX = window.ANX;
  if (!ANX || typeof ANX.render !== 'function') return;

  const COLLECT_URL = 'https://vqpxhozavfzgtkqscncs.supabase.co/functions/v1/analytics-collect';
  const CONSENT_KEY = 'anx_analytics_consent';
  const SESSION_KEY = 'anx_analytics_session';
  let lastSignature = '';
  let lastSentAt = 0;

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

  async function trackPage(page) {
    if (!consentGranted()) return;
    const safePage = String(page || 'inicio').slice(0, 120);
    const signature = safePage + '|' + location.pathname + location.search;
    const now = Date.now();
    if (signature === lastSignature && now - lastSentAt < 2500) return;
    lastSignature = signature;
    lastSentAt = now;

    try {
      await fetch(COLLECT_URL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: 'granted',
          sessionId: sessionId(),
          page: safePage,
          path: location.pathname + location.search,
          referrerHost: referrerHost(),
          device: deviceType()
        }),
        keepalive: true
      });
    } catch (_) {
      // La analítica nunca debe bloquear el uso de la aplicación.
    }
  }

  const originalRender = ANX.render;
  ANX.render = function (html, active, showNav) {
    const result = originalRender(html, active, showNav);
    setTimeout(function () { trackPage(active || 'inicio'); }, 0);
    return result;
  };

  const accept = document.getElementById('anxCookieAccept');
  if (accept) accept.addEventListener('click', function () {
    setTimeout(function () { trackPage(ANX.state?.section || 'inicio'); }, 50);
  });

  window.ANXAnalytics = { trackPage, consentGranted };
})();
