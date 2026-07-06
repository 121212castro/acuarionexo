/* AcuarioNexo · animals core */
(function () {
  const { esc } = window.ANX;

  const liveCategories = new Set(['Peces marinos', 'Peces', 'Corales', 'Invertebrados', 'Plantas', 'Microfauna']);

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

  function isAlive(item) {
    const meta = inventoryMeta(item);
    const status = String(meta.status || item.status || '').toLowerCase();
    if (/dead|baja|muerto|retirado|lost|vendido/.test(status)) return false;
    return Number(item.quantity ?? 1) > 0;
  }

  function animalName(item, meta) {
    return meta.library_card?.title || item.name || 'Animal';
  }

  function animalScientific(item, meta) {
    return meta.library_card?.scientific_name || '';
  }

  function animalSummary(item, meta) {
    const card = meta.library_card || {};
    return card.summary || sectionText(card.sections?.summary) || '';
  }

  function animalCover(item, meta) {
    return item.photo_url || meta.library_card?.photo_url || meta.library_card?.cover_url || meta.image_url || meta.cover_url || '';
  }

  function animalCard(item) {
    const meta = inventoryMeta(item);
    const name = animalName(item, meta);
    const cover = animalCover(item, meta);
    const summary = animalSummary(item, meta);
    return `<article class="item inventory-card animal-inventory-card" onclick="verInventario('${esc(item.id)}')">
      <div class="inventory-cover">${cover ? `<img src="${esc(cover)}" alt="${esc(name)}" loading="lazy" onerror="this.replaceWith(document.createTextNode('□'))">` : '<span>□</span>'}</div>
      <div class="inventory-card-body">
        <div class="inventory-card-head">
          <div><b>${esc(name)}</b><p class="small">${esc(animalScientific(item, meta) || item.category || 'Animal')} · Cantidad ${esc(item.quantity ?? 1)}</p></div>
          <div class="inline-actions"><span>Vivo</span><button class="ghost danger" onclick="event.stopPropagation(); eliminarAnimalInventario('${esc(item.id)}', '${esc(name)}')">🗑 Eliminar</button></div>
        </div>
        ${summary ? `<p>${esc(summary.length > 220 ? `${summary.slice(0, 220)}...` : summary)}</p>` : ''}
      </div>
    </article>`;
  }

  window.ANX.AnimalsCore = {
    liveCategories,
    inventoryMeta,
    sectionText,
    isAlive,
    animalName,
    animalScientific,
    animalSummary,
    animalCover,
    animalCard
  };
})();
