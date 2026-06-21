/* AcuarioNexo · microfauna */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, render } = window.ANX;
  const { loadAquariums } = window.ANX;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const microfaunaProfiles = {
  rotiferos: {
    label: 'Rotiferos',
    salinity: [18, 25],
    temperature: [24, 28],
    feed: 'Fitoplancton vivo o concentrado',
    feedAmount: 'Poco y frecuente, mantener agua ligeramente verde',
    feedings: 2,
    waterPercent: 20,
    waterDays: 1,
    harvestHours: 24,
    notes: 'Mantener densidad estable, aireacion suave y evitar picos de amonio.'
  },
  copepodos: {
    label: 'Copepodos',
    salinity: [30, 35],
    temperature: [22, 26],
    feed: 'Fitoplancton variado',
    feedAmount: 'Dosis baja hasta tinte suave',
    feedings: 1,
    waterPercent: 15,
    waterDays: 7,
    harvestHours: 168,
    notes: 'Cultivo mas lento. Recolectar parcial y conservar adultos reproductores.'
  },
  fitoplancton: {
    label: 'Fitoplancton',
    salinity: [30, 35],
    temperature: [20, 25],
    feed: 'Fertilizante F/2',
    feedAmount: 'Segun cepa y volumen',
    feedings: 0,
    waterPercent: 50,
    waterDays: 7,
    harvestHours: 168,
    notes: 'Luz 14-18 h/dia, aireacion constante y dividir antes de colapso.'
  },
  artemia: {
    label: 'Artemia',
    salinity: [25, 35],
    temperature: [26, 28],
    feed: 'Sin alimento hasta eclosion',
    feedAmount: 'Enriquecer tras eclosion si se mantiene mas tiempo',
    feedings: 0,
    waterPercent: 100,
    waterDays: 2,
    harvestHours: 36,
    hatchHours: 36,
    notes: 'Eclosion orientativa 24-36 h. Separar cascaras antes de alimentar.'
  },
  infusorios: {
    label: 'Infusorios',
    salinity: [0, 2],
    temperature: [20, 26],
    feed: 'Materia vegetal o levadura muy diluida',
    feedAmount: 'Muy poco para evitar pudricion',
    feedings: 1,
    waterPercent: 20,
    waterDays: 3,
    harvestHours: 48,
    notes: 'Usar olor y claridad como senales de control. Renovar si se enturbia demasiado.'
  }
};

function profileFor(type) {
  return microfaunaProfiles[type] || microfaunaProfiles.rotiferos;
}

function nowIso() {
  return new Date().toISOString();
}

function addIso(ms) {
  return new Date(Date.now() + ms).toISOString();
}

function localDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoFromInput(id) {
  const raw = val(id);
  return raw ? new Date(raw).toISOString() : null;
}

function dueClass(iso) {
  if (!iso) return 'muted';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 'muted';
  if (t <= Date.now()) return 'due';
  if (t <= Date.now() + DAY) return 'soon';
  return 'ok';
}

function dueLabel(label, iso) {
  return `<span class="micro-due ${dueClass(iso)}"><b>${esc(label)}</b>${esc(iso ? dateText(iso) : 'Sin programar')}</span>`;
}

function typeOptions(selected) {
  return Object.keys(microfaunaProfiles).map(function (key) {
    return `<option value="${esc(key)}" ${key === selected ? 'selected' : ''}>${esc(profileFor(key).label)}</option>`;
  }).join('');
}

function aquariumOptions(selected) {
  const rows = state.aquariums || [];
  return `<option value="">General / sin acuario</option>` + rows.map(function (aq) {
    return `<option value="${esc(aq.id)}" ${aq.id === selected ? 'selected' : ''}>${esc(aq.name || 'Acuario')}</option>`;
  }).join('');
}

function defaultCulture(type) {
  const p = profileFor(type);
  const start = nowIso();
  return {
    name: p.label,
    culture_type: type,
    status: 'active',
    vessel: '',
    volume_ml: '',
    salinity_ppt: p.salinity[0],
    temperature_c: p.temperature[1],
    density: '',
    feed_type: p.feed,
    feed_amount: p.feedAmount,
    feedings_per_day: p.feedings,
    water_change_percent: p.waterPercent,
    water_change_days: p.waterDays,
    harvest_interval_hours: p.harvestHours,
    culture_started_at: start,
    hatch_started_at: type === 'artemia' ? start : null,
    hatch_expected_at: type === 'artemia' ? addIso((p.hatchHours || 36) * HOUR) : null,
    next_feed_at: p.feedings ? addIso(Math.max(1, Math.round(24 / p.feedings)) * HOUR) : null,
    next_water_change_at: addIso(p.waterDays * DAY),
    next_harvest_at: addIso(p.harvestHours * HOUR),
    notes: p.notes
  };
}

function cultureCard(row) {
  const p = profileFor(row.culture_type);
  const aq = (state.aquariums || []).find(a => a.id === row.aquarium_id);
  return `<article class="micro-card">
    <div class="micro-card-head">
      <div><small>${esc(p.label)}${aq ? ` · ${esc(aq.name || 'Acuario')}` : ''}</small><h3>${esc(row.name || p.label)}</h3></div>
      <span class="pill">${esc(row.status || 'active')}</span>
    </div>
    <div class="micro-kpis">
      <span><b>${esc(row.volume_ml || '-')}</b> ml</span>
      <span><b>${esc(row.salinity_ppt || '-')}</b> ppt</span>
      <span><b>${esc(row.temperature_c || '-')}</b> C</span>
    </div>
    <p class="small">${esc(row.feed_type || p.feed)}${row.feed_amount ? ` · ${esc(row.feed_amount)}` : ''}</p>
    <div class="micro-dates">
      ${dueLabel('Alimentar', row.next_feed_at)}
      ${dueLabel('Cambio', row.next_water_change_at)}
      ${dueLabel('Recolectar', row.next_harvest_at)}
      ${row.hatch_expected_at ? dueLabel('Eclosion', row.hatch_expected_at) : ''}
    </div>
    <div class="micro-actions">
      <button onclick="registrarMicrofauna('${esc(row.id)}','feed')">Alimentar</button>
      <button onclick="registrarMicrofauna('${esc(row.id)}','water')">Cambio</button>
      <button onclick="registrarMicrofauna('${esc(row.id)}','harvest')">Recolectar</button>
      <button onclick="formMicrofauna('${esc(row.id)}')">Editar</button>
    </div>
  </article>`;
}

function microSummary(rows) {
  const active = rows.filter(r => r.status !== 'paused' && r.status !== 'archived');
  const due = active.filter(r => [r.next_feed_at, r.next_water_change_at, r.next_harvest_at, r.hatch_expected_at].some(x => dueClass(x) === 'due')).length;
  return `<section class="summary-card"><div><small>AcuarioNexo</small><h2>Microfauna</h2><p>${active.length} cultivos activos · ${due} con revision pendiente</p></div></section>`;
}

async function ensureAquariumsLoaded() {
  if (!state.aquariums?.length && loadAquariums) await loadAquariums();
}

window.microfauna = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="panel"><h2>Microfauna</h2>${msg('Cargando cultivos...')}</section>`, 'inicio');
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
      </section>`, 'inicio');
  } catch (e) {
    if (isCurrent(t)) render(`<section class="panel"><h2>Microfauna</h2>${msg(e.message, 'error')}</section>`, 'inicio');
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
  </section>`, 'inicio');
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
  if (error) return render(`<section class="panel">${msg(error.message, 'error')}</section>`, 'inicio');
  await microfauna();
};

  Object.assign(window.ANX, {
    microfaunaProfiles,
    microfaunaProfileFor: profileFor
  });
})();
