/* AcuarioNexo · Inventory form */
(function () {
  function A() { return window.ANX || {}; }

  function formInventario(scope = 'general') {
    const { esc, currentAquarium, aqHeader, render, generalInventoryCategories, aquariumInventoryCategoriesFor } = A();
    const aq = currentAquarium();
    const isAq = scope === 'aquarium' && aq;
    const active = isAq ? 'acuarios' : 'inventario';
    const head = isAq ? aqHeader('inventario') : '';
    const categories = isAq ? aquariumInventoryCategoriesFor(aq) : generalInventoryCategories;
    const categoryOptions = categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    render(head + `<section class="panel"><button onclick="${isAq ? "openAqSection('inventario')" : "inventario('general')"}">← Volver</button><h2>${isAq ? 'Nuevo item del acuario' : 'Nuevo item general'}</h2>
      <label>Nombre</label><input id="invName">
      <label>Categoría</label><select id="invCategory">${categoryOptions}</select>
      <label>Cantidad</label><input id="invQty" type="number" step="0.1" value="1">
      <label>Unidad</label><input id="invUnit" value="unidad" placeholder="unidad, ml, g, bote...">
      <label>Fecha compra / alta</label><input id="invPurchaseDate" type="date">
      <label>Dónde se compra / procedencia</label><input id="invPurchasePlace" placeholder="Tienda, criador, proveedor, web...">
      <label>Precio</label><input id="invPurchasePrice" inputmode="decimal" placeholder="Ej. 24.90">
      <label>Lote / SKU / referencia</label><input id="invBatch" placeholder="Opcional">
      <label>Caducidad</label><input id="invExpiry" type="date">
      <label>Portada</label><input id="invCover" placeholder="URL de imagen o portada">
      <input id="invScope" type="hidden" value="${isAq ? 'aquarium' : 'general'}">
      <label>Notas</label><textarea id="invNotes"></textarea>
      <button class="primary" onclick="saveInventario()">Guardar</button><div id="x"></div></section>`, active);
  }

  async function saveInventario() {
    const { supabase, state, byId, val, num, msg, currentAquarium } = A();
    try {
      if (!val('invName')) throw new Error('Pon un nombre.');
      const aq = currentAquarium();
      const scope = val('invScope') || 'general';
      const meta = { source: 'manual', scope, purchase_date: val('invPurchaseDate'), purchase_place: val('invPurchasePlace'), purchase_price: val('invPurchasePrice'), batch: val('invBatch') };
      const metaHasValue = Object.values(meta).some(Boolean);
      const notes = [metaHasValue ? `AcuarioNexoMeta:${JSON.stringify(meta)}` : '', val('invNotes') || ''].filter(Boolean).join('\n');
      const row = { user_id: state.user.id, name: val('invName'), category: val('invCategory') || (scope === 'aquarium' ? 'Equipos' : 'Material general'), quantity: num('invQty') ?? 1, unit: val('invUnit') || 'unidad', expiry_date: val('invExpiry') || null, photo_url: val('invCover') || null, notes: notes || null };
      if (scope === 'aquarium') {
        if (!aq) throw new Error('Abre un acuario para guardar inventario del acuario.');
        row.aquarium_id = aq.id;
      }
      const { error } = await supabase.from('inventory_items').insert(row);
      if (error) throw error;
      scope === 'aquarium' ? window.inventario('aquarium') : window.inventario('general');
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  }

  async function editarInventario(id) {
    const { supabase, state, esc, msg, token, isCurrent, currentAquarium, render, aqHeader, generalInventoryCategories, aquariumInventoryCategoriesFor, inventoryAqId, inventoryMeta, inventoryCover, inventoryNoteText } = A();
    const t = token();
    render(`<section class="panel">${msg('Cargando editor...')}</section>`, 'inventario');
    try {
      const { data, error } = await supabase.from('inventory_items').select('*').eq('id', id).eq('user_id', state.user.id).single();
      if (error) throw error;
      if (!isCurrent(t)) return;
      const aqId = inventoryAqId(data);
      const isAq = !!aqId;
      const aq = isAq && currentAquarium()?.id === aqId ? currentAquarium() : null;
      const active = isAq && aq ? 'acuarios' : 'inventario';
      const head = isAq && aq ? aqHeader('inventario') : '';
      const categories = isAq ? aquariumInventoryCategoriesFor(aq) : generalInventoryCategories;
      const categoryOptions = categories.map(c => `<option value="${esc(c)}" ${data.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
      const meta = inventoryMeta(data);
      render(head + `<section class="panel">
        <button onclick="verInventario('${esc(data.id)}')">← Volver</button><h2>Editar ficha</h2>
        <label>Nombre</label><input id="invEditName" value="${esc(data.name || '')}">
        <label>Categoría</label><select id="invEditCategory">${categoryOptions}</select>
        <label>Cantidad</label><input id="invEditQty" type="number" step="0.1" value="${esc(data.quantity ?? 1)}">
        <label>Unidad</label><input id="invEditUnit" value="${esc(data.unit || 'unidad')}">
        <label>Fecha compra / alta</label><input id="invEditPurchaseDate" type="date" value="${esc(meta.purchase_date || '')}">
        <label>Dónde se compra / procedencia</label><input id="invEditPurchasePlace" value="${esc(meta.purchase_place || '')}" placeholder="Tienda, criador, proveedor, web...">
        <label>Precio</label><input id="invEditPurchasePrice" inputmode="decimal" value="${esc(meta.purchase_price || '')}">
        <label>Lote / SKU / referencia</label><input id="invEditBatch" value="${esc(meta.batch || '')}">
        <textarea id="invEditExistingMeta" class="hidden">${esc(JSON.stringify(meta || {}))}</textarea>
        <label>Caducidad</label><input id="invEditExpiry" type="date" value="${esc(data.expiry_date || meta.expires_at || '')}">
        <label>Portada</label><input id="invEditCover" value="${esc(inventoryCover(data))}" placeholder="URL de imagen o portada">
        <label>Notas</label><textarea id="invEditNotes">${esc(inventoryNoteText(data))}</textarea>
        <button class="primary" onclick="guardarInventarioEditado('${esc(data.id)}','${isAq ? 'aquarium' : 'general'}')">Guardar cambios</button><div id="x"></div>
      </section>`, active);
    } catch (e) {
      render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'inventario');
    }
  }

  async function guardarInventarioEditado(id, scope) {
    const { supabase, byId, val, num, msg, currentAquarium } = A();
    try {
      const aq = currentAquarium();
      let previousMeta = {};
      try { previousMeta = JSON.parse(val('invEditExistingMeta') || '{}'); } catch (_) { previousMeta = {}; }
      const meta = { ...previousMeta, source: 'manual', scope, purchase_date: val('invEditPurchaseDate'), purchase_place: val('invEditPurchasePlace'), purchase_price: val('invEditPurchasePrice'), batch: val('invEditBatch') };
      const metaHasValue = Object.values(meta).some(Boolean);
      const notes = [metaHasValue ? `AcuarioNexoMeta:${JSON.stringify(meta)}` : '', val('invEditNotes') || ''].filter(Boolean).join('\n');
      const row = { name: val('invEditName'), category: val('invEditCategory') || (scope === 'aquarium' ? 'Equipos' : 'Material general'), quantity: num('invEditQty') ?? 1, unit: val('invEditUnit') || 'unidad', expiry_date: val('invEditExpiry') || null, photo_url: val('invEditCover') || null, notes: notes || null };
      if (scope === 'aquarium' && aq) row.aquarium_id = aq.id;
      const { error } = await supabase.from('inventory_items').update(row).eq('id', id).eq('user_id', window.ANX.state.user.id);
      if (error) throw error;
      window.verInventario(id);
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  }

  window.formInventario = formInventario;
  window.saveInventario = saveInventario;
  window.editarInventario = editarInventario;
  window.guardarInventarioEditado = guardarInventarioEditado;
  window.ANX = window.ANX || {};
  window.ANX.InventoryForm = { formInventario, saveInventario, editarInventario, guardarInventarioEditado };
})();