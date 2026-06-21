/* AcuarioNexo · IA extendida de avisos */
(function(){
  const ANX = window.ANX || {};
  const { supabase, state, esc, byId, msg, token, isCurrent, dateText, render } = ANX;
  if (!supabase || !state) return;

  const DAY = 24 * 60 * 60 * 1000;
  const labels = ANX.aiParameterLabels || {};
  const plans = ANX.aiMeasurementPlans || {};
  const modeOf = ANX.aiAquariumMode || function(aq){ return /fresh|dulce/i.test(String(aq?.aquarium_type || aq?.type || '')) ? 'freshwater' : 'marine'; };
  const norm = ANX.normalizeMeasurementKey || function(r){ return String(r?.parameter_key || r?.parameter || r?.parameter_label || '').toLowerCase(); };
  const latestMeasurements = ANX.aiLatestMeasurements || function(rows){ const o={}; (rows||[]).forEach(r=>{ const k=norm(r); if(k&&!o[k]) o[k]=r; }); return o; };

  function text(v){ return String(v || '').toLowerCase(); }
  function rowDate(r){ return r?.performed_at || r?.changed_at || r?.water_changed_at || r?.event_at || r?.completed_at || r?.measured_at || r?.created_at || r?.due_at || r?.date || null; }
  function latest(rows){ return (rows||[]).filter(rowDate).sort((a,b)=>new Date(rowDate(b))-new Date(rowDate(a)))[0] || null; }
  function isWaterChange(r){ return /cambio\s+de\s+agua|water\s*change|water_change|cambiar\s+agua/.test([r?.title,r?.event_type,r?.task_type,r?.type,r?.category,r?.notes,r?.description].map(text).join(' ')); }
  function openKey(t){ return String(t?.title || '').toLowerCase().trim(); }

  async function optionalRows(table, build){
    try{
      const q = build ? build(supabase.from(table)) : supabase.from(table).select('*');
      const { data, error } = await q;
      return error ? [] : (data || []);
    }catch(_){ return []; }
  }

  function dueMeasurement(aq, key, freq, row){
    const label = labels[key] || key;
    const name = aq.name || 'Acuario';
    if(!row) return { type:'measurement', priority:'high', aquarium_id:aq.id, aquarium_name:name, title:`Medir ${label} · ${name}`, due_at:new Date().toISOString(), notes:`No hay medición registrada de ${label}. Registrar este dato permite a la IA detectar riesgos.` };
    const d = new Date(row.measured_at || row.created_at || Date.now());
    if(new Date(d.getTime() + freq * DAY) <= new Date()) return { type:'measurement', priority:'normal', aquarium_id:aq.id, aquarium_name:name, title:`Medir ${label} · ${name}`, due_at:new Date().toISOString(), notes:`Toca repetir ${label}. Última medición: ${dateText(row.measured_at || row.created_at)}. Frecuencia: cada ${freq} días.` };
    return null;
  }

  async function waterRows(aq){
    let rows = [];
    for(const table of ['water_changes','water_change_history','aquarium_water_changes']){
      rows = rows.concat(await optionalRows(table, q => q.select('*').eq('aquarium_id', aq.id).limit(120)));
    }
    const maintenance = await optionalRows('maintenance_events', q => q.select('*').eq('aquarium_id', aq.id).limit(160));
    rows = rows.concat((maintenance || []).filter(isWaterChange));
    const doneTasks = await optionalRows('tasks', q => q.select('*').eq('aquarium_id', aq.id).eq('status','done').limit(160));
    rows = rows.concat((doneTasks || []).filter(isWaterChange));
    return rows;
  }

  function waterSuggestion(aq, rows){
    const mode = modeOf(aq);
    const every = mode === 'freshwater' ? 14 : 7;
    const percent = mode === 'freshwater' ? 25 : 10;
    const liters = Number(aq.real_liters || aq.liters || aq.volume_liters || 0);
    const changeLiters = liters ? Math.round(liters * percent) / 100 : null;
    const salt = mode === 'marine' && changeLiters ? ` Preparar aprox. ${Math.round(changeLiters * 35)} g de sal a 35 g/L.` : '';
    const name = aq.name || 'Acuario';
    const last = latest(rows);
    if(!last) return { type:'water_change', priority:'high', aquarium_id:aq.id, aquarium_name:name, title:`Programar cambio de agua · ${name}`, due_at:new Date().toISOString(), notes:`No encuentro cambios de agua registrados. Recomendación inicial: ${percent}%${changeLiters ? ` (${changeLiters} L)` : ''}.${salt}` };
    const days = Math.floor((Date.now() - new Date(rowDate(last)).getTime()) / DAY);
    if(days >= every) return { type:'water_change', priority:days >= every*2 ? 'high' : 'normal', aquarium_id:aq.id, aquarium_name:name, title:`Toca cambio de agua · ${name}`, due_at:new Date().toISOString(), notes:`Último cambio: ${dateText(rowDate(last))}. Han pasado ${days} días. Recomendación: ${percent}%${changeLiters ? ` (${changeLiters} L)` : ''}.${salt}` };
    return null;
  }

  function missingAquariumData(aq){
    const out = [];
    const liters = Number(aq.manual_real_liters || aq.system_net_liters || aq.real_liters || aq.volume_liters || aq.liters || 0);
    const name = aq.name || 'Acuario';
    if(!liters) out.push({ type:'missing_data', priority:'high', aquarium_id:aq.id, aquarium_name:name, title:`Completar litros · ${name}`, due_at:new Date().toISOString(), notes:'La IA necesita litros reales/netos para calcular cambios de agua, dosis, sal y riesgos con seguridad.' });
    if(!aq.aquarium_type && !aq.type) out.push({ type:'missing_data', priority:'normal', aquarium_id:aq.id, aquarium_name:name, title:`Definir tipo de acuario · ${name}`, due_at:new Date().toISOString(), notes:'Falta saber si es marino, dulce, reef, hospital o cuarentena. Ese dato cambia rangos, mediciones y recomendaciones.' });
    return out;
  }

  function inventorySuggestions(items){
    const out = [];
    const meta = ANX.inventoryMeta || (()=>({}));
    const expStatus = ANX.inventoryExpiryStatus || (()=>'');
    const has = w => (items||[]).some(i => text(i.category).includes(w) || text(i.name).includes(w));
    (items||[]).forEach(i => {
      const st = expStatus(i);
      const exp = meta(i).expires_at || i.expires_at || i.expiry_date || '';
      if(st === 'caducado') out.push({ type:'inventory', priority:'high', title:`Reponer ${i.name || 'producto caducado'}`, due_at:new Date().toISOString(), notes:`Figura caducado${exp ? ` desde ${exp}` : ''}. Revisar y retirar si procede.` });
      if(st === 'caduca pronto') out.push({ type:'inventory', priority:'normal', title:`Revisar caducidad de ${i.name || 'producto'}`, due_at:new Date(Date.now()+7*DAY).toISOString(), notes:`Caduca pronto${exp ? ` (${exp})` : ''}. Planificar reposición.` });
      if(Number(i.quantity) <= 0) out.push({ type:'inventory', priority:'normal', title:`Comprar ${i.name || 'inventario'}`, due_at:new Date().toISOString(), notes:`Aparece con cantidad ${i.quantity}. Revisar stock real.` });
    });
    if(!has('test')) out.push({ type:'inventory', priority:'normal', title:'Revisar tests disponibles', due_at:new Date().toISOString(), notes:'No veo tests en inventario. La IA necesita tests registrados para avisos de mediciones y compras.' });
    if(!has('comida') && !has('alimento')) out.push({ type:'inventory', priority:'normal', title:'Registrar comida disponible', due_at:new Date().toISOString(), notes:'No veo comida registrada. Añadirla permite controlar stock y compras.' });
    return out;
  }

  async function reviewAll(){
    const aquariums = state.aquariums?.length ? state.aquariums : await ANX.loadAquariums();
    const open = await supabase.from('tasks').select('*').eq('user_id', state.user.id).neq('status','done').limit(300);
    if(open.error) throw open.error;
    const existing = new Set((open.data || []).map(openKey));
    const inv = await supabase.from('inventory_items').select('*').eq('user_id', state.user.id).limit(300);
    let suggestions = inv.error ? [] : inventorySuggestions(inv.data || []);
    for(const aq of aquariums || []){
      suggestions = suggestions.concat(missingAquariumData(aq));
      const m = await supabase.from('aquarium_measurements').select('*').eq('aquarium_id', aq.id).order('measured_at', { ascending:false }).limit(150);
      if(!m.error){
        const last = latestMeasurements(m.data || []);
        const plan = plans[modeOf(aq)] || plans.marine || {};
        Object.keys(plan).forEach(k => { const s = dueMeasurement(aq, k, plan[k], last[k] || (k === 'salinity_ppt' ? last.salinity_sg : null)); if(s) suggestions.push(s); });
        Object.values(last).forEach(row => { const s = ANX.interpretMeasurementValue ? ANX.interpretMeasurementValue(aq, row) : null; if(s) suggestions.push(s); });
      }
      const wc = waterSuggestion(aq, await waterRows(aq));
      if(wc) suggestions.push(wc);
    }
    try{
      const micro = await supabase.from('microfauna_cultures').select('*').eq('user_id', state.user.id).eq('status', 'active').limit(150);
      if(!micro.error && ANX.microfaunaSuggestions) suggestions = suggestions.concat(ANX.microfaunaSuggestions(micro.data || []));
    }catch(_){}
    suggestions = suggestions.filter(s => !existing.has(openKey(s))).slice(0, 80);
    return { suggestions, existing: existing.size };
  }

  function card(s){
    return `<div class="item ai-suggestion ${esc(s.priority || 'normal')}"><b>${esc(s.title)}</b><p class="small">${esc(s.aquarium_name || 'General')} · ${esc(s.priority || 'normal')} · ${dateText(s.due_at)}</p><p>${esc(s.notes || '')}</p></div>`;
  }

  async function saveSuggestions(suggestions){
    if(!suggestions.length) return 0;
    const rows = suggestions.map(s => ({ user_id:state.user.id, aquarium_id:s.aquarium_id || null, title:s.title, task_type:'ai', due_at:s.due_at || new Date().toISOString(), priority:s.priority || 'normal', status:'open', notes:s.notes || null }));
    const { error } = await supabase.from('tasks').insert(rows);
    if(error) throw error;
    return rows.length;
  }

  window.iaAcuarioNexo = async function(){
    if(!state.user) return login();
    const t = token();
    render(`<section class="panel"><h2>IA AcuarioNexo</h2>${msg('Revisando parámetros, cambios de agua, inventario y tareas...')}</section>`, 'avisos');
    try{
      const review = await reviewAll();
      if(!isCurrent(t)) return;
      const created = await saveSuggestions(review.suggestions);
      render(`<section class="panel"><div class="panel-head"><div><h2>IA AcuarioNexo</h2><p class="small">Lee parámetros, cambios de agua, inventario, caducidades, stock y tareas.</p></div><button onclick="tareas()">Avisos</button></div>${created ? msg(`${created} avisos IA creados automáticamente.`, 'success') : ''}${review.suggestions.map(card).join('') || msg('No veo avisos nuevos ahora mismo.', 'success')}</section>`, 'avisos');
    }catch(e){ if(isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'avisos'); }
  };
})();
