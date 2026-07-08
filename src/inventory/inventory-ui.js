/* AcuarioNexo · Inventory UI helpers */
(function () {
  function byId(id) { return document.getElementById(id); }
  function val(id) { return byId(id)?.value || ''; }
  function num(id) { const raw = val(id); if (raw === '') return null; const n = Number(String(raw).replace(',', '.')); return Number.isFinite(n) ? n : null; }

  function isInventoryScreen(app) {
    const text = app?.textContent || '';
    return /Inventario general|Inventario de|Registro del acuario|Registro de/.test(text);
  }

  function isAquariumInventoryScreen(app) {
    const text = app?.textContent || '';
    return /Aqui van los habitantes|Aquí van los habitantes|Este acuario|Registro del acuario|Registro de/.test(text);
  }

  function normalizeInventoryTexts() {
    const app = byId('app');
    if (!app || !isInventoryScreen(app)) return;
    const aquariumScope = isAquariumInventoryScreen(app);
    app.querySelectorAll('button').forEach(function (btn) {
      const label = (btn.textContent || '').trim();
      if (label === 'Desde ficha') btn.textContent = aquariumScope ? 'Añadir copia desde Biblioteca' : 'Añadir desde ficha existente';
    });
  }

  function ensureInventoryNotice() {
    const app = byId('app');
    if (!app || !isInventoryScreen(app) || byId('inventoryImportNotice')) return;
    const aquariumScope = isAquariumInventoryScreen(app);
    const target = Array.from(app.querySelectorAll('.panel')).find(function (panel) {
      return /Inventario|Registro/.test(panel.textContent || '');
    });
    if (!target) return;
    const html = aquariumScope
      ? '<div id="inventoryImportNotice" class="notice"><b>Registro real del acuario.</b><br>Añade aquí solo habitantes, microfauna y equipos que tienes en este acuario. Al añadir desde Biblioteca se crea una copia; la ficha original sigue en Biblioteca para poder usarla en otros acuarios.</div>'
      : '<div id="inventoryImportNotice" class="notice"><b>Inventario real.</b><br>Añade aquí solo lo que tienes o quieres registrar. Las fichas informativas permanecen en Biblioteca hasta que decidas añadirlas.</div>';
    target.insertAdjacentHTML('beforeend', html);
  }

  function ensureCreateLibraryOption() {
    const notes = byId('invNotes');
    if (!notes || byId('invCreateLibrary')) return;
    const wrapper = document.createElement('label');
    wrapper.className = 'inventory-library-sync';
    wrapper.innerHTML = '<input id="invCreateLibrary" type="checkbox" checked> Crear ficha base también en Biblioteca';
    notes.insertAdjacentElement('afterend', wrapper);
    const help = document.createElement('p');
    help.className = 'small';
    help.textContent = 'Útil para tests, productos, sales, aditivos, alimentos y equipos que deben quedar disponibles como ficha informativa. La ficha queda marcada para revisar antes de usarla como ficha completa.';
    wrapper.insertAdjacentElement('afterend', help);
  }

  function categoryToEntryType(category) {
    const c = String(category || '').toLowerCase();
    if (/test/.test(c)) return 'test';
    if (/medic/.test(c)) return 'medicamento';
    if (/sal/.test(c)) return 'sal';
    if (/aditiv/.test(c)) return 'aditivo';
    if (/alimento|comida/.test(c)) return 'alimento';
    if (/equipo|material/.test(c)) return 'equipamiento';
    if (/coral/.test(c)) return 'coral';
    if (/pez|peces/.test(c)) return c.includes('marino') ? 'pez_marino' : 'pez_dulce';
    if (/planta/.test(c)) return 'planta';
    if (/microfauna/.test(c)) return 'microfauna';
    if (/invertebr/.test(c)) return 'invertebrado';
    return 'producto';
  }

  function typeLabel(type) {
    const labels = {
      pez_marino: 'Pez marino', pez_dulce: 'Pez de agua dulce', coral: 'Coral', invertebrado: 'Invertebrado', planta: 'Planta', microfauna: 'Microfauna', producto: 'Producto', medicamento: 'Medicamento', sal: 'Sal', aditivo: 'Aditivo', alimento: 'Alimento', test: 'Test', equipamiento: 'Equipamiento'
    };
    return labels[type] || 'Producto';
  }

  async function createBaseLibraryEntry(row, meta) {
    const ANX = window.ANX || {};
    const supabase = ANX.supabase;
    const state = ANX.state || {};
    if (!supabase || !state.user?.id) throw new Error('Sesión no disponible para crear la ficha base.');
    const entryType = categoryToEntryType(row.category);
    const summary = 'Ficha base creada desde Inventario. Pendiente de completar con datos técnicos, fuentes y revisión antes de considerarla ficha completa.';
    const payload = {
      user_id: state.user.id,
      title: row.name,
      scientific_name: null,
      entry_type: entryType,
      status: 'review',
      visibility: 'public',
      summary,
      sections: { summary, inventory_origin: 'Creada desde un elemento real del inventario.' },
      data: {
        inventory_origin: true,
        inventory_category: row.category,
        inventory_unit: row.unit,
        purchase_place: meta.purchase_place || '',
        batch: meta.batch || '',
        needs_sources: true,
        ai_notes: 'No usar como stock real. Es una ficha informativa base creada desde Inventario y pendiente de completar.'
      },
      tags: [row.category, 'inventario', 'pendiente_revision'].filter(Boolean),
      sources: [],
      identity_confirmed: true,
      confidence: null,
      identify_result: { source: 'inventory_manual_base', title: row.name, entry_type: entryType },
      ai_model: 'manual-inventory-base',
      ai_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('library_entries').insert(payload).select('*').single();
    if (error) throw error;
    return data || payload;
  }

  function libraryCardMeta(card) {
    return {
      id: card.id,
      type: card.entry_type || 'producto',
      type_label: typeLabel(card.entry_type),
      title: card.title || '',
      scientific_name: card.scientific_name || '',
      summary: card.summary || '',
      cover_url: card.cover_url || '',
      photo_url: card.photo_url || '',
      tags: Array.isArray(card.tags) ? card.tags : [],
      status: card.status || 'review',
      sections: card.sections || {},
      data: card.data || {}
    };
  }

  function notesFromMeta(meta, userNotes, libraryId) {
    return [
      `AcuarioNexoMeta:${JSON.stringify(meta)}`,
      libraryId ? `AcuarioNexoLibrary:${libraryId}` : '',
      userNotes || ''
    ].filter(Boolean).join('\n');
  }

  function installManualInventorySavePatch() {
    if (window.__anxInventoryManualLibraryPatch) return;
    const original = window.saveInventario;
    if (typeof original !== 'function') return;
    window.__anxInventoryManualLibraryPatch = true;
    window.saveInventario = async function () {
      if (!byId('invCreateLibrary')?.checked) return original.apply(this, arguments);
      const ANX = window.ANX || {};
      const supabase = ANX.supabase;
      const state = ANX.state || {};
      const currentAquarium = ANX.currentAquarium;
      const msg = ANX.msg || ((text, type) => `<div class="${type || 'notice'}">${text}</div>`);
      const box = byId('x');
      try {
        if (!val('invName')) throw new Error('Pon un nombre.');
        const aq = typeof currentAquarium === 'function' ? currentAquarium() : null;
        const scope = val('invScope') || 'general';
        const meta = {
          source: 'manual',
          scope,
          purchase_date: val('invPurchaseDate'),
          purchase_place: val('invPurchasePlace'),
          purchase_price: val('invPurchasePrice'),
          batch: val('invBatch')
        };
        const row = {
          user_id: state.user.id,
          name: val('invName'),
          category: val('invCategory') || (scope === 'aquarium' ? 'Equipos' : 'Material general'),
          quantity: num('invQty') ?? 1,
          unit: val('invUnit') || 'unidad',
          expiry_date: val('invExpiry') || null,
          photo_url: val('invCover') || null
        };
        if (scope === 'aquarium') {
          if (!aq) throw new Error('Abre un acuario para guardar inventario del acuario.');
          row.aquarium_id = aq.id;
        }
        if (box) box.innerHTML = msg('Creando ficha base en Biblioteca...', 'notice');
        const card = await createBaseLibraryEntry(row, meta);
        meta.library_id = card.id;
        meta.library_type = card.entry_type;
        meta.source_title = card.title || row.name;
        meta.library_card = libraryCardMeta(card);
        row.notes = notesFromMeta(meta, val('invNotes'), card.id);
        if (box) box.innerHTML = msg('Guardando registro vinculado a Biblioteca...', 'notice');
        const { error } = await supabase.from('inventory_items').insert(row);
        if (error) throw error;
        scope === 'aquarium' ? window.inventario('aquarium') : window.inventario('general');
      } catch (e) {
        if (box) box.innerHTML = msg(e.message, 'error');
      }
    };
  }

  function applyInventoryUi() {
    try {
      normalizeInventoryTexts();
      ensureInventoryNotice();
      ensureCreateLibraryOption();
      installManualInventorySavePatch();
    } catch (_) {}
  }

  document.addEventListener('click', function () { setTimeout(applyInventoryUi, 300); }, true);
  new MutationObserver(applyInventoryUi).observe(document.body, { childList: true, subtree: true });
  setTimeout(applyInventoryUi, 300);

  window.ANX = window.ANX || {};
  window.ANX.InventoryUI = { applyInventoryUi };
})();