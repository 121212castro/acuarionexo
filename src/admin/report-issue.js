/* AcuarioNexo · incidencia de usuario */
(function () {
  const A = () => window.ANX || {};
  const { supabase, state, esc, byId, val, msg, render } = A();

  function safeArea() {
    const active = document.querySelector('.bottom-nav button.active small')?.textContent || '';
    return active || state.section || 'app';
  }

  function removeTopButton() {
    document.getElementById('reportIssueTopBtn')?.remove();
  }

  window.reportIssueForm = function () {
    removeTopButton();
    if (!state?.user) return login();
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Incidencia</h2><p>Enviar aviso al administrador</p></div></section>
      <section class="panel">
        <button onclick="dashboard()">← Volver</button>
        <label>Zona afectada</label>
        <select id="reportArea">
          <option value="${esc(safeArea())}">${esc(safeArea())}</option>
          <option value="Inicio">Inicio</option>
          <option value="Acuarios">Acuarios</option>
          <option value="Biblioteca">Biblioteca</option>
          <option value="Microfauna">Microfauna</option>
          <option value="Inventario">Inventario</option>
          <option value="Avisos">Avisos</option>
          <option value="Admin">Admin</option>
        </select>
        <label>Gravedad</label>
        <select id="reportSeverity">
          <option value="normal">Normal</option>
          <option value="low">Baja</option>
          <option value="high">Alta</option>
          <option value="critical">Crítica</option>
        </select>
        <label>Título</label><input id="reportTitle" placeholder="Qué falla">
        <label>Descripción</label><textarea id="reportDetails" placeholder="Qué estabas haciendo, qué esperabas y qué ocurrió"></textarea>
        <button class="primary" onclick="sendIssueReport()">Enviar incidencia</button>
        <div id="reportMsg"></div>
      </section>`, 'inicio');
  };

  window.sendIssueReport = async function () {
    const box = byId('reportMsg');
    try {
      if (!state?.user?.id) throw new Error('Sesión no disponible.');
      const title = val('reportTitle');
      const details = val('reportDetails');
      if (!title) throw new Error('Pon un título.');
      if (!details) throw new Error('Describe la incidencia.');
      if (box) box.innerHTML = msg('Enviando incidencia...', 'notice');
      const { error } = await supabase.from('admin_reports').insert({
        user_id: state.user.id,
        area: val('reportArea') || safeArea(),
        severity: val('reportSeverity') || 'normal',
        title,
        details,
        user_agent: navigator.userAgent || '',
        status: 'open'
      });
      if (error) throw error;
      if (box) box.innerHTML = msg('Incidencia enviada. Queda registrada para revisión.', 'success');
    } catch (e) {
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  removeTopButton();
  setInterval(removeTopButton, 1000);
})();
