/* AcuarioNexo · inventory */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;

const generalInventoryCategories = ['Medicamentos', 'Sales', 'Aditivos', 'Alimentos', 'Tests', 'Material general'];
const marineInventoryCategories = ['Peces marinos', 'Corales', 'Invertebrados', 'Microfauna', 'Equipos'];
const freshwaterInventoryCategories = ['Peces', 'Invertebrados', 'Plantas', 'Equipos'];
const liveCategories = new Set(['Peces marinos', 'Peces', 'Corales', 'Invertebrados', 'Plantas', 'Microfauna']);
const importedSectionLabels = {
  summary: 'Resumen', identity: 'Identificacion', habitat: 'Habitat', aquarium: 'Acuario recomendado',
  parameters: 'Parametros', behavior: 'Comportamiento', feeding: 'Alimentacion', compatibility: 'Compatibilidad',
  reef_safe: 'Reef safe', health: 'Salud', purchase: 'Antes de comprar', mistakes: 'Errores frecuentes',
  breeding: 'Reproduccion', lighting: 'Iluminacion', flow: 'Flujo', placement: 'Ubicacion', co2: 'CO2 / nutrientes',
  maintenance: 'Mantenimiento', uses: 'Usos', dose: 'Dosis', remove: 'Retirar durante tratamiento', risks: 'Riesgos',
  aftercare: 'Seguimiento', inventory_logic: 'Logica AcuarioNexo', mixing: 'Preparacion', use: 'Uso', nutrition: 'Composicion',
  acuarionexo_plan: 'Plan AcuarioNexo', specs: 'Especificaciones', installation: 'Instalacion', reading: 'Lectura',
  range: 'Rangos', storage: 'Conservacion', sources: 'Fuentes', culture: 'Cultivo', harvest: 'Recolecta'
};

function inventoryMode(aq) {
  const type = String(aq?.aquarium_type || aq?.type || '').toLowerCase();
  return /fresh|dulce|plant|gamb|betta|discus/.test(type) ? 'freshwater' : 'marine';
}

function aquariumInventoryCategoriesFor(aq) {
  return inventoryMode(aq) === 'freshwater' ? freshwaterInventoryCategories : marineInventoryCategories;
}

function groupedInventoryHtml(rows, aqName) {
  if (!rows.length) return msg('Sin inventario todavía.');
  const groups = {};
  rows.forEach(item => {
    const key = item.category || 'Sin categoría';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.keys(groups).sort().map(category => `<section class="inventory-group"><h3>${esc(category)}</h3>${groups[category].map(item => inventoryItemHtml(item, aqName)).join('')}</section>`).join('');
}

function inventoryNoteText(item) {
  return String(item.notes || '')
    .replace(/^AcuarioNexoAcuario:[^|\n]+[|\n]\s*/i, '')
    .replace(/^AcuarioNexoMeta:\{[^\n]*\}\n?/i, '')
    .replace(/^AcuarioNexoLibrary:[^\n]*\n?/i, '')
    .trim();
}

function inventoryMeta(item) {
  const text = String(item.notes || '');
  const match = text.match(/^AcuarioNexoMeta:(\{[^\n]*\})/i) || text.match(/\nAcuarioNexoMeta:(\{[^\n]*\})/i);
  if (!match) return {};
  try { return JSON.parse(match[1]); } catch (_) { return {}; }
}

function sectionText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(sectionText).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    return Object.entries(value).map(([key, val]) => {
      const text = sectionText(val);
      return text ? `${key}: ${text}` : '';
    }).filter(Boolean).join('\n');
  }
  return String(value);
}

function importedFichaHtml(meta) {
  const card = meta.library_card;
  if (!card || typeof card !== 'object') return '';
  const sections = card.sections && typeof card.sections === 'object' ? card.sections : {};
  const rows = Object.keys(sections).map(key => {
    const text = sectionText(sections[key]);
    if (!text) return '';
    return `<section class="library-detail-section inventory-imported-section"><h3>${esc(importedSectionLabels[key] || key)}</h3><p>${esc(text).replace(/\n/g, '<br>')}</p></section>`;
  }).filter(Boolean).join('');
  const tags = Array.isArray(card.tags) && card.tags.length ? `<p class="small"><b>Etiquetas:</b> ${esc(card.tags.join(', '))}</p>` : '';
  const source = card.source_notes ? `<section class="library-detail-section inventory-imported-section"><h3>Fuente original</h3><p>${esc(sectionText(card.source_notes)).replace(/\n/g, '<br>')}</p></section>` : '';
  return `<section class="inventory-imported-card">
    <div class="panel-head"><h3>Ficha tecnica importada</h3><small>${esc(card.type_label || card.type || 'Biblioteca')}</small></div>
    <h2>${esc(card.title || 'Ficha')}</h2>
    ${card.scientific_name ? `<p class="scientific">${esc(card.scientific_name)}</p>` : ''}
    ${tags}
    ${rows || (card.summary ? `<section class="library-detail-section inventory-imported-section"><h3>Resumen</h3><p>${esc(card.summary)}</p></section>` : '')}
    ${source}
  </section>`;
}

function inventoryCover(item) {
  const meta = inventoryMeta(item);
  return item.photo_url || meta.library_card?.photo_url || meta.library_card?.cover_url || meta.cover_url || meta.image_url || '';
}

function inventoryExpiryStatus(item) {
  const exp = item.expiry_date || inventoryMeta(item).expires_at || '';
  if (!exp) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${exp}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.round((date - today) / 86400000);
  if (days < 0) return 'caducado';
  if (days <= 30) return 'caduca pronto';
  return 'ok';
}

function inventoryAqId(item) {
  if (item.aquarium_id) return String(item.aquarium_id);
  const note = String(item.notes || '');
  const match = note.match(/^AcuarioNexoAcuario:([^|\n]+)/i);
  return match ? match[1] : '';
}

function afterDeleteRoute(item) {
  const aqId = inventoryAqId(item);
  const aq = aqId && currentAquarium()?.id === aqId ? currentAquarium() : null;
  if (aq && liveCategories.has(item.category || '') && typeof window.animales === 'function') return window.animales();
  if (aq) return window.inventario('aquarium');
  return window.inventario('general');
}

function inventoryItemHtml(item, aqName) {
  const cleanNotes = inventoryNoteText(item);
  const shortNotes = cleanNotes.length > 180 ? `${cleanNotes.slice(0, 180)}...` : cleanNotes;
  const scope = inventoryAqId(item) ? (aqName || 'Acuario') : 'General';
  const expiry = item.expiry_date || inventoryMeta(item).expires_at || '';
  const meta = inventoryMeta(item);
  const expiryStatus = inventoryExpiryStatus(item);
  const cover = inventoryCover(item);
  const hasFicha = meta.library_card ? ' · ficha completa' : '';
  return `<button class="item inventory-card inventory-ficha-card" onclick="verInventario('${esc(item.id)}')">
    <div class="inventory-cover">${cover ? `<img src="${esc(cover)}" alt="${esc(item.name || 'Inventario')}" loading="lazy" onerror="this.replaceWith(document.createTextNode('▤'))">` : '<span>▤</span>'}</div>
    <div class="inventory-card-body">
      <div class="inventory-card-head">
        <div><b>${esc(item.name || 'Item')}</b><p class="small">${esc(item.category || 'Inventario')} · ${esc(item.quantity ?? '-')} ${esc(item.unit || '')}${hasFicha}</p></div>
        <span>${esc(scope)}</span>
      </div>
      ${(meta.purchase_date || meta.purchase_place || meta.purchase_price) ? `<p class="small">Compra: ${esc([meta.purchase_date, meta.purchase_place, meta.purchase_price].filter(Boolean).join(' · '))}</p>` : ''}
      ${expiry ? `<p class="small inventory-expiry ${esc(expiryStatus)}">Caducidad: ${esc(expiry)}${expiryStatus ? ` · ${esc(expiryStatus)}` : ''}</p>` : ''}
      ${shortNotes ? `<p>${esc(shortNotes)}</p>` : ''}
    </div>
  </button>`;
}

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
    const filtered = isAq
      ? rows.filter(item => inventoryAqId(item) === String(aq.id))
      : rows.filter(item => !inventoryAqId(item));
    const html = groupedInventoryHtml(filtered, isAq ? aq.name : '');
    const tabs = `<div class="inventory-tabs">
      <button class="${isAq ? 'active' : ''}" ${aq ? `onclick="openAqSection('inventario')"` : 'disabled'}>Este acuario</button>
      <button class="${!isAq ? 'active' : ''}" onclick="inventario('general')">General compartido</button>
    </div>`;
    const hint = isAq
      ? '<p class="small inventory-hint">Aqui van los habitantes, microfauna y equipos que pertenecen solo a este acuario.</p>'
      : '<p class="small inventory-hint">Aqui van medicamentos, sales, aditivos, alimentos, tests y material compartido entre acuarios.</p>';
    render(head + `<section class="panel"><div class="panel-head"><h2>${esc(title)}</h2><div class="inline-actions"><button onclick="importarFichaInventario('${isAq ? 'aquarium' : 'general'}')">Desde ficha</button><button class="primary" onclick="formInventario('${isAq ? 'aquarium' : 'general'}')">Añadir manual</button></div></div>${tabs}${hint}${html || msg('Sin inventario todavía.')}</section>`, active);
  } catch (e) {
    if (isCurrent(t)) render(head + `<section class="panel">${msg(e.message, 'error')}</section>`, active);
  }
};

window.formInventario = function (scope = 'general') {
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
};

window.saveInventario = async function () {
  try {
    if (!val('invName')) throw new Error('Pon un nombre.');
    const aq = currentAquarium();
    const scope = val('invScope') || 'general';
    const meta = {
      source: 'manual',
      scope,
      purchase_date: val('invPurchaseDate'),
      purchase_place: val('invPurchasePlace'),
      purchase_price: val('invPurchasePrice'),
      batch: val('invBatch')
    };
    const metaHasValue = Object.values(meta).some(Boolean);
    const notes = [metaHasValue ? `AcuarioNexoMeta:${JSON.stringify(meta)}` : '', val('invNotes') || ''].filter(Boolean).join('\n');
    const row = {
      user_id: state.user.id,
      name: val('invName'),
      category: val('invCategory') || (scope === 'aquarium' ? 'Equipos' : 'Material general'),
      quantity: num('invQty') ?? 1,
      unit: val('invUnit') || 'unidad',
      expiry_date: val('invExpiry') || null,
      photo_url: val('invCover') || null,
      notes: notes || null
    };
    if (scope === 'aquarium') {
      if (!aq) throw new Error('Abre un acuario para guardar inventario del acuario.');
      row.aquarium_id = aq.id;
    }
    const { error } = await supabase.from('inventory_items').insert(row);
    if (error) throw error;
    scope === 'aquarium' ? inventario('aquarium') : inventario('general');
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
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
      <div class="inventory-detail-head">
        <div><small>${esc(data.category || 'Inventario')}</small><h2>${esc(data.name || 'Item')}</h2></div>
        ${status ? `<span class="${esc(status)}">${esc(status)}</span>` : ''}
      </div>
      <div class="inventory-fields">
        <div><small>Cantidad</small><b>${esc(data.quantity ?? '-')} ${esc(data.unit || '')}</b></div>
        <div><small>Ámbito</small><b>${esc(isAq ? (aq?.name || 'Acuario') : 'General compartido')}</b></div>
        <div><small>Caducidad</small><b>${esc(expiry || 'Sin fecha')}</b></div>
        <div><small>Fecha compra / alta</small><b>${esc(meta.purchase_date || 'Sin fecha')}</b></div>
        <div><small>Compra / procedencia</small><b>${esc(meta.purchase_place || 'Sin dato')}</b></div>
        <div><small>Precio</small><b>${esc(meta.purchase_price || 'Sin dato')}</b></div>
        <div><small>Lote / SKU</small><b>${esc(meta.batch || 'Sin dato')}</b></div>
      </div>
      ${cleanNotes ? `<section class="library-detail-section"><h3>Notas</h3><p>${esc(cleanNotes)}</p></section>` : ''}
      ${importedFichaHtml(meta)}
      <div class="inline-actions">
        <button class="primary" onclick="editarInventario('${esc(data.id)}')">Editar ficha</button>
        <button class="ghost danger" onclick="eliminarInventario('${esc(data.id)}')">🗑 Eliminar</button>
      </div>
    </section>`, active);
  } catch (e) {
    render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'inventario');
  }
};

window.editarInventario = async function (id) {
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
      <button onclick="verInventario('${esc(data.id)}')">← Volver</button>
      <h2>Editar ficha</h2>
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
      <button class="primary" onclick="guardarInventarioEditado('${esc(data.id)}','${isAq ? 'aquarium' : 'general'}')">Guardar cambios</button>
      <div id="x"></div>
    </section>`, active);
  } catch (e) {
    render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'inventario');
  }
};

window.guardarInventarioEditado = async function (id, scope) {
  try {
    const aq = currentAquarium();
    let previousMeta = {};
    try { previousMeta = JSON.parse(val('invEditExistingMeta') || '{}'); } catch (_) { previousMeta = {}; }
    const meta = {
      ...previousMeta,
      source: 'manual',
      scope,
      purchase_date: val('invEditPurchaseDate'),
      purchase_place: val('invEditPurchasePlace'),
      purchase_price: val('invEditPurchasePrice'),
      batch: val('invEditBatch')
    };
    const metaHasValue = Object.values(meta).some(Boolean);
    const notes = [metaHasValue ? `AcuarioNexoMeta:${JSON.stringify(meta)}` : '', val('invEditNotes') || ''].filter(Boolean).join('\n');
    const row = {
      name: val('invEditName'),
      category: val('invEditCategory') || (scope === 'aquarium' ? 'Equipos' : 'Material general'),
      quantity: num('invEditQty') ?? 1,
      unit: val('invEditUnit') || 'unidad',
      expiry_date: val('invEditExpiry') || null,
      photo_url: val('invEditCover') || null,
      notes: notes || null
    };
    if (scope === 'aquarium' && aq) row.aquarium_id = aq.id;
    const { error } = await supabase.from('inventory_items').update(row).eq('id', id).eq('user_id', state.user.id);
    if (error) throw error;
    verInventario(id);
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
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

  window.ANX.inventoryMeta = inventoryMeta;
  window.ANX.inventoryExpiryStatus = inventoryExpiryStatus;
})();