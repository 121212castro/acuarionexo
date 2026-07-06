/* AcuarioNexo · Microfauna save */
(function () {
  function readMicrofaunaForm() {
    const { state, val, num, profileFor, isoFromInput, nowIso } = window.ANX;
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

  async function saveMicrofauna(id = '') {
    const { supabase, state, byId, msg } = window.ANX;
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
  }

  window.saveMicrofauna = saveMicrofauna;
  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { readMicrofaunaForm });
  window.ANX.MicrofaunaSave = { readMicrofaunaForm, saveMicrofauna };
})();