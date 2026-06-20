/* AcuarioNexo · mediciones completas */
(function () {
  const { supabase, state, esc, byId, val, msg, currentAquarium, render, aqHeader } = window.ANX;
  const parameterLabels = window.ANX.aiParameterLabels || {};
  const plans = window.ANX.aiMeasurementPlans || {};
  const normalize = window.ANX.normalizeMeasurementKey || (v => String(v || '').trim().toLowerCase().replace(/\s+/g, '_'));

  const defaultKeys = ['temperature','salinity','ph','kh','ammonia','nitrite','nitrate','phosphate','calcium','magnesium','potassium','iodine'];
  const units = { temperature: '°C', salinity: 'ppt', salinity_sg: 'sg', ph: 'pH', kh: 'dKH', ammonia: 'mg/L', nitrite: 'mg/L', nitrate: 'mg/L', phosphate: 'mg/L', calcium: 'mg/L', magnesium: 'mg/L', potassium: 'mg/L', iodine: 'mg/L' };
  function keysFor(aq) {
    const mode = window.ANX.aiAquariumMode ? window.ANX.aiAquariumMode(aq) : 'reef_mixed';
    const plan = plans[mode]?.parameters || [];
    return [...new Set([...(plan.length ? plan : defaultKeys), 'salinity_sg'])];
  }
  function labelFor(key) { return parameterLabels[key] || key.replace(/_/g, ' '); }

  function injectButton() {
    const panel = document.querySelector('.panel-head .panel-actions') || document.querySelector('.panel-head');
    if (!panel || byId('advancedMeasurementsBtn')) return;
    panel.insertAdjacentHTML('afterbegin', '<button id="advancedMeasurementsBtn" onclick="formMedicionCompleta()">Completa</button>');
  }

  const originalParametros = window.parametros;
  if (typeof originalParametros === 'function') {
    window.parametros = async function () {
      await originalParametros();
      setTimeout(injectButton, 0);
    };
  }

  window.formMedicionCompleta = function () {
    const aq = currentAquarium();
    if (!aq) return;
    const now = new Date().toISOString().slice(0, 16);
    const rows = keysFor(aq).map(key => `<div class="measurement-row"><label>${esc(labelFor(key))}</label><input id="m_${esc(key)}" inputmode="decimal" placeholder="Valor"><input id="u_${esc(key)}" value="${esc(units[key] || '')}" placeholder="Unidad"></div>`).join('');
    render(aqHeader('parametros') + `<section class="panel"><button onclick="parametros()">Volver</button><h2>Medicion completa</h2><label>Fecha</label><input id="measureDate" type="datetime-local" value="${now}"><label>Metodo / test</label><input id="measureMethod" placeholder="Hanna, Salifert, ICP, refractometro..."><div class="measurement-grid">${rows}</div><label>Notas</label><textarea id="measureNotes" placeholder="Cambios de agua, aditivos, observaciones..."></textarea><button class="primary" onclick="saveMedicionCompleta()">Guardar mediciones</button><div id="x"></div></section>`, 'acuarios');
  };

  window.saveMedicionCompleta = async function () {
    const aq = currentAquarium();
    if (!aq) return;
    const batch = crypto?.randomUUID ? crypto.randomUUID() : `batch-${Date.now()}`;
    const measured_at = val('measureDate') ? new Date(val('measureDate')).toISOString() : new Date().toISOString();
    const notes = val('measureNotes') || null;
    const method = val('measureMethod') || null;
    const rows = keysFor(aq).map(key => ({ key, value: Number(String(val(`m_${key}`)).replace(',', '.')), unit: val(`u_${key}`) || units[key] || null })).filter(row => Number.isFinite(row.value)).map(row => ({ user_id: state.user.id, aquarium_id: aq.id, parameter: normalize(row.key), value: row.value, unit: row.unit, method, notes, batch_id: batch, measured_at }));
    try {
      if (!rows.length) throw new Error('Añade al menos una medicion.');
      const { error } = await supabase.from('aquarium_measurements').insert(rows);
      if (error) throw error;
      parametros();
    } catch (e) { if (byId('x')) byId('x').innerHTML = msg(e.message, 'error'); }
  };
})();
