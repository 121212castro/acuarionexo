/* AcuarioNexo · Biblioteca V3 core */
(function () {
  const { supabase, state, esc, val, msg, token, isCurrent, render } = window.ANX;
  const S = window.ANX.LibrarySchema;

  const types = [['all','Todo'],['pez_marino','Pez marino'],['pez_dulce','Pez de agua dulce'],['coral','Coral'],['invertebrado','Invertebrado'],['planta','Planta'],['microfauna','Microfauna'],['fitoplancton','Fitoplancton y microalgas'],['producto','Producto'],['medicamento','Medicamento'],['sal','Sal'],['aditivo','Aditivo'],['alimento','Alimento'],['test','Test'],['equipamiento','Equipamiento']];
  const labels = Object.fromEntries(types);
  const biologicalTypes = new Set(['pez_marino','pez_dulce','coral','invertebrado','planta','microfauna','fitoplancton']);

  function typeName(t) { return labels[t] || t || 'Ficha'; }
  function statusName(s) { return ({ draft: 'Borrador', identified: 'Identificada', review: 'Revisión', validated: 'Validada', published: 'Publicada', archived: 'Archivada' }[s] || s || 'Revisión'); }
  function row(id) { return (state.libraryRows || []).find(x => String(x.id) === String(id)); }
  function isAdminLibrary() { return !!state.isAdmin; }
  function isOwnLibraryEntry(x) { return !!state.user?.id && String(x.user_id || '') === String(state.user.id); }
  function canSeeLibraryEntry(x) {
    const status = String(x.status || '').toLowerCase();
    return isAdminLibrary() || isOwnLibraryEntry(x) || ['published', 'validated'].includes(status);
  }

  function isAdminReturnContext() { return !!state.libraryAdminReturn && !!state.isAdmin; }
  function returnToLibrarySource() { return isAdminReturnContext() ? adminPanel() : biblioteca(); }
  function libraryBackButton() {
    const label = isAdminReturnContext() ? '← Panel de administración' : '← Biblioteca';
    return `<button onclick="ANX.LibraryV3Core.returnToLibrarySource()">${label}</button>`;
  }

  async function load() {
    const pageSize = 1000;
    const allRows = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('library_entries')
        .select('*')
        .order('title', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const batch = data || [];
      allRows.push(...batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }
    state.libraryRows = allRows;
  }

  function sources(value) {
    const list = S.normalizeSources(value);
    return list.length ? `<div class="library-source-list">${list.map(x => `<a class="item" href="${esc(x.url)}" target="_blank" rel="noopener"><b>${esc(x.name || 'Fuente')}</b></a>`).join('')}</div>` : msg('Sin fuentes estructuradas.', 'error');
  }

  function responsiveImage(x, kind, fallback, className, alt, loading = 'lazy') {
    const asset = x.image_assets?.[kind] || {};
    const src = asset.original || fallback || asset.desktop || asset.tablet || asset.mobile || '';
    if (!src) return '';
    const isDetail = String(className || '').includes('library-detail-');
    const isCard = String(className || '').includes('library-card-cover');
    const cardStyle = isCard ? ' style="display:block!important;width:100%!important;min-width:100%!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;object-fit:contain!important;object-position:center!important;margin:0!important;padding:0!important;border-radius:0!important"' : '';
    const image = `<img class="${esc(className)}" src="${esc(src)}" alt="${esc(alt)}" loading="${loading}"${cardStyle}>`;
    if (!isDetail) return image;
    return `<div class="library-media-frame library-media-frame--${kind}">${image}</div>`;
  }

  function card(x) {
    const cover = responsiveImage(x, 'cover', x.cover_url || x.photo_url || '', 'library-card-cover', x.title || 'Ficha');
    const title = esc(x.title || 'Ficha');
    const noCover = `<div class="library-card-cover library-no-photo"><span class="library-no-photo-title">${title}</span><span class="library-no-photo-label">Sin portada</span></div>`;
    return `<button class="library-card library-cover-card library-cover-only" style="display:block!important;width:100%!important;height:auto!important;padding:0!important;overflow:hidden!important" onclick="verFicha('${esc(x.id)}')" aria-label="Abrir ficha: ${title}" title="${title}">${cover || noCover}</button>`;
  }

  function libraryInfoNotice() { return '<div id="libraryInfoNotice" class="notice"><b>Biblioteca de consulta.</b><br>Fichas verificadas para revisar compatibilidad, requisitos, riesgos y próximas compras.</div>'; }
  function publicFilters(f) { return `<div class="library-clean-filters"><button class="${f === 'all' ? 'active' : ''}" onclick="filtrarBiblioteca('all')">Todo</button>${types.filter(([k]) => k !== 'all').map(([k,n]) => `<button class="${f === k ? 'active' : ''}" onclick="filtrarBiblioteca('${k}')">${esc(n)}</button>`).join('')}</div>`; }

  function groupRows(rows) {
    const groups = new Map(types.filter(([k]) => k !== 'all').map(([k, n]) => [k, { key: k, label: n, rows: [] }]));
    rows.forEach(item => {
      const key = item.entry_type || 'producto';
      if (!groups.has(key)) groups.set(key, { key, label: typeName(key), rows: [] });
      groups.get(key).rows.push(item);
    });
    return Array.from(groups.values()).filter(group => group.rows.length);
  }

  function groupedList(rows, q, f) {
    if (!rows.length) return msg('No hay fichas para este filtro.', 'notice');
    if (f !== 'all' || q) return `<div class="library-grid">${rows.map(card).join('')}</div>`;
    return `<div class="library-sections">${groupRows(rows).map((group, index) => `<details class="library-section" ${index === 0 ? 'open' : ''}><summary><span>${esc(group.label)}</span><b>${group.rows.length}</b></summary><div class="library-grid">${group.rows.map(card).join('')}</div></details>`).join('')}</div>`;
  }

  function list() {
    const q = val('librarySearch').toLowerCase();
    const f = state.libraryFilter || 'all';
    const statusFilter = Array.isArray(state.libraryStatusFilter) ? state.libraryStatusFilter : [];
    const rows = (state.libraryRows || []).filter(x => (f === 'all' || x.entry_type === f) && (!statusFilter.length || statusFilter.includes(String(x.status || '').toLowerCase())) && (!q || [x.title, x.scientific_name, x.summary, x.status, typeName(x.entry_type)].join(' ').toLowerCase().includes(q)));
    const visible = rows
      .filter(canSeeLibraryEntry)
      .sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'es', { sensitivity: 'base', numeric: true }));
    const adminReviewHeader = isAdminReturnContext() ? `<div class="panel-head"><h2>Fichas pendientes de revisión</h2><button onclick="adminPanel()">← Admin</button></div><div class="notice"><b>${visible.length} fichas pendientes.</b><br>Abre una ficha para editarla, completar sus datos y publicarla cuando supere la validación.</div>` : `<div class="panel-head"><h2>Consulta</h2></div>${libraryInfoNotice()}`;
    render(`<section class="summary-card"><div><small>Base de conocimiento verificable</small><h2>Biblioteca</h2><p>${visible.length} fichas</p></div></section><section class="panel library-clean-panel">${adminReviewHeader}<div class="library-search"><input id="librarySearch" placeholder="Buscar especie, producto o parámetro" oninput="renderBibliotecaActual()"></div>${publicFilters(f)}${groupedList(visible, q, f)}</section>`, 'biblioteca');
  }

  window.biblioteca = async function (options) {
    if (!state.user) return login();
    const config = options && typeof options === 'object' ? options : {};
    state.libraryStatusFilter = Array.isArray(config.statusFilter) ? config.statusFilter.map(x => String(x).toLowerCase()) : [];
    state.libraryAdminReturn = !!config.adminReturn && !!state.isAdmin;
    const t = token();
    render(`<section class="panel">${msg('Cargando Biblioteca...')}</section>`, 'biblioteca');
    try { await load(); if (isCurrent(t)) list(); }
    catch (e) { if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'biblioteca'); }
  };

  window.renderBibliotecaActual = list;
  window.filtrarBiblioteca = t => { state.libraryFilter = t || 'all'; list(); };
  window.ANX.LibraryV3Core = { S, types, labels, biologicalTypes, typeName, statusName, row, load, sources, responsiveImage, card, libraryInfoNotice, list, isAdminLibrary, isOwnLibraryEntry, canSeeLibraryEntry, isAdminReturnContext, returnToLibrarySource, libraryBackButton };
})();