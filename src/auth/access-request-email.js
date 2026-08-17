/* AcuarioNexo · access request email notification */
(function () {
  const ANX = window.ANX || {};
  const supabase = ANX.supabase;
  const val = ANX.val;
  const byId = ANX.byId;
  const msg = ANX.msg;
  const authMessage = ANX.authMessage || function (e) { return String(e?.message || e || 'Error'); };
  const LEGAL_VERSION = '2026-08-17';

  if (!supabase || !val) return;

  window.enviarSolicitudAcceso = async function () {
    try {
      const email = val('accessEmail');
      const name = val('accessName');
      const messageText = val('accessMessage');
      if (!email) throw new Error('Pon tu email.');
      if (!byId('accessLegalAccepted')?.checked) throw new Error('Debes aceptar las condiciones y leer la política de privacidad.');

      const request = await supabase.rpc('submit_access_request', {
        p_email: email,
        p_name: name || null,
        p_message: messageText || null,
        p_legal_version: LEGAL_VERSION,
        p_legal_accepted: true
      });
      if (request.error) throw request.error;

      if (byId('x')) byId('x').innerHTML = msg('Solicitud enviada. Te avisaremos cuando el acceso haya sido aprobado.', 'success');
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(authMessage(e), 'error');
    }
  };
})();
