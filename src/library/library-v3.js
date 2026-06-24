/* AcuarioNexo · Biblioteca V3 */
(function () {
  const { supabase, state, esc, byId, val, msg, token, isCurrent, render } = window.ANX;
  const Schema = window.ANX.LibrarySchema;
  if (!Schema) throw new Error('LibrarySchema no cargado.');

  const types = [
    ['pez_marino', 'Pez marino'], ['pez_dulce', 'Pez de agua dulce'], ['coral', 'Coral'],
    ['invertebrado', 'Invertebrado'], ['planta', 'Planta'], ['microfauna', 'Microfauna'],
    ['producto', 'Producto'], ['medicamento', 'Medicamento'], ['sal', 'Sal'], ['aditivo', 'Aditivo'],
    ['alimento', 'Alimento'], ['test', 'Test'], ['equipamiento', 'Equipamiento']
  ];
  const labels = Object.fromEntries(types);
  const statusLabels = { identified: 'Identificada', draft: 'Borrador', review: 'Revisar', validated: 'Validada', published: 'Publicada' };
  const fieldLabels = {
    family: 'Familia', order_name: 'Orden', class_name: 'Clase', distribution: 'Distribución', adult_size_cm: 'Tamaño adulto (cm)', minimum_tank_liters: 'Acuario mínimo (L)',
    temperature_min: 'Temperatura mínima (°C)', temperature_max: 'Temperatura máxima (°C)', ph_min: 'pH mínimo', ph_max: 'pH máximo', salinity_min: 'Salinidad mínima', salinity_max: 'Salinidad máxima',
    diet: 'Alimentación', behavior: 'Comportamiento', compatibility: 'Compatibilidad', reef_safe: 'Reef safe', care_level: 'Dificultad', lighting: 'Iluminación', flow: 'Flujo', placement: 'Ubicación', growth_rate: 'Crecimiento', aggressiveness: 'Agresividad', molting: 'Muda', feeding: 'Alimentación', co2: 'CO2', culture_method: 'Método de cultivo', harvest: 'Cosecha', use_in_aquarium: 'Uso en acuario', manufacturer: 'Fabricante', product_code: 'Código de producto', composition: 'Composición', dose: 'Dosis', use: 'Uso', monitoring: 'Seguimiento', risks: 'Riesgos', active_ingredient: 'Principio activo', treatment_days: 'Días de tratamiento', remove_equipment: 'Equipos que retirar', parameter: 'Parámetro', range: 'Rango', resolution: 'Resolución', interpretation: 'Interpretación', power: 'Potencia', volume: 'Volumen recomendado', maintenance: 'Mantenimiento'
  };

  function typeName(type) { return labels[type] || type || 'Ficha'; }
  function statusName(status) { return statusLabels[status] || status || 'Borrador'; }
  function rowById(id) { return (state.libraryRows || []).find(row => String(row.id) === String(id)); }
  async function functionMessage(error) {
    const fallback = error?.message || 'Error en el motor de Biblioteca.';
    try { return await error?.context?.json?.().then(body => body?.message || body?.error || fallback); } catch (_) { return fallback; }
  }
  function usable(row) { return ['validated', 'published'].includes(row?.status); }

  async function loadRows() {
    const { data, error } = await supabase.from('library_entries').select('*').order('updated_at', { ascending: false }).limit(200);
    if (error) throw error;
    state.libraryRows = data || [];
  }

  function sourceCards(sources) {
    const normalized = Schema.normalizeSources(sources);
    if (!normalized.length) return msg('Sin fuentes estructuradas.', 'error');
    return `<div class="library-source-list">${normalized.map(source => `<a class="item" href="${esc(source.url)}" target="_blank" rel="noopener"><b>${esc(source.name)}</b><small>${esc(source.source_type || 'Fuente')} · ${esc(source.used_for || 'Identificación y contraste')}</small></a>`).join('')}</div>`;
  }

  function card(row) {
    const cover = row.cover_url || row.photo_url || '';
    const audit = row.validation_result || {};
    return `<button class="library-card library-cover-card" onclick="verFicha('${esc(row.id)}')">${cover ? `<img class="library-card-cover" src="${esc(cover)}" alt="${esc(row.title)}" loading="lazy">` : `<div class="library-card-cover library-no-photo">${esc(typeName(row.entry_type).slice(0, 1))}</div>`}<div class="library-card-body"><h3>${esc(row.title || 'Ficha')}</h3><p class="scientific">${esc(row.scientific_name || typeName(row.entry_type))}</p><p>${esc(row.summary || '')}</p><small>${esc(statusName(row.status))} · ${Schema.normalizeSources(row.sources).length} fuentes${audit.approved ? ' · auditada' : ''}</small></div></button>`;
  }

  function renderLibrary() {
    const q = val('librarySearch').toLowerCase();
    const filter = state.libraryFilter || 'all';
    const rows = (state.libraryRows || []).filter(row => (filter === 'all' || row.entry_type === filter) && (!q || [row.title, row.scientific_name, row.summary, row.status].join(' ').toLowerCase().includes(q))));
    render(`<section class="summary-card"><div><small>Base de conocimiento verificable</small><h2>Biblioteca</h2><p>${rows.length} fichas</p></div></section><section class="panel"><div class="panel-head"><h2>Conocimiento</h2><button class="primary" onclick="nuevaFichaV3()">Identificar nueva entrada</button></div><div class="library-search"><input id="librarySearch" placeholder="Buscar especie o producto" value="${esc(q)}" oninput="renderBibliotecaActual()"></div><div class="library-modules"><button class="${filter === 'all' ? 'active' : ''}" onclick="filtrarBiblioteca('all')"><b>Todo</b><span>Fichas</span><small>Todos los estados</small></button>${types.map(([key, label]) => `<button class="${filter === key ? 'active' : ''}" onclick="filtrarBiblioteca('${key}')"><b>${esc(label)}</b><span>${esc(key)}</span><small>Contrato V3</small></button>`).join('')}</div><div class="library-grid">${rows.map(card).join('') || msg('No hay fichas para este filtro.', 'notice')}</div></section>`, 'biblioteca');
  }

  window.biblioteca = async function () {
    if (!state.user) return login();
    const current = token();
    render(`<section class="panel">${msg('Cargando Biblioteca...')}</section>`, 'biblioteca');
    try { await loadRows(); if (isCurrent(current)) renderLibrary(); }
    catch (error) { if (isCurrent(current)) render(`<section class="panel">${msg(error.message, 'error')}</section>`, 'biblioteca'); }
  };
  window.renderBibliotecaActual = renderLibrary;
  window.filtrarBiblioteca = function (type) { state.libraryFilter = type || 'all'; renderLibrary(); };

  window.nuevaFichaV3 = function () {
    state.identifyResult = null;
    render(`<section class="panel library-detail"><button onclick="biblioteca()">Volver</button><h2>Identificar</h2><div class="notice">Sin identificación confirmada no se crea borrador, portada ni ficha.</div><div class="form-grid"><div><label>Tipo</label><select id="identifyType">${types.map(([key, label]) => `<option value="${key}">${esc(label)}</option>`).join('')}</select></div><div><label>Nombre común o producto</label><input id="identifyCommonName"></div></div><div class="form-grid"><div><label>Nombre científico</label><input id="identifyScientificName"></div><div><label>Marca</label><input id="identifyBrand"></div></div><label>Foto de referencia (URL opcional)</label><input id="identifyPhotoUrl" placeholder="https://..."><label>Datos observados</label><textarea id="identifyNotes" placeholder="Rasgos visibles, variante, código, texto de etiqueta o procedencia"></textarea><button class="primary" onclick="buscarIdentify()">Identificar</button><div id="identifyBox"></div></section>`, 'biblioteca');
  };
  window.mostrarIdentify = window.nuevaFichaV3;

  window.buscarIdentify = async function () {
    const box = byId('identifyBox');
    try {
      if (box) box.innerHTML = msg('Contrastando identidad y fuentes...', 'notice');
      const { data, error } = await supabase.functions.invoke('library-identify', { body: { common_name: val('identifyCommonName'), scientific_name: val('identifyScientificName'), brand: val('identifyBrand'), entry_type: val('identifyType'), photo_url: val('identifyPhotoUrl'), notes: val('identifyNotes') } });
      if (error) throw new Error(await functionMessage(error));
      const result = data?.data || {};
      state.identifyResult = result;
      if (!result.identity_confirmed) { if (box) box.innerHTML = `<div class="error"><b>Identificación insuficiente.</b><br>No se puede crear ficha.</div>${sourceCards(result.sources)}`; return; }
      if (box) box.innerHTML = `<div class="success"><b>Identidad confirmada</b><br>${esc(result.title)}${result.scientific_name ? `<br><i>${esc(result.scientific_name)}</i>` : ''}<br>Confianza: ${esc(result.confidence)}</div>${sourceCards(result.sources)}<button class="primary" onclick="crearBorradorV3()">Crear borrador verificado</button>`;
    } catch (error) { if (box) box.innerHTML = msg(error.message, 'error'); }
  };

  window.crearBorradorV3 = async function () {
    const box = byId('identifyBox');
    try {
      const identity = state.identifyResult;
      if (!identity?.identity_confirmed) throw new Error('Identificación insuficiente. No se puede crear ficha.');
      if (box) box.innerHTML = msg('Investigando y creando borrador...', 'notice');
      const { data, error } = await supabase.functions.invoke('library-generate-draft', { body: { identify_result: identity, photo_url: val('identifyPhotoUrl') } });
      if (error) throw new Error(await functionMessage(error));
      await loadRows();
      window.formFicha(data.data.id);
    } catch (error) { if (box) box.innerHTML = msg(error.message, 'error'); }
  };

  function inputFor(field, value) {
    const label = fieldLabels[field] || field;
    const numeric = /(_cm|_liters|_min|_max|power|flow|volume|treatment_days)$/.test(field);
    const long = ['diet','behavior','compatibility','lighting','placement','feeding','culture_method','harvest','use_in_aquarium','composition','dose','use','monitoring','risks','interpretation','maintenance','remove_equipment'].includes(field);
    if (field === 'reef_safe') return `<label>${esc(label)}</label><select id="libData_${field}">${Schema.REEF_SAFE.map(item => `<option ${value === item ? 'selected' : ''}>${esc(item)}</option>`).join('')}</select>`;
    if (long) return `<label>${esc(label)}</label><textarea id="libData_${field}">${esc(value ?? '')}</textarea>`;
    return `<label>${esc(label)}</label><input id="libData_${field}" ${numeric ? 'inputmode="decimal"' : ''} value="${esc(value ?? '')}">`;
  }
  function editableFields(row) { return (Schema.CONTRACTS[row.entry_type] || []).filter(field => !['title','scientific_name','sources'].includes(field)); }

  window.formFicha = function (id) {
    const row = rowById(id);
    if (!row) return window.nuevaFichaV3();
    const fields = editableFields(row);
    const audit = row.validation_result || {};
    render(`<section class="panel library-detail"><button onclick="verFicha('${esc(row.id)}')">Volver</button><div class="panel-head"><div><small>${esc(typeName(row.entry_type))}</small><h2>Editar ficha</h2></div><b>${esc(statusName(row.status))}</b></div><label>Nombre</label><input id="libTitle" value="${esc(row.title || '')}"><label>Nombre científico</label><input id="libScientific" value="${esc(row.scientific_name || '')}"><label>Resumen</label><textarea id="libSummary">${esc(row.summary || '')}</textarea><div class="library-image-grid"><section class="library-image-panel"><h3>Portada</h3><input id="libCover" value="${esc(row.cover_url || '')}" placeholder="URL"></section><section class="library-image-panel"><h3>Foto de ficha</h3><input id="libPhoto" value="${esc(row.photo_url || '')}" placeholder="URL"></section></div><h3>Contrato ${esc(typeName(row.entry_type))}</h3>${fields.map(field => inputFor(field, row.data?.[field])).join('')}<label>Etiquetas</label><input id="libTags" value="${esc((row.tags || []).join(', '))}"><h3>Fuentes</h3>${sourceCards(row.sources)}${audit.errors?.length ? `<div class="error"><b>Errores</b><ul>${audit.errors.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>` : ''}${audit.warnings?.length ? `<div class="notice"><b>Revisión</b><ul>${audit.warnings.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>` : ''}<div class="quick-actions"><button onclick="guardarFicha('${esc(row.id)}')">Guardar cambios</button><button class="primary" onclick="auditarFicha('${esc(row.id)}')">Auditar ficha</button>${row.status === 'validated' ? `<button class="primary" onclick="publicarFicha('${esc(row.id)}')">Publicar</button>` : ''}</div><div id="x"></div></section>`, 'biblioteca');
  };

  function readEdit(row) {
    const data = { ...(row.data || {}) };
    editableFields(row).forEach(field => { const raw = val(`libData_${field}`); data[field] = /(_cm|_liters|_min|_max|power|flow|volume|treatment_days)$/.test(field) && raw !== '' ? Number(raw.replace(',', '.')) : raw; });
    return { title: val('libTitle'), scientific_name: val('libScientific') || null, summary: val('libSummary') || null, cover_url: val('libCover') || null, photo_url: val('libPhoto') || null, tags: val('libTags').split(',').map(item => item.trim()).filter(Boolean), data, sections: { ...(row.sections || {}), summary: val('libSummary') || '' }, updated_at: new Date().toISOString() };
  }

  async function saveEntry(id) {
    const row = rowById(id);
    if (!row) throw new Error('Ficha no encontrada.');
    const { error } = await supabase.from('library_entries').update(readEdit(row)).eq('id', id);
    if (error) throw error;
    await loadRows();
    return rowById(id);
  }

  window.guardarFicha = async function (id) { const box = byId('x'); try { await saveEntry(id); if (box) box.innerHTML = msg('Cambios guardados. La publicación sigue bloqueada hasta auditar.', 'success'); } catch (error) { if (box) box.innerHTML = msg(error.message, 'error'); } };
  window.auditarFicha = async function (id) {
    const box = byId('x');
    try {
      if (box) box.innerHTML = msg('Guardando y auditando contrato, taxonomía y fuentes...', 'notice');
      await saveEntry(id);
      const { data, error } = await supabase.functions.invoke('library-audit-card', { body: { entry_id: id } });
      if (error) throw new Error(await functionMessage(error));
      await loadRows();
      if (box) box.innerHTML = msg(data.result, data.result === 'APROBADA' ? 'success' : 'error');
      setTimeout(() => window.formFicha(id), 500);
    } catch (error) { if (box) box.innerHTML = msg(error.message, 'error'); }
  };
  window.publicarFicha = async function (id) {
    const box = byId('x');
    try {
      const row = rowById(id);
      if (row?.status !== 'validated') throw new Error('Solo se puede publicar una ficha validada.');
      if (box) box.innerHTML = msg('Publicando ficha validada...', 'notice');
      const { error } = await supabase.functions.invoke('library-publish', { body: { entry_id: id } });
      if (error) throw new Error(await functionMessage(error));
      await loadRows();
      window.verFicha(id);
    } catch (error) { if (box) box.innerHTML = msg(error.message, 'error'); }
  };

  window.verFicha = function (id) {
    const row = rowById(id);
    if (!row) return biblioteca();
    const data = row.data || {};
    const fields = editableFields(row).filter(field => data[field] !== '' && data[field] != null);
    const audit = row.validation_result || {};
    const mainPhoto = row.photo_url || row.cover_url || '';
    render(`<section class="panel library-detail"><button onclick="biblioteca()">Volver</button>${mainPhoto ? `<img class="library-detail-photo" src="${esc(mainPhoto)}" alt="${esc(row.title)}">` : ''}<small>${esc(typeName(row.entry_type))} · ${esc(statusName(row.status))}</small><h2>${esc(row.title)}</h2>${row.scientific_name ? `<p class="scientific">${esc(row.scientific_name)}</p>` : ''}${row.summary ? `<section class="library-detail-section"><h3>Resumen</h3><p>${esc(row.summary)}</p></section>` : ''}${fields.map(field => `<section class="library-detail-section"><h3>${esc(fieldLabels[field] || field)}</h3><p>${esc(String(data[field])).replace(/\n/g, '<br>')}</p></section>`).join('')}<section class="library-detail-section"><h3>Fuentes verificables</h3>${sourceCards(row.sources)}</section><section class="library-detail-section"><h3>Auditoría</h3><p>${audit.approved ? 'APROBADA' : 'REQUIERE REVISIÓN'} · ${esc(String(audit.source_count ?? Schema.normalizeSources(row.sources).length))} fuentes</p></section><div class="quick-actions"><button onclick="formFicha('${esc(row.id)}')">Editar</button>${usable(row) ? `<button class="primary" onclick="pasarFichaAInventario('${esc(row.id)}')">Pasar a inventario</button>` : '<button disabled>Inventario bloqueado</button>'}${row.status === 'validated' ? `<button class="primary" onclick="publicarFicha('${esc(row.id)}')">Publicar</button>` : ''}</div><div id="x"></div></section>`, 'biblioteca');
  };

  const originalPass = window.pasarFichaAInventario;
  const originalImportForm = window.formImportarFichaInventario;
  const originalSaveImport = window.guardarImportacionFichaInventario;
  window.pasarFichaAInventario = async function (id) { const row = rowById(id); if (!usable(row)) { const box = byId('x'); if (box) box.innerHTML = msg('Solo las fichas validadas o publicadas pueden pasar a inventario.', 'error'); return; } return originalPass ? originalPass.apply(this, arguments) : null; };
  window.formImportarFichaInventario = function (id) { const row = rowById(id); if (!usable(row)) { const box = byId('x'); if (box) box.innerHTML = msg('Esta ficha no está validada y no puede importarse.', 'error'); else alert('Esta ficha no está validada y no puede importarse.'); return; } return originalImportForm ? originalImportForm.apply(this, arguments) : null; };
  window.guardarImportacionFichaInventario = async function (id) { const row = rowById(id); if (!usable(row)) throw new Error('Solo una ficha validada o publicada puede pasar a inventario.'); return originalSaveImport ? originalSaveImport.apply(this, arguments) : null; };
})();
