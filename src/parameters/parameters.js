/* AcuarioNexo · parameters */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;
  const { AI_DAY, aiMeasurementPlans, aiParameterLabels, aiAquariumMode, normalizeMeasurementKey, measurementNumber, aiLatestMeasurements, interpretMeasurementValue } = window.ANX;

async function parametros() {
  const aq = currentAquarium();
  const t = token();
  render(aqHeader('parametros') + `<section class="panel"><div class="panel-head"><h2>Parámetros</h2><div class="panel-actions"><button onclick="parametrosAdmin()">Manual</button><button class="primary" onclick="formMedicionCompleta('weekly')">Semanal</button></div></div>${msg('Cargando parámetros...')}</section>`, 'acuarios');
  try {
    const { data, error } = await supabase.from('aquarium_measurements').select('*').eq('aquarium_id', aq.id).order('measured_at', { ascending: false }).limit(180);
    if (error) throw error;
    if (!isCurrent(t)) return;
    const rows = data || [];
    render(aqHeader('parametros') + `<section class="panel param-screen">
      <div class="panel-head"><h2>Parámetros</h2><div class="panel-actions"><button onclick="parametrosAdmin()">Manual</button><button class="primary" onclick="formMedicionCompleta('weekly')">Semanal</button></div></div>
      ${paramActionPanel()}
      ${paramLatestPanel(aq, rows)}
      ${paramCyclePanel(rows)}
      <h3>Historial</h3>
      ${paramHistoryHtml(rows)}
    </section>`, 'acuarios');
  } catch (e) {
    if (isCurrent(t)) render(aqHeader('parametros') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
  }
}

window.parametros = parametros;

function paramKeysForAquarium(aq) {
  return Object.keys(aiMeasurementPlans[aiAquariumMode(aq)] || aiMeasurementPlans.marine);
}

function paramActionPanel() {
  return `<div class="param-actions param-profile-actions">
    <button onclick="formMedicionCompleta('weekly')">Semanal</button>
    <button onclick="formMedicionCompleta('monthly')">Mensual</button>
    <button onclick="formMedicionCompleta('icp')">ICP</button>
  </div>`;
}

function paramDisplayValue(row) {
  return String(row?.display_value || row?.raw_text || row?.value || row?.normalized_value || '-').replace(/^=\s*/, '').trim();
}

function paramVisualState(aq, row) {
  if (!row) return { cls: 'p-empty', label: 'Sin datos' };
  const chemical = interpretMeasurementValue(aq, row);
  if (chemical?.priority === 'high') return { cls: 'p-risk', label: 'Riesgo' };
  if (chemical) return { cls: 'p-alert', label: 'Alerta' };
  if (['red', 'purple'].includes(row.color) || ['high', 'critical'].includes(row.risk_level)) return { cls: 'p-risk', label: 'Riesgo' };
  if (['yellow', 'orange'].includes(row.color) || row.risk_level === 'medium') return { cls: 'p-alert', label: 'Alerta' };
  const key = normalizeMeasurementKey(row);
  const plan = aiMeasurementPlans[aiAquariumMode(aq)] || aiMeasurementPlans.marine;
  const freq = plan[key] || (key === 'salinity_sg' ? plan.salinity_ppt : null);
  if (freq) {
    const measured = new Date(row.measured_at || row.created_at || Date.now());
    if (new Date(measured.getTime() + freq * AI_DAY) < new Date()) return { cls: 'p-caution', label: 'Precaución' };
  }
  return { cls: 'p-ok', label: 'Bien' };
}

function paramTileHtml(aq, key, row) {
  const stateInfo = paramVisualState(aq, row);
  const label = aiParameterLabels[key] || row?.parameter_label || key;
  if (!row) {
    return `<button class="date-param param-latest ${stateInfo.cls}" onclick="formMedicionCompleta('weekly')"><b>${esc(label)}</b><strong>Pendiente</strong><span class="status-pill">${esc(stateInfo.label)}</span></button>`;
  }
  return `<button class="date-param param-latest ${stateInfo.cls}" onclick="formMedicionCompleta('weekly')">
    <b>${esc(label)}</b>
    <strong>${esc(paramDisplayValue(row))}</strong>
    <span class="status-pill">${esc(stateInfo.label)}</span>
    <small>${dateText(row.measured_at || row.created_at)}</small>
  </button>`;
}

function paramLatestPanel(aq, rows) {
  const latest = aiLatestMeasurements(rows);
  const tiles = paramKeysForAquarium(aq).map(function (key) {
    const row = latest[key] || (key === 'salinity_ppt' ? latest.salinity_sg : null);
    return paramTileHtml(aq, key, row);
  }).join('');
  return `<div class="param-aq-card">
    <h3>Última medición</h3>
    <div class="param-legend"><span class="ok">Bien</span><span class="warn">Precaución</span><span class="alert">Alerta</span><span class="risk">Riesgo</span></div>
    <div class="date-body param-latest-grid">${tiles}</div>
  </div>`;
}

function paramCyclePanel(rows) {
  const weekly = rows.find(r => r.source === 'weekly' || /semanal/i.test(r.method || ''));
  const monthly = rows.find(r => r.source === 'monthly' || /mensual/i.test(r.method || ''));
  const icp = rows.find(r => r.source === 'icp' || /icp|laboratorio/i.test(r.method || ''));
  function item(title, row, action) {
    return `<button class="param-cycle-card" onclick="${action}">
      <b>${esc(title)}</b>
      <strong>${row ? esc(dateText(row.measured_at || row.created_at)) : 'Pendiente'}</strong>
      <small>${row ? esc(row.method || row.source || 'Registrado') : 'Crear registro'}</small>
    </button>`;
  }
  return `<div class="param-aq-card">
    <h3>Ciclos de medición</h3>
    <div class="param-cycle-grid">
      ${item('Semanal', weekly, "formMedicionCompleta('weekly')")}
      ${item('Mensual', monthly, "formMedicionCompleta('monthly')")}
      ${item('ICP', icp, "formMedicionCompleta('icp')")}
    </div>
  </div>`;
}

function paramHistoryHtml(rows) {
  if (!rows.length) return msg('Sin mediciones todavía.');
  return `<div class="date-list">${rows.map(function (r) {
    const key = normalizeMeasurementKey(r);
    return `<div class="item param-history-row">
      <b>${esc(r.parameter_label || aiParameterLabels[key] || key || 'Parámetro')}</b>
      <p>${esc(paramDisplayValue(r))}</p>
      <p class="small">${dateText(r.measured_at || r.created_at)}${r.method ? ' · ' + esc(r.method) : ''}${r.source ? ' · ' + esc(r.source) : ''}${r.notes ? ' · ' + esc(r.notes) : ''}</p>
    </div>`;
  }).join('')}</div>`;
}

window.parametrosAdmin = function () {
  formParametro('__manual');
};

window.formParametro = function (preset = '') {
  if (!preset) return formMedicionCompleta('weekly');
  const manualPreset = preset === '__manual' ? '' : preset;
  render(aqHeader('parametros') + `<section class="panel">
    <button onclick="openAqSection('parametros')">← Volver</button>
    <h2>Registro manual</h2>
    <div class="param-actions param-profile-actions">
      <button type="button" onclick="formMedicionCompleta('weekly')">Semanal</button>
      <button type="button" onclick="formMedicionCompleta('monthly')">Mensual</button>
      <button type="button" onclick="formMedicionCompleta('icp')">ICP</button>
    </div>
    ${msg('Usa este formulario solo para una medición puntual fuera de los ciclos.', 'notice')}
    <label>Parámetro</label><input id="parName" value="${esc(manualPreset)}" placeholder="KH, NO3, PO4, pH...">
    <label>Valor</label><input id="parValue" placeholder="Ej. 8.2">
    <label>Fecha</label><input id="parDate" type="datetime-local" value="${new Date().toISOString().slice(0, 16)}">
    <label>Notas</label><textarea id="parNotes"></textarea>
    <button class="primary" onclick="saveParametro()">Guardar</button>
    <div id="x"></div>
  </section>`, 'acuarios');
};

window.saveParametro = async function () {
  try {
    const aq = currentAquarium();
    if (!val('parName')) throw new Error('Indica el parámetro.');
    const key = normalizeMeasurementKey({ parameter_key: val('parName') });
    const rawValue = measurementNumber({ raw_text: val('parValue') });
    const row = {
      user_id: state.user.id,
      aquarium_id: aq.id,
      parameter_key: key,
      parameter_label: aiParameterLabels[key] || val('parName'),
      display_value: val('parValue'),
      raw_text: val('parValue'),
      raw_value: rawValue,
      normalized_value: rawValue,
      measured_at: val('parDate') ? new Date(val('parDate')).toISOString() : new Date().toISOString(),
      notes: val('parNotes') || null
    };
    const { error } = await supabase.from('aquarium_measurements').insert(row);
    if (error) throw error;
    parametros();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};
})();
