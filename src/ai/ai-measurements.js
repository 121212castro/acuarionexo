/* AcuarioNexo · AI measurements */
(function () {
  function labels() { return window.ANX?.aiParameterLabels || {}; }

  function aiAquariumMode(aq) {
    const t = String(aq?.aquarium_type || aq?.type || '').toLowerCase();
    if (/fresh|dulce|plant|betta|angel|discus/.test(t)) return 'freshwater';
    return 'marine';
  }

  function normalizeMeasurementKey(row) {
    const raw = String(row?.parameter_key || row?.parameter || row?.parameter_label || '').toLowerCase();
    const key = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const map = {
      temperatura: 'temperature_c', temp: 'temperature_c', temperature: 'temperature_c', temperature_c: 'temperature_c',
      salinidad: 'salinity_sg', sg: 'salinity_sg', densidad: 'salinity_sg', specific_gravity: 'salinity_sg', salinity_sg: 'salinity_sg',
      kh: 'kh_dkh', alcalinidad: 'kh_dkh', alkalinity: 'kh_dkh', kh_dkh: 'kh_dkh',
      no3: 'nitrate_no3', nitrato: 'nitrate_no3', nitratos: 'nitrate_no3', nitrate: 'nitrate_no3', nitrate_no3: 'nitrate_no3',
      po4: 'phosphate_po4', fosfato: 'phosphate_po4', fosfatos: 'phosphate_po4', phosphate: 'phosphate_po4', phosphate_po4: 'phosphate_po4',
      nh3: 'ammonia_nh3', nh4: 'ammonia_nh3', amonio: 'ammonia_nh3', amoniaco: 'ammonia_nh3', ammonia: 'ammonia_nh3', ammonium: 'ammonia_nh3', ammonia_nh3: 'ammonia_nh3',
      no2: 'nitrite_no2', nitrito: 'nitrite_no2', nitritos: 'nitrite_no2', nitrite: 'nitrite_no2', nitrite_no2: 'nitrite_no2',
      calcio: 'calcium_ca', ca: 'calcium_ca', calcium: 'calcium_ca', calcium_ca: 'calcium_ca',
      magnesio: 'magnesium_mg', mg: 'magnesium_mg', magnesium: 'magnesium_mg', magnesium_mg: 'magnesium_mg',
      potasio: 'potassium_k', k: 'potassium_k', potassium: 'potassium_k', potassium_k: 'potassium_k',
      yodo: 'iodine_i', iodo: 'iodine_i', i: 'iodine_i', iodine: 'iodine_i', iodine_i: 'iodine_i',
      estroncio: 'strontium_sr', sr: 'strontium_sr', strontium: 'strontium_sr', strontium_sr: 'strontium_sr',
      boro: 'boron_b', b: 'boron_b', boron: 'boron_b', boron_b: 'boron_b',
      hierro: 'iron_fe', fe: 'iron_fe', iron: 'iron_fe', iron_fe: 'iron_fe',
      manganeso: 'manganese_mn', mn: 'manganese_mn', manganese: 'manganese_mn', manganese_mn: 'manganese_mn',
      zinc: 'zinc_zn', zn: 'zinc_zn', zinc_zn: 'zinc_zn',
      cobre: 'copper_cu', cu: 'copper_cu', copper: 'copper_cu', copper_cu: 'copper_cu',
      aluminio: 'aluminum_al', al: 'aluminum_al', aluminum: 'aluminum_al', aluminium: 'aluminum_al', aluminum_al: 'aluminum_al',
      silicio: 'silicon_si', si: 'silicon_si', silicon: 'silicon_si', silicate: 'silicon_si', silicatos: 'silicon_si', silicon_si: 'silicon_si',
      litio: 'lithium_li', li: 'lithium_li', lithium: 'lithium_li', lithium_li: 'lithium_li',
      niquel: 'nickel_ni', nickel: 'nickel_ni', ni: 'nickel_ni', nickel_ni: 'nickel_ni',
      cromo: 'chromium_cr', chromium: 'chromium_cr', cr: 'chromium_cr', chromium_cr: 'chromium_cr',
      vanadio: 'vanadium_v', vanadium: 'vanadium_v', v: 'vanadium_v', vanadium_v: 'vanadium_v',
      molibdeno: 'molybdenum_mo', molybdenum: 'molybdenum_mo', mo: 'molybdenum_mo', molybdenum_mo: 'molybdenum_mo',
      fluor: 'fluorine_f', fluorine: 'fluorine_f', f: 'fluorine_f', fluorine_f: 'fluorine_f',
      bromo: 'bromine_br', bromine: 'bromine_br', br: 'bromine_br', bromine_br: 'bromine_br',
      tds: 'tds', ppm: 'tds', ph: 'ph'
    };
    return map[key] || key;
  }

  function measurementNumber(row) {
    const source = row?.display_value ?? row?.raw_text ?? row?.value ?? row?.raw_value ?? row?.normalized_value ?? '';
    const match = String(source).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function aiLatestMeasurements(rows) {
    const out = {};
    (rows || []).forEach(function (r) {
      const key = normalizeMeasurementKey(r);
      if (key && !out[key]) out[key] = r;
    });
    return out;
  }

  function aiDueSuggestion(aq, key, freq, row) {
    const label = labels()[key] || key;
    if (!row) return { type: 'measurement', priority: 'high', aquarium_id: aq.id, aquarium_name: aq.name || 'Acuario', title: `Medir ${label} · ${aq.name || 'Acuario'}`, due_at: new Date().toISOString(), notes: `La IA no encuentra una medición reciente de ${label} en ${aq.name || 'este acuario'}. Medir y registrar para poder detectar riesgos.` };
    const measured = new Date(row.measured_at || row.created_at || Date.now());
    const next = new Date(measured.getTime() + freq * (window.ANX?.AI_DAY || 86400000));
    if (next <= new Date()) return { type: 'measurement', priority: 'normal', aquarium_id: aq.id, aquarium_name: aq.name || 'Acuario', title: `Medir ${label} · ${aq.name || 'Acuario'}`, due_at: new Date().toISOString(), notes: `Toca repetir ${label}. Última medición: ${window.ANX?.dateText?.(row.measured_at || row.created_at) || row.measured_at || row.created_at}. Frecuencia orientativa: cada ${freq} días.` };
    return null;
  }

  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { aiAquariumMode, normalizeMeasurementKey, measurementNumber, aiLatestMeasurements });
  window.ANX.AiMeasurements = { aiAquariumMode, normalizeMeasurementKey, measurementNumber, aiLatestMeasurements, aiDueSuggestion };
})();