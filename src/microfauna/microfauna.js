/* AcuarioNexo · microfauna */
(function () {
  const { supabase, state, msg, token, isCurrent, render } = window.ANX;
  const { loadAquariums, HOUR, DAY, profileFor, nowIso, addIso, cultureCard, microSummary } = window.ANX;

async function ensureAquariumsLoaded() {
  if (!state.aquariums?.length && loadAquariums) await loadAquariums();
}

window.microfauna = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="panel microfauna-panel"><h2>Microfauna</h2>${msg('Cargando cultivos...')}</section>`, 'microfauna');
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
      <section class="panel microfauna-panel">
        <div class="panel-head microfauna-head"><div><h2>Cultivos</h2><p class="small">Rotíferos, copépodos, fitoplancton, artemia e infusorios.</p></div><button class="primary" onclick="formMicrofauna()">Nuevo</button></div>
        <div class="quick-actions micro-presets">
          <button onclick="formMicrofauna('', 'rotiferos')"><span>R</span>Rotíferos</button>
          <button onclick="formMicrofauna('', 'copepodos')"><span>C</span>Copépodos</button>
          <button onclick="formMicrofauna('', 'fitoplancton')"><span>F</span>Fitoplancton</button>
          <button onclick="formMicrofauna('', 'artemia')"><span>A</span>Artemia</button>
          <button onclick="formMicrofauna('', 'infusorios')"><span>I</span>Infusorios</button>
        </div>
        <div class="micro-grid">${state.microfaunaRows.map(cultureCard).join('') || '<p class="small">Sin cultivos todavía.</p>'}</div>
      </section>`, 'microfauna');
  } catch (e) {
    if (isCurrent(t)) render(`<section class="panel microfauna-panel"><h2>Microfauna</h2>${msg(e.message, 'error')}</section>`, 'microfauna');
  }
};

window.registrarMicrofauna = async function (id, action) {
  const row = (state.microfaunaRows || []).find(r => r.id === id);
  if (!row) return;
  const profile = profileFor(row.culture_type);
  const updates = { updated_at: nowIso(), last_review_at: nowIso() };
  if (action === 'feed') {
    if (row.culture_type === 'fitoplancton') {
      const hours = Number(row.harvest_interval_hours) || profile.harvestHours || 168;
      updates.next_feed_at = addIso(hours * HOUR);
    } else {
      const perDay = Number(row.feedings_per_day) || profile.feedings || 1;
      updates.next_feed_at = addIso(Math.max(1, Math.round(24 / perDay)) * HOUR);
    }
  }
  if (action === 'water' && profile.showWater) {
    const days = Number(row.water_change_days) || profile.waterDays || 1;
    updates.next_water_change_at = addIso(days * DAY);
  }
  if (action === 'harvest') {
    const hours = Number(row.harvest_interval_hours) || profile.harvestHours || 24;
    updates.last_harvest_at = nowIso();
    updates.next_harvest_at = addIso(hours * HOUR);
  }
  const { error } = await supabase.from('microfauna_cultures').update(updates).eq('id', id).eq('user_id', state.user.id);
  if (error) return render(`<section class="panel microfauna-panel">${msg(error.message, 'error')}</section>`, 'microfauna');
  await microfauna();
};
})();