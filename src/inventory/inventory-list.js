/* AcuarioNexo · Inventory list */
(function () {
  function A() { return window.ANX || {}; }

  const INVENTORY_GROUP_ORDER = [
    'Peces marinos', 'Peces', 'Corales', 'Invertebrados', 'Plantas', 'Microfauna', 'Equipos',
    'Medicamentos', 'Sales', 'Aditivos', 'Alimentos', 'Tests', 'Material general', 'Sin categoría'
  ];

  const IMPORTED_GROUPS = [
    { id: 'identity', label: 'Identificación', keys: ['summary', 'identity', 'habitat', 'aquarium', 'specs'] },
    { id: 'parameters', label: 'Parámetros y requisitos', keys: ['parameters', 'range', 'lighting', 'flow', 'placement', 'co2', 'maintenance', 'culture', 'harvest'] },
    { id: 'use', label: 'Uso, alimentación y dosis', keys: ['feeding', 'nutrition', 'uses', 'use', 'dose', 'remove', 'mixing', 'reading', 'installation'] },
    { id: 'compatibility', label: 'Compatibilidad y salud', keys: ['behavior', 'compatibility', 'reef_safe', 'health', 'breeding'] },
    { id: 'risks', label: 'Riesgos y compra', keys: ['purchase', 'mistakes', 'risks', 'aftercare', 'inventory_logic', 'acuarionexo_plan', 'storage'] },
    { id: 'sources', label: 'Fuentes', keys: ['sources'] }
  ];

  function normalize(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function itemSearchText(item) {
    const { inventoryNoteText, inventoryMeta, sectionText } = A();
    const meta = inventoryMeta(item);
    const card = meta.library_card || {};
    return normalize([
      item.name,
      item.category,
      item.quantity,
      item.unit,
      item.expiry_date,
      inventoryNoteText(item),
      meta.purchase_date,
      meta.purchase_place,
      meta.purchase_price,
      meta.batch,
      card.title,
      card.scientific_name,
      card.summary,
      sectionText(card.sections || {})
    ].filter(Boolean).join(' '));
  }

  function filterInventoryRows(rows, query) {
    const q = normalize(query);
    if (!q) return rows;
    return rows.filter(item => itemSearchText(item).includes(q));
  }

  function groupSort(a, b) {
    const ai = INVENTORY_GROUP_ORDER.indexOf(a);
    const bi = INVENTORY_GROUP_ORDER.indexOf(b);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.localeCompare(b, 'es');
  }

  function groupedInventoryHtml(rows, aqName, options = {}) {
    const { esc, msg } = A();
    const query = options.query || '';
    const filtered = filterInventoryRows(rows || [], query);
    if (!filtered.length) return msg(query ? 'No hay resultados para esa búsqueda.' : 'Sin inventario todavía.');
    const groups = {};
    filtered.forEach(item => {
      const key = item.category || 'Sin categoría';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.keys(groups).sort(groupSort).map((category, index) => {
      const items = groups[category];
      const open = query || index === 0 ? ' open' : '';
      return `<details class="inventory-group inventory-accordion"${open}>
        <summary><span>${esc(category)}</span><small>${items.length} ${items.length === 1 ? 'elemento' : 'elementos'}</small></summary>
        <div class="inventory-group-body">${items.map(item => inventoryItemHtml(item, aqName)).join('')}</div>
      </details>`;
    }).join('');
  }

  function sectionBlock(key, value) {
    const { esc, importedSectionLabels, sectionText } = A();
    const text = sectionText(value);
    if (!text) return '';
    return `<details class="library-detail-section inventory-imported-section inventory-answer-detail">
      <summary>${esc(importedSectionLabels[key] || key)}</summary>
      <p>${esc(text).replace(/\n/g, '<br>')}</p>
    </details>`;
  }

  function importedFichaHtml(meta) {
    const { esc, sectionText } = A();
    const card = meta.library_card;
    if (!card || typeof card !== 'object') return '';
    const sections = card.sections && typeof card.sections === 'object' ? card.sections : {};
    const used = new Set();
    const grouped = IMPORTED_GROUPS.map((group, index) => {
      const content = group.keys.map(key => {
        used.add(key);
        return sectionBlock(key, sections[key]);
      }).filter(Boolean).join('');
      if (!content) return '';
      return `<details class="inventory-imported-group"${index === 0 ? ' open' : ''}>
        <summary><span>${esc(group.label)}</span></summary>
        ${content}
      </details>`;
    }).filter(Boolean).join('');
    const extra = Object.keys(sections).filter(key => !used.has(key)).map(key => sectionBlock(key, sections[key])).filter(Boolean).join('');
    const extraGroup = extra ? `<details class="inventory-imported-group"><summary><span>Otros datos de la ficha</span></summary>${extra}</details>` : '';
    const tags = Array.isArray(card.tags) && card.tags.length ? `<p class="small"><b>Etiquetas:</b> ${esc(card.tags.join(', '))}</p>` : '';
    const source = card.source_notes ? `<details class="inventory-imported-group"><summary><span>Fuente original</span></summary><p>${esc(sectionText(card.source_notes)).replace(/\n/g, '<br>')}</p></details>` : '';
    return `<section class="inventory-imported-card">
      <div class="panel-head"><h3>Ficha técnica importada</h3><small>${esc(card.type_label || card.type || 'Biblioteca')}</small></div>
      <h2>${esc(card.title || 'Ficha')}</h2>
      ${card.scientific_name ? `<p class="scientific">${esc(card.scientific_name)}</p>` : ''}
      ${tags}
      ${grouped || (card.summary ? `<details class="inventory-imported-group" open><summary><span>Resumen</span></summary><p>${esc(card.summary)}</p></details>` : '')}
      ${extraGroup}
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
  Object.assign(window.ANX, { groupedInventoryHtml, importedFichaHtml, inventoryItemHtml, filterInventoryRows });
  window.ANX.InventoryList = { groupedInventoryHtml, importedFichaHtml, inventoryItemHtml, filterInventoryRows };
})();