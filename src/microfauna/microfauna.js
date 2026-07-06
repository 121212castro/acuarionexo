/* AcuarioNexo · microfauna */
(function () {
  const { supabase, state, byId, val, num, msg, token, isCurrent, render } = window.ANX;
  const { loadAquariums, HOUR, DAY, profileFor, nowIso, addIso, isoFromInput, cultureCard, microSummary } = window.ANX;

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