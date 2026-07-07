/* AcuarioNexo · inventory */
(function () {
  const { supabase, state, esc, msg, token, isCurrent, currentAquarium, render, aqHeader } = window.ANX;
  const { liveCategories, inventoryNoteText, inventoryMeta, inventoryCover, inventoryExpiryStatus, inventoryAqId, groupedInventoryHtml, importedFichaHtml } = window.ANX;

function afterDeleteRoute(item) {
  const aqId = inventoryAqId(item);
  const aq = aqId && currentAquarium()?.id === aqId ? currentAquarium() : null;
  if (aq && liveCategories.has(item.category || '') && typeof window.animales === 'function') return window.animales();
  if (aq) return window.inventario('aquarium');
  return window.inventario('general');
}

function inventorySearchBar(scope) {
  return `<div class="inventory-search-bar">
    <input id="inventorySearch" type="search" placeholder="Buscar por nombre, categoría, ficha, lote, notas o caducidad">
    <button class="primary" onclick="buscarInventarioActual()">Buscar</button>
    <button onclick="limpiarBusquedaInventario()">Limpiar</button>
  </div>`;
}

function setInventoryContext(rows, aqName) {
  state.inventoryCurrentRows = rows || [];
  state.inventoryCurrentAquariumName = aqName || '';
}

window.buscarInventarioActual = function () {
  const box = document.getElementById('inventoryList');
  const input = document.getElementById('inventorySearch');
  if (!box) return;
  const query = input ? input.value.trim() : '';
  box.innerHTML = groupedInventoryHtml(state.inventoryCurrentRows || [], state.inventoryCurrentAquariumName || '', { query });
};

window.limpiarBusquedaInventario = function () {
  const input = document.getElementById('inventorySearch');
  if (input) input.value = '';
  window.buscarInventarioActual();
};

window.inventario = async function (scope = 'general') {
  if (!state.user) return login();
  const t = token();
  const aq = currentAquarium();
  const isAq = scope === 'aquarium' && aq;
  const active = isAq ? 'acuarios' : 'inventario';
  const head = isAq ? aqHeader('inventario') : '';
  const title = isAq ? `Inventario de ${aq.name || 'acuario'}` : 'Inventario general';
  render(head + `<section class="panel"><div class="panel-head"><h2>${esc(title)}</h2><button class="primary" onclick="formInventario('${isAq ? 'aquarium' : 'general'}')">Añadir manual</button></div>${msg('Cargando inventario...')}</section>`, active);
  try {
    const { data, error } = await supabase.from('inventory_items').select('id,name,category,quantity,unit,photo_url,aquarium_id,expiry_date,notes,created_at').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(120);
    if (error) throw error;
    if (!isCurrent(t)) return;
    const rows = data || [];
    const filtered = isAq ? rows.filter(item => inventoryAqId(item) === String(aq.id)) : rows.filter(item => !inventoryAqId(item));
    setInventoryContext(filtered, isAq ? aq.name : '');
    const html = groupedInventoryHtml(filtered, isAq ? aq.name : '');
    const tabs = `<div class="inventory-tabs">
      <button class="${isAq ? 'active' : ''}" ${aq ? `onclick="openAqSection('inventario')"` : 'disabled'}>Este acuario</button>
      <button class="${!isAq ? 'active' : ''}" onclick="inventario('general')">General compartido</button>
    </div>`;
    const hint = isAq ? '<p class="small inventory-hint">Aqui van los habitantes, microfauna y equipos que pertenecen solo a este acuario.</p>' : '<p class="small inventory-hint">Aqui van medicamentos, sales, aditivos, alimentos, tests y material compartido entre acuarios.</p>';
    render(head + `<section class="panel"><div class="panel-head"><h2>${esc(title)}</h2><div class="inline-actions"><button onclick="importarFichaInventario('${isAq ? 'aquarium' : 'general'}')">Desde ficha</button><button class="primary" onclick="formInventario('${isAq ? 'aquarium' : 'general'}')">Añadir manual</button></div></div>${tabs}${hint}${inventorySearchBar(isAq ? 'aquarium' : 'general')}<div id="inventoryList">${html || msg('Sin inventario todavía.')}</div></section>`, active);
  } catch (e) {
    if (isCurrent(t)) render(head + `<section class="panel">${msg(e.message, 'error')}</section>`, active);
  }
};

window.verInventario = async function (id) {
  const t = token();
  render(`<section class="panel">${msg('Abriendo ficha de inventario...')}</section>`, 'inventario');
  try {
    const { data, error } = await supabase.from('inventory_items').select('*').eq('id', id).eq('user_id', state.user.id).single();
    if (error) throw error;
    if (!isCurrent(t)) return;
    const aqId = inventoryAqId(data);
    const isAq = !!aqId;
    const aq = isAq && currentAquarium()?.id === aqId ? currentAquarium() : null;
    const active = isAq && aq ? 'acuarios' : 'inventario';
    const head = isAq && aq ? aqHeader('inventario') : '';
    const cleanNotes = inventoryNoteText(data);
    const expiry = data.expiry_date || inventoryMeta(data).expires_at || '';
    const meta = inventoryMeta(data);
    const status = inventoryExpiryStatus(data);
    const cover = inventoryCover(data);
    render(head + `<section class="panel inventory-detail">
      <button onclick="${isAq && aq ? "openAqSection('inventario')" : "inventario('general')"}">← Volver</button>
      ${cover ? `<img class="inventory-detail-cover" src="${esc(cover)}" alt="${esc(data.name || 'Inventario')}" onerror="this.replaceWith(document.createElement('div'));this.className='inventory-detail-cover empty';this.textContent='▤';">` : '<div class="inventory-detail-cover empty">▤</div>'}
      <div class="inventory-detail-head"><div><small>${esc(data.category || 'Inventario')}</small><h2>${esc(data.name || 'Item')}</h2></div>${status ? `<span class="${esc(status)}">${esc(status)}</span>` : ''}</div>
      <div class="inventory-fields">
        <div><small>Cantidad</small><b>${esc(data.quantity ?? '-')} ${esc(data.unit || '')}</b></div>
        <div><small>Ámbito</small><b>${esc(isAq ? (aq?.name || 'Acuario') : 'General compartido')}</b></div>
        <div><small>Caducidad</small><b>${esc(expiry || 'Sin fecha')}</b></div>
        <div><small>Fecha compra / alta</small><b>${esc(meta.purchase_date || 'Sin fecha')}</b></div>
        <div><small>Compra / procedencia</small><b>${esc(meta.purchase_place || 'Sin dato')}</b></div>
        <div><small>Precio</small><b>${esc(meta.purchase_price || 'Sin dato')}</b></div>
        <div><small>Lote / SKU</small><b>${esc(meta.batch || 'Sin dato')}</b></div>
      </div>
      ${cleanNotes ? `<details class="library-detail-section inventory-answer-detail"><summary>Notas</summary><p>${esc(cleanNotes)}</p></details>` : ''}
      ${importedFichaHtml(meta)}
      <div class="inline-actions"><button class="primary" onclick="editarInventario('${esc(data.id)}')">Editar ficha</button><button class="ghost danger" onclick="eliminarInventario('${esc(data.id)}')">🗑 Eliminar</button></div>
    </section>`, active);
  } catch (e) {
    render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'inventario');
  }
};

window.eliminarInventario = async function (id) {
  const t = token();
  render(`<section class="panel">${msg('Comprobando elemento...')}</section>`, 'inventario');
  try {
    const { data, error } = await supabase.from('inventory_items').select('id,name,category,aquarium_id,notes').eq('id', id).eq('user_id', state.user.id).single();
    if (error) throw error;
    const ok = confirm(`¿Eliminar ${data.name || 'este elemento'}?\n\nSe borrará del inventario. Esta acción no se puede deshacer.`);
    if (!ok) return verInventario(id);
    const { error: delError } = await supabase.from('inventory_items').delete().eq('id', id).eq('user_id', state.user.id);
    if (delError) throw delError;
    if (!isCurrent(t)) return;
    afterDeleteRoute(data);
  } catch (e) {
    render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'inventario');
  }
};
})();