/* AcuarioNexo · Parameters core */
(function () {
  function A() { return window.ANX || {}; }

  let parameterTestsCache = null;

  function paramKeysForAquarium(aq) {
    const { aiMeasurementPlans, aiAquariumMode } = A();
    return Object.keys(aiMeasurementPlans[aiAquariumMode(aq)] || aiMeasurementPlans.marine);
  }

  function normalizeTestParameter(value) {
    const { normalizeMeasurementKey } = A();
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (typeof normalizeMeasurementKey === 'function') return normalizeMeasurementKey({ parameter_key: raw });
    return raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function parameterTestLabel(test) {
    const data = test?.data || {};
    const brand = data.brand || data.manufacturer || test?.brand || test?.manufacturer || '';
    const model = data.product_code || test?.product_code || '';
    const title = test?.title || 'Test sin nombre';
    return [brand, model, title].map(x => String(x || '').trim()).filter((value, index, list) => value && list.indexOf(value) === index).join(' · ');
  }

  function parameterKeysForTest(test) {
    const data = test?.data || {};
    return [data.primary_field, data.parameter, data.measured_ion_or_compound]
      .map(normalizeTestParameter)
      .filter(Boolean);
  }

  function testsForParameter(tests, parameterKey) {
    const target = normalizeTestParameter(parameterKey);
    return (tests || []).filter(test => parameterKeysForTest(test).includes(target));
  }

  async function loadParameterTests(force = false) {
    if (parameterTestsCache && !force) return parameterTestsCache;
    const { supabase, state } = A();
    const { data, error } = await supabase.from('library_entries')
      .select('id,title,entry_type,status,data,manufacturer,brand,product_code')
      .eq('entry_type', 'test')
      .order('title', { ascending: true });
    if (error) throw error;
    parameterTestsCache = (data || []).filter(test => {
      const status = String(test.status || '').toLowerCase();
      return ['published', 'validated'].includes(status) || (!!state?.isAdmin && ['review', 'draft', 'identified'].includes(status));
    });
    return parameterTestsCache;
  }

  function parameterTestOptions(parameterKey, tests, selected = '') {
    const { esc } = A();
    const matching = testsForParameter(tests, parameterKey);
    return `<option value="">Seleccionar test...</option>${matching.map(test => {
      const label = parameterTestLabel(test);
      return `<option value="${esc(label)}" ${label === selected ? 'selected' : ''}>${esc(label)}</option>`;
    }).join('')}<option value="__manual__">Otro test o método</option>`;
  }

  function allParameterTestOptions(tests, selected = '') {
    const { esc } = A();
    return `<option value="">Seleccionar test...</option>${(tests || []).map(test => {
      const label = parameterTestLabel(test);
      return `<option value="${esc(label)}" ${label === selected ? 'selected' : ''}>${esc(label)}</option>`;
    }).join('')}<option value="__manual__">Otro test o método</option>`;
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
    const { interpretMeasurementValue, normalizeMeasurementKey, aiMeasurementPlans, aiAquariumMode, AI_DAY } = A();
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
    const { esc, dateText, aiParameterLabels } = A();
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
    const { aiLatestMeasurements } = A();
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

  function paramAgeDays(row) {
    const { AI_DAY } = A();
    if (!row) return null;
    const d = new Date(row.measured_at || row.created_at || '');
    if (Number.isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / AI_DAY);
  }

  function paramAiAdviceFor(key, row, stateInfo) {
    const { aiParameterLabels } = A();
    const label = aiParameterLabels[key] || row?.parameter_label || key;
    const value = row ? paramDisplayValue(row) : 'pendiente';
    if (!row) return `Falta ${label}. Regístralo antes de tomar decisiones sobre el acuario.`;
    if (stateInfo.label === 'Riesgo') return `${label} está en riesgo (${value}). Repite la medición, confirma con otro test si puedes y revisa cambios recientes antes de corregir.`;
    if (stateInfo.label === 'Alerta') return `${label} está en alerta (${value}). No corrijas a ciegas: confirma tendencia con una nueva medición.`;
    if (stateInfo.label === 'Precaución') return `${label} necesita revisión (${value}). Comprueba si la medición está antigua o fuera de rutina.`;
    return '';
  }

  function paramCyclePanel(rows) {
    const { esc, dateText } = A();
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
    const { esc, msg, dateText, normalizeMeasurementKey, aiParameterLabels } = A();
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

  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { paramKeysForAquarium, normalizeTestParameter, parameterTestLabel, parameterKeysForTest, testsForParameter, loadParameterTests, parameterTestOptions, allParameterTestOptions, paramActionPanel, paramDisplayValue, paramVisualState, paramTileHtml, paramLatestPanel, paramAgeDays, paramAiAdviceFor, paramCyclePanel, paramHistoryHtml });
  window.ANX.ParametersCore = { paramKeysForAquarium, normalizeTestParameter, parameterTestLabel, parameterKeysForTest, testsForParameter, loadParameterTests, parameterTestOptions, allParameterTestOptions, paramActionPanel, paramDisplayValue, paramVisualState, paramTileHtml, paramLatestPanel, paramAgeDays, paramAiAdviceFor, paramCyclePanel, paramHistoryHtml };
})();