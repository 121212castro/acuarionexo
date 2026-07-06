/* AcuarioNexo · Parameters alert helpers */
(function () {
  function taskNotesPayload(notes, meta = {}) {
    const cleanMeta = Object.fromEntries(Object.entries(meta).filter(([, value]) => value !== null && value !== undefined && value !== ''));
    return `${Object.keys(cleanMeta).length ? `AcuarioNexoTaskMeta:${JSON.stringify(cleanMeta)}\n` : ''}${notes || ''}`.trim() || null;
  }

  function notifyLocalParameterAlert(title, body, tag) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      new Notification(title, { body, tag, requireInteraction: true });
    } catch (_) {}
  }

  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { taskNotesPayload, notifyLocalParameterAlert });
  window.ANX.ParametersAlertHelpers = { taskNotesPayload, notifyLocalParameterAlert };
})();