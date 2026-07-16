/* AcuarioNexo · Soporte y reportes */
(function () {
  const ANX = window.ANX;
  const { state, render, esc, msg, supabase } = ANX;

  const STATUS_LABELS = {
    sent: 'Enviado',
    reviewing: 'En revisión',
    accepted: 'Aceptado',
    in_progress: 'En desarrollo',
    resolved: 'Resuelto',
    closed: 'Cerrado'
  };

  function platform() {
    try { return window.Capacitor?.getPlatform?.() || 'web'; } catch (_) { return 'web'; }
  }

  function diagnostic() {
    return {
      version: ANX.config?.APP_VERSION || null,
      build: window.ACUARIONEXO_BUILD || null,
      platform: platform(),
      user_agent: navigator.userAgent || null,
      push: window.AcuarioNexoNotifications?.diagnostic?.() || window.AcuarioNexoPushDiagnostic || null,
      settings: window.AcuarioNexoSettings?.load?.() || null,
      generated_at: new Date().toISOString()
    };
  }

  function field(label, control, help) {
    return `<label class="support-field"><span>${esc(label)}</span>${control}${help ? `<small>${esc(help)}</small>` : ''}</label>`;
  }

  function select(id, options) {
    return `<select id="${id}">${options.map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join('')}</select>`;
  }

  function formHtml() {
    return `<section class="panel support-page">
      <div class="support-header"><button class="support-back" onclick="settings()">←</button><div><h2>Soporte</h2><p>Reporta fallos, mejoras o consultas</p></div></div>
      <article class="support-card support-intro">
        <strong>El diagnóstico técnico se adjunta automáticamente.</strong>
        <p>No se incluyen contraseñas, claves privadas ni tokens completos.</p>
      </article>
      <form class="support-form" onsubmit="submitSupportReport(event)">
        ${field('Tipo de reporte', select('supportType', [['bug','Fallo'],['improvement','Mejora'],['question','Consulta']]), '')}
        ${field('Módulo', select('supportModule', [['general','General'],['inicio','Inicio'],['acuarios','Acuarios'],['biblioteca','Biblioteca'],['microfauna','Microfauna'],['avisos','Avisos'],['ia','Inteligencia artificial'],['ajustes','Ajustes'],['cuenta','Cuenta y acceso']]), '')}
        ${field('Título', '<input id="supportTitle" maxlength="120" required placeholder="Resume el problema o propuesta">', 'Entre 5 y 120 caracteres')}
        ${field('Descripción', '<textarea id="supportDescription" rows="5" maxlength="3000" required placeholder="Explica qué ocurrió y cuándo"></textarea>', 'Incluye los datos necesarios para entenderlo')}
        <div id="supportBugFields">
          ${field('Pasos para reproducir', '<textarea id="supportSteps" rows="4" maxlength="2000" placeholder="1. Abrir... 2. Pulsar..."></textarea>', '')}
          ${field('Resultado esperado', '<textarea id="supportExpected" rows="3" maxlength="1500" placeholder="Qué debería ocurrir"></textarea>', '')}
          ${field('Resultado obtenido', '<textarea id="supportActual" rows="3" maxlength="1500" placeholder="Qué ocurrió realmente"></textarea>', '')}
        </div>
        ${field('Prioridad', select('supportPriority', [['low','Baja'],['normal','Normal'],['high','Alta'],['critical','Crítica']]), 'Usa Crítica solo cuando impida utilizar la aplicación o comprometa datos')}
        <label class="support-consent"><input id="supportIncludeDiagnostic" type="checkbox" checked> Adjuntar diagnóstico técnico de la app</label>
        <button id="supportSubmitBtn" class="primary" type="submit">Enviar reporte</button>
        <div id="supportMessage"></div>
      </form>
      <div class="support-actions"><button onclick="supportHistory()">Ver mis reportes</button><button onclick="settings()">Volver a Ajustes</button></div>
    </section>`;
  }

  window.support = function () {
    if (!state.user) return window.login?.();
    render(formHtml(), 'inicio');
    const type = document.getElementById('supportType');
    type?.addEventListener('change', function () {
      document.getElementById('supportBugFields')?.classList.toggle('hidden', type.value !== 'bug');
    });
  };

  window.submitSupportReport = async function (event) {
    event.preventDefault();
    const button = document.getElementById('supportSubmitBtn');
    const box = document.getElementById('supportMessage');
    try {
      const title = document.getElementById('supportTitle')?.value.trim() || '';
      const description = document.getElementById('supportDescription')?.value.trim() || '';
      if (title.length < 5) throw new Error('El título debe tener al menos 5 caracteres.');
      if (description.length < 15) throw new Error('La descripción debe tener al menos 15 caracteres.');
      button.disabled = true;
      button.textContent = 'Enviando...';
      const includeDiagnostic = !!document.getElementById('supportIncludeDiagnostic')?.checked;
      const row = {
        user_id: state.user.id,
        report_type: document.getElementById('supportType')?.value || 'bug',
        module: document.getElementById('supportModule')?.value || 'general',
        title,
        description,
        steps: document.getElementById('supportSteps')?.value.trim() || null,
        expected_result: document.getElementById('supportExpected')?.value.trim() || null,
        actual_result: document.getElementById('supportActual')?.value.trim() || null,
        priority: document.getElementById('supportPriority')?.value || 'normal',
        app_version: ANX.config?.APP_VERSION || null,
        build: window.ACUARIONEXO_BUILD || null,
        platform: platform(),
        user_agent: navigator.userAgent || null,
        diagnostic: includeDiagnostic ? diagnostic() : {}
      };
      const result = await supabase.from('support_reports').insert(row).select('id,status,created_at').single();
      if (result.error) throw result.error;
      box.innerHTML = msg('Reporte enviado correctamente. Puedes consultar su estado en Mis reportes.', 'success');
      event.target.reset();
      document.getElementById('supportIncludeDiagnostic').checked = true;
    } catch (error) {
      box.innerHTML = msg(error.message || error, 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Enviar reporte';
    }
  };

  window.supportHistory = async function () {
    if (!state.user) return window.login?.();
    render('<section class="panel support-page"><div class="support-header"><button class="support-back" onclick="support()">←</button><div><h2>Mis reportes</h2><p>Cargando historial...</p></div></div></section>', 'inicio');
    const result = await supabase.from('support_reports').select('id,report_type,module,title,priority,status,admin_response,created_at,updated_at').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(100);
    if (result.error) {
      render(`<section class="panel support-page">${msg(result.error.message, 'error')}<button onclick="support()">Volver</button></section>`, 'inicio');
      return;
    }
    const cards = (result.data || []).map(function (report) {
      return `<article class="support-report-card">
        <div class="support-report-top"><span class="support-status status-${esc(report.status)}">${esc(STATUS_LABELS[report.status] || report.status)}</span><small>${esc(new Date(report.created_at).toLocaleString('es-ES'))}</small></div>
        <h3>${esc(report.title)}</h3>
        <p>${esc(report.report_type === 'bug' ? 'Fallo' : report.report_type === 'improvement' ? 'Mejora' : 'Consulta')} · ${esc(report.module || 'general')} · prioridad ${esc(report.priority)}</p>
        ${report.admin_response ? `<div class="support-response"><strong>Respuesta:</strong><p>${esc(report.admin_response)}</p></div>` : ''}
      </article>`;
    }).join('');
    render(`<section class="panel support-page">
      <div class="support-header"><button class="support-back" onclick="support()">←</button><div><h2>Mis reportes</h2><p>${result.data?.length || 0} enviados</p></div></div>
      <div class="support-history">${cards || '<article class="support-card"><p>No has enviado reportes todavía.</p></article>'}</div>
      <div class="support-actions"><button class="primary" onclick="support()">Nuevo reporte</button><button onclick="settings()">Ajustes</button></div>
    </section>`, 'inicio');
  };
})();