/* AcuarioNexo · parameters */
(function () {
  const { supabase, state, esc, msg, token, isCurrent, currentAquarium, render, aqHeader } = window.ANX;
  const { aiMeasurementPlans, aiParameterLabels, aiAquariumMode, aiLatestMeasurements } = window.ANX;
  const { paramKeysForAquarium, paramDisplayValue, paramVisualState, paramLatestPanel, paramAgeDays, paramAiAdviceFor, paramHistoryHtml, taskNotesPayload, notifyLocalParameterAlert } = window.ANX;

async function parametros() {
  const aq = currentAquarium();
  const t = token();
  render(aqHeader('parametros') + `<section class="panel"><div class="panel-head"><h2>Parámetros</h2><div class="panel-actions"><button onclick="parametrosAdmin()">Manual</button><button class="primary" onclick="formMedicionCompleta('routine')">Medición completa</button></div></div>${msg('Cargando parámetros...')}</section>`, 'acuarios');
  try {
    const { data, error } = await supabase.from('aquarium_measurements').select('*').eq('aquarium_id', aq.id).order('measured_at', { ascending: false }).limit(180);
    if (error) throw error;
    if (!isCurrent(t)) return;
    const rows = data || [];
    render(aqHeader('parametros') + `<section class="panel param-screen">
      <div class="panel-head"><h2>Parámetros</h2><div class="panel-actions"><button onclick="parametrosAdmin()">Manual</button><button class="primary" onclick="formMedicionCompleta('routine')">Medición completa</button><button onclick="formMedicionCompleta('icp')">ICP / laboratorio</button></div></div>
      ${paramLatestPanel(aq, rows)}
      ${paramAiPanel(aq, rows)}
      <h3>Historial</h3>
      ${paramHistoryHtml(rows)}
    </section>`, 'acuarios');
    ensureParameterAlerts(aq, rows);
  } catch (e) {
    if (isCurrent(t)) render(aqHeader('parametros') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
  }
}

window.parametros = parametros;

function parameterAlertCandidates(aq, rows) {
  const latest = aiLatestMeasurements(rows);
  const keys = paramKeysForAquarium(aq);
  const out = [];
  keys.forEach(function (key) {
    const row = latest[key] || (key === 'salinity_ppt' ? latest.salinity_sg : null);
    if (!row) return;
    const stateInfo = paramVisualState(aq, row);
    if (!['Riesgo', 'Alerta'].includes(stateInfo.label)) return;
    const label = aiParameterLabels[key] || row.parameter_label || key;
    const value = paramDisplayValue(row);
    const alertKey = `param:${aq.id}:${key}:${stateInfo.label}:${value}`;
    out.push({ key, label, value, stateInfo, alertKey, row });
  });
  return out;
}

async function ensureParameterAlerts(aq, rows) {
  if (!aq || !state.user) return;
  const candidates = parameterAlertCandidates(aq, rows);
  if (!candidates.length) return;
  try {
    const existing = await supabase.from('tasks')
      .select('id,title,notes,status')
      .eq('user_id', state.user.id)
      .eq('aquarium_id', aq.id)
      .eq('task_type', 'parameter_alert')
      .neq('status', 'done')
      .limit(80);
    if (existing.error) throw existing.error;
    const existingText = (existing.data || []).map(function (t) { return String(t.notes || '') + ' ' + String(t.title || ''); }).join('\n');
    const rowsToInsert = [];
    candidates.forEach(function (c) {
      if (existingText.includes(c.alertKey)) return;
      const high = c.stateInfo.label === 'Riesgo';
      const title = `${high ? 'Riesgo' : 'Alerta'} en ${c.label}: ${c.value}`;
      const body = `${aq.name || 'Acuario'} · repetir medición y revisar antes de corregir.`;
      rowsToInsert.push({
        user_id: state.user.id,
        aquarium_id: aq.id,
        title,
        task_type: 'parameter_alert',
        type: 'parameter_alert',
        category: 'Parámetros',
        priority: high ? 'high' : 'medium',
        status: 'open',
        due_at: new Date().toISOString(),
        notes: taskNotesPayload(`${body}\nParámetro: ${c.label}\nValor: ${c.value}\nEstado: ${c.stateInfo.label}`, {
          route: 'parametros', source: 'parameters_ai', alert_key: c.alertKey, parameter_key: c.key, state: c.stateInfo.label, value: c.value
        })
      });
      notifyLocalParameterAlert('AcuarioNexo · ' + title, body, c.alertKey);
    });
    if (!rowsToInsert.length) return;
    const insert = await supabase.from('tasks').insert(rowsToInsert);
    if (insert.error) throw insert.error;
    if (window.AcuarioNexoNotifications?.checkDueTasks) setTimeout(function () { window.AcuarioNexoNotifications.checkDueTasks(); }, 500);
  } catch (_) {}
}

function paramAiPanel(aq, rows) {
  const latest = aiLatestMeasurements(rows);
  const plan = aiMeasurementPlans[aiAquariumMode(aq)] || aiMeasurementPlans.marine;
  const keys = paramKeysForAquarium(aq);
  const missing = [];
  const old = [];
  const risk = [];
  const alert = [];
  const advice = [];

  keys.forEach(function (key) {
    const row = latest[key] || (key === 'salinity_ppt' ? latest.salinity_sg : null);
    const stateInfo = paramVisualState(aq, row);
    const label = aiParameterLabels[key] || row?.parameter_label || key;
    const freq = plan[key] || (key === 'salinity_sg' ? plan.salinity_ppt : null);
    const days = paramAgeDays(row);
    if (!row) missing.push(label);
    if (row && freq && days != null && days > freq) old.push(`${label} (${days} días)`);
    if (stateInfo.label === 'Riesgo') risk.push(`${label}: ${paramDisplayValue(row)}`);
    if (stateInfo.label === 'Alerta') alert.push(`${label}: ${paramDisplayValue(row)}`);
    const text = paramAiAdviceFor(key, row, stateInfo);
    if (text) advice.push(text);
  });

  const priority = risk.length ? 'Riesgo detectado' : alert.length ? 'Alertas pendientes' : missing.length || old.length ? 'Faltan datos para decidir' : 'Sin urgencias detectadas';
  const priorityClass = risk.length ? 'error' : alert.length ? 'notice' : (missing.length || old.length ? 'notice' : 'success');
  const nextChecks = [];
  if (missing.length) nextChecks.push(`Medir pendientes: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '...' : ''}.`);
  if (old.length) nextChecks.push(`Actualizar mediciones antiguas: ${old.slice(0, 8).join(', ')}${old.length > 8 ? '...' : ''}.`);
  if (risk.length || alert.length) nextChecks.push('Antes de aditar o hacer cambios fuertes, repetir los parámetros marcados y anotar fecha, test/equipo y cambios recientes. Se creará aviso en la pantalla Avisos.');
  if (!nextChecks.length) nextChecks.push('Mantener tu rutina de medición completa y registrar cualquier cambio de agua, aditivo o incidencia.');

  return `<div class="param-aq-card param-ai-card">
    <h3>Análisis IA</h3>
    <div class="${priorityClass}"><b>${esc(priority)}</b><br>${esc(nextChecks.join(' '))}</div>
    ${risk.length ? `<section class="param-ai-block"><h4>Riesgo</h4><p>${esc(risk.join(' · '))}</p></section>` : ''}
    ${alert.length ? `<section class="param-ai-block"><h4>Alerta</h4><p>${esc(alert.join(' · '))}</p></section>` : ''}
    <section class="param-ai-block"><h4>Consejos seguros</h4><ul>${advice.slice(0, 6).map(function (x) { return `<li>${esc(x)}</li>`; }).join('') || '<li>No hay acciones urgentes con los datos actuales.</li>'}</ul></section>
  </div>`;
}
})();
