/* AcuarioNexo · Inventory list */
(function () {
  function A() { return window.ANX || {}; }

  function groupedInventoryHtml(rows, aqName) {
    const { esc, msg } = A();
    if (!rows.length) return msg('Sin inventario todavía.');
    const groups = {};
    rows.forEach(item => {
      const key = item.category || 'Sin categoría';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.keys(groups).sort().map(category => `<section class="inventory-group"><h3>${esc(category)}</h3>${groups[category].map(item => inventoryItemHtml(item, aqName)).join('')}</section>`).join('');
  }

  function importedFichaHtml(meta) {
    const { esc, importedSectionLabels, sectionText } = A();
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

  function inventoryItemHtml(item, aqName) {
    const { esc, inventoryNoteText, inventoryAqId, inventoryMeta, inventoryExpiryStatus, inventoryCover } = A();
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

  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { groupedInventoryHtml, importedFichaHtml, inventoryItemHtml });
  window.ANX.InventoryList = { groupedInventoryHtml, importedFichaHtml, inventoryItemHtml };
})();