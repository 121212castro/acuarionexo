/* AcuarioNexo · Inventario por clases */
(function() {
  const BUILD = 'inventory-router-v1-class-sections';

  const CLASSES = [
    { key: 'all', label: 'Todo', icon: '□', desc: 'Todas las cosas guardadas.' },
    { key: 'medicine', label: 'Medicamentos', icon: '💊', desc: 'Tratamientos, cuarentena, usados y caducidad.' },
    { key: 'product', label: 'Productos y sales', icon: '🧂', desc: 'Sales, aditivos, tests, alimentos y consumibles.' },
    { key: 'equipment', label: 'Equipamiento', icon: '⚙️', desc: 'Bombas, luces, skimmer, filtros y material tecnico.' },
    { key: 'expired', label: 'Caducados', icon: '!', desc: 'Elementos vencidos o para revisar.' },
    { key: 'low_stock', label: 'Bajo stock', icon: '↓', desc: 'Cantidades por debajo del minimo.' },
    { key: 'other', label: 'Otros', icon: '◇', desc: 'Cosas sin clase clara todavia.' }
  ];

  function esc(x) {
    return (window.E ? window.E(x) : String(x ?? '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    }));
  }

  function msg(t, k) {
    return window.M ? window.M(t, k) : '<div class="' + (k || 'notice') + '">' + esc(t) + '</div>';
  }

  function clean(x) {
    return String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function nav(active) {
    const item = (id, label, icon, fn) => '<button class="' + (active === id ? 'active' : '') + '" onclick="' + fn + '"><span>' + icon + '</span><small>' + label + '</small></button>';
    return '<div style="height:140px"></div><nav class="bottom-nav">' +
      item('inicio', 'Inicio', '⌂', 'dashboard()') +
      item('acuarios', 'Acuarios', '▣', 'dashboard()') +
      item('biblioteca', 'Biblioteca', '□', 'biblioteca()') +
      item('avisos', 'Avisos', '♢', 'tareas()') +
      item('microfauna', 'Microfauna', '∞', 'microfauna()') +
    '</nav>';
  }

  function render(html) {
    if (window.S) window.S(html + nav('acuarios'));
  }

  function textValue(v) {
    if (v == null || v === '') return '';
    if (Array.isArray(v)) return v.map(textValue).filter(Boolean).join('\n');
    if (typeof v === 'object') return textValue(v.text || v.texto || v.value || v.valor || v.description || v.descripcion || JSON.stringify(v));
    return String(v).trim();
  }

  function itemClass(item) {
    const payload = item.ficha_json || {};
    const text = clean([
      payload.module,
      payload.module_label,
      payload.source_category,
      payload.category,
      item.category,
      item.name,
      item.brand,
      item.notes,
      item.ai_product_summary
    ].filter(Boolean).join(' '));

    if (/medic|tratamiento|treatment|cobre|copper|parasito|parasite|antiparasit|cuarentena/.test(text)) return 'medicine';
    if (/equip|equipo|equipment|bomba|luz|skimmer|filtro|calentador|reactor|sensor|test(er)?/.test(text)) return 'equipment';
    if (/product|producto|sal\b|salt|aditivo|additive|alimento|food|test|consumible|resina|carbon/.test(text)) return 'product';
    return 'other';
  }

  function isExpired(item) {
    const raw = item.ficha_json || {};
    const date = item.expiry_date || item.expires_at || item.caducidad || raw.expiry_date || raw.caducidad;
    if (!date) return false;
    const t = new Date(date).getTime();
    return Number.isFinite(t) && t < Date.now();
  }

  function isLowStock(item) {
    const q = Number(item.quantity || 0);
    const min = Number(item.min_stock || 0);
    return min > 0 && q <= min;
  }

  function classLabel(key) {
    return (CLASSES.find(c => c.key === key) || CLASSES[0]).label;
  }

  function classItems(items, key) {
    if (key === 'all') return items;
    if (key === 'expired') return items.filter(isExpired);
    if (key === 'low_stock') return items.filter(isLowStock);
    return items.filter(item => itemClass(item) === key);
  }

  function counts(items) {
    return Object.fromEntries(CLASSES.map(c => [c.key, classItems(items, c.key).length]));
  }

  function classesHtml(items, active) {
    const n = counts(items);
    return '<div class="library-modules inventory-classes">' + CLASSES
      .filter(c => c.key === 'all' || n[c.key] > 0)
      .map(c => '<button class="' + (active === c.key ? 'active' : '') + '" onclick="filtrarInventarioClase(\'' + esc(c.key) + '\')"><b>' + esc(c.icon) + ' ' + n[c.key] + '</b><span>' + esc(c.label) + '</span><small>' + esc(c.desc) + '</small></button>')
      .join('') + '</div>';
  }

  function itemSections(item) {
    const p = item.ficha_json || {};
    const fields = [
      ['Resumen rapido', p.description || item.ai_product_summary],
      ['Compatibilidad', p.compatibility],
      ['Alimentacion / uso', p.feeding],
      ['Parametros', textValue(p.parameters)],
      ['Advertencias', p.reef_safe],
      ['Notas', p.acquisition_notes || item.notes],
      ['Fuentes', p.references_text || p.source_url || item.source_url]
    ].filter(([, body]) => textValue(body));

    if (!fields.length && item.notes) fields.push(['Notas', item.notes]);

    return fields.map(([title, body], idx) =>
      '<details class="library-detail-section" ' + (idx === 0 ? 'open' : '') + '><summary>' + esc(title) + '</summary><p>' + esc(textValue(body)).replaceAll('\n', '<br>') + '</p></details>'
    ).join('');
  }

  function itemCard(item) {
    const cls = itemClass(item);
    const badges = [classLabel(cls)];
    if (isExpired(item)) badges.push('Caducado');
    if (isLowStock(item)) badges.push('Bajo stock');
    return '<div class="item inventory-item inventory-' + esc(cls) + '">' +
      (item.photo_url ? '<img src="' + esc(item.photo_url) + '" alt="' + esc(item.name) + '" style="width:100%;max-height:220px;object-fit:contain;background:#fff;border-radius:14px;margin-bottom:10px">' : '') +
      '<p class="small">' + badges.map(esc).join(' · ') + '</p>' +
      '<h3>' + esc(item.name || 'Sin nombre') + '</h3>' +
      '<p class="small">' + esc(item.category || '') + (item.brand ? ' · ' + esc(item.brand) : '') + '</p>' +
      '<p class="small">Cantidad: ' + esc(item.quantity ?? 1) + ' ' + esc(item.unit || 'unidad') + '</p>' +
      itemSections(item) +
    '</div>';
  }

  window.filtrarInventarioClase = function(key) {
    const items = window.__inventarioItemsActual || [];
    const filtered = classItems(items, key);
    const target = document.getElementById('inventarioResultados');
    if (!target) return;
    target.innerHTML = classesHtml(items, key) +
      '<div class="library-section-title"><h3>' + esc(classLabel(key)) + '</h3><p class="small">' + filtered.length + ' elementos encontrados.</p></div>' +
      (filtered.length ? filtered.map(itemCard).join('') : msg('No hay elementos en este apartado.'));
  };

  window.inventario = async function() {
    try {
      if (!window.u) throw new Error('Debes iniciar sesion.');
      const r = await window.s.from('inventory_items').select('*').eq('user_id', window.u.id).order('created_at', { ascending: false }).limit(300);
      if (r.error) throw r.error;
      window.__inventarioItemsActual = r.data || [];
      render('<section class="panel inventory-panel"><h2>Inventario</h2><button onclick="panel()">← Volver</button><p class="small">Separado por clases para encontrar rapido medicamentos, productos, equipamiento y revisiones.</p><div id="inventarioResultados">' + msg('Cargando inventario...') + '</div></section>');
      window.filtrarInventarioClase('all');
    } catch (e) {
      render('<section class="panel"><h2>Inventario</h2>' + msg(e.message, 'error') + '</section>');
    }
  };

  window.__ACUARIONEXO_INVENTORY_ROUTER__ = BUILD;
})();
