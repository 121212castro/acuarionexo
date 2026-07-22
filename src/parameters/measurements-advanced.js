/* AcuarioNexo · mediciones completas */
(function () {
  const { supabase, state, esc, byId, val, msg, currentAquarium, render, aqHeader } = window.ANX;
  const labels = window.ANX.aiParameterLabels || {};
  const normalize = window.ANX.normalizeMeasurementKey || (v => String(v?.parameter_key || v || '').trim().toLowerCase().replace(/\s+/g, '_'));

  const units = {
    temperature_c: '°C', salinity_ppt: 'ppt', salinity_sg: 'sg', ph: 'pH', kh_dkh: 'dKH',
    ammonia_nh3: 'mg/L', ammonium_nh4: 'mg/L', nitrite_no2: 'mg/L', nitrate_no3: 'mg/L', phosphate_po4: 'mg/L',
    calcium_ca: 'mg/L', magnesium_mg: 'mg/L', potassium_k: 'mg/L', iodine_i: 'µg/L',
    strontium_sr: 'mg/L', boron_b: 'mg/L', iron_fe: 'µg/L', manganese_mn: 'µg/L',
    zinc_zn: 'µg/L', copper_cu: 'µg/L', aluminum_al: 'µg/L', silicon_si: 'µg/L',
    lithium_li: 'µg/L', nickel_ni: 'µg/L', chromium_cr: 'µg/L', vanadium_v: 'µg/L',
    molybdenum_mo: 'µg/L', fluorine_f: 'mg/L', bromine_br: 'mg/L', gh: 'dGH', tds: 'ppm',
    chlorine_cl2: 'mg/L', oxygen_o2: 'mg/L'
  };

  const profiles = {
    weekly: {
      title: 'Medición semanal',
      method: 'Semanal',
      source: 'weekly',
      marine: ['temperature_c', 'salinity_ppt', 'salinity_sg', 'ph', 'kh_dkh', 'nitrate_no3', 'phosphate_po4'],
      freshwater: ['temperature_c', 'ph', 'kh_dkh', 'gh', 'ammonia_nh3', 'nitrite_no2', 'nitrate_no3', 'tds']
    },
    monthly: {
      title: 'Medición mensual',
      method: 'Mensual',
      source: 'monthly',
      marine: ['temperature_c', 'salinity_ppt', 'salinity_sg', 'ph', 'kh_dkh', 'calcium_ca', 'magnesium_mg', 'potassium_k', 'nitrate_no3', 'phosphate_po4', 'iodine_i', 'strontium_sr'],
      freshwater: ['temperature_c', 'ph', 'kh_dkh', 'gh', 'ammonia_nh3', 'nitrite_no2', 'nitrate_no3', 'phosphate_po4', 'iron_fe', 'tds']
    },
    icp: {
      title: 'ICP / laboratorio',
      method: 'ICP',
      source: 'icp',
      marine: ['salinity_ppt', 'salinity_sg', 'kh_dkh', 'calcium_ca', 'magnesium_mg', 'potassium_k', 'iodine_i', 'strontium_sr', 'boron_b', 'iron_fe', 'manganese_mn', 'zinc_zn', 'copper_cu', 'aluminum_al', 'silicon_si', 'lithium_li', 'nickel_ni', 'chromium_cr', 'vanadium_v', 'molybdenum_mo', 'fluorine_f', 'bromine_br'],
      freshwater: ['calcium_ca', 'magnesium_mg', 'potassium_k', 'iron_fe', 'manganese_mn', 'zinc_zn', 'copper_cu', 'aluminum_al', 'silicon_si', 'nickel_ni', 'chromium_cr', 'tds']
    }
  };

  function modeFor(aq) {
    return window.ANX.aiAquariumMode ? window.ANX.aiAquariumMode(aq) : 'marine';
  }

  function labelFor(key) {
    return labels[key] || key.replace(/_/g, ' ');
  }

  function keysFor(aq, profileKey) {
    const profile = profiles[profileKey] || profiles.weekly;
    return profile[modeFor(aq)] || profile.marine;
  }

  function numberFromInput(id) {
    const text = String(val(id) || '').replace(',', '.').trim();
    if (!text) return null;
    const match = text.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function uuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (Number(c) ^ Math.random() * 16 >> Number(c) / 4).toString(16)
    );
  }

  function profileButtons(active) {
    return `<div class="param-actions param-profile-actions">
      <button type="button" class="${active === 'weekly' ? 'active' : ''}" onclick="formMedicionCompleta('weekly')">Semanal</button>
      <button type="button" class="${active === 'monthly' ? 'active' : ''}" onclick="formMedicionCompleta('monthly')">Mensual</button>
      <button type="button" class="${active === 'icp' ? 'active' : ''}" onclick="formMedicionCompleta('icp')">ICP</button>
    </div>`;
  }

  function inputRows(aq, profileKey, tests) {
    const optionsFor = window.ANX.parameterTestOptions;
    return keysFor(aq, profileKey).map(key => `<div class="measurement-row">
      <label>${esc(labelFor(key))}</label>
      <div class="measurement-row-inputs">
        <input id="m_${esc(key)}" inputmode="decimal" placeholder="Valor">
        <input id="u_${esc(key)}" value="${esc(units[key] || '')}" placeholder="Unidad">
      </div>
      <label for="t_${esc(key)}">Test utilizado</label>
      <select id="t_${esc(key)}" onchange="document.getElementById('tm_${esc(key)}').classList.toggle('hidden',this.value!=='__manual__')">${optionsFor ? optionsFor(key, tests) : '<option value="__manual__">Otro test o método</option>'}</select>
      <input id="tm_${esc(key)}" class="hidden" placeholder="Marca, modelo o método utilizado">
    </div>`).join('');
  }

  function selectedMethod(key, profile) {
    const selected = val(`t_${key}`);
    if (selected === '__manual__') return val(`tm_${key}`) || profile.method;
    return selected || profile.method;
  }

  window.formMedicionCompleta = async function (profileKey = 'weekly') {
    const aq = currentAquarium();
    if (!aq) return;
    const profile = profiles[profileKey] || profiles.weekly;
    render(aqHeader('parametros') + `<section class="panel guided-box">${msg('Cargando catálogo de tests...')}</section>`, 'acuarios');
    try {
      const tests = typeof window.ANX.loadParameterTests === 'function' ? await window.ANX.loadParameterTests() : [];
      const now = new Date().toISOString().slice(0, 16);
      render(aqHeader('parametros') + `<section class="panel guided-box">
        <button onclick="parametros()">Volver</button>
        <h2>${esc(profile.title)}</h2>
        ${profileButtons(profileKey)}
        <input id="measureProfile" class="hidden" value="${esc(profileKey)}">
        <label>Fecha</label><input id="measureDate" type="datetime-local" value="${now}">
        <p class="small">Selecciona el test utilizado en cada parámetro. Las opciones proceden de las fichas Test de Biblioteca.</p>
        <div class="measurement-grid">${inputRows(aq, profileKey, tests)}</div>
        <label>Notas</label><textarea id="measureNotes" placeholder="Cambios de agua, aditivos, observaciones, laboratorio ICP..."></textarea>
        <button class="primary" onclick="saveMedicionCompleta()">Guardar mediciones</button><div id="x"></div>
      </section>`, 'acuarios');
    } catch (e) {
      render(aqHeader('parametros') + `<section class="panel guided-box"><button onclick="parametros()">Volver</button>${msg(e.message || 'No se pudo cargar el catálogo de tests.', 'error')}</section>`, 'acuarios');
    }
  };

  window.saveMedicionCompleta = async function () {
    const aq = currentAquarium();
    if (!aq) return;
    const profileKey = val('measureProfile') || 'weekly';
    const profile = profiles[profileKey] || profiles.weekly;
    const batch = uuid();
    const measuredAt = val('measureDate') ? new Date(val('measureDate')).toISOString() : new Date().toISOString();
    const notes = val('measureNotes') || null;
    const rows = keysFor(aq, profileKey).map(key => {
      const display = val(`m_${key}`);
      const numeric = numberFromInput(`m_${key}`);
      const unit = val(`u_${key}`) || units[key] || null;
      return { key, display, numeric, unit, method: selectedMethod(key, profile) };
    }).filter(row => row.display || Number.isFinite(row.numeric)).map(row => ({
      user_id: state.user.id,
      aquarium_id: aq.id,
      parameter_key: normalize({ parameter_key: row.key }),
      parameter_label: labelFor(row.key),
      parameter: normalize({ parameter_key: row.key }),
      display_value: row.display ? `${row.display}${row.unit ? ` ${row.unit}` : ''}` : String(row.numeric),
      raw_text: row.display || String(row.numeric),
      raw_value: row.numeric,
      value: row.numeric,
      normalized_value: row.numeric,
      unit: row.unit,
      method: row.method,
      source: profile.source,
      notes,
      batch_id: batch,
      measured_at: measuredAt,
      updated_at: new Date().toISOString()
    }));
    try {
      if (!rows.length) throw new Error('Añade al menos una medición.');
      const { error } = await supabase.from('aquarium_measurements').insert(rows);
      if (error) throw error;
      parametros();
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };
})();