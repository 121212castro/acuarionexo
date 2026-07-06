/* AcuarioNexo · AI coordinator */
(function () {
  const { supabase, state, esc, byId, msg, token, isCurrent, dateText, render } = window.ANX;
  const { loadAquariums, inventoryMeta, inventoryExpiryStatus, AI_DAY, aiMeasurementPlans, aiParameterLabels, aiAquariumMode, aiLatestMeasurements, interpretMeasurementValue } = window.ANX;
  const { aiDueSuggestion } = window.ANX.AiMeasurements || {};

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
  return { type: 'microfauna', priority: priority || 'normal', aquarium_id: row.aquarium_id || null, aquarium_name: row.name || 'Microfauna', title, due_at: new Date().toISOString(), notes };
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
      if (salinity < p.salinity[0] || salinity > p.salinity[1]) suggestions.push({ type: 'microfauna', priority: 'normal', aquarium_id: row.aquarium_id || null, aquarium_name: name, title: `Revisar salinidad ${name}`, due_at: new Date().toISOString(), notes: `${label}: salinidad ${salinity} ppt. Rango orientativo ${p.salinity[0]}-${p.salinity[1]} ppt. Ajustar despacio para evitar choque del cultivo.` });
    }
    if (p.temperature && Number.isFinite(Number(row.temperature_c))) {
      const temp = Number(row.temperature_c);
      if (temp < p.temperature[0] || temp > p.temperature[1]) suggestions.push({ type: 'microfauna', priority: 'normal', aquarium_id: row.aquarium_id || null, aquarium_name: name, title: `Revisar temperatura ${name}`, due_at: new Date().toISOString(), notes: `${label}: temperatura ${temp} C. Rango orientativo ${p.temperature[0]}-${p.temperature[1]} C. Revisar estabilidad antes de corregir.` });
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
    render(`<section class="panel"><div class="panel-head"><div><h2>IA AcuarioNexo</h2><p class="small">Primer cerebro: mediciones, stock, caducidades y avisos.</p></div><button onclick="tareas()">Avisos</button></div>${review.existing ? msg(`${review.existing} avisos ya estaban creados y no se duplican.`, 'notice') : ''}${html || msg('No veo avisos nuevos ahora mismo.', 'success')}${review.suggestions.length ? `<button class="primary" onclick="crearAvisosIA()">Crear estos avisos</button>` : ''}<div id="x"></div></section>`, 'avisos');
  } catch (e) {
    if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'avisos');
  }
};

window.crearAvisosIA = async function () {
  try {
    const suggestions = window.__aiReview?.suggestions || [];
    if (!suggestions.length) throw new Error('No hay avisos IA para crear.');
    byId('x').innerHTML = msg('Creando avisos...');
    const rows = suggestions.map(s => ({ user_id: state.user.id, aquarium_id: s.aquarium_id || null, title: s.title, task_type: 'ai', due_at: s.due_at || new Date().toISOString(), priority: s.priority || 'normal', status: 'open', notes: `AcuarioNexoTaskMeta:${JSON.stringify({ route: aiSuggestionRoute(s), source: 'ai' })}\n${s.notes || ''}`.trim() }));
    const { error } = await supabase.from('tasks').insert(rows);
    if (error) throw error;
    byId('x').innerHTML = msg('Avisos IA creados.', 'success');
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

  Object.assign(window.ANX, { microfaunaSuggestions });
  window.ANX.AiCoordinator = { buildAiMaintenanceReview, aiInventorySuggestions, microfaunaSuggestions, aiSuggestionRoute };
})();