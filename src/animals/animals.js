/* AcuarioNexo · animals from inventory */
(function () {
  const { supabase, state, esc, msg, token, isCurrent, currentAquarium, render, aqHeader } = window.ANX;

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

  function animalCard(item) {
    const meta = inventoryMeta(item);
    const cover = item.photo_url || meta.library_card?.photo_url || meta.library_card?.cover_url || meta.image_url || meta.cover_url || '';
    const summary = animalSummary(item, meta);
    return `<button class="item inventory-card animal-inventory-card" onclick="verInventario('${esc(item.id)}')">
      <div class="inventory-cover">${cover ? `<img src="${esc(cover)}" alt="${esc(animalName(item, meta))}" loading="lazy">` : '<span>□</span>'}</div>
      <div class="inventory-card-body">
        <div class="inventory-card-head">
          <div><b>${esc(animalName(item, meta))}</b><p class="small">${esc(animalScientific(item, meta) || item.category || 'Animal')} · Cantidad ${esc(item.quantity ?? 1)}</p></div>
          <span>Vivo</span>
        </div>
        ${summary ? `<p>${esc(summary.length > 220 ? `${summary.slice(0, 220)}...` : summary)}</p>` : ''}
      </div>
    </button>`;
  }

  async function animales() {
    const aq = currentAquarium();
    if (!aq) return;
    const t = token();
    render(aqHeader('animales') + `<section class="panel"><div class="panel-head"><h2>Animales</h2><button onclick="importarFichaInventario('aquarium')">Añadir desde ficha</button></div>${msg('Cargando animales vivos...')}</section>`, 'acuarios');
    try {
      const { data, error } = await supabase.from('inventory_items')
        .select('id,name,category,quantity,unit,photo_url,aquarium_id,notes,created_at')
        .eq('user_id', state.user.id)
        .eq('aquarium_id', aq.id)
        .order('created_at', { ascending: false })
        .limit(160);
      if (error) throw error;
      if (!isCurrent(t)) return;
      const rows = (data || []).filter(item => liveCategories.has(item.category || '') && isAlive(item));
      render(aqHeader('animales') + `<section class="panel">
        <div class="panel-head"><h2>Animales vivos</h2><button class="primary" onclick="importarFichaInventario('aquarium')">Añadir desde ficha</button></div>
        <p class="small">Esta pantalla sale del inventario de este acuario. No crea animales aparte.</p>
        <div class="library-grid">${rows.map(animalCard).join('') || msg('Sin animales vivos en el inventario de este acuario.', 'notice')}</div>
      </section>`, 'acuarios');
    } catch (e) {
      if (isCurrent(t)) render(aqHeader('animales') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
    }
  }

  window.animales = animales;
  window.formAnimal = function () { importarFichaInventario('aquarium'); };
  window.saveAnimal = function () { importarFichaInventario('aquarium'); };
})();