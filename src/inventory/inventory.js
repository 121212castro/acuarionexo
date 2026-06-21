/* AcuarioNexo · inventory */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;

const generalInventoryCategories = ['Medicamento', 'Test', 'Comida', 'Material general'];
const aquariumInventoryCategories = ['Pez', 'Planta', 'Invertebrado', 'Coral', 'Equipo'];

function inventoryNoteText(item) {
  return String(item.notes || '')
    .replace(/^AcuarioNexoAcuario:[^|\n]+[|\n]\s*/i, '')
    .replace(/^AcuarioNexoMeta:\{[^\n]*\}\n?/i, '')
    .trim();
}

function inventoryMeta(item) {
  const text = String(item.notes || '');
  const match = text.match(/^AcuarioNexoMeta:(\{[^\n]*\})/i) || text.match(/\nAcuarioNexoMeta:(\{[^\n]*\})/i);
  if (!match) return {};
  try { return JSON.parse(match[1]); } catch (_) { return {}; }
}

function inventoryCover(item) {
  const meta = inventoryMeta(item);
  return item.photo_url || meta.cover_url || meta.image_url || '';
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

function inventoryItemHtml(item, aqName) {
  const cleanNotes = inventoryNoteText(item);
  const shortNotes = cleanNotes.length > 180 ? `${cleanNotes.slice(0, 180)}...` : cleanNotes;
  const scope = inventoryAqId(item) ? (aqName || 'Acuario') : 'General';
  const expiry = item.expiry_date || inventoryMeta(item).expires_at || '';
  const expiryStatus = inventoryExpiryStatus(item);
  const cover = inventoryCover(item);
  return `<button class="item inventory-card inventory-ficha-card" onclick="verInventario('${esc(item.id)}')">
    <div class="inventory-cover">${cover ? `<img src="${esc(cover)}" alt="${esc(item.name || 'Inventario')}" loading="lazy">` : '<span>▤</span>'}</div>
    <div class="inventory-card-body">
      <div class="inventory-card-head">
        <div><b>${esc(item.name || 'Item')}</b><p class="small">${esc(item.category || 'Inventario')} · ${esc(item.quantity ?? '-')} ${esc(item.unit || '')}</p></div>
        <span>${esc(scope)}</span>
      </div>
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
  render(head + `<section class="panel"><div class="panel-head"><h2>${esc(title)}</h2><button class="primary" onclick="formInventario('${isAq ? 'aquarium' : 'general'}')">Añadir</button></div>${msg('Cargando inventario...')}</section>`, active);
  try {
    const { data, error } = await supabase.from('inventory_items').select('id,name,category,quantity,unit,photo_url,aquarium_id,expiry_date,notes,created_at').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(120);
    if (error) throw error;
    if (!isCurrent(t)) return;
    const rows = data || [];
    const filtered = isAq
      ? rows.filter(item => inventoryAqId(item) === String(aq.id))
      : rows.filter(item => !inventoryAqId(item));
    const html = filtered.map(item => inventoryItemHtml(item, isAq ? aq.name : '')).join('');
    const tabs = `<div class="inventory-tabs">
      <button class="${isAq ? 'active' : ''}" ${aq ? `onclick="openAqSection('inventario')"` : 'disabled'}>Este acuario</button>
      <button class="${!isAq ? 'active' : ''}" onclick="inventario('general')">General compartido</button>
    </div>`;
    const hint = isAq
      ? '<p class="small inventory-hint">Aqui van habitantes, plantas, invertebrados, corales y equipo que pertenecen solo a este acuario.</p>'
      : '<p class="small inventory-hint">Aqui van medicamentos, tests, comida y material que pueden servir para varios acuarios.</p>';
    render(head + `<section class="panel"><div class="panel-head"><h2>${esc(title)}</h2><button class="primary" onclick="formInventario('${isAq ? 'aquarium' : 'general'}')">Añadir</button></div>${tabs}${hint}${html || msg('Sin inventario todavía.')}</section>`, active);
  } catch (e) {
    if (isCurrent(t)) render(head + `<section class="panel">${msg(e.message, 'error')}</section>`, active);
  }
};

window.formInventario = function (scope = 'general') {
  const aq = currentAquarium();
  const isAq = scope === 'aquarium' && aq;
  const active = isAq ? 'acuarios' : 'inventario';
  const head = isAq ? aqHeader('inventario') : '';
  const categories = isAq ? aquariumInventoryCategories : generalInventoryCategories;
  const categoryOptions = categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  render(head + `<section class="panel"><button onclick="${isAq ? "openAqSection('inventario')" : "inventario('general')"}">← Volver</button><h2>${isAq ? 'Nuevo item del acuario' : 'Nuevo item general'}</h2>
    <label>Nombre</label><input id="invName">
    <label>Categoría</label><select id="invCategory">${categoryOptions}</select>
    <label>Cantidad</label><input id="invQty" type="number" step="0.1" value="1">
    <label>Unidad</label><input id="invUnit" value="unidad" placeholder="unidad, ml, g, bote...">
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
    const row = {
      user_id: state.user.id,
      name: val('invName'),
      category: val('invCategory') || (scope === 'aquarium' ? 'Equipo' : 'Material general'),
      quantity: num('invQty') ?? 1,
      unit: val('invUnit') || 'unidad',
      expiry_date: val('invExpiry') || null,
      photo_url: val('invCover') || null,
      notes: val('invNotes') || null
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
    const status = inventoryExpiryStatus(data);
    const cover = inventoryCover(data);
    render(head + `<section class="panel inventory-detail">
      <button onclick="${isAq && aq ? "openAqSection('inventario')" : "inventario('general')"}">← Volver</button>
      ${cover ? `<img class="inventory-detail-cover" src="${esc(cover)}" alt="${esc(data.name || 'Inventario')}">` : '<div class="inventory-detail-cover empty">▤</div>'}
      <div class="inventory-detail-head">
        <div><small>${esc(data.category || 'Inventario')}</small><h2>${esc(data.name || 'Item')}</h2></div>
        ${status ? `<span class="${esc(status)}">${esc(status)}</span>` : ''}
      </div>
      <div class="inventory-fields">
        <div><small>Cantidad</small><b>${esc(data.quantity ?? '-')} ${esc(data.unit || '')}</b></div>
        <div><small>Ámbito</small><b>${esc(isAq ? (aq?.name || 'Acuario') : 'General compartido')}</b></div>
        <div><small>Caducidad</small><b>${esc(expiry || 'Sin fecha')}</b></div>
      </div>
      ${cleanNotes ? `<section class="library-detail-section"><h3>Notas</h3><p>${esc(cleanNotes)}</p></section>` : ''}
      <button class="primary" onclick="editarInventario('${esc(data.id)}')">Editar ficha</button>
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
    const categories = isAq ? aquariumInventoryCategories : generalInventoryCategories;
    const categoryOptions = categories.map(c => `<option value="${esc(c)}" ${data.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
    const meta = inventoryMeta(data);
    render(head + `<section class="panel">
      <button onclick="verInventario('${esc(data.id)}')">← Volver</button>
      <h2>Editar ficha</h2>
      <label>Nombre</label><input id="invEditName" value="${esc(data.name || '')}">
      <label>Categoría</label><select id="invEditCategory">${categoryOptions}</select>
      <label>Cantidad</label><input id="invEditQty" type="number" step="0.1" value="${esc(data.quantity ?? 1)}">
      <label>Unidad</label><input id="invEditUnit" value="${esc(data.unit || 'unidad')}">
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
    const row = {
      name: val('invEditName'),
      category: val('invEditCategory') || (scope === 'aquarium' ? 'Equipo' : 'Material general'),
      quantity: num('invEditQty') ?? 1,
      unit: val('invEditUnit') || 'unidad',
      expiry_date: val('invEditExpiry') || null,
      photo_url: val('invEditCover') || null,
      notes: val('invEditNotes') || null
    };
    if (scope === 'aquarium' && aq) row.aquarium_id = aq.id;
    const { error } = await supabase.from('inventory_items').update(row).eq('id', id).eq('user_id', state.user.id);
    if (error) throw error;
    verInventario(id);
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

  window.ANX.inventoryMeta = inventoryMeta;
  window.ANX.inventoryExpiryStatus = inventoryExpiryStatus;
})();