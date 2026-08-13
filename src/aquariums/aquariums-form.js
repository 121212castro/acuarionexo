/* AcuarioNexo · aquariums form */
(function () {
  const { state, esc, byId, val, render, photoUrl } = window.ANX;
  const { calcStat } = window.ANX.AquariumsCore;

  function selectTypeOptions(current) {
    const options = [
      ['reef', 'Marino arrecife'],
      ['freshwater', 'Agua dulce'],
      ['hospital', 'Hospital'],
      ['quarantine', 'Cuarentena'],
      ['other', 'Otro']
    ];
    return options.map(function (item) { return `<option value="${esc(item[0])}" ${String(current || '') === item[0] ? 'selected' : ''}>${esc(item[1])}</option>`; }).join('');
  }

  function dateValue(value) { return value ? String(value).slice(0, 10) : ''; }
  function fnum(id, label, value) { return `<label for="${esc(id)}">${esc(label)}</label><input id="${esc(id)}" type="number" step="0.1" inputmode="decimal" value="${esc(value ?? '')}" oninput="calcAqVolumes()">`; }
  function fdate(id, label, value) { return `<label for="${esc(id)}">${esc(label)}</label><input id="${esc(id)}" type="date" value="${esc(dateValue(value))}">`; }
  function fcheck(id, label, value) { return `<label class="aq-switch" for="${esc(id)}"><span>${esc(label)}</span><input id="${esc(id)}" type="checkbox" ${value ? 'checked' : ''} onchange="calcAqVolumes()"><i aria-hidden="true"></i></label>`; }
  function nval(id) { const raw = val(id); if (raw === '') return null; const n = Number(String(raw).replace(',', '.')); return Number.isFinite(n) ? n : null; }
  function dval(id) { return val(id) || null; }

  function lDisplay(a, b, h) { return ((Number(a) || 0) * (Number(b) || 0) * (Number(h) || 0) / 1000) || 0; }

  function calcVolumesFromInputs() {
    const gross = lDisplay(val('tank_length_cm'), val('tank_width_cm'), val('tank_height_cm'));
    const displayWater = lDisplay(val('tank_length_cm'), val('tank_width_cm'), val('display_water_height_cm'));
    const displayNet = displayWater;
    const sumpGross = lDisplay(val('sump_length_cm'), val('sump_width_cm'), val('sump_height_cm'));
    const sumpNet = byId('has_sump')?.checked ? lDisplay(val('sump_length_cm'), val('sump_width_cm'), val('sump_water_height_cm')) : 0;
    const systemNet = displayNet + sumpNet;
    return { gross, displayWater, displayNet, sumpGross, sumpNet, systemNet };
  }

  function aquariumPayload() {
    const c = calcVolumesFromInputs();
    return {
      name: val('editAqName'),
      aquarium_type: val('editAqType') || 'reef',
      type: val('editAqType') || 'reef',
      location: val('editAqLocation') || null,
      tank_length_cm: nval('tank_length_cm'),
      tank_width_cm: nval('tank_width_cm'),
      tank_height_cm: nval('tank_height_cm'),
      display_water_height_cm: nval('display_water_height_cm'),
      rock_kg: nval('rock_kg'),
      sand_kg: nval('sand_kg'),
      has_sump: !!byId('has_sump')?.checked,
      sump_length_cm: nval('sump_length_cm'),
      sump_width_cm: nval('sump_width_cm'),
      sump_height_cm: nval('sump_height_cm'),
      sump_water_height_cm: nval('sump_water_height_cm'),
      has_refugium: !!byId('has_refugium')?.checked,
      refugium_liters: nval('refugium_liters'),
      has_ato_reservoir: !!byId('has_ato_reservoir')?.checked,
      ato_reservoir_liters: nval('ato_reservoir_liters'),
      gross_liters: c.gross,
      display_water_liters: c.displayWater,
      display_net_liters: c.displayNet,
      sump_net_liters: c.sumpNet,
      system_net_liters: c.systemNet,
      real_liters: c.systemNet,
      manual_real_liters: null,
      liters: c.systemNet,
      volume_liters: c.systemNet,
      mounted_at: dval('mounted_at'),
      filled_at: dval('filled_at'),
      cycling_start_date: dval('cycling_start_date'),
      cycling_end_date: dval('cycling_end_date'),
      notes: val('editAqNotes') || null
    };
  }

  function aquariumPhotoHtml(aq, isEdit) {
    if (!isEdit) return '';
    const currentPhoto = photoUrl(aq) || aq?.__cover_url || '';
    return `<div class="aquarium-photo-block">
      <h3>Foto del acuario</h3>
      ${currentPhoto ? `<img class="aquarium-form-photo" src="${esc(currentPhoto)}" alt="Foto actual de ${esc(aq?.name || 'acuario')}">` : '<p class="small">Este acuario todavía no tiene una foto.</p>'}
      <label for="editAqPhoto">Añadir o cambiar foto</label>
      <input id="editAqPhoto" type="file" accept="image/*" capture="environment">
      <p class="small">La imagen seleccionada se guardará al pulsar Guardar cambios.</p>
    </div>`;
  }

  function formSection(title, body, open = false) {
    return `<details class="aquarium-form-section" ${open ? 'open' : ''}><summary>${esc(title)}</summary><div class="aquarium-form-section-body">${body}</div></details>`;
  }

  function aquariumFormHtml(aq, mode) {
    const isEdit = mode === 'edit';
    const type = aq?.aquarium_type || aq?.type || 'reef';
    const general = `<label for="editAqName">Nombre</label><input id="editAqName" placeholder="Nombre del acuario" value="${esc(aq?.name || '')}">
      <label for="editAqType">Tipo</label><select id="editAqType">${selectTypeOptions(type)}</select>
      <label for="editAqLocation">Ubicación</label><input id="editAqLocation" placeholder="Ubicación" value="${esc(aq?.location || '')}">
      ${aquariumPhotoHtml(aq, isEdit)}
      <div class="aquarium-date-grid">${fdate('mounted_at','Fecha de montaje',aq?.mounted_at)}${fdate('filled_at','Fecha de llenado',aq?.filled_at)}${fdate('cycling_start_date','Inicio de ciclado',aq?.cycling_start_date)}${fdate('cycling_end_date','Fin de ciclado',aq?.cycling_end_date)}</div>`;
    const tank = `<div class="aquarium-fields-grid">${fnum('tank_length_cm','Largo urna (cm)',aq?.tank_length_cm)}${fnum('tank_width_cm','Ancho urna (cm)',aq?.tank_width_cm)}${fnum('tank_height_cm','Alto urna (cm)',aq?.tank_height_cm)}${fnum('display_water_height_cm','Altura real de agua sobre sustrato (cm)',aq?.display_water_height_cm)}${fnum('rock_kg','Roca (kg)',aq?.rock_kg)}${fnum('sand_kg','Arena (kg)',aq?.sand_kg)}</div><p class="small">Roca y arena se guardan como datos del acuario, pero no se descuentan del volumen. Los litros se calculan directamente con largo × ancho × altura real de agua.</p>`;
    const support = `${fcheck('has_sump','Tiene sump',!!aq?.has_sump)}<div class="aquarium-fields-grid">${fnum('sump_length_cm','Largo sump (cm)',aq?.sump_length_cm)}${fnum('sump_width_cm','Ancho sump (cm)',aq?.sump_width_cm)}${fnum('sump_height_cm','Alto sump (cm)',aq?.sump_height_cm)}${fnum('sump_water_height_cm','Altura real de agua sump (cm)',aq?.sump_water_height_cm)}</div>${fcheck('has_refugium','Tiene refugio',!!aq?.has_refugium)}${fnum('refugium_liters','Litros refugio',aq?.refugium_liters)}${fcheck('has_ato_reservoir','Tiene depósito de relleno',!!aq?.has_ato_reservoir)}${fnum('ato_reservoir_liters','Litros depósito relleno',aq?.ato_reservoir_liters)}`;
    const liters = `<div class="aquarium-volume-cards">${calcStat('Brutos urna','calcGross')}${calcStat('Display por altura de agua','calcDisplayNet')}${calcStat('Sump por altura de agua','calcSumpNet')}${calcStat('Sistema para cálculos','calcSystemNet')}</div><p class="small">El sistema se calcula como display + sump conectado. El depósito de relleno no forma parte del volumen circulante.</p>`;
    const notes = `<label for="editAqNotes">Nota</label><textarea id="editAqNotes">${esc(aq?.notes || '')}</textarea>`;
    return `<section class="summary-card"><div><small>AcuarioNexo</small><h2>${isEdit ? 'Editar acuario' : 'Nuevo acuario'}</h2><p>${isEdit ? 'Modificar datos del sistema.' : 'Crear un sistema nuevo.'}</p></div></section>
      <section class="panel aquarium-form">
        <div class="panel-head"><h2>${isEdit ? 'Editar acuario' : 'Nuevo acuario'}</h2><button onclick="${isEdit ? 'openAqSection(\'resumen\')' : 'acuariosHome()'}">Cancelar</button></div>
        ${formSection('Datos generales', general, true)}
        ${formSection('Medidas de la urna', tank)}
        ${formSection('Sump, refugio y relleno', support)}
        ${formSection('Litros calculados', liters, true)}
        ${formSection('Notas', notes)}
        <div class="aquarium-form-savebar"><button class="primary" onclick="${isEdit ? 'guardarEdicionAcuario()' : 'guardarNuevoAcuario()'}">${isEdit ? 'Guardar cambios' : 'Crear acuario'}</button><div id="editAqStatus"></div></div>
      </section>`;
  }

  window.formA = function () {
    if (!state.user) return login();
    render(aquariumFormHtml(null, 'new'), 'acuarios');
    setTimeout(function () { if (window.calcAqVolumes) window.calcAqVolumes(); }, 0);
  };

  window.editarAcuario = function () {
    if (!state.user) return login();
    const aq = window.ANX.currentAquarium();
    if (!aq) return listaAcuarios();
    render(aquariumFormHtml(aq, 'edit'), 'acuarios');
    setTimeout(function () { if (window.calcAqVolumes) window.calcAqVolumes(); }, 0);
  };

  window.calcAqVolumes = function () {
    const c = calcVolumesFromInputs();
    const set = (id, value) => { if (byId(id)) byId(id).textContent = `${value.toFixed(1)} L`; };
    set('calcGross', c.gross); set('calcDisplayNet', c.displayNet); set('calcSumpNet', c.sumpNet); set('calcSystemNet', c.systemNet);
  };

  window.ANX.AquariumsForm = {
    selectTypeOptions,
    dateValue,
    fnum,
    fdate,
    fcheck,
    nval,
    dval,
    lDisplay,
    calcVolumesFromInputs,
    aquariumPayload,
    aquariumPhotoHtml,
    formSection,
    aquariumFormHtml
  };
})();