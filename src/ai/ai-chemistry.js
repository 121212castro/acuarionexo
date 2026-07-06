/* AcuarioNexo · AI chemistry */
(function () {
  function reefRangeState(key, value) {
    if (key === 'salinity_sg' && Number.isFinite(value) && value > 10) value = value / 1000;
    if (!Number.isFinite(value)) return null;
    if (key === 'temperature_c') { if (value < 23) return { state: 'crítico bajo', priority: 'high' }; if (value < 24) return { state: 'bajo', priority: 'normal' }; if (value <= 27) return null; if (value > 28) return { state: 'crítico alto', priority: 'high' }; return { state: 'alto', priority: 'normal' }; }
    if (key === 'salinity_sg') { if (value > 2) return null; if (value < 1.022) return { state: 'crítico bajo', priority: 'high' }; if (value < 1.024) return { state: 'bajo', priority: 'normal' }; if (value <= 1.026) return null; if (value > 1.028) return { state: 'crítico alto', priority: 'high' }; return { state: 'alto', priority: 'normal' }; }
    if (key === 'ph') { if (value < 7.8) return { state: 'crítico bajo', priority: 'high' }; if (value < 8.0) return { state: 'bajo', priority: 'normal' }; if (value <= 8.4) return null; if (value > 8.5) return { state: 'crítico alto', priority: 'high' }; return { state: 'alto', priority: 'normal' }; }
    if (key === 'kh_dkh') { if (value < 6) return { state: 'crítico bajo', priority: 'high' }; if (value < 7) return { state: 'bajo', priority: 'normal' }; if (value <= 9) return null; if (value > 12) return { state: 'crítico alto', priority: 'high' }; return { state: 'alto', priority: 'normal' }; }
    if (key === 'calcium_ca') { if (value < 350) return { state: 'crítico bajo', priority: 'high' }; if (value < 400) return { state: 'bajo', priority: 'normal' }; if (value <= 450) return null; if (value > 500) return { state: 'crítico alto', priority: 'high' }; return { state: 'alto', priority: 'normal' }; }
    if (key === 'magnesium_mg') { if (value < 1150) return { state: 'crítico bajo', priority: 'high' }; if (value < 1250) return { state: 'bajo', priority: 'normal' }; if (value <= 1400) return null; if (value > 1500) return { state: 'crítico alto', priority: 'high' }; return { state: 'alto', priority: 'normal' }; }
    if (key === 'nitrate_no3') { if (value < 1) return { state: 'muy bajo', priority: 'normal' }; if (value <= 10) return null; if (value > 50) return { state: 'crítico alto', priority: 'high' }; if (value > 25) return { state: 'alto', priority: 'normal' }; return null; }
    if (key === 'phosphate_po4') { if (value < 0.02) return { state: 'muy bajo', priority: 'normal' }; if (value <= 0.08) return null; if (value > 0.20) return { state: 'crítico alto', priority: 'high' }; if (value > 0.10) return { state: 'alto', priority: 'normal' }; return null; }
    return null;
  }

  function interpretMeasurementValue(aq, measurementRow) {
    if (!measurementRow || window.ANX.aiAquariumMode(aq) !== 'marine') return null;
    let value = window.ANX.measurementNumber(measurementRow);
    let key = window.ANX.normalizeMeasurementKey(measurementRow);
    if (key === 'salinity_ppt' && value !== null && value < 2) key = 'salinity_sg';
    if (key === 'salinity_sg' && Number.isFinite(value) && value > 10) value = value / 1000;
    const range = reefRangeState(key, value);
    if (!range) return null;
    const label = window.ANX.aiParameterLabels[key] || key;
    const aqName = aq.name || 'Acuario';
    return { type: 'chemistry', priority: range.priority, aquarium_id: aq.id, aquarium_name: aqName, title: `${label} ${range.state} · ${aqName}`, due_at: new Date().toISOString(), notes: `${label}: ${value}. Estado: ${range.state}. Revisar la medición, confirmar con test fiable y actuar según el acuario antes de dosificar.` };
  }

  window.interpretMeasurementValue = interpretMeasurementValue;
  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { interpretMeasurementValue });
  window.ANX.AiChemistry = { reefRangeState, interpretMeasurementValue };
})();