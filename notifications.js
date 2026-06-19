(function () {
  const CHECK_INTERVAL_MS = 15 * 60 * 1000;
  let checking = false;

  async function checkDueTasks() {
    if (checking || document.hidden || !window.s || !window.state?.user) return;
    checking = true;
    try {
      const now = new Date().toISOString();
      const r = await window.s
        .from('tasks')
        .select('id,title,due_at,status')
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
        new Notification('AcuarioNexo', { body: t.title || 'Aviso pendiente' });
        set.add(t.id);
        changed = true;
      });
      if (changed) localStorage.setItem('acuarionexo_notified', JSON.stringify(Array.from(set)));
    } catch (_) {
    } finally {
      checking = false;
    }
  }

  async function run() {
    if (!('Notification' in window)) return;
    try {
      if (Notification.permission === 'default') await Notification.requestPermission();
      if (Notification.permission !== 'granted') return;
      setTimeout(checkDueTasks, 30000);
      setInterval(checkDueTasks, CHECK_INTERVAL_MS);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) checkDueTasks();
      });
    } catch (_) {}
  }

  window.addEventListener('load', run);
})();
