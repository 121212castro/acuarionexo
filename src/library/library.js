/* AcuarioNexo · Biblioteca oficial */
(function () {
  const { supabase, state, esc, byId, val, msg, token, isCurrent, render } = window.ANX;

  const types = [
    ['pez_marino', 'Pez marino'], ['pez_dulce', 'Pez agua dulce'], ['coral', 'Coral'],
    ['invertebrado', 'Invertebrado'], ['planta', 'Planta / alga'], ['medicamento', 'Medicamento'],
    ['sal', 'Sal'], ['aditivo', 'Aditivo'], ['alimento', 'Alimento'], ['equipamiento', 'Equipo'], ['test', 'Test'],
    ['microfauna', 'Microfauna'], ['general', 'General']
  ];
  const labels = Object.fromEntries(types);
  const sectionLabels = {
    summary: 'Resumen', identity: 'Identificacion', habitat: 'Habitat', aquarium: 'Acuario recomendado',
    parameters: 'Parametros', behavior: 'Comportamiento', feeding: 'Alimentacion', compatibility: 'Compatibilidad',
    reef_safe: 'Reef safe', health: 'Salud', purchase: 'Antes de comprar', mistakes: 'Errores frecuentes',
    breeding: 'Reproduccion', lighting: 'Iluminacion', flow: 'Flujo', placement: 'Ubicacion', co2: 'CO2 / nutrientes',
    maintenance: 'Mantenimiento', uses: 'Usos', dose: 'Dosis', remove: 'Retirar durante tratamiento', risks: 'Riesgos',
    aftercare: 'Seguimiento', monitoring: 'Mediciones / seguimiento', inventory_logic: 'Logica AcuarioNexo', mixing: 'Preparacion', use: 'Uso', nutrition: 'Composicion',
    acuarionexo_plan: 'Plan AcuarioNexo', specs: 'Especificaciones', installation: 'Instalacion', reading: 'Lectura',
    range: 'Rangos', storage: 'Conservacion', sources: 'Fuentes'
  };
  const sectionsByType = {
    pez_marino: ['summary','identity','habitat','aquarium','parameters','behavior','feeding','compatibility','reef_safe','health','purchase','mistakes','sources'],
    pez_dulce: ['summary','identity','habitat','aquarium','parameters','behavior','feeding','compatibility','breeding','health','purchase','mistakes','sources'],
    coral: ['summary','identity','habitat','aquarium','parameters','lighting','flow','placement','feeding','compatibility','health','purchase','mistakes','sources'],
    invertebrado: ['summary','identity','habitat','aquarium','parameters','behavior','feeding','compatibility','reef_safe','health','purchase','mistakes','sources'],
    planta: ['summary','identity','habitat','aquarium','parameters','lighting','co2','maintenance','compatibility','health','sources'],
    medicamento: ['summary','identity','uses','dose','monitoring','compatibility','remove','risks','aftercare','inventory_logic','sources'],
    sal: ['summary','identity','parameters','mixing','use','monitoring','risks','sources'],
    aditivo: ['summary','identity','composition','dose','use','monitoring','compatibility','risks','storage','sources'],
    alimento: ['summary','identity','nutrition','use','monitoring','compatibility','risks','acuarionexo_plan','sources'],
    equipamiento: ['summary','identity','specs','installation','maintenance','monitoring','compatibility','risks','sources'],
    test: ['summary','identity','parameters','reading','range','use','monitoring','risks','storage','sources'],
    microfauna: ['summary','identity','culture','parameters','feeding','maintenance','harvest','risks','sources'],
    general: ['summary','identity','aquarium','parameters','compatibility','risks','sources']
  };
  const productTypes = new Set(['medicamento', 'sal', 'aditivo', 'alimento', 'equipamiento', 'test']);
  const biologicalTypes = new Set(['pez_marino', 'pez_dulce', 'coral', 'invertebrado', 'planta', 'microfauna']);
  const sectionsFor = type => sectionsByType[type] || sectionsByType.general;
  const typeName = type => labels[type] || 'Ficha';
  const tagsText = row => Array.isArray(row?.tags) ? row.tags.join(', ') : '';
  const tagsFromText = text => String(text || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 20);
  const sourceFieldDefaults = {
    manufacturer: '',
    manufacturer_url: '',
    datasheet_url: '',
    product_code: '',
    label_text: '',
    source_notes: ''
  };

  function parseSourceNotes(row = {}) {
    if (!row.source_notes) return { ...sourceFieldDefaults };
    try {
      return { ...sourceFieldDefaults, ...JSON.parse(row.source_notes) };
    } catch (_) {
      return { ...sourceFieldDefaults, source_notes: row.source_notes || '' };
    }
  }

  function sourceContextFromForm() {
    return {
      manufacturer: val('libManufacturer'),
      manufacturer_url: val('libManufacturerUrl'),
      datasheet_url: val('libDatasheetUrl'),
      product_code: val('libProductCode'),
      label_text: val('libLabelText'),
      source_notes: val('libSourceNotes')
    };
  }

  function sourceNotesPayload() {
    const source = sourceContextFromForm();
    const hasValue = Object.values(source).some(value => String(value || '').trim());
    return hasValue ? JSON.stringify(source) : null;
  }

  async function loadRows() {
    const { data, error } = await supabase.from('library_entries').select('*').order('created_at', { ascending: false }).limit(80);
    if (error) throw error;
    state.libraryRows = data || [];
  }

  function filteredRows() {
    const q = val('librarySearch').toLowerCase();
    const filter = state.libraryFilter || 'all';
    return (state.libraryRows || []).filter(row => {
      if (filter !== 'all' && row.entry_type !== filter) return false;
      if (!q) return true;
      return [row.title, row.scientific_name, row.summary, typeName(row.entry_type), tagsText(row)].join(' ').toLowerCase().includes(q);
    });
  }

  function imageUrlFromPhoto(row) {
    return row?.image_url || row?.photo_url || row?.public_url || row?.url || row?.cover_url || '';
  }

  function imagePreviewHtml(fieldId, title, url) {
    const safeUrl = String(url || '').trim();
    return safeUrl
      ? `<img src="${esc(safeUrl)}" alt="${esc(title)}" loading="lazy" onerror="imagenFichaNoCarga('${esc(fieldId)}')">`
      : '<span>Sin imagen</span>';
  }

  function updateImagePreview(fieldId, title, url) {
    const preview = byId(`${fieldId}Preview`);
    if (!preview) return;
    const safeUrl = String(url || '').trim();
    preview.classList.toggle('empty', !safeUrl);
    preview.innerHTML = imagePreviewHtml(fieldId, title || preview.dataset.title || 'Imagen', safeUrl);
  }

  function setImageFieldValue(fieldId, url) {
    const input = byId(fieldId);
    if (input) input.value = url || '';
    const title = input?.dataset?.title || 'Imagen';
    updateImagePreview(fieldId, title, url || '');
  }

  function isPlaceholderText(text) {
    return /borrador pendiente|pendiente de validar|completar este apartado|datos reales antes de publicar/i.test(String(text || ''));
  }

  function sectionText(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value.map(sectionText).filter(Boolean).join('\n');
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([key, val]) => {
          const text = sectionText(val);
          return text ? `${key}: ${text}` : '';
        })
        .filter(Boolean)
        .join('\n');
    }
    return String(value);
  }

  function aiGenerationNotice(generated, warning) {
    const warnings = Array.isArray(generated?.warnings) ? generated.warnings.filter(Boolean) : [];
    const candidates = Array.isArray(generated?.candidates) ? generated.candidates.filter(item => item?.name || item?.scientific_name) : [];
    const candidateHtml = candidates.length ? `<ul>${candidates.map(item => `<li><b>${esc(item.name || item.scientific_name)}</b>${item.scientific_name && item.name ? ` · ${esc(item.scientific_name)}` : ''}${item.confidence ? ` · ${esc(item.confidence)}` : ''}${item.reason ? `<br>${esc(item.reason)}` : ''}</li>`).join('')}</ul>` : '';
    const warningsHtml = warnings.length ? `<ul>${warnings.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : '';
    const confidence = generated?.confidence ? `<p><b>Confianza:</b> ${esc(generated.confidence)}</p>` : '';
    return [warning ? `<p>${esc(warning)}</p>` : '', confidence, candidateHtml, warningsHtml].filter(Boolean).join('');
  }

  async function functionErrorMessage(error) {
    const fallback = error?.message || 'No se pudo generar la ficha con IA real.';
    try {
      const context = error?.context;
      if (context && typeof context.json === 'function') {
        const body = await context.json();
        return body?.message || body?.error || fallback;
      }
    } catch (_) {}
    return fallback;
  }

  function card(row) {
    const cover = row.cover_url || row.photo_url || '';
    return `<button class="library-card library-cover-card" onclick="verFicha('${esc(row.id)}')">
      ${cover ? `<img class="library-card-cover" src="${esc(cover)}" alt="${esc(row.title)}" loading="lazy">` : `<div class="library-card-cover library-no-photo">${esc(typeName(row.entry_type).slice(0, 1))}</div>`}
      <div class="library-card-body"><h3>${esc(row.title || 'Ficha')}</h3><p class="scientific">${esc(row.scientific_name || typeName(row.entry_type))}</p><p>${esc(row.summary || '')}</p><small>${esc(typeName(row.entry_type))} · ${esc(row.status || 'draft')}</small></div>
    </button>`;
  }

  function inventoryScopeForType(type) {
    if (type === 'equipamiento') return 'aquarium';
    if (productTypes.has(type)) return 'general';
    if (['pez_marino', 'pez_dulce', 'coral', 'invertebrado', 'planta', 'microfauna'].includes(type)) return 'aquarium';
    return 'general';
  }

  function inventoryCategoryFor(row) {
    const type = row.entry_type || 'general';
    const map = {
      pez_marino: 'Peces marinos',
      pez_dulce: 'Peces',
      coral: 'Corales',
      invertebrado: 'Invertebrados',
      planta: 'Plantas',
      microfauna: 'Microfauna',
      equipamiento: 'Equipos',
      medicamento: 'Medicamentos',
      sal: 'Sales',
      aditivo: 'Aditivos',
      alimento: 'Alimentos',
      test: 'Tests'
    };
    return map[type] || typeName(type);
  }

  function inventoryBackAction(scope) {
    return scope === 'aquarium' ? "openAqSection('inventario')" : "inventario('general')";
  }

  function importableRowsForScope(scope) {
    return (state.libraryRows || []).filter(row => inventoryScopeForType(row.entry_type) === scope);
  }

  async function loadInventoryAquariums() {
    if (Array.isArray(state.aquariums) && state.aquariums.length) return state.aquariums;
    const { data, error } = await supabase.from('aquariums').select('id,name,aquarium_type,status,created_at').eq('user_id', state.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    state.aquariums = data || [];
    return state.aquariums;
  }

  function aquariumOptionsHtml(selectedId) {
    const list = state.aquariums || [];
    return list.map(aq => `<option value="${esc(aq.id)}" ${String(aq.id) === String(selectedId || '') ? 'selected' : ''}>${esc(aq.name || 'Acuario')} · ${esc(aq.aquarium_type || 'acuario')}</option>`).join('');
  }

  function importMetaFromForm(row, scope) {
    return {
      source: 'library',
      library_id: row.id,
      library_type: row.entry_type || 'general',
      scope,
      purchase_date: val('importPurchaseDate'),
      purchase_place: val('importPurchasePlace'),
      purchase_price: val('importPurchasePrice'),
      batch: val('importBatch'),
      source_title: row.title || '',
      scientific_name: row.scientific_name || '',
      cover_url: row.cover_url || '',
      image_url: row.photo_url || '',
      library_card: {
        id: row.id,
        type: row.entry_type || 'general',
        type_label: typeName(row.entry_type),
        title: row.title || '',
        scientific_name: row.scientific_name || '',
        summary: row.summary || '',
        cover_url: row.cover_url || '',
        photo_url: row.photo_url || '',
        tags: Array.isArray(row.tags) ? row.tags : [],
        status: row.status || '',
        source_notes: row.source_notes || '',
        sections: row.sections || {}
      }
    };
  }

  function inventoryNotesFromImport(row, meta) {
    const userNotes = val('importNotes');
    return [
      `AcuarioNexoMeta:${JSON.stringify(meta)}`,
      `AcuarioNexoLibrary:${row.id}`,
      meta.purchase_date ? `Fecha compra/alta: ${meta.purchase_date}` : '',
      meta.purchase_place ? `Compra/proveedor: ${meta.purchase_place}` : '',
      meta.purchase_price ? `Precio: ${meta.purchase_price}` : '',
      meta.batch ? `Lote/SKU: ${meta.batch}` : '',
      userNotes
    ].filter(Boolean).join('\n');
  }

  window.importarFichaInventario = async function (scope = 'general') {
    if (!state.user) return login();
    const aq = window.ANX.currentAquarium ? window.ANX.currentAquarium() : null;
    const realScope = scope === 'aquarium' ? 'aquarium' : 'general';
    const active = realScope === 'aquarium' ? 'acuarios' : 'inventario';
    const head = realScope === 'aquarium' && window.ANX.aqHeader ? window.ANX.aqHeader('inventario') : '';
    render(head + `<section class="panel">${msg('Cargando fichas disponibles...')}</section>`, active);
    try {
      await loadRows();
      if (realScope === 'aquarium') await loadInventoryAquariums();
      const rows = importableRowsForScope(realScope);
      render(head + `<section class="panel">
        <button onclick="${inventoryBackAction(realScope)}">← Volver</button>
        <div class="panel-head"><h2>${realScope === 'aquarium' ? 'Añadir desde Biblioteca' : 'Añadir producto desde Biblioteca'}</h2></div>
        <p class="small">${realScope === 'aquarium' ? 'Elige una ficha de animal, coral, microfauna o equipo y crea su registro real en este acuario.' : 'Elige una ficha de producto y crea su registro real compartido.'}</p>
        <div class="library-grid">${rows.map(row => `<button class="library-card library-cover-card" onclick="formImportarFichaInventario('${esc(row.id)}','${realScope}')">
          ${(row.cover_url || row.photo_url) ? `<img class="library-card-cover" src="${esc(row.cover_url || row.photo_url)}" alt="${esc(row.title || 'Ficha')}" loading="lazy">` : `<div class="library-card-cover library-no-photo">${esc(typeName(row.entry_type).slice(0, 1))}</div>`}
          <div class="library-card-body"><h3>${esc(row.title || 'Ficha')}</h3><p class="scientific">${esc(row.scientific_name || typeName(row.entry_type))}</p><small>${esc(typeName(row.entry_type))}</small></div>
        </button>`).join('') || msg('No hay fichas compatibles para este inventario.', 'notice')}</div>
      </section>`, active);
    } catch (e) {
      render(head + `<section class="panel">${msg(e.message, 'error')}</section>`, active);
    }
  };

  window.formImportarFichaInventario = function (id, scope = 'general') {
    const row = (state.libraryRows || []).find(r => r.id === id);
    if (!row) return importarFichaInventario(scope);
    const realScope = scope === 'aquarium' ? 'aquarium' : inventoryScopeForType(row.entry_type);
    const aq = window.ANX.currentAquarium ? window.ANX.currentAquarium() : null;
    const aquariums = state.aquariums || [];
    const selectedAqId = aq?.id || aquariums[0]?.id || '';
    const active = realScope === 'aquarium' ? 'acuarios' : 'inventario';
    const head = realScope === 'aquarium' && window.ANX.aqHeader ? window.ANX.aqHeader('inventario') : '';
    const isProduct = productTypes.has(row.entry_type) && row.entry_type !== 'equipamiento';
    const unit = isProduct ? 'unidad' : 'ejemplar';
    render(head + `<section class="panel inventory-import-form">
      <button onclick="importarFichaInventario('${realScope}')">← Volver</button>
      <small>${esc(typeName(row.entry_type))}</small>
      <h2>${esc(row.title || row.scientific_name || 'Ficha')}</h2>
      ${row.scientific_name ? `<p class="scientific">${esc(row.scientific_name)}</p>` : ''}
      ${realScope === 'aquarium' ? `<label>Acuario destino</label><select id="importAquariumId">${aquariumOptionsHtml(selectedAqId)}</select>` : ''}
      <label>Cantidad</label><input id="importQty" type="number" step="0.1" value="1">
      <label>Unidad</label><input id="importUnit" value="${esc(unit)}" placeholder="ejemplar, bote, kg, ml, unidad...">
      <label>Fecha compra / alta</label><input id="importPurchaseDate" type="date">
      <label>Dónde se compra / procedencia</label><input id="importPurchasePlace" placeholder="Tienda, criador, proveedor, web...">
      <label>Precio</label><input id="importPurchasePrice" inputmode="decimal" placeholder="Ej. 24.90">
      ${isProduct ? '<label>Caducidad</label><input id="importExpiry" type="date">' : ''}
      <label>Lote / SKU / referencia</label><input id="importBatch" placeholder="Opcional">
      <label>Notas de este registro</label><textarea id="importNotes" placeholder="Aclimatacion, observaciones, dosificacion real, estado al llegar..."></textarea>
      <button class="primary" onclick="guardarImportacionFichaInventario('${esc(row.id)}','${realScope}')">Guardar en inventario</button>
      <div id="x"></div>
    </section>`, active);
  };

  window.guardarImportacionFichaInventario = async function (id, scope = 'general') {
    try {
      const row = (state.libraryRows || []).find(r => r.id === id);
      if (!row) throw new Error('No encuentro la ficha cargada.');
      const realScope = scope === 'aquarium' ? 'aquarium' : inventoryScopeForType(row.entry_type);
      const aq = window.ANX.currentAquarium ? window.ANX.currentAquarium() : null;
      const targetAquariumId = realScope === 'aquarium' ? (val('importAquariumId') || aq?.id || '') : '';
      if (realScope === 'aquarium' && !targetAquariumId) throw new Error('Elige el acuario destino.');
      const meta = importMetaFromForm(row, realScope);
      const targetAq = (state.aquariums || []).find(item => String(item.id) === String(targetAquariumId));
      if (targetAq) {
        meta.aquarium_id = targetAq.id;
        meta.aquarium_name = targetAq.name || '';
      }
      const payload = {
        user_id: state.user.id,
        aquarium_id: realScope === 'aquarium' ? targetAquariumId : null,
        name: row.title || row.scientific_name || 'Ficha',
        category: inventoryCategoryFor(row),
        quantity: Number(val('importQty')) || 1,
        unit: val('importUnit') || 'unidad',
        expiry_date: val('importExpiry') || null,
        photo_url: row.photo_url || row.cover_url || null,
        notes: inventoryNotesFromImport(row, meta),
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('inventory_items').insert(payload);
      if (error) throw error;
      if (realScope === 'aquarium' && aq && String(aq.id) === String(targetAquariumId)) inventario('aquarium');
      else biblioteca();
    } catch (e) {
      const box = byId('x') || byId('aiBox');
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  window.pasarFichaAInventario = async function (id) {
    const row = (state.libraryRows || []).find(r => r.id === id);
    if (!row) return biblioteca();
    if (inventoryScopeForType(row.entry_type) === 'aquarium') {
      try { await loadInventoryAquariums(); }
      catch (e) { const box = byId('x') || byId('aiBox'); if (box) box.innerHTML = msg(e.message, 'error'); return; }
    }
    formImportarFichaInventario(id, inventoryScopeForType(row.entry_type));
  };

  function modules() {
    const all = `<button class="${state.libraryFilter === 'all' ? 'active' : ''}" onclick="filtrarBiblioteca('all')"><b>Todo</b><span>Fichas</span><small>Almacen</small></button>`;
    return `<div class="library-modules">${all}${types.map(([key, label]) => `<button class="${state.libraryFilter === key ? 'active' : ''}" onclick="filtrarBiblioteca('${key}')"><b>${esc(label)}</b><span>${esc(key)}</span><small>Crear y validar</small></button>`).join('')}</div>`;
  }

  function renderLibrary() {
    const rows = filteredRows();
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Biblioteca</h2><p>${rows.length} fichas visibles</p></div></section>
      <section class="panel"><div class="panel-head"><h2>Almacen de fichas</h2><button class="primary" onclick="formFicha()">Nueva ficha</button></div>
      <div class="library-search"><input id="librarySearch" placeholder="Buscar pez, coral, producto..." oninput="renderBibliotecaActual()"><button onclick="biblioteca()">Buscar</button></div>
      ${modules()}<div class="library-grid">${rows.map(card).join('') || msg('Sin fichas. Crea una ficha o genera un borrador IA.', 'notice')}</div></section>`, 'biblioteca');
  }

  window.biblioteca = async function () {
    if (!state.user) return login();
    const t = token();
    state.libraryFilter = state.libraryFilter || 'all';
    render(`<section class="panel">${msg('Cargando fichas...')}</section>`, 'biblioteca');
    try { await loadRows(); if (isCurrent(t)) renderLibrary(); }
    catch (e) { if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'biblioteca'); }
  };
  window.renderBibliotecaActual = renderLibrary;
  window.filtrarBiblioteca = function (type) { state.libraryFilter = type || 'all'; renderLibrary(); };

  function imageField(title, fieldId, url) {
    return `<section class="library-image-panel"><div class="panel-head"><h3>${esc(title)}</h3><button type="button" onclick="limpiarImagenFicha('${fieldId}')">Borrar</button></div>
      <div id="${fieldId}Preview" data-title="${esc(title)}" class="library-image-preview ${url ? '' : 'empty'}">${imagePreviewHtml(fieldId, title, url)}</div>
      <input id="${fieldId}" data-title="${esc(title)}" value="${esc(url || '')}" placeholder="URL de ${esc(title.toLowerCase())}" oninput="actualizarPreviewImagenFicha('${fieldId}')">
      <div class="image-actions">
        <button type="button" onclick="subirImagenFicha('${fieldId}')">Subir foto</button>
        <button type="button" onclick="elegirImagenExistente('${fieldId}')">Elegir existente</button>
      </div>
    </section>`;
  }

  function sourceFieldsHtml(type, source) {
    if (productTypes.has(type)) {
      return `<h3>Datos verificados del producto</h3>
        <div class="form-grid"><div><label>Fabricante / marca</label><input id="libManufacturer" value="${esc(source.manufacturer || '')}" placeholder="Ocean Nutrition, Tropic Marin..."></div>
        <div><label>Codigo / lote / SKU</label><input id="libProductCode" value="${esc(source.product_code || '')}" placeholder="Referencia, lote, codigo de barras..."></div></div>
        <label>URL fabricante</label><input id="libManufacturerUrl" value="${esc(source.manufacturer_url || '')}" placeholder="https://fabricante.com/producto">
        <label>URL ficha tecnica / prospecto</label><input id="libDatasheetUrl" value="${esc(source.datasheet_url || '')}" placeholder="https://...">
        <label>Texto de etiqueta</label><textarea id="libLabelText" placeholder="Ingredientes, composicion, dosis, instrucciones, advertencias...">${esc(source.label_text || '')}</textarea>
        <label>Notas de fuente</label><textarea id="libSourceNotes" placeholder="De donde sale el dato, dudas, variante exacta, idioma de la etiqueta...">${esc(source.source_notes || '')}</textarea>`;
    }
    if (biologicalTypes.has(type)) {
      return `<h3>Datos verificados de identificacion</h3>
        <label>URL fuente fiable</label><input id="libDatasheetUrl" value="${esc(source.datasheet_url || '')}" placeholder="FishBase, WoRMS, fabricante del cultivo, articulo tecnico...">
        <label>Notas de identificacion</label><textarea id="libSourceNotes" placeholder="Rasgos visibles, procedencia, dudas, sinonimos, variedad, fuente consultada...">${esc(source.source_notes || '')}</textarea>
        <input id="libManufacturer" class="hidden" value="">
        <input id="libProductCode" class="hidden" value="">
        <input id="libManufacturerUrl" class="hidden" value="">
        <textarea id="libLabelText" class="hidden"></textarea>`;
    }
    return `<h3>Datos verificados</h3>
      <label>URL fuente fiable</label><input id="libDatasheetUrl" value="${esc(source.datasheet_url || '')}" placeholder="https://...">
      <label>Notas de fuente</label><textarea id="libSourceNotes" placeholder="De donde sale el dato, dudas, variante exacta...">${esc(source.source_notes || '')}</textarea>
      <input id="libManufacturer" class="hidden" value="">
      <input id="libProductCode" class="hidden" value="">
      <input id="libManufacturerUrl" class="hidden" value="">
      <textarea id="libLabelText" class="hidden"></textarea>`;
  }

  window.formFicha = function (id = '', forcedType = '') {
    const row = id ? (state.libraryRows || []).find(r => r.id === id) || {} : {};
    const selectedType = forcedType || row.entry_type || (state.libraryFilter === 'all' ? 'pez_marino' : state.libraryFilter) || 'pez_marino';
    const source = parseSourceNotes(row);
    render(`<section class="panel library-detail"><button onclick="biblioteca()">Volver</button><h2>${id ? 'Editar ficha' : 'Nueva ficha'}</h2>
      <input id="libImageFile" class="hidden" type="file" accept="image/*" onchange="uploadSelectedFichaImage(event)">
      <input id="libImageTarget" class="hidden" value="">
      <div class="form-grid"><div><label>Tipo</label><select id="libType" onchange="formFicha('${esc(id)}', this.value)">${types.map(([key, label]) => `<option value="${key}" ${selectedType === key ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></div>
      <div><label>Estado</label><select id="libStatus"><option value="draft" ${row.status !== 'published' ? 'selected' : ''}>Borrador</option><option value="published" ${row.status === 'published' ? 'selected' : ''}>Validada/publicada</option></select></div></div>
      <label>Nombre</label><input id="libTitle" value="${esc(row.title || '')}" placeholder="Ej. Amphiprion ocellaris, Sal Pro Reef...">
      <label>Nombre cientifico / marca</label><input id="libScientific" value="${esc(row.scientific_name || '')}">
      <div class="library-image-grid">
        ${imageField('Portada', 'libCover', row.cover_url || '')}
        ${imageField('Foto de ficha', 'libPhoto', row.photo_url || '')}
      </div>
      <div class="image-actions paired">
        <button type="button" onclick="copiarImagenFicha('libCover','libPhoto')">Portada → foto</button>
        <button type="button" onclick="copiarImagenFicha('libPhoto','libCover')">Foto → portada</button>
      </div>
      <div id="imagePickerBox"></div>
      <label>Etiquetas</label><input id="libTags" value="${esc(tagsText(row))}" placeholder="reef, principiante, lps...">
      <label>Notas para IA</label><textarea id="libPrompt" placeholder="Datos que sabes, enfoque, advertencias, producto concreto...">${esc(row.ai_prompt || '')}</textarea>
      ${sourceFieldsHtml(selectedType, source)}
      <button type="button" onclick="mostrarIdentify()">🔍 Identificar organismo</button><div id="aiBox"></div>
      ${sectionsFor(selectedType).map(key => `<label>${esc(sectionLabels[key] || key)}</label><textarea id="libSection_${key}">${esc(sectionText(row.sections?.[key]))}</textarea>`).join('')}
      <button class="primary" onclick="guardarFicha('${esc(id)}')">Guardar ficha</button><div id="x"></div></section>`, 'biblioteca');
  };

  function readForm() {
    const entry_type = val('libType') || 'general';
    const sections = {};
    sectionsFor(entry_type).forEach(key => { sections[key] = val(`libSection_${key}`); });
    const status = val('libStatus') || 'draft';
    return { user_id: state.user.id, title: val('libTitle') || 'Ficha', scientific_name: val('libScientific') || null, entry_type, status, visibility: status === 'published' ? 'public' : 'private', summary: sections.summary || null, cover_url: val('libCover') || null, photo_url: val('libPhoto') || null, sections, tags: tagsFromText(val('libTags')), ai_prompt: val('libPrompt') || null, source_notes: sourceNotesPayload(), validated_at: status === 'published' ? new Date().toISOString() : null, published_at: status === 'published' ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
  }

  window.guardarFicha = async function (id = '') {
    try {
      const row = readForm();
      const result = id ? await supabase.from('library_entries').update(row).eq('id', id) : await supabase.from('library_entries').insert(row);
      if (result.error) throw result.error;
      await biblioteca();
    } catch (e) { if (byId('x')) byId('x').innerHTML = msg(e.message, 'error'); }
  };

  window.limpiarImagenFicha = function (fieldId) {
    setImageFieldValue(fieldId, '');
    formFichaPreviewMessage('Imagen quitada. Guarda la ficha para confirmar.');
  };

  window.copiarImagenFicha = function (fromId, toId) {
    const from = byId(fromId);
    setImageFieldValue(toId, from?.value || '');
    formFichaPreviewMessage('Imagen copiada. Guarda la ficha para confirmar.');
  };

  window.actualizarPreviewImagenFicha = function (fieldId) {
    const input = byId(fieldId);
    updateImagePreview(fieldId, input?.dataset?.title || 'Imagen', input?.value || '');
  };

  window.imagenFichaNoCarga = function (fieldId) {
    const preview = byId(`${fieldId}Preview`);
    if (!preview) return;
    preview.classList.add('empty');
    preview.innerHTML = '<span>No se pudo cargar la imagen</span>';
  };

  function formFichaPreviewMessage(text) {
    const box = byId('imagePickerBox');
    if (box) box.innerHTML = msg(text, 'notice');
  }

  window.subirImagenFicha = function (fieldId) {
    const target = byId('libImageTarget');
    const file = byId('libImageFile');
    if (!target || !file) return;
    target.value = fieldId;
    file.value = '';
    file.click();
  };

  window.uploadSelectedFichaImage = async function (event) {
    const file = event.target.files?.[0];
    const fieldId = val('libImageTarget');
    if (!file || !fieldId) return;
    const box = byId('imagePickerBox');
    try {
      if (box) box.innerHTML = msg('Subiendo imagen...');
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
      const path = `library/${state.user.id}/${safeName}`;
      let publicUrl = '';
      let lastError = null;
      for (const bucket of ['library-photos', 'photos', 'aquarium-photos']) {
        const upload = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
        if (!upload.error) {
          publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
          break;
        }
        lastError = upload.error;
      }
      if (!publicUrl) throw lastError || new Error('No se pudo subir la imagen.');
      setImageFieldValue(fieldId, publicUrl);
      if (box) box.innerHTML = msg('Imagen subida. Guarda la ficha para confirmar.', 'success');
    } catch (e) {
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  window.elegirImagenExistente = async function (fieldId) {
    const box = byId('imagePickerBox');
    try {
      if (box) box.innerHTML = msg('Buscando imagenes existentes...');
      const photosReq = supabase.from('aquarium_photos').select('title,caption,image_url,photo_url,public_url,url,cover_url,created_at').order('created_at', { ascending: false }).limit(40);
      const libraryReq = supabase.from('library_entries').select('title,cover_url,photo_url,created_at').order('created_at', { ascending: false }).limit(40);
      const [photos, library] = await Promise.all([photosReq, libraryReq]);
      if (photos.error) throw photos.error;
      if (library.error) throw library.error;
      const seen = new Set();
      const items = [];
      function add(url, label) {
        if (!url || seen.has(url)) return;
        seen.add(url);
        items.push({ url, label });
      }
      (photos.data || []).forEach(row => add(imageUrlFromPhoto(row), row.title || row.caption || 'Foto'));
      (library.data || []).forEach(row => { add(row.cover_url, `${row.title || 'Ficha'} · portada`); add(row.photo_url, `${row.title || 'Ficha'} · foto`); });
      if (!items.length) {
        if (box) box.innerHTML = msg('No hay fotos existentes. Sube una imagen o pega una URL.', 'notice');
        return;
      }
      if (box) box.innerHTML = `<section class="library-picker"><div class="panel-head"><h3>Elegir imagen</h3><button type="button" onclick="cerrarSelectorImagen()">Cerrar</button></div><div class="library-picker-grid">${items.map(item => `<button type="button" onclick="usarImagenFicha('${esc(fieldId)}','${esc(item.url)}')"><img src="${esc(item.url)}" alt="${esc(item.label)}" loading="lazy"><span>${esc(item.label)}</span></button>`).join('')}</div></section>`;
    } catch (e) {
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  window.usarImagenFicha = function (fieldId, url) {
    setImageFieldValue(fieldId, url);
    const box = byId('imagePickerBox');
    if (box) box.innerHTML = msg('Imagen seleccionada. Guarda la ficha para confirmar.', 'success');
  };

  window.cerrarSelectorImagen = function () {
    const box = byId('imagePickerBox');
    if (box) box.innerHTML = '';
  };

  window.mostrarIdentify = function () {
    const nombreComun = val('libTitle');
    const nombreCientifico = val('libScientific');
    const marca = val('libManufacturer') || (productTypes.has(val('libType')) ? val('libScientific') : '');
    render(`<section class="panel library-detail identify-v1"><button onclick="formFicha()">Volver</button>
      <h2>Identificar organismo/producto</h2>
      <div class="notice">
        <p><b>Sin identificar</b> = No ficha</p>
        <p><b>Sin investigar</b> = No ficha</p>
        <p><b>Sin validar</b> = No publicacion</p>
      </div>
      <label>Nombre comun</label><input id="identifyCommonName" value="${esc(nombreComun)}" placeholder="Ej. Pez payaso, Sal marina, Test de calcio...">
      <label>Nombre cientifico</label><input id="identifyScientificName" value="${esc(nombreCientifico)}" placeholder="Ej. Amphiprion ocellaris">
      <label>Marca</label><input id="identifyBrand" value="${esc(marca)}" placeholder="Solo productos: marca/fabricante">
      <button class="primary" type="button" onclick="buscarIdentify()">Buscar</button>
      <div id="identifyBox"></div>
    </section>`, 'biblioteca');
  };

  window.buscarIdentify = async function () {
    const nombreComun = val('identifyCommonName');
    const nombreCientifico = val('identifyScientificName');
    const marca = val('identifyBrand');
    const box = byId('identifyBox');
    if (!nombreComun && !nombreCientifico && !marca) {
      if (box) box.innerHTML = msg('Introduce al menos nombre comun, nombre cientifico o marca para empezar la identificacion.', 'error');
      return;
    }
     
    try {
      if (box) box.innerHTML = msg('Identificando con IA real...', 'notice');

      const { data, error } = await supabase.functions.invoke('library-generate-card', {
        body: {
          mode: 'identify',
          title: nombreComun,
          scientific_name: nombreCientifico,
          entry_type: val('libType') || 'general',
          notes: marca,
          source_context: {
            manufacturer: marca,
            source_notes: marca
          }
        }
      });

      if (error) throw new Error(await functionErrorMessage(error));

      const result = data?.data || data || {};
      if (!result.identity_confirmed) {
        if (box) box.innerHTML = msg('Identificacion no validada. No se puede crear ficha.', 'error');
        return;
      }

      if (byId('libTitle')) byId('libTitle').value = result.title || nombreComun;
      if (byId('libScientific')) byId('libScientific').value = result.scientific_name || nombreCientifico;

      if (box) box.innerHTML = `<div class="success">
        Identificacion validada.<br>
        <b>${esc(result.title || '')}</b><br>
        ${esc(result.scientific_name || '')}<br><br>
        <button type="button" onclick="formFicha('', '${esc(result.entry_type || val('libType') || 'general')}')">Crear borrador</button>
      </div>`;
    } catch (e) {
      if (box) box.innerHTML = msg(e.message || 'Error en identificacion.', 'error');
   }
};
  window.generarFichaIA = async function () {
    try {
      const title = val('libTitle');
      const coverUrl = val('libCover');
      const photoUrl = val('libPhoto');
      if (!title && !coverUrl && !photoUrl) throw new Error('Pon un nombre o sube una foto para que la IA pueda identificar y buscar.');
      if (byId('aiBox')) byId('aiBox').innerHTML = msg('Generando borrador...');
      const source_context = sourceContextFromForm();
      const { data, error } = await supabase.functions.invoke('library-generate-card', { body: { title, scientific_name: val('libScientific'), entry_type: val('libType'), notes: val('libPrompt'), cover_url: coverUrl, photo_url: photoUrl, source_context } });
      if (error) throw new Error(await functionErrorMessage(error));
      const generated = data?.data || data || {};
      const warning = data?.warning || generated.warning || '';
      const sections = generated.sections || {};
      let loaded = 0;
      Object.keys(sections).forEach(key => {
        const text = sectionText(sections[key]);
        if (!text || isPlaceholderText(text)) return;
        const el = byId(`libSection_${key}`);
        if (el) { el.value = text; loaded += 1; }
      });
      if (generated.scientific_name && !isPlaceholderText(generated.scientific_name) && byId('libScientific')) byId('libScientific').value = generated.scientific_name;
      if (Array.isArray(generated.tags) && byId('libTags')) byId('libTags').value = generated.tags.filter(tag => tag && !isPlaceholderText(tag)).join(', ');
      const notice = aiGenerationNotice(generated, warning);
      if (!loaded && !generated.scientific_name && !generated.tags?.length) {
        if (generated.needs_ai_configuration || generated.ai_model === 'no-ai-configured') throw new Error(warning || 'OPENAI_API_KEY no configurada. Anade datos verificados o configura la IA.');
        throw new Error('La IA no devolvio contenido util para cargar. Revisa el nombre o anade mas notas.');
      }
      const className = generated.needs_ai_configuration || generated.ai_model === 'verified-input-no-ai' ? 'notice' : 'success';
      const noticeTitle = className === 'notice' ? 'Datos verificados cargados. Falta IA real para buscar y contrastar por internet/foto.' : 'Borrador IA cargado. Revisa antes de guardar.';
      if (byId('aiBox')) byId('aiBox').innerHTML = `<div class="${className}">${noticeTitle}${notice ? `<br>${notice}` : ''}</div>`;
    } catch (e) { if (byId('aiBox')) byId('aiBox').innerHTML = msg(e.message, 'error'); }
  };

  window.verFicha = function (id) {
    const row = (state.libraryRows || []).find(r => r.id === id);
    if (!row) return biblioteca();
    const mainPhoto = row.photo_url || row.cover_url || '';
    const coverOnly = row.cover_url && row.cover_url !== mainPhoto;
    render(`<section class="panel library-detail"><button onclick="biblioteca()">Volver</button>${mainPhoto ? `<img class="library-detail-photo" src="${esc(mainPhoto)}" alt="${esc(row.title)}">` : ''}${coverOnly ? `<div class="library-cover-note"><b>Portada</b><img src="${esc(row.cover_url)}" alt="Portada"></div>` : ''}<small>${esc(typeName(row.entry_type))} · ${esc(row.status || 'draft')}</small><h2>${esc(row.title || 'Ficha')}</h2>${row.scientific_name ? `<p class="scientific">${esc(row.scientific_name)}</p>` : ''}${sectionsFor(row.entry_type).map(key => sectionText(row.sections?.[key]) ? `<section class="library-detail-section"><h3>${esc(sectionLabels[key] || key)}</h3><p>${esc(sectionText(row.sections[key])).replace(/\n/g, '<br>')}</p></section>` : '').join('')}<div class="quick-actions"><button class="primary" onclick="pasarFichaAInventario('${esc(row.id)}')"><span>▤</span>Pasar a inventario</button><button onclick="formFicha('${esc(row.id)}')"><span>□</span>Editar ficha</button></div><div id="x"></div></section>`, 'biblioteca');
  };
})();
