/* AcuarioNexo · ai */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;
  const { loadAquariums, inventoryMeta, inventoryExpiryStatus } = window.ANX;

const AI_DAY = 24 * 60 * 60 * 1000;
const aiMeasurementPlans = {
  marine: { temperature_c: 1, salinity_ppt: 2, ph: 2, kh_dkh: 3, nitrate_no3: 7, phosphate_po4: 7, calcium_ca: 30, magnesium_mg: 30, potassium_k: 30, iodine_i: 30, strontium_sr: 30 },
  freshwater: { temperature_c: 1, ph: 7, kh_dkh: 14, gh: 14, ammonia_nh3: 7, nitrite_no2: 7, nitrate_no3: 7, phosphate_po4: 30, iron_fe: 30, tds: 14 }
};
const aiParameterLabels = {
  temperature_c: 'Temperatura',
  salinity_ppt: 'Salinidad',
  salinity_sg: 'Salinidad',
  ph: 'pH',
  kh_dkh: 'KH',
  nitrate_no3: 'NO3',
  phosphate_po4: 'PO4',
  calcium_ca: 'Calcio',
  magnesium_mg: 'Magnesio',
  potassium_k: 'Potasio',
  iodine_i: 'Yodo',
  strontium_sr: 'Estroncio',
  boron_b: 'Boro',
  iron_fe: 'Hierro',
  manganese_mn: 'Manganeso',
  zinc_zn: 'Zinc',
  copper_cu: 'Cobre',
  aluminum_al: 'Aluminio',
  silicon_si: 'Silicio',
  lithium_li: 'Litio',
  gh: 'GH',
  ammonia_nh3: 'NH3/NH4',
  ammonium_nh4: 'NH4',
  nitrite_no2: 'NO2',
  tds: 'TDS',
  chlorine_cl2: 'Cloro',
  oxygen_o2: 'Oxígeno',
  nickel_ni: 'Níquel',
  chromium_cr: 'Cromo',
  vanadium_v: 'Vanadio',
  molybdenum_mo: 'Molibdeno',
  fluorine_f: 'Flúor',
  bromine_br: 'Bromo'
};

function aiAquariumMode(aq) {
  const t = String(aq?.aquarium_type || aq?.type || '').toLowerCase();
  if (/fresh|dulce|plant|betta|angel|discus/.test(t)) return 'freshwater';
  return 'marine';
}

function normalizeMeasurementKey(row) {
  const raw = String(row?.parameter_key || row?.parameter || row?.parameter_label || '').toLowerCase();
  const key = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (['temperatura', 'temp', 'temperature', 'temperature_c'].includes(key)) return 'temperature_c';
  if (['salinidad', 'sg', 'densidad', 'specific_gravity', 'salinity_sg'].includes(key)) return 'salinity_sg';
  if (['kh', 'alcalinidad', 'alkalinity', 'kh_dkh'].includes(key)) return 'kh_dkh';
  if (['no3', 'nitrato', 'nitratos', 'nitrate', 'nitrate_no3'].includes(key)) return 'nitrate_no3';
  if (['po4', 'fosfato', 'fosfatos', 'phosphate', 'phosphate_po4'].includes(key)) return 'phosphate_po4';
  if (['nh3', 'nh4', 'amonio', 'amoniaco', 'ammonia', 'ammonium', 'ammonia_nh3'].includes(key)) return 'ammonia_nh3';
  if (['no2', 'nitrito', 'nitritos', 'nitrite', 'nitrite_no2'].includes(key)) return 'nitrite_no2';
  if (['calcio', 'ca', 'calcium', 'calcium_ca'].includes(key)) return 'calcium_ca';
  if (['magnesio', 'mg', 'magnesium', 'magnesium_mg'].includes(key)) return 'magnesium_mg';
  if (['potasio', 'k', 'potassium', 'potassium_k'].includes(key)) return 'potassium_k';
  if (['yodo', 'iodo', 'i', 'iodine', 'iodine_i'].includes(key)) return 'iodine_i';
  if (['estroncio', 'sr', 'strontium', 'strontium_sr'].includes(key)) return 'strontium_sr';
  if (['boro', 'b', 'boron', 'boron_b'].includes(key)) return 'boron_b';
  if (['hierro', 'fe', 'iron', 'iron_fe'].includes(key)) return 'iron_fe';
  if (['manganeso', 'mn', 'manganese', 'manganese_mn'].includes(key)) return 'manganese_mn';
  if (['zinc', 'zn', 'zinc_zn'].includes(key)) return 'zinc_zn';
  if (['cobre', 'cu', 'copper', 'copper_cu'].includes(key)) return 'copper_cu';
  if (['aluminio', 'al', 'aluminum', 'aluminium', 'aluminum_al'].includes(key)) return 'aluminum_al';
  if (['silicio', 'si', 'silicon', 'silicate', 'silicatos', 'silicon_si'].includes(key)) return 'silicon_si';
  if (['litio', 'li', 'lithium', 'lithium_li'].includes(key)) return 'lithium_li';
  if (['niquel', 'nickel', 'ni', 'nickel_ni'].includes(key)) return 'nickel_ni';
  if (['cromo', 'chromium', 'cr', 'chromium_cr'].includes(key)) return 'chromium_cr';
  if (['vanadio', 'vanadium', 'v', 'vanadium_v'].includes(key)) return 'vanadium_v';
  if (['molibdeno', 'molybdenum', 'mo', 'molybdenum_mo'].includes(key)) return 'molybdenum_mo';
  if (['fluor', 'fluorine', 'f', 'fluorine_f'].includes(key)) return 'fluorine_f';
  if (['bromo', 'bromine', 'br', 'bromine_br'].includes(key)) return 'bromine_br';
  if (['tds', 'ppm'].includes(key)) return 'tds';
  if (key === 'ph') return 'ph';
  return key;
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
  const label = aiParameterLabels[key] || key;
  if (!row) {
    return {
      type: 'measurement',
      priority: 'high',
      aquarium_id: aq.id,
      aquarium_name: aq.name || 'Acuario',
      title: `Medir ${label} · ${aq.name || 'Acuario'}`,
      due_at: new Date().toISOString(),
      notes: `La IA no encuentra una medición reciente de ${label} en ${aq.name || 'este acuario'}. Medir y registrar para poder detectar riesgos.`
    };
  }
  const measured = new Date(row.measured_at || row.created_at || Date.now());
  const next = new Date(measured.getTime() + freq * AI_DAY);
  if (next <= new Date()) {
    return {
      type: 'measurement',
      priority: 'normal',
      aquarium_id: aq.id,
      aquarium_name: aq.name || 'Acuario',
      title: `Medir ${label} · ${aq.name || 'Acuario'}`,
      due_at: new Date().toISOString(),
      notes: `Toca repetir ${label}. Última medición: ${dateText(row.measured_at || row.created_at)}. Frecuencia orientativa: cada ${freq} días.`
    };
  }
  return null;
}

function reefRangeState(key, value) {
  if (!Number.isFinite(value)) return null;
  if (key === 'temperature_c') {
    if (value < 23) return { state: 'crítico bajo', priority: 'high' };
    if (value < 24) return { state: 'bajo', priority: 'normal' };
    if (value <= 27) return null;
    if (value > 28) return { state: 'crítico alto', priority: 'high' };
    return { state: 'alto', priority: 'normal' };
  }
  if (key === 'salinity_sg') {
    if (value > 2) return null;
    if (value < 1.022) return { state: 'crítico bajo', priority: 'high' };
    if (value < 1.024) return { state: 'bajo', priority: 'normal' };
    if (value >= 1.025 && value <= 1.026) return null;
    if (value > 1.028) return { state: 'crítico alto', priority: 'high' };
    return { state: 'alto', priority: 'normal' };
  }
  if (key === 'ph') {
    if (value < 7.8) return { state: 'crítico bajo', priority: 'high' };
    if (value < 8.0) return { state: 'bajo', priority: 'normal' };
    if (value <= 8.4) return null;
    if (value > 8.5) return { state: 'crítico alto', priority: 'high' };
    return { state: 'alto', priority: 'normal' };
  }
  if (key === 'kh_dkh') {
    if (value < 6) return { state: 'crítico bajo', priority: 'high' };
    if (value < 7) return { state: 'bajo', priority: 'normal' };
    if (value <= 9) return null;
    if (value > 12) return { state: 'crítico alto', priority: 'high' };
    return { state: 'alto', priority: 'normal' };
  }
  if (key === 'calcium_ca') {
    if (value < 350) return { state: 'crítico bajo', priority: 'high' };
    if (value < 400) return { state: 'bajo', priority: 'normal' };
    if (value <= 450) return null;
    if (value > 500) return { state: 'crítico alto', priority: 'high' };
    return { state: 'alto', priority: 'normal' };
  }
  if (key === 'magnesium_mg') {
    if (value < 1150) return { state: 'crítico bajo', priority: 'high' };
    if (value < 1250) return { state: 'bajo', priority: 'normal' };
    if (value <= 1400) return null;
    if (value > 1500) return { state: 'crítico alto', priority: 'high' };
    return { state: 'alto', priority: 'normal' };
  }
  if (key === 'nitrate_no3') {
    if (value < 1) return { state: 'muy bajo', priority: 'normal' };
    if (value <= 10) return null;
    if (value > 50) return { state: 'crítico alto', priority: 'high' };
    if (value > 25) return { state: 'alto', priority: 'normal' };
    return null;
  }
  if (key === 'phosphate_po4') {
    if (value < 0.02) return { state: 'muy bajo', priority: 'normal' };
    if (value <= 0.08) return null;
    if (value > 0.20) return { state: 'crítico alto', priority: 'high' };
    if (value > 0.10) return { state: 'alto', priority: 'normal' };
    return null;
  }
  return null;
}

function interpretMeasurementValue(aq, measurementRow) {
  if (!measurementRow || aiAquariumMode(aq) !== 'marine') return null;
  const value = measurementNumber(measurementRow);
  let key = normalizeMeasurementKey(measurementRow);
  if (key === 'salinity_ppt' && value !== null && value < 2) key = 'salinity_sg';
  const range = reefRangeState(key, value);
  if (!range) return null;
  const label = aiParameterLabels[key] || key;
  const aqName = aq.name || 'Acuario';
  return {
    type: 'chemistry',
    priority: range.priority,
    aquarium_id: aq.id,
    aquarium_name: aqName,
    title: `${label} ${range.state} · ${aqName}`,
    due_at: new Date().toISOString(),
    notes: `${label}: ${value}. Estado: ${range.state}. Revisar la medición, confirmar con test fiable y actuar según el acuario antes de dosificar.`
  };
}

window.interpretMeasurementValue = interpretMeasurementValue;

function aiInventorySuggestions(items) {
  const suggestions = [];
  const lower = text => String(text || '').toLowerCase();
  const hasCat = word => items.some(i => lower(i.category).includes(word) || lower(i.name).includes(word));
  (items || []).forEach(function (item) {
    const status = inventoryExpiryStatus(item);
    const expiry = inventoryMeta(item).expires_at || item.expires_at || item.expiry_date || '';
    if (status === 'caducado') {
      suggestions.push({
        type: 'inventory',
        priority: 'high',
        title: `Reponer ${item.name || 'producto caducado'}`,
        due_at: new Date().toISOString(),
        notes: `${item.name || 'Producto'} figura caducado${expiry ? ` desde ${expiry}` : ''}. Revisar, retirar si procede y comprar sustituto si se sigue usando.`
      });
    } else if (status === 'caduca pronto') {
      suggestions.push({
        type: 'inventory',
        priority: 'normal',
        title: `Revisar caducidad de ${item.name || 'producto'}`,
        due_at: new Date(Date.now() + 7 * AI_DAY).toISOString(),
        notes: `${item.name || 'Producto'} caduca pronto${expiry ? ` (${expiry})` : ''}. Planificar compra si es necesario.`
      });
    }
    if (Number(item.quantity) <= 0) {
      suggestions.push({
        type: 'inventory',
        priority: 'normal',
        title: `Comprar ${item.name || 'inventario'}`,
        due_at: new Date().toISOString(),
        notes: `${item.name || 'Item'} aparece con cantidad ${item.quantity}. Revisar stock real.`
      });
    }
  });
  if (!hasCat('test')) suggestions.push({ type: 'inventory', priority: 'normal', title: 'Revisar tests disponibles', due_at: new Date().toISOString(), notes: 'No veo tests en inventario general. La IA necesita tests registrados para avisar de mediciones y compras.' });
  if (!hasCat('comida') && !hasCat('alimento')) suggestions.push({ type: 'inventory', priority: 'normal', title: 'Registrar comida disponible', due_at: new Date().toISOString(), notes: 'No veo comida registrada. Añadirla permite controlar stock y compras.' });
  return suggestions;
}

function microProfile(type) {
  if (window.ANX.microfaunaProfileFor) return window.ANX.microfaunaProfileFor(type);
  return null;
}

function microDueSuggestion(row, field, title, notes, priority) {
  if (!row?.[field]) return null;
  const due = new Date(row[field]);
  if (Number.isNaN(due.getTime()) || due > new Date()) return null;
  return {
    type: 'microfauna',
    priority: priority || 'normal',
    aquarium_id: row.aquarium_id || null,
    aquarium_name: row.name || 'Microfauna',
    title,
    due_at: new Date().toISOString(),
    notes
  };
}

function microfaunaSuggestions(rows) {
  const suggestions = [];
  (rows || []).forEach(function (row) {
    const p = microProfile(row.culture_type) || {};
    const label = p.label || row.culture_type || 'Microfauna';
    const name = row.name || label;
    const feed = row.feed_type || p.feed || 'alimento indicado';
    const amount = row.feed_amount ? ` (${row.feed_amount})` : '';
    [
      microDueSuggestion(row, 'next_feed_at', `Alimentar ${name}`, `Cultivo ${label}. Alimentar con ${feed}${amount}. Revisar olor, color y densidad antes de subir dosis.`),
      microDueSuggestion(row, 'next_water_change_at', `Cambio de agua ${name}`, `Cultivo ${label}. Cambio orientativo: ${row.water_change_percent || p.waterPercent || '-'}%. Igualar salinidad y temperatura antes de reponer.`),
      microDueSuggestion(row, 'next_harvest_at', `Recolectar ${name}`, `Cultivo ${label}. Recolectar parcial y dejar poblacion madre suficiente para que no colapse.`),
      microDueSuggestion(row, 'hatch_expected_at', `Revisar eclosion ${name}`, `Cultivo ${label}. Comprobar eclosion, separar residuos/cascaras si aplica y decidir si se enriquece antes de alimentar.`, 'high')
    ].filter(Boolean).forEach(s => suggestions.push(s));

    if (p.salinity && Number.isFinite(Number(row.salinity_ppt))) {
      const salinity = Number(row.salinity_ppt);
      if (salinity < p.salinity[0] || salinity > p.salinity[1]) {
        suggestions.push({
          type: 'microfauna',
          priority: 'normal',
          aquarium_id: row.aquarium_id || null,
          aquarium_name: name,
          title: `Revisar salinidad ${name}`,
          due_at: new Date().toISOString(),
          notes: `${label}: salinidad ${salinity} ppt. Rango orientativo ${p.salinity[0]}-${p.salinity[1]} ppt. Ajustar despacio para evitar choque del cultivo.`
        });
      }
    }
    if (p.temperature && Number.isFinite(Number(row.temperature_c))) {
      const temp = Number(row.temperature_c);
      if (temp < p.temperature[0] || temp > p.temperature[1]) {
        suggestions.push({
          type: 'microfauna',
          priority: 'normal',
          aquarium_id: row.aquarium_id || null,
          aquarium_name: name,
          title: `Revisar temperatura ${name}`,
          due_at: new Date().toISOString(),
          notes: `${label}: temperatura ${temp} C. Rango orientativo ${p.temperature[0]}-${p.temperature[1]} C. Revisar estabilidad antes de corregir.`
        });
      }
    }
  });
  return suggestions;
}

function aiSuggestionCard(s) {
  return `<div class="item ai-suggestion ${esc(s.priority || 'normal')}">
    <b>${esc(s.title)}</b>
    <p class="small">${esc(s.aquarium_name || 'General')} · ${esc(s.priority || 'normal')} · ${dateText(s.due_at)}</p>
    <p>${esc(s.notes || '')}</p>
  </div>`;
}

function aiSuggestionRoute(s) {
  const text = [s.type, s.title, s.notes].join(' ').toLowerCase();
  if (/measurement|chemistry|medir|kh|no3|po4|salinidad|temperatura|calcio|magnesio|icp/.test(text)) return 'parametros';
  if (/inventory|stock|comprar|caduc|reponer|test|sal|aditivo|alimento|medicamento/.test(text)) return 'inventario';
  if (/microfauna|rotif|copepod|artemia|fitoplancton|infusorio|cultivo|eclosion|recolect/.test(text)) return 'microfauna';
  return 'tareas';
}

async function buildAiMaintenanceReview() {
  const aquariums = state.aquariums.length ? state.aquariums : await loadAquariums();
  const inv = await supabase.from('inventory_items').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(250);
  if (inv.error) throw inv.error;
  const tasks = await supabase.from('tasks').select('*').eq('user_id', state.user.id).neq('status', 'done').limit(250);
  if (tasks.error) throw tasks.error;
  const suggestions = aiInventorySuggestions(inv.data || []);
  const micro = await supabase.from('microfauna_cultures').select('*').eq('user_id', state.user.id).eq('status', 'active').limit(150);
  if (micro.error) throw micro.error;
  suggestions.push(...microfaunaSuggestions(micro.data || []));
  for (const aq of aquariums) {
    const measurements = await supabase.from('aquarium_measurements').select('*').eq('aquarium_id', aq.id).order('measured_at', { ascending: false }).limit(120);
    if (measurements.error) throw measurements.error;
    const latest = aiLatestMeasurements(measurements.data || []);
    const plan = aiMeasurementPlans[aiAquariumMode(aq)] || aiMeasurementPlans.marine;
    Object.keys(plan).forEach(function (key) {
      const row = latest[key] || (key === 'salinity_ppt' ? latest.salinity_sg : null);
      const suggestion = aiDueSuggestion(aq, key, plan[key], row);
      if (suggestion) suggestions.push(suggestion);
    });
    Object.values(latest).forEach(function (row) {
      const chemical = interpretMeasurementValue(aq, row);
      if (chemical) suggestions.push(chemical);
    });
  }
  const openTitles = new Set((tasks.data || []).map(t => String(t.title || '').toLowerCase()));
  if (window.ANX.aiExtraReview) {
    const extra = await window.ANX.aiExtraReview();
    suggestions.push(...(extra.suggestions || []));
  }
  const seen = new Set();
  const filtered = suggestions.filter(function (s) {
    const key = String(s.title || '').toLowerCase();
    if (!key || openTitles.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  filtered.sort((a, b) => (a.priority === 'high' ? -1 : 1) - (b.priority === 'high' ? -1 : 1));
  return { created_at: new Date().toISOString(), suggestions: filtered.slice(0, 40), existing: suggestions.length - filtered.length };
}

window.iaAcuarioNexo = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="panel"><h2>IA AcuarioNexo</h2>${msg('Revisando acuarios, mediciones, inventario y tareas...')}</section>`, 'avisos');
  try {
    const review = await buildAiMaintenanceReview();
    if (!isCurrent(t)) return;
    window.__aiReview = review;
    const html = review.suggestions.map(aiSuggestionCard).join('');
    render(`<section class="panel">
      <div class="panel-head"><div><h2>IA AcuarioNexo</h2><p class="small">Primer cerebro: mediciones, stock, caducidades y avisos.</p></div><button onclick="tareas()">Avisos</button></div>
      ${review.existing ? msg(`${review.existing} avisos ya estaban creados y no se duplican.`, 'notice') : ''}
      ${html || msg('No veo avisos nuevos ahora mismo.', 'success')}
      ${review.suggestions.length ? `<button class="primary" onclick="crearAvisosIA()">Crear estos avisos</button>` : ''}
      <div id="x"></div>
    </section>`, 'avisos');
  } catch (e) {
    if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'avisos');
  }
};

window.crearAvisosIA = async function () {
  try {
    const suggestions = window.__aiReview?.suggestions || [];
    if (!suggestions.length) throw new Error('No hay avisos IA para crear.');
    byId('x').innerHTML = msg('Creando avisos...');
    const rows = suggestions.map(s => ({
      user_id: state.user.id,
      aquarium_id: s.aquarium_id || null,
      title: s.title,
      task_type: 'ai',
      due_at: s.due_at || new Date().toISOString(),
      priority: s.priority || 'normal',
      status: 'open',
      notes: `AcuarioNexoTaskMeta:${JSON.stringify({ route: aiSuggestionRoute(s), source: 'ai' })}\n${s.notes || ''}`.trim()
    }));
    const { error } = await supabase.from('tasks').insert(rows);
    if (error) throw error;
    byId('x').innerHTML = msg('Avisos IA creados.', 'success');
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

  Object.assign(window.ANX, {
    AI_DAY,
    aiMeasurementPlans,
    aiParameterLabels,
    aiAquariumMode,
    normalizeMeasurementKey,
    measurementNumber,
    aiLatestMeasurements,
    interpretMeasurementValue,
    microfaunaSuggestions
  });
})();
