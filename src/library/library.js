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

  function card(row) {
    const cover = row.cover_url || '';
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

  window.formFicha = function (id = '', forcedType = '') {
    const row = id ? (state.libraryRows || []).find(r => r.id === id) || {} : {};
    const selectedType = forcedType || row.entry_type || (state.libraryFilter === 'all' ? 'pez_marino' : state.libraryFilter) || 'pez_marino';
    render(`<section class="panel library-detail"><button onclick="biblioteca()">Volver</button><h2>${id ? 'Editar ficha' : 'Nueva ficha'}</h2>
      <div class="form-grid"><div><label>Tipo</label><select id="libType" onchange="formFicha('${esc(id)}', this.value)">${types.map(([key, label]) => `<option value="${key}" ${selectedType === key ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></div>
      <div><label>Estado</label><select id="libStatus"><option value="draft" ${row.status !== 'published' ? 'selected' : ''}>Borrador</option><option value="published" ${row.status === 'published' ? 'selected' : ''}>Validada/publicada</option></select></div></div>
      <label>Nombre</label><input id="libTitle" value="${esc(row.title || '')}" placeholder="Ej. Amphiprion ocellaris, Sal Pro Reef...">
      <label>Nombre cientifico / marca</label><input id="libScientific" value="${esc(row.scientific_name || '')}">
      <label>Portada URL</label><input id="libCover" value="${esc(row.cover_url || '')}">
      <label>Etiquetas</label><input id="libTags" value="${esc(tagsText(row))}" placeholder="reef, principiante, lps...">
      <label>Notas para IA</label><textarea id="libPrompt" placeholder="Datos que sabes, enfoque, advertencias, producto concreto...">${esc(row.ai_prompt || '')}</textarea>
      <button type="button" onclick="generarFichaIA()">Generar borrador IA</button><div id="aiBox"></div>
      ${sectionsFor(selectedType).map(key => `<label>${esc(sectionLabels[key] || key)}</label><textarea id="libSection_${key}">${esc(row.sections?.[key] || '')}</textarea>`).join('')}
      <button class="primary" onclick="guardarFicha('${esc(id)}')">Guardar ficha</button><div id="x"></div></section>`, 'biblioteca');
  };

  function readForm() {
    const entry_type = val('libType') || 'general';
    const sections = {};
    sectionsFor(entry_type).forEach(key => { sections[key] = val(`libSection_${key}`); });
    const status = val('libStatus') || 'draft';
    return { user_id: state.user.id, title: val('libTitle') || 'Ficha', scientific_name: val('libScientific') || null, entry_type, status, visibility: status === 'published' ? 'public' : 'private', summary: sections.summary || null, cover_url: val('libCover') || null, sections, tags: tagsFromText(val('libTags')), ai_prompt: val('libPrompt') || null, validated_at: status === 'published' ? new Date().toISOString() : null, published_at: status === 'published' ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
  }

  window.guardarFicha = async function (id = '') {
    try {
      const row = readForm();
      const result = id ? await supabase.from('library_entries').update(row).eq('id', id) : await supabase.from('library_entries').insert(row);
      if (result.error) throw result.error;
      await biblioteca();
    } catch (e) { if (byId('x')) byId('x').innerHTML = msg(e.message, 'error'); }
  };

  window.generarFichaIA = async function () {
    try {
      if (!val('libTitle')) throw new Error('Pon primero el nombre de la ficha.');
      if (byId('aiBox')) byId('aiBox').innerHTML = msg('Generando borrador...');
      const { data, error } = await supabase.functions.invoke('library-generate-card', { body: { title: val('libTitle'), entry_type: val('libType'), notes: val('libPrompt') } });
      if (error) throw error;
      const generated = data?.data || data || {};
      const sections = generated.sections || {};
      Object.keys(sections).forEach(key => { const el = byId(`libSection_${key}`); if (el) el.value = sections[key] || ''; });
      if (generated.scientific_name && byId('libScientific')) byId('libScientific').value = generated.scientific_name;
      if (generated.tags && byId('libTags')) byId('libTags').value = generated.tags.join(', ');
      if (byId('aiBox')) byId('aiBox').innerHTML = msg('Borrador cargado. Revisa antes de guardar.', 'success');
    } catch (e) { if (byId('aiBox')) byId('aiBox').innerHTML = msg(e.message, 'error'); }
  };

  window.verFicha = function (id) {
    const row = (state.libraryRows || []).find(r => r.id === id);
    if (!row) return biblioteca();
    render(`<section class="panel library-detail"><button onclick="biblioteca()">Volver</button>${row.cover_url ? `<img class="library-detail-photo" src="${esc(row.cover_url)}" alt="${esc(row.title)}">` : ''}<small>${esc(typeName(row.entry_type))} · ${esc(row.status || 'draft')}</small><h2>${esc(row.title || 'Ficha')}</h2>${row.scientific_name ? `<p class="scientific">${esc(row.scientific_name)}</p>` : ''}${sectionsFor(row.entry_type).map(key => row.sections?.[key] ? `<section class="library-detail-section"><h3>${esc(sectionLabels[key] || key)}</h3><p>${esc(row.sections[key]).replace(/\n/g, '<br>')}</p></section>` : '').join('')}<button class="primary" onclick="formFicha('${esc(row.id)}')">Editar ficha</button></section>`, 'biblioteca');
  };
})();
