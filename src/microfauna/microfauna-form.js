/* AcuarioNexo · Microfauna form */
(function () {
  async function formMicrofauna(id = '', forcedType = '') {
    const { state, esc, render, loadAquariums, profileFor, defaultCulture, typeOptions, aquariumOptions, localDateTime } = window.ANX;
    if (!state.user) return login();
    if (!state.aquariums?.length && loadAquariums) await loadAquariums();
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
  }

  window.formMicrofauna = formMicrofauna;
  window.ANX = window.ANX || {};
  window.ANX.MicrofaunaForm = { formMicrofauna };
})();