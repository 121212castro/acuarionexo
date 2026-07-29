/* AcuarioNexo · Microfauna form */
(function () {
  function field(label, input) { return `<div><label>${label}</label>${input}</div>`; }

  async function formMicrofauna(id = '', forcedType = '') {
    const { state, esc, render, loadAquariums, profileFor, defaultCulture, typeOptions, aquariumOptions, localDateTime } = window.ANX;
    if (!state.user) return login();
    if (!state.aquariums?.length && loadAquariums) await loadAquariums();
    const existing = id ? (state.microfaunaRows || []).find(r => r.id === id) : null;
    const type = forcedType || existing?.culture_type || 'rotiferos';
    const row = existing ? Object.assign({}, existing, { culture_type: type }) : defaultCulture(type);
    const p = profileFor(row.culture_type || type);
    const isPhyto = row.culture_type === 'fitoplancton';

    const feedingFields = `${field(p.feedLabel, `<input id="microFeed" value="${esc(row.feed_type || '')}">`)}
      ${field(p.feedAmountLabel, `<input id="microFeedAmount" value="${esc(row.feed_amount || '')}">`)}
      ${p.showFeedings ? field('Tomas/día', `<input id="microFeedings" type="number" step="1" value="${esc(row.feedings_per_day ?? '')}">`) : '<input id="microFeedings" type="hidden" value="0">'}`;

    const maintenanceFields = isPhyto
      ? `${field(p.harvestPercentLabel, `<input id="microWaterPercent" type="number" min="0" max="100" step="1" value="${esc(row.water_change_percent ?? '')}">`)}
         <input id="microWaterDays" type="hidden" value="">
         ${field('Cosecha cada horas', `<input id="microHarvestHours" type="number" min="1" step="1" value="${esc(row.harvest_interval_hours ?? '')}">`)}`
      : `${p.showWater ? `${field(p.waterPercentLabel, `<input id="microWaterPercent" type="number" min="0" max="100" step="1" value="${esc(row.water_change_percent ?? '')}">`)}
         ${field(p.waterDaysLabel, `<input id="microWaterDays" type="number" min="1" step="1" value="${esc(row.water_change_days ?? '')}">`)}` : '<input id="microWaterPercent" type="hidden" value=""><input id="microWaterDays" type="hidden" value="">'}
         ${field('Recolecta cada horas', `<input id="microHarvestHours" type="number" min="1" step="1" value="${esc(row.harvest_interval_hours ?? '')}">`)}`;

    const hatchingFields = p.showHatching
      ? `${field('Inicio eclosión', `<input id="microHatchStarted" type="datetime-local" value="${esc(localDateTime(row.hatch_started_at))}">`)}
         ${field('Eclosión prevista', `<input id="microHatchExpected" type="datetime-local" value="${esc(localDateTime(row.hatch_expected_at))}">`)}`
      : '<input id="microHatchStarted" type="hidden" value=""><input id="microHatchExpected" type="hidden" value="">';

    const scheduleFields = `${field('Inicio cultivo', `<input id="microStarted" type="datetime-local" value="${esc(localDateTime(row.culture_started_at))}">`)}
      ${isPhyto || row.next_feed_at || p.showFeedings ? field(p.nextFeedLabel, `<input id="microNextFeed" type="datetime-local" value="${esc(localDateTime(row.next_feed_at))}">`) : '<input id="microNextFeed" type="hidden" value="">'}
      ${p.showWater ? field(p.nextWaterLabel, `<input id="microNextWater" type="datetime-local" value="${esc(localDateTime(row.next_water_change_at))}">`) : '<input id="microNextWater" type="hidden" value="">'}
      ${field(p.nextHarvestLabel, `<input id="microNextHarvest" type="datetime-local" value="${esc(localDateTime(row.next_harvest_at))}">`)}`;

    render(`<section class="panel micro-form">
      <button onclick="microfauna()">← Volver</button>
      <h2>${existing ? 'Editar cultivo' : 'Nuevo cultivo'}</h2>
      <p class="small">${esc(p.notes)}</p>
      <div class="form-grid">
        ${field('Tipo', `<select id="microType" onchange="formMicrofauna('${esc(existing?.id || '')}', this.value)">${typeOptions(row.culture_type || type)}</select>`)}
        ${field('Estado', `<select id="microStatus"><option value="active" ${row.status === 'active' ? 'selected' : ''}>Activo</option><option value="paused" ${row.status === 'paused' ? 'selected' : ''}>Pausado</option><option value="archived" ${row.status === 'archived' ? 'selected' : ''}>Archivado</option></select>`)}
        ${field('Nombre', `<input id="microName" value="${esc(row.name || '')}" placeholder="Cultivo principal">`)}
        ${field('Acuario vinculado', `<select id="microAquarium">${aquariumOptions(row.aquarium_id || '')}</select>`)}
        ${field('Recipiente', `<input id="microVessel" value="${esc(row.vessel || '')}" placeholder="Botella, cubo, reactor...">`)}
        ${field('Volumen ml', `<input id="microVolume" type="number" min="0" step="1" value="${esc(row.volume_ml || '')}">`)}
        ${field('Salinidad ppt', `<input id="microSalinity" type="number" step="0.1" value="${esc(row.salinity_ppt ?? '')}">`)}
        ${field('Temperatura °C', `<input id="microTemp" type="number" step="0.1" value="${esc(row.temperature_c ?? '')}">`)}
        ${field(isPhyto ? 'Densidad o color del cultivo' : 'Densidad', `<input id="microDensity" value="${esc(row.density || '')}" placeholder="${isPhyto ? 'Color, escala visual o células/ml' : 'Alta, media, individuos/ml...'}">`)}
        ${feedingFields}
        ${maintenanceFields}
        ${scheduleFields}
        ${hatchingFields}
      </div>
      <label>Notas</label><textarea id="microNotes" placeholder="Observaciones, olor, color, cepa, riesgos...">${esc(row.notes || '')}</textarea>
      <button class="primary" onclick="saveMicrofauna('${esc(existing?.id || '')}')">Guardar cultivo</button>
      <div id="microMsg"></div>
    </section>`, 'microfauna');
  }

  window.formMicrofauna = formMicrofauna;
  window.ANX = window.ANX || {};
  window.ANX.MicrofaunaForm = { formMicrofauna };
})();
