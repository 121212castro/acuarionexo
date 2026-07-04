/* AcuarioNexo · Inventory UI helpers */
(function () {
  function byId(id) { return document.getElementById(id); }

  function isInventoryScreen(app) {
    const text = app?.textContent || '';
    return /Inventario general|Inventario de/.test(text);
  }

  function normalizeInventoryTexts() {
    const app = byId('app');
    if (!app || !isInventoryScreen(app)) return;
    app.querySelectorAll('button').forEach(function (btn) {
      const label = (btn.textContent || '').trim();
      if (label === 'Desde ficha') btn.textContent = 'Añadir desde ficha existente';
    });
  }

  function ensureInventoryNotice() {
    const app = byId('app');
    if (!app || !isInventoryScreen(app) || byId('inventoryImportNotice')) return;
    const target = Array.from(app.querySelectorAll('.panel')).find(function (panel) {
      return /Inventario/.test(panel.textContent || '');
    });
    if (!target) return;
    target.insertAdjacentHTML('beforeend', '<div id="inventoryImportNotice" class="notice"><b>Inventario real.</b><br>Añade aquí solo lo que tienes o quieres registrar. Las fichas informativas permanecen en Biblioteca hasta que decidas añadirlas.</div>');
  }

  function applyInventoryUi() {
    try {
      normalizeInventoryTexts();
      ensureInventoryNotice();
    } catch (_) {}
  }

  document.addEventListener('click', function () { setTimeout(applyInventoryUi, 300); }, true);
  new MutationObserver(applyInventoryUi).observe(document.body, { childList: true, subtree: true });
  setTimeout(applyInventoryUi, 300);

  window.ANX = window.ANX || {};
  window.ANX.InventoryUI = { applyInventoryUi };
})();
