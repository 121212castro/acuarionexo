/* AcuarioNexo · mediciones completas */
(function () {
  const { supabase, state, esc, byId, val, msg, currentAquarium, render, aqHeader } = window.ANX;
  const labels = window.ANX.aiParameterLabels || {};
  const normalize = window.ANX.normalizeMeasurementKey || (v => String(v?.parameter_key || v || '').trim().toLowerCase().replace(/\s+/g, '_'));

  const localLabels = {
    temperature_c: 'Temperatura', salinity_sg: 'Salinidad / densidad', ph: 'pH', phosphorus_p: 'Fósforo',
    nitrate_no3: 'Nitrato (NO3)', calcium_ca: 'Calcio', magnesium_mg: 'Magnesio', phosphate_po4: 'Fosfato (PO4)',
    kh_dkh: 'KH', copper_cu: 'Cobre', ammonia_nh3: 'Amoniaco', silicon_si: 'Silicato', potassium_k: 'Potasio'
  };

  const units = {
    temperature_c: '°C', salinity_ppt: 'ppt', salinity_sg: 'sg', ph: 'pH', phosphorus_p: 'ppb P', kh_dkh: 'dKH',
    ammonia_nh3: 'mg/L', ammonium_nh4: 'mg/L', nitrite_no2: 'mg/L', nitrate_no3: 'mg/L', phosphate_po4: 'mg/L',
    calcium_ca: 'mg/L', magnesium_mg: 'mg/L', potassium_k: 'mg/L', iodine_i: 'µg/L', strontium_sr: 'mg/L',
    boron_b: 'mg/L', iron_fe: 'µg/L', manganese_mn: 'µg/L', zinc_zn: 'µg/L', copper_cu: 'µg/L',
    aluminum_al: 'µg/L', silicon_si: 'µg/L', lithium_li: 'µg/L', nickel_ni: 'µg/L', chromium_cr: 'µg/L',
    vanadium_v: 'µg/L', molybdenum_mo: 'µg/L', fluorine_f: 'mg/L', bromine_br: 'mg/L', gh: 'dGH',
    tds: 'ppm', chlorine_cl2: 'mg/L', oxygen_o2: 'mg/L'
  };

  const profiles = {
    routine: {
      title: 'Medición completa', source: 'routine',
      marine: ['temperature_c','salinity_sg','ph','phosphorus_p','nitrate_no3','calcium_ca','magnesium_mg','phosphate_po4','kh_dkh','copper_cu','ammonia_nh3','silicon_si','potassium_k'],
      freshwater: ['temperature_c','ph','kh_dkh','gh','ammonia_nh3','nitrite_no2','nitrate_no3','phosphate_po4','iron_fe','tds']
    },
    icp: {
      title: 'ICP / laboratorio', source: 'icp',
      marine: ['salinity_ppt','salinity_sg','kh_dkh','calcium_ca','magnesium_mg','potassium_k','iodine_i','strontium_sr','boron_b','iron_fe','manganese_mn','zinc_zn','copper_cu','aluminum_al','silicon_si','lithium_li','nickel_ni','chromium_cr','vanadium_v','molybdenum_mo','fluorine_f','bromine_br'],
      freshwater: ['calcium_ca','magnesium_mg','potassium_k','iron_fe','manganese_mn','zinc_zn','copper_cu','aluminum_al','silicon_si','nickel_ni','chromium_cr','tds']
    }
  };

  const quickSources = {
    hanna: { value: '__quick_hanna__', label: 'Hanna' },
    salifert: { value: '__quick_salifert__', label: 'Salifert' },
    refractometer: { value: '__quick_refractometer__', label: 'Refractómetro' },
    thermometer: { value: '__quick_thermometer__', label: 'Termómetro' },
    probe: { value: '__quick_probe__', label: 'Sonda / controlador' },
    laboratory: { value: '__quick_laboratory__', label: 'ICP / laboratorio' }
  };

  function modeFor(aq) { return window.ANX.aiAquariumMode ? window.ANX.aiAquariumMode(aq) : 'marine'; }
  function labelFor(key) { return localLabels[key] || labels[key] || key.replace(/_/g, ' '); }
  function normalizedProfileKey(profileKey) { return profileKey === 'icp' ? 'icp' : 'routine'; }
  function keysFor(aq, profileKey) {
    const profile = profiles[normalizedProfileKey(profileKey)] || profiles.routine;
    return profile[modeFor(aq)] || profile.marine;
  }
  function numberFromText(text) { const match = String(text || '').replace(',', '.').match(/-?\d+(?:\.\d+)?/); return match ? Number(match[0]) : null; }
  function uuid() { return window.crypto?.randomUUID ? window.crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (Number(c) ^ Math.random() * 16 >> Number(c) / 4).toString(16)); }
  function selectedTest(key) { return window.ANX.findParameterTest?.(window.ANX.activeParameterTests || [], val(`t_${key}`)) || null; }
  function splitScale(value) { return String(value || '').split(/[;,|\n]/).map(x => x.trim()).filter(x => /\d/.test(x)); }
  function rangeNumbers(value) { const nums = String(value || '').replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/g) || []; return nums.map(Number).filter(Number.isFinite); }
  function unitForTest(test, fallback) { const d = test?.data || {}; return String(d.internal_unit || d.reading_unit || fallback || '').replace(/^Unidad de\s+/i, '').trim(); }

  function profileButtons(active) {
    return `<div class="param-actions param-profile-actions"><button type="button" class="${active === 'routine' ? 'active' : ''}" onclick="formMedicionCompleta('routine')">Medición completa</button><button type="button" class="${active === 'icp' ? 'active' : ''}" onclick="formMedicionCompleta('icp')">ICP / laboratorio</button></div>`;
  }

  function quickSourcesFor(key, profileKey) {
    if (profileKey === 'icp') return [quickSources.laboratory];
    if (key === 'temperature_c') return [quickSources.thermometer, quickSources.probe];
    if (key === 'salinity_sg' || key === 'salinity_ppt') return [quickSources.refractometer, quickSources.probe];
    if (key === 'ph') return [quickSources.hanna, quickSources.salifert, quickSources.probe];
    return [quickSources.hanna, quickSources.salifert];
  }

  function sourceName(value) {
    const item = Object.values(quickSources).find(x => x.value === value);
    return item?.label || '';
  }

  function testOptions(key, tests, profileKey) {
    const quick = quickSourcesFor(key, profileKey).map(item => `<option value="${esc(item.value)}">${esc(item.label)}</option>`).join('');
    const matching = typeof window.ANX.testsForParameter === 'function' ? window.ANX.testsForParameter(tests, key) : [];
    const exact = matching.map(test => {
      const id = String(test.id || '');
      const label = window.ANX.parameterTestLabel ? window.ANX.parameterTestLabel(test) : (test.title || 'Test');
      return `<option value="${esc(id)}">${esc(label)}</option>`;
    }).join('');
    return `<option value="">Seleccionar test / equipo...</option>${quick}${exact ? `<optgroup label="Tests de Biblioteca">${exact}</optgroup>` : ''}<option value="__manual__">Otro test / equipo</option>`;
  }

  function resultControl(key, test) {
    const d = test?.data || {};
    const scale = splitScale(d.scale_values);
    const unit = unitForTest(test, units[key]);
    const methodText = `${d.test_type || ''} ${d.method || ''}`;
    const isContinuous = /digital|fotometr|electrodo|sonda|conduct|refract|titul|icp|laboratorio/i.test(methodText);
    if (scale.length >= 2 && !isContinuous) {
      const options = [`<option value="">Seleccionar lectura...</option>`, `<option value="< ${esc(scale[0])}">Menor de ${esc(scale[0])}</option>`, ...scale.map(x => `<option value="${esc(x)}">${esc(x)}</option>`), `<option value="> ${esc(scale[scale.length - 1])}">Mayor de ${esc(scale[scale.length - 1])}</option>`].join('');
      return `<select id="m_${esc(key)}">${options}</select><input id="u_${esc(key)}" value="${esc(unit)}" readonly>`;
    }
    const range = rangeNumbers(d.range || `${d.device_min_limit || ''} ${d.device_max_limit || ''}`);
    const min = range.length ? ` min="${range[0]}"` : '';
    const max = range.length > 1 ? ` max="${range[range.length - 1]}"` : '';
    const step = numberFromText(d.resolution);
    return `<input id="m_${esc(key)}" type="number" inputmode="decimal"${min}${max}${step ? ` step="${step}"` : ' step="any"'} placeholder="Valor"><input id="u_${esc(key)}" value="${esc(unit)}" readonly>`;
  }

  function testHelp(test, source) {
    if (!test && !source) return '';
    if (!test) return `<div class="notice small"><b>${esc(source)}</b><br>La medición quedará guardada con este test/equipo para que la IA interprete el dato con su procedencia.</div>`;
    const d = test.data || {};
    const parts = [
      d.range ? `Rango: ${d.range}` : '', d.resolution ? `Resolución: ${d.resolution}` : '', d.accuracy ? `Precisión: ${d.accuracy}` : '',
      d.scale_values ? `Escala: ${d.scale_values}` : '', d.sample_volume ? `Muestra: ${d.sample_volume}` : '', d.procedure ? d.procedure : ''
    ].filter(Boolean);
    return `<div class="notice small"><b>${esc(test.title || window.ANX.parameterTestLabel?.(test) || 'Test')}</b><br>${parts.map(esc).join('<br>')}</div>`;
  }

  function inputRows(aq, profileKey, tests) {
    return keysFor(aq, profileKey).map(key => `<div class="measurement-row" data-parameter-key="${esc(key)}">
      <label>${esc(labelFor(key))}</label>
      <select id="t_${esc(key)}" onchange="applyTestToMeasurement('${esc(key)}')">${testOptions(key, tests, profileKey)}</select>
      <input id="tm_${esc(key)}" class="hidden" placeholder="Escribe marca y modelo del test/equipo">
      <div id="r_${esc(key)}" class="measurement-row-inputs">${resultControl(key, null)}</div>
      <div id="h_${esc(key)}"></div>
    </div>`).join('');
  }

  window.applyTestToMeasurement = function (key) {
    const selected = val(`t_${key}`);
    const manualTest = byId(`tm_${key}`);
    const isManual = selected === '__manual__';
    if (manualTest) manualTest.classList.toggle('hidden', !isManual);
    const test = selectedTest(key);
    const result = byId(`r_${key}`);
    const help = byId(`h_${key}`);
    if (result) result.innerHTML = resultControl(key, test);
    if (help) help.innerHTML = testHelp(test, sourceName(selected));
  };

  window.applyMethodToMeasurement = function () {};

  window.formMedicionCompleta = async function (profileKey = 'routine') {
    const aq = currentAquarium();
    if (!aq) return;
    const realProfileKey = normalizedProfileKey(profileKey);
    const profile = profiles[realProfileKey] || profiles.routine;
    render(aqHeader('parametros') + `<section class="panel guided-box">${msg('Cargando catálogo de tests...')}</section>`, 'acuarios');
    try {
      const tests = typeof window.ANX.loadParameterTests === 'function' ? await window.ANX.loadParameterTests() : [];
      window.ANX.activeParameterTests = tests;
      const now = new Date().toISOString().slice(0, 16);
      render(aqHeader('parametros') + `<section class="panel guided-box"><button onclick="parametros()">Volver</button><h2>${esc(profile.title)}</h2>${profileButtons(realProfileKey)}<input id="measureProfile" class="hidden" value="${esc(realProfileKey)}"><label>Fecha</label><input id="measureDate" type="datetime-local" value="${now}"><p class="small">Para cada valor solo indica el test o equipo utilizado: Hanna, Salifert, refractómetro, termómetro o el test exacto de Biblioteca. No necesitas escoger además un método de lectura.</p><div class="measurement-grid">${inputRows(aq, realProfileKey, tests)}</div><label>Notas</label><textarea id="measureNotes" placeholder="Cambios de agua, aditivos, observaciones, laboratorio ICP..."></textarea><button class="primary" onclick="saveMedicionCompleta()">Guardar mediciones</button><div id="x"></div></section>`, 'acuarios');
    } catch (e) {
      render(aqHeader('parametros') + `<section class="panel guided-box"><button onclick="parametros()">Volver</button>${msg(e.message || 'No se pudo cargar el catálogo de tests.', 'error')}</section>`, 'acuarios');
    }
  };

  window.saveMedicionCompleta = async function () {
    const aq = currentAquarium();
    if (!aq) return;
    const profileKey = normalizedProfileKey(val('measureProfile') || 'routine');
    const profile = profiles[profileKey] || profiles.routine;
    const measuredAt = val('measureDate') ? new Date(val('measureDate')).toISOString() : new Date().toISOString();
    const generalNotes = val('measureNotes') || '';
    const batch = uuid();
    try {
      const rows = keysFor(aq, profileKey).map(key => {
        const display = val(`m_${key}`);
        if (!display) return null;
        const selected = val(`t_${key}`);
        const test = selectedTest(key);
        const manualTest = selected === '__manual__' ? val(`tm_${key}`) : '';
        const quickName = sourceName(selected);
        if (!selected) throw new Error(`Selecciona el test o equipo utilizado para ${labelFor(key)}.`);
        if (selected === '__manual__' && !manualTest) throw new Error(`Escribe el test o equipo utilizado para ${labelFor(key)}.`);
        const d = test?.data || {};
        const unit = val(`u_${key}`) || units[key] || null;
        const numeric = numberFromText(display);
        const testName = test ? window.ANX.parameterTestLabel(test) : (quickName || manualTest);
        const trace = test
          ? `test_id: ${test.id}; test/equipo: ${testName}; referencia: ${d.product_code || 'sin referencia'}; rango: ${d.range || 'no indicado'}; resolución: ${d.resolution || 'no indicada'}; escala: ${d.scale_values || 'continua'}`
          : `test/equipo: ${testName}`;
        return {
          user_id: state.user.id, aquarium_id: aq.id, parameter_key: normalize({ parameter_key: key }), parameter_label: labelFor(key), parameter: normalize({ parameter_key: key }),
          display_value: `${display}${unit ? ` ${unit}` : ''}`, raw_text: display, raw_value: numeric, value: numeric, normalized_value: numeric, unit,
          method: testName, source: profile.source, notes: [generalNotes, trace].filter(Boolean).join(' · '), batch_id: batch, measured_at: measuredAt, updated_at: new Date().toISOString()
        };
      }).filter(Boolean);
      if (!rows.length) throw new Error('Añade al menos una medición.');
      const { error } = await supabase.from('aquarium_measurements').insert(rows);
      if (error) throw error;
      parametros();
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };
})();
