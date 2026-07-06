/* AcuarioNexo · Microfauna core */
(function () {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  const microfaunaProfiles = {
    rotiferos: { label: 'Rotiferos', salinity: [18, 25], temperature: [24, 28], feed: 'Fitoplancton vivo o concentrado', feedAmount: 'Poco y frecuente, mantener agua ligeramente verde', feedings: 2, waterPercent: 20, waterDays: 1, harvestHours: 24, notes: 'Mantener densidad estable, aireacion suave y evitar picos de amonio.' },
    copepodos: { label: 'Copepodos', salinity: [30, 35], temperature: [22, 26], feed: 'Fitoplancton variado', feedAmount: 'Dosis baja hasta tinte suave', feedings: 1, waterPercent: 15, waterDays: 7, harvestHours: 168, notes: 'Cultivo mas lento. Recolectar parcial y conservar adultos reproductores.' },
    fitoplancton: { label: 'Fitoplancton', salinity: [30, 35], temperature: [20, 25], feed: 'Fertilizante F/2', feedAmount: 'Segun cepa y volumen', feedings: 0, waterPercent: 50, waterDays: 7, harvestHours: 168, notes: 'Luz 14-18 h/dia, aireacion constante y dividir antes de colapso.' },
    artemia: { label: 'Artemia', salinity: [25, 35], temperature: [26, 28], feed: 'Sin alimento hasta eclosion', feedAmount: 'Enriquecer tras eclosion si se mantiene mas tiempo', feedings: 0, waterPercent: 100, waterDays: 2, harvestHours: 36, hatchHours: 36, notes: 'Eclosion orientativa 24-36 h. Separar cascaras antes de alimentar.' },
    infusorios: { label: 'Infusorios', salinity: [0, 2], temperature: [20, 26], feed: 'Materia vegetal o levadura muy diluida', feedAmount: 'Muy poco para evitar pudricion', feedings: 1, waterPercent: 20, waterDays: 3, harvestHours: 48, notes: 'Usar olor y claridad como senales de control. Renovar si se enturbia demasiado.' }
  };

  function profileFor(type) { return microfaunaProfiles[type] || microfaunaProfiles.rotiferos; }
  function nowIso() { return new Date().toISOString(); }
  function addIso(ms) { return new Date(Date.now() + ms).toISOString(); }

  function localDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function isoFromInput(id) {
    const { val } = window.ANX;
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
    const { esc, dateText } = window.ANX;
    return `<span class="micro-due ${dueClass(iso)}"><b>${esc(label)}</b>${esc(iso ? dateText(iso) : 'Sin programar')}</span>`;
  }

  function typeOptions(selected) {
    const { esc } = window.ANX;
    return Object.keys(microfaunaProfiles).map(function (key) {
      return `<option value="${esc(key)}" ${key === selected ? 'selected' : ''}>${esc(profileFor(key).label)}</option>`;
    }).join('');
  }

  function aquariumOptions(selected) {
    const { state, esc } = window.ANX;
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
    const { state, esc } = window.ANX;
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

  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { HOUR, DAY, microfaunaProfiles, profileFor, nowIso, addIso, localDateTime, isoFromInput, dueClass, dueLabel, typeOptions, aquariumOptions, defaultCulture, cultureCard, microSummary, microfaunaProfileFor: profileFor });
  window.ANX.MicrofaunaCore = { HOUR, DAY, microfaunaProfiles, profileFor, nowIso, addIso, localDateTime, isoFromInput, dueClass, dueLabel, typeOptions, aquariumOptions, defaultCulture, cultureCard, microSummary };
})();