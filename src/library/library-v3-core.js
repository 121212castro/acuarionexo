/* AcuarioNexo · Biblioteca V3 core */
(function () {
  const { supabase, state, esc, val, msg, token, isCurrent, render } = window.ANX;
  const S = window.ANX.LibrarySchema;

  const types = [['all','Todo'],['pez_marino','Pez marino'],['pez_dulce','Pez de agua dulce'],['coral','Coral'],['invertebrado','Invertebrado'],['planta','Planta'],['microfauna','Microfauna'],['producto','Producto'],['medicamento','Medicamento'],['sal','Sal'],['aditivo','Aditivo'],['alimento','Alimento'],['test','Test'],['equipamiento','Equipamiento']];
  const labels = Object.fromEntries(types);
  const biologicalTypes = new Set(['pez_marino','pez_dulce','coral','invertebrado','planta','microfauna']);

  function typeName(t) { return labels[t] || t || 'Ficha'; }
  function statusName(s) { return ({ review: 'Revisión', validated: 'Validada', published: 'Publicada', archived: 'Archivada' }[s] || s || 'Revisión'); }
  function row(id) { return (state.libraryRows || []).find(x => String(x.id) === String(id)); }

  async function load() {
    const { data, error } = await supabase.from('library_entries').select('*').order('updated_at', { ascending: false }).limit(300);
    if (error) throw error;
    state.libraryRows = data || [];
  }

  function sources(value) {
    const list = S.normalizeSources(value);
    return list.length ? `<div class="library-source-list">${list.map(x => `<a class="item" href="${esc(x.url)}" target="_blank" rel="noopener"><b>${esc(x.name || 'Fuente')}</b></a>`).join('')}</div>` : msg('Sin fuentes estructuradas.', 'error');
  }

  function card(x) {
    const cover = x.cover_url || x.photo_url || '';
    return `<button class="library-card library-cover-card" onclick="verFicha('${esc(x.id)}')">${cover ? `<img class="library-card-cover" src="${esc(cover)}" alt="${esc(x.title)}">` : `<div class="library-card-cover library-no-photo">Ficha</div>`}<div class="library-card-body"><h3>${esc(x.title || 'Ficha')}</h3><p class="scientific">${esc(x.scientific_name || '')}</p><p>${esc(x.summary || '')}</p><small>${S.normalizeSources(x.sources).length} fuentes</small></div></button>`;
  }

  function libraryInfoNotice() {
    return '<div id="libraryInfoNotice" class="notice"><b>Ficha informativa.</b><br>Sirve para consultar compatibilidad, próximas compras, requisitos y riesgos. No se guarda en inventario salvo que pulses <b>Añadir a mi inventario</b>.</div>';
  }

  function list() {
    const q = val('librarySearch').toLowerCase();
    const f = state.libraryFilter || 'all';
    const rows = (state.libraryRows || []).filter(x => (f === 'all' || x.entry_type === f) && (!q || [x.title, x.scientific_name, x.summary, x.status].join(' ').toLowerCase().includes(q)));
    render(`<section class="summary-card"><div><small>Base de conocimiento verificable</small><h2>Biblioteca</h2><p>${rows.length} fichas</p></div></section><section class="panel"><div class="panel-head"><h2>Conocimiento</h2><button class="primary" onclick="nuevaFichaV3()">Identificar nueva entrada</button></div>${libraryInfoNotice()}<div class="library-search"><input id="librarySearch" placeholder="Buscar especie o producto" oninput="renderBibliotecaActual()"></div><div class="form-grid"><div><label>Plantilla para el chat</label><select id="templateCopyType">${types.map(([k,n]) => `<option value="${k}" ${f === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div><div><label>&nbsp;</label><button class="primary" onclick="copiarApartadosFicha()">Copiar apartados para Chat</button></div></div><div id="templateCopyStatus"></div><div class="library-modules"><button class="${f === 'all' ? 'active' : ''}" onclick="filtrarBiblioteca('all')"><b>Todo</b><span>Fichas</span><small>Biblioteca</small></button>${types.filter(([k]) => k !== 'all').map(([k,n]) => `<button class="${f === k ? 'active' : ''}" onclick="filtrarBiblioteca('${k}')"><b>${esc(n)}</b><span>Fichas</span><small>Biblioteca</small></button>`).join('')}</div><div class="library-grid">${rows.map(card).join('') || msg('No hay fichas para este filtro.', 'notice')}</div></section>`, 'biblioteca');
  }

  window.biblioteca = async function () {
    if (!state.user) return login();
    const t = token();
    render(`<section class="panel">${msg('Cargando Biblioteca...')}</section>`, 'biblioteca');
    try { await load(); if (isCurrent(t)) list(); }
    catch (e) { if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'biblioteca'); }
  };

  window.renderBibliotecaActual = list;
  window.filtrarBiblioteca = t => { state.libraryFilter = t || 'all'; list(); };

  window.ANX.LibraryV3Core = {
    S,
    types,
    labels,
    biologicalTypes,
    typeName,
    statusName,
    row,
    load,
    sources,
    card,
    libraryInfoNotice,
    list
  };
})();
