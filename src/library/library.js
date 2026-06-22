/* AcuarioNexo · Biblioteca oficial */
(function () {
  const { supabase, state, esc, byId, val, msg, token, isCurrent, render } = window.ANX;

  const types = [
    ['pez_marino', 'Pez marino'], ['pez_dulce', 'Pez agua dulce'], ['coral', 'Coral'],
    ['invertebrado', 'Invertebrado'], ['planta', 'Planta / alga'], ['medicamento', 'Medicamento'],
    ['sal', 'Sal'], ['alimento', 'Alimento'], ['equipamiento', 'Equipo'], ['test', 'Test'], ['general', 'General']
  ];
  const labels = Object.fromEntries(types);
  const sectionLabels = {
    summary: 'Resumen', identity: 'Identificacion', habitat: 'Habitat', aquarium: 'Acuario recomendado',
    parameters: 'Parametros', behavior: 'Comportamiento', feeding: 'Alimentacion', compatibility: 'Compatibilidad',
    reef_safe: 'Reef safe', health: 'Salud', purchase: 'Antes de comprar', mistakes: 'Errores frecuentes',
    breeding: 'Reproduccion', lighting: 'Iluminacion', flow: 'Flujo', placement: 'Ubicacion', co2: 'CO2 / nutrientes',
    maintenance: 'Mantenimiento', uses: 'Usos', dose: 'Dosis', remove: 'Retirar durante tratamiento', risks: 'Riesgos',
    aftercare: 'Seguimiento', inventory_logic: 'Logica AcuarioNexo', mixing: 'Preparacion', use: 'Uso', nutrition: 'Composicion',
    acuarionexo_plan: 'Plan AcuarioNexo', specs: 'Especificaciones', installation: 'Instalacion', reading: 'Lectura',
    range: 'Rangos', storage: 'Conservacion', sources: 'Fuentes'
  };
  const sectionsByType = {
    pez_marino: ['summary','identity','habitat','aquarium','parameters','behavior','feeding','compatibility','reef_safe','health','purchase','mistakes','sources'],
    pez_dulce: ['summary','identity','habitat','aquarium','parameters','behavior','feeding','compatibility','breeding','health','purchase','mistakes','sources'],
    coral: ['summary','identity','habitat','aquarium','parameters','lighting','flow','placement','feeding','compatibility','health','purchase','mistakes','sources'],
    invertebrado: ['summary','identity','habitat','aquarium','parameters','behavior','feeding','compatibility','reef_safe','health','purchase','mistakes','sources'],
    planta: ['summary','identity','habitat','aquarium','parameters','lighting','co2','maintenance','compatibility','health','sources'],
    medicamento: ['summary','identity','uses','dose','compatibility','remove','risks','aftercare','inventory_logic','sources'],
    sal: ['summary','identity','parameters','mixing','use','risks','sources'],
    alimento: ['summary','identity','nutrition','use','compatibility','risks','acuarionexo_plan','sources'],
    equipamiento: ['summary','identity','specs','installation','maintenance','compatibility','risks','sources'],
    test: ['summary','identity','parameters','reading','range','use','risks','storage','sources'],
    general: ['summary','identity','aquarium','parameters','compatibility','risks','sources']
  };
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
      <h3>Datos verificados</h3>
      <div class="form-grid"><div><label>Fabricante / marca</label><input id="libManufacturer" value="${esc(source.manufacturer || '')}" placeholder="Ocean Nutrition, Tropic Marin..."></div>
      <div><label>Codigo / lote / SKU</label><input id="libProductCode" value="${esc(source.product_code || '')}" placeholder="Referencia, lote, codigo de barras..."></div></div>
      <label>URL fabricante</label><input id="libManufacturerUrl" value="${esc(source.manufacturer_url || '')}" placeholder="https://fabricante.com/producto">
      <label>URL ficha tecnica / prospecto</label><input id="libDatasheetUrl" value="${esc(source.datasheet_url || '')}" placeholder="https://...">
      <label>Texto de etiqueta</label><textarea id="libLabelText" placeholder="Ingredientes, composicion, dosis, instrucciones, advertencias...">${esc(source.label_text || '')}</textarea>
      <label>Notas de fuente</label><textarea id="libSourceNotes" placeholder="De donde sale el dato, dudas, variante exacta, idioma de la etiqueta...">${esc(source.source_notes || '')}</textarea>
      <button type="button" onclick="generarFichaIA()">Generar borrador IA</button><div id="aiBox"></div>
      ${sectionsFor(selectedType).map(key => `<label>${esc(sectionLabels[key] || key)}</label><textarea id="libSection_${key}">${esc(row.sections?.[key] || '')}</textarea>`).join('')}
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

  window.generarFichaIA = async function () {
    try {
      if (!val('libTitle')) throw new Error('Pon primero el nombre de la ficha.');
      if (byId('aiBox')) byId('aiBox').innerHTML = msg('Generando borrador...');
      const source_context = sourceContextFromForm();
      const { data, error } = await supabase.functions.invoke('library-generate-card', { body: { title: val('libTitle'), scientific_name: val('libScientific'), entry_type: val('libType'), notes: val('libPrompt'), cover_url: val('libCover'), photo_url: val('libPhoto'), source_context } });
      if (error) throw new Error(await functionErrorMessage(error));
      const generated = data?.data || data || {};
      const warning = data?.warning || generated.warning || '';
      const sections = generated.sections || {};
      let loaded = 0;
      Object.keys(sections).forEach(key => {
        const text = sections[key] || '';
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
      const title = className === 'notice' ? 'Datos verificados cargados. Falta IA real para buscar y contrastar por internet/foto.' : 'Borrador IA cargado. Revisa antes de guardar.';
      if (byId('aiBox')) byId('aiBox').innerHTML = `<div class="${className}">${title}${notice ? `<br>${notice}` : ''}</div>`;
    } catch (e) { if (byId('aiBox')) byId('aiBox').innerHTML = msg(e.message, 'error'); }
  };

  window.verFicha = function (id) {
    const row = (state.libraryRows || []).find(r => r.id === id);
    if (!row) return biblioteca();
    const mainPhoto = row.photo_url || row.cover_url || '';
    const coverOnly = row.cover_url && row.cover_url !== mainPhoto;
    render(`<section class="panel library-detail"><button onclick="biblioteca()">Volver</button>${mainPhoto ? `<img class="library-detail-photo" src="${esc(mainPhoto)}" alt="${esc(row.title)}">` : ''}${coverOnly ? `<div class="library-cover-note"><b>Portada</b><img src="${esc(row.cover_url)}" alt="Portada"></div>` : ''}<small>${esc(typeName(row.entry_type))} · ${esc(row.status || 'draft')}</small><h2>${esc(row.title || 'Ficha')}</h2>${row.scientific_name ? `<p class="scientific">${esc(row.scientific_name)}</p>` : ''}${sectionsFor(row.entry_type).map(key => row.sections?.[key] ? `<section class="library-detail-section"><h3>${esc(sectionLabels[key] || key)}</h3><p>${esc(row.sections[key]).replace(/\n/g, '<br>')}</p></section>` : '').join('')}<button class="primary" onclick="formFicha('${esc(row.id)}')">Editar ficha</button></section>`, 'biblioteca');
  };
})();