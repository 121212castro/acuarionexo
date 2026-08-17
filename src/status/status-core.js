/* AcuarioNexo · Centro de Estado · núcleo */
(function () {
  const ANX = window.ANX = window.ANX || {};

  function platformName() {
    const platform = window.Capacitor?.getPlatform?.() || 'web';
    return ({ ios: 'iPhone / iPad', android: 'Android', web: 'Web' })[platform] || platform;
  }

  function statusLevel(ok, warning) {
    if (ok) return 'ok';
    return warning ? 'warning' : 'error';
  }

  function safeDate(value) {
    if (!value) return 'Sin actividad registrada';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
    return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  }

  async function safeQuery(job, fallback) {
    try {
      const result = await job();
      return result?.error ? fallback : result;
    } catch (_) {
      return fallback;
    }
  }

  async function remoteBuild() {
    try {
      const response = await fetch('app-version.json?status=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return null;
      const data = await response.json();
      return data?.build || null;
    } catch (_) {
      return null;
    }
  }

  async function collectUserData() {
    const { supabase, state } = ANX;
    const userId = state?.user?.id;
    if (!supabase || !userId) return {};

    const [devices, deliveries, reports, aiUsage] = await Promise.all([
      safeQuery(() => supabase.from('notification_devices').select('id,provider,platform,enabled,last_seen_at,created_at').eq('user_id', userId).order('last_seen_at', { ascending: false }).limit(10), { data: [] }),
      safeQuery(() => supabase.from('notification_deliveries').select('id,status,provider,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20), { data: [] }),
      safeQuery(() => supabase.from('support_reports').select('id,status,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50), { data: [] }),
      safeQuery(() => supabase.from('ai_usage_logs').select('id,created_at').eq('user_id', userId).limit(100), { data: [] })
    ]);

    return {
      devices: devices.data || [],
      deliveries: deliveries.data || [],
      reports: reports.data || [],
      aiUsage: aiUsage.data || []
    };
  }

  async function collectAdminData() {
    const { state, countTable } = ANX;
    if (!state?.isAdmin || typeof countTable !== 'function') return null;
    const [aquariums, devices, reports, library, aiUsage] = await Promise.all([
      countTable('aquariums'),
      countTable('notification_devices', q => q.eq('enabled', true)),
      countTable('support_reports', q => q.not('status', 'in', '(resolved,closed)')),
      countTable('library_entries'),
      countTable('ai_usage_logs')
    ]);
    return { aquariums, devices, reports, library, aiUsage };
  }

  async function collect() {
    const { state, config } = ANX;
    const installedBuild = window.ACUARIONEXO_BUILD || 'dev';
    const [publishedBuild, userData, adminData] = await Promise.all([
      remoteBuild(),
      collectUserData(),
      collectAdminData()
    ]);

    const pushDiagnostic = window.AcuarioNexoNotifications?.diagnostic?.() || window.AcuarioNexoPushDiagnostic || null;
    const devices = userData.devices || [];
    const deliveries = userData.deliveries || [];
    const reports = userData.reports || [];
    const enabledDevice = devices.find(item => item.enabled);
    const lastDelivery = deliveries[0] || null;
    const openReports = reports.filter(item => !['resolved', 'closed'].includes(item.status)).length;
    const online = navigator.onLine !== false;
    const versionCurrent = !!publishedBuild && publishedBuild === installedBuild;
    const aiAccess = ANX.AIAccess?.access?.() || {
      allowed: !!window.AcuarioNexoSettings?.load?.().aiEnabled,
      plan: window.AcuarioNexoSettings?.load?.().plan || 'free',
      source: 'local',
      note: 'Beta cerrada: no hay suscripciones ni cobros activos'
    };

    return {
      generatedAt: new Date().toISOString(),
      application: {
        level: statusLevel(versionCurrent, !publishedBuild),
        installedBuild,
        publishedBuild: publishedBuild || 'No se pudo consultar',
        appVersion: config?.APP_VERSION || 'AcuarioNexo',
        current: versionCurrent
      },
      account: {
        level: state?.user ? 'ok' : 'error',
        email: state?.user?.email || 'Sin sesión',
        role: state?.isAdmin ? (state.adminRole?.role || 'admin') : 'usuario',
        plan: window.AcuarioNexoSettings?.load?.().plan || 'free'
      },
      connection: {
        level: online ? 'ok' : 'error',
        online,
        supabase: !!ANX.supabase,
        platform: platformName()
      },
      notifications: {
        level: statusLevel(!!enabledDevice, !!pushDiagnostic),
        registered: !!enabledDevice,
        devices: devices.length,
        provider: enabledDevice?.provider || 'Sin registrar',
        lastSeen: safeDate(enabledDevice?.last_seen_at),
        lastDelivery: safeDate(lastDelivery?.created_at),
        lastDeliveryStatus: lastDelivery?.status || 'Sin envíos',
        diagnostic: pushDiagnostic?.stage || 'Sin diagnóstico'
      },
      support: {
        level: openReports ? 'warning' : 'ok',
        total: reports.length,
        open: openReports,
        latest: safeDate(reports[0]?.created_at)
      },
      ai: {
        level: aiAccess.allowed ? 'ok' : 'warning',
        enabled: !!aiAccess.allowed,
        plan: aiAccess.plan || 'free',
        usage: (userData.aiUsage || []).length,
        accessSource: aiAccess.source || 'unknown',
        note: aiAccess.note || ''
      },
      storage: {
        level: 'ok',
        cacheAvailable: 'caches' in window,
        localStorageAvailable: (() => { try { localStorage.setItem('__anx_test', '1'); localStorage.removeItem('__anx_test'); return true; } catch (_) { return false; } })()
      },
      admin: adminData
    };
  }

  ANX.StatusCore = { collect, platformName, safeDate };
})();
