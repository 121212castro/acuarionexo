/* AcuarioNexo · Biblioteca · importacion a acuario/inventario */
(function(){
  const { supabase, state, esc, byId, val, msg, render } = window.ANX;

  const types = [
    ['pez_marino', 'Pez marino'], ['pez_dulce', 'Pez de agua dulce'], ['coral', 'Coral'],
    ['invertebrado', 'Invertebrado'], ['planta', 'Planta'], ['microfauna', 'Microfauna'],
    ['producto', 'Producto'], ['medicamento', 'Medicamento'], ['sal', 'Sal'], ['aditivo', 'Aditivo'],
    ['alimento', 'Alimento'], ['equipamiento', 'Equipo'], ['test', 'Test'], ['general', 'General']
  ];
  const labels = Object.fromEntries(types);
  const productTypes = new Set(['producto', 'medicamento', 'sal', 'aditivo', 'alimento', 'test']);
  const typeName = type => labels[type] || type || 'Ficha';

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
      producto: 'Productos',
      medicamento: 'Medicamentos',
      sal: 'Sales',
      aditivo: 'Aditivos',
      alimento: 'Alimentos',
      test: 'Tests'
    };
    return map[type] || typeName(type);
  }

  function fichaCompleta(row) {
    if (!row) return false;
    if (['validated', 'published'].includes(row.status)) return true;
    try {
      const audit = window.ANX.LibrarySchema.audit(row);
      return !!audit.approved;
    } catch (_) {
      return false;
    }
  }

  function inventoryBackAction(scope) {
    return scope === 'aquarium' ? "openAqSection('inventario')" : "inventario('general')";
  }

  async function loadRows() {
    const { data, error } = await supabase.from('library_entries').select('*').order('updated_at', { ascending: false }).limit(200);
    if (error) throw error;
    state.libraryRows = data || [];
  }

  async function loadInventoryAquariums() {
    if (Array.isArray(state.aquariums) && state.aquariums.length) return state.aquariums;
    const { data, error } = await supabase.from('aquariums').select('id,name,aquarium_type,status,created_at').eq('user_id', state.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    state.aquariums = data || [];
    return state.aquariums;
  }

  function importableRowsForScope(scope) {
    return (state.libraryRows || []).filter(row => inventoryScopeForType(row.entry_type) === scope && fichaCompleta(row));
  }

  function aquariumOptionsHtml(selectedId) {
    const list = state.aquariums || [];
    return list.map(aq => `<option value="${esc(aq.id)}" ${String(aq.id) === String(selectedId || '') ? 'selected' : ''}>${esc(aq.name || 'Acuario')} · ${esc(aq.aquarium_type || 'acuario')}</option>`).join('');
  }

  function importMetaFromForm(row, scope) {
    return {
      source: 'library',
      copied_from_library: true,
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
        sections: row.sections || {},
        data: row.data || {}
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

  window.importarFichaInventario = async function(scope = 'general') {
    if (!state.user) return login();
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
        <div class="panel-head"><h2>${realScope === 'aquarium' ? 'Añadir copia al acuario desde Biblioteca' : 'Añadir producto desde Biblioteca'}</h2></div>
        <p class="small">${realScope === 'aquarium' ? 'Elige una ficha completa de animal, coral, planta, microfauna o equipo. Se creará una copia real para este acuario y la ficha original seguirá en Biblioteca.' : 'Elige una ficha completa de producto y crea su registro real compartido.'}</p>
        <div class="library-grid">${rows.map(row => `<button class="library-card library-cover-card" onclick="formImportarFichaInventario('${esc(row.id)}','${realScope}')">
          ${(row.cover_url || row.photo_url) ? `<img class="library-card-cover" src="${esc(row.cover_url || row.photo_url)}" alt="${esc(row.title || 'Ficha')}" loading="lazy">` : `<div class="library-card-cover library-no-photo">${esc(typeName(row.entry_type).slice(0, 1))}</div>`}
          <div class="library-card-body"><h3>${esc(row.title || 'Ficha')}</h3><p class="scientific">${esc(row.scientific_name || typeName(row.entry_type))}</p><small>${esc(typeName(row.entry_type))}</small></div>
        </button>`).join('') || msg(realScope === 'aquarium' ? 'No hay fichas completas compatibles para añadir al acuario.' : 'No hay fichas completas compatibles para añadir como producto.', 'notice')}</div>
      </section>`, active);
    } catch (e) {
      render(head + `<section class="panel">${msg(e.message, 'error')}</section>`, active);
    }
  };

  window.formImportarFichaInventario = function(id, scope = 'general') {
    const row = (state.libraryRows || []).find(r => String(r.id) === String(id));
    if (!row) return importarFichaInventario(scope);
    if (!fichaCompleta(row)) {
      const box = byId('x') || byId('aiBox');
      if (box) box.innerHTML = msg('Solo fichas completas.', 'error');
      return;
    }
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
      <button class="primary" onclick="guardarImportacionFichaInventario('${esc(row.id)}','${realScope}')">${realScope === 'aquarium' ? 'Guardar copia en acuario' : 'Guardar producto'}</button>
      <div id="x"></div>
    </section>`, active);
  };

  window.guardarImportacionFichaInventario = async function(id, scope = 'general') {
    try {
      const row = (state.libraryRows || []).find(r => String(r.id) === String(id));
      if (!row) throw new Error('No encuentro la ficha cargada.');
      if (!fichaCompleta(row)) throw new Error('Solo fichas completas.');
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
        photo_url: row.cover_url || row.photo_url || null,
        notes: inventoryNotesFromImport(row, meta),
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('inventory_items').insert(payload);
      if (error) throw error;
      if (realScope === 'aquarium' && aq && String(aq.id) === String(targetAquariumId)) inventario('aquarium');
      else inventario('general');
    } catch (e) {
      const box = byId('x') || byId('aiBox');
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  window.pasarFichaAInventario = async function(id) {
    await loadRows();
    const row = (state.libraryRows || []).find(r => String(r.id) === String(id));
    if (!row) return biblioteca();
    if (!fichaCompleta(row)) {
      const box = byId('x') || byId('aiBox');
      if (box) box.innerHTML = msg('Solo fichas completas.', 'error');
      return;
    }
    const scope = inventoryScopeForType(row.entry_type);
    if (scope === 'aquarium') {
      try { await loadInventoryAquariums(); }
      catch (e) { const box = byId('x') || byId('aiBox'); if (box) box.innerHTML = msg(e.message, 'error'); return; }
    }
    formImportarFichaInventario(id, scope);
  };

  window.ANX.LibraryInventoryImport = {
    inventoryScopeForType,
    inventoryCategoryFor,
    fichaCompleta
  };
})();