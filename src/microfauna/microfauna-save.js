/* AcuarioNexo · Microfauna save */
(function () {
  function readMicrofaunaForm() {
    const { state, val, num, profileFor, isoFromInput, nowIso } = window.ANX;
    const type = val('microType') || 'rotiferos';
    const p = profileFor(type);
    const isPhyto = type === 'fitoplancton';
    const waterPercent = num('microWaterPercent');
    const harvestHours = Number(val('microHarvestHours')) || null;
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
      feedings_per_day: p.showFeedings ? (Number(val('microFeedings')) || 0) : 0,
      water_change_percent: waterPercent,
      water_change_days: p.showWater ? (Number(val('microWaterDays')) || null) : null,
      harvest_interval_hours: harvestHours,
      culture_started_at: isoFromInput('microStarted'),
      hatch_started_at: p.showHatching ? isoFromInput('microHatchStarted') : null,
      hatch_expected_at: p.showHatching ? isoFromInput('microHatchExpected') : null,
      next_feed_at: isoFromInput('microNextFeed'),
      next_water_change_at: p.showWater ? isoFromInput('microNextWater') : null,
      next_harvest_at: isoFromInput('microNextHarvest'),
      ai_profile: {
        label: p.label,
        salinity_ppt: p.salinity,
        temperature_c: p.temperature,
        feed_label: p.feedLabel,
        feed: val('microFeed') || p.feed,
        feed_amount_label: p.feedAmountLabel,
        feed_amount: val('microFeedAmount') || p.feedAmount,
        feedings_per_day: p.showFeedings ? (Number(val('microFeedings')) || 0) : 0,
        harvest_percent: isPhyto ? waterPercent : null,
        water_change_percent: p.showWater ? waterPercent : null,
        water_change_days: p.showWater ? (Number(val('microWaterDays')) || null) : null,
        harvest_interval_hours: harvestHours,
        next_feed_label: p.nextFeedLabel,
        next_water_label: p.nextWaterLabel,
        next_harvest_label: p.nextHarvestLabel,
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