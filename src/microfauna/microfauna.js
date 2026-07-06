/* AcuarioNexo · microfauna */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, render } = window.ANX;
  const { loadAquariums, HOUR, DAY, profileFor, nowIso, addIso, localDateTime, isoFromInput, typeOptions, aquariumOptions, defaultCulture, cultureCard, microSummary } = window.ANX;

async function ensureAquariumsLoaded() {
  if (!state.aquariums?.length && loadAquariums) await loadAquariums();
}

window.microfauna = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="panel"><h2>Microfauna</h2>${msg('Cargando cultivos...')}</section>`, 'microfauna');
  try {
    await ensureAquariumsLoaded();
    const { data, error } = await supabase.from('microfauna_cultures')
      .select('*')
      .eq('user_id', state.user.id)
      .order('created_at', { ascending: false })
      .limit(120);
    if (error) throw error;
    if (!isCurrent(t)) return;
    state.microfaunaRows = data || [];
    render(`${microSummary(state.microfaunaRows)}
      <section class="panel">
        <div class="panel-head"><div><h2>Cultivos</h2><p class="small">Rotiferos, copepodos, fitoplancton, artemia e infusorios.</p></div><button onclick="formMicrofauna()">Nuevo</button></div>
        <div class="quick-actions micro-presets">
          <button onclick="formMicrofauna('', 'rotiferos')"><span>R</span>Rotiferos</button>
          <button onclick="formMicrofauna('', 'copepodos')"><span>C</span>Copepodos</button>
          <button onclick="formMicrofauna('', 'fitoplancton')"><span>F</span>Fitoplancton</button>
          <button onclick="formMicrofauna('', 'artemia')"><span>A</span>Artemia</button>
          <button onclick="formMicrofauna('', 'infusorios')"><span>I</span>Infusorios</button>
        </div>
        <div class="micro-grid">${state.microfaunaRows.map(cultureCard).join('') || '<p class="small">Sin cultivos todavia.</p>'}</div>
      </section>`, 'microfauna');
  } catch (e) {
    if (isCurrent(t)) render(`<section class="panel"><h2>Microfauna</h2>${msg(e.message, 'error')}</section>`, 'microfauna');
  }
};

window.formMicrofauna = async function (id = '', forcedType = '') {
  if (!state.user) return login();
  await ensureAquariumsLoaded();
  const existing = id ? (state.microfaunaRows || []).find(r => r.id === id) : null;
  const type = forcedType || existing?.culture_type || 'rotiferos';
  const row = existing ? Object.assign({}, existing, { culture_type: type }) : defaultCulture(type);
  const p = profileFor(row.culture_type || type);
  render(`<section class="panel micro-form">
    <button onclick="microfauna()">← Volver</button>
    <h2>${existing ? 'Editar cultivo' : 'Nuevo cultivo'}</h2>
    <p class="small">${esc(p.notes)}</p>
    <div class="form-grid">
      <div><label>Tipo</label><select id="microType" onchange="formMicrofauna('${esc(existing?.id || '')}', this.value)">${typeOptions(row.culture_type || type)}</select></div>
      <div><label>Estado</label><select id="microStatus">
        <option value="active" ${row.status === 'active' ? 'selected' : ''}>Activo</option>
        <option value="paused" ${row.status === 'paused' ? 'selected' : ''}>Pausado</option>
        <option value="archived" ${row.status === 'archived' ? 'selected' : ''}>Archivado</option>
      </select></div>
      <div><label>Nombre</label><input id="microName" value="${esc(row.name || '')}" placeholder="Cultivo principal"></div>
      <div><label>Acuario vinculado</label><select id="microAquarium">${aquariumOptions(row.aquarium_id || '')}</select></div>
      <div><label>Recipiente</label><input id="microVessel" value="${esc(row.vessel || '')}" placeholder="Botella, cubo, reactor..."></div>
      <div><label>Volumen ml</label><input id="microVolume" type="number" step="1" value="${esc(row.volume_ml || '')}"></div>
      <div><label>Salinidad ppt</label><input id="microSalinity" type="number" step="0.1" value="${esc(row.salinity_ppt ?? '')}"></div>
      <div><label>Temperatura C</label><input id="microTemp" type="number" step="0.1" value="${esc(row.temperature_c ?? '')}"></div>
      <div><label>Densidad</label><input id="microDensity" value="${esc(row.density || '')}" placeholder="Alta, media, cel/ml..."></div>
      <div><label>Alimento</label><input id="microFeed" value="${esc(row.feed_type || '')}"></div>
      <div><label>Cantidad alimento</label><input id="microFeedAmount" value="${esc(row.feed_amount || '')}"></div>
      <div><label>Tomas/dia</label><input id="microFeedings" type="number" step="1" value="${esc(row.feedings_per_day ?? '')}"></div>
      <div><label>Cambio agua %</label><input id="microWaterPercent" type="number" step="1" value="${esc(row.water_change_percent ?? '')}"></div>
      <div><label>Cada cuantos dias</label><input id="microWaterDays" type="number" step="1" value="${esc(row.water_change_days ?? '')}"></div>
      <div><label>Recolecta cada horas</label><input id="microHarvestHours" type="number" step="1" value="${esc(row.harvest_interval_hours ?? '')}"></div>
      <div><label>Inicio cultivo</label><input id="microStarted" type="datetime-local" value="${esc(localDateTime(row.culture_started_at))}"></div>
      <div><label>Inicio eclosion</label><input id="microHatchStarted" type="datetime-local" value="${esc(localDateTime(row.hatch_started_at))}"></div>
      <div><label>Eclosion prevista</label><input id="microHatchExpected" type="datetime-local" value="${esc(localDateTime(row.hatch_expected_at))}"></div>
      <div><label>Proxima alimentacion</label><input id="microNextFeed" type="datetime-local" value="${esc(localDateTime(row.next_feed_at))}"></div>
      <div><label>Proximo cambio</label><input id="microNextWater" type="datetime-local" value="${esc(localDateTime(row.next_water_change_at))}"></div>
      <div><label>Proxima recolecta</label><input id="microNextHarvest" type="datetime-local" value="${esc(localDateTime(row.next_harvest_at))}"></div>
    </div>
    <label>Notas</label><textarea id="microNotes" placeholder="Observaciones, olor, color, cepa, riesgos...">${esc(row.notes || '')}</textarea>
    <button class="primary" onclick="saveMicrofauna('${esc(existing?.id || '')}')">Guardar cultivo</button>
    <div id="microMsg"></div>
  </section>`, 'microfauna');
};

function readMicrofaunaForm() {
  const type = val('microType') || 'rotiferos';
  const p = profileFor(type);
  return {
    user_id: state.user.id,
    aquarium_id: val('microAquarium') || null,
    name: val('microName') || p.label,
    culture_type: type,
    status: val('microStatus') || 'active',
    vessel: val('microVessel') || null,
    volume_ml: num('microVolume'),
    salinity_ppt: num('microSalinity'),
    temperature_c: num('microTemp'),
    density: val('microDensity') || null,
    feed_type: val('microFeed') || p.feed,
    feed_amount: val('microFeedAmount') || p.feedAmount,
    feedings_per_day: Number(val('microFeedings')) || 0,
    water_change_percent: num('microWaterPercent'),
    water_change_days: Number(val('microWaterDays')) || null,
    harvest_interval_hours: Number(val('microHarvestHours')) || null,
    culture_started_at: isoFromInput('microStarted'),
    hatch_started_at: isoFromInput('microHatchStarted'),
    hatch_expected_at: isoFromInput('microHatchExpected'),
    next_feed_at: isoFromInput('microNextFeed'),
    next_water_change_at: isoFromInput('microNextWater'),
    next_harvest_at: isoFromInput('microNextHarvest'),
    ai_profile: {
      label: p.label,
      salinity_ppt: p.salinity,
      temperature_c: p.temperature,
      feed: p.feed,
      feed_amount: p.feedAmount,
      feedings_per_day: p.feedings,
      water_change_percent: p.waterPercent,
      water_change_days: p.waterDays,
      harvest_interval_hours: p.harvestHours,
      notes: p.notes
    },
    notes: val('microNotes') || null,
    updated_at: nowIso()
  };
}

window.saveMicrofauna = async function (id = '') {
  try {
    if (byId('microMsg')) byId('microMsg').innerHTML = msg('Guardando...');
    const row = readMicrofaunaForm();
    const result = id
      ? await supabase.from('microfauna_cultures').update(row).eq('id', id).eq('user_id', state.user.id)
      : await supabase.from('microfauna_cultures').insert(row);
    if (result.error) throw result.error;
    await microfauna();
  } catch (e) {
    if (byId('microMsg')) byId('microMsg').innerHTML = msg(e.message, 'error');
  }
};

window.registrarMicrofauna = async function (id, action) {
  const row = (state.microfaunaRows || []).find(r => r.id === id);
  if (!row) return;
  const updates = { updated_at: nowIso(), last_review_at: nowIso() };
  if (action === 'feed') {
    const perDay = Number(row.feedings_per_day) || profileFor(row.culture_type).feedings || 1;
    updates.next_feed_at = addIso(Math.max(1, Math.round(24 / perDay)) * HOUR);
  }
  if (action === 'water') {
    const days = Number(row.water_change_days) || profileFor(row.culture_type).waterDays || 1;
    updates.next_water_change_at = addIso(days * DAY);
  }
  if (action === 'harvest') {
    const hours = Number(row.harvest_interval_hours) || profileFor(row.culture_type).harvestHours || 24;
    updates.last_harvest_at = nowIso();
    updates.next_harvest_at = addIso(hours * HOUR);
  }
  const { error } = await supabase.from('microfauna_cultures').update(updates).eq('id', id).eq('user_id', state.user.id);
  if (error) return render(`<section class="panel">${msg(error.message, 'error')}</section>`, 'microfauna');
  await microfauna();
};
})();