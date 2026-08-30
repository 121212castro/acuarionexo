/* AcuarioNexo · etiquetas visibles en tarjetas de Biblioteca */
(function () {
  if (window.__anxLibraryCardLabelsLoaded) return;
  window.__anxLibraryCardLabelsLoaded = true;

  function ensureStyle() {
    if (document.getElementById('anxLibraryCardLabelsStyle')) return;
    const style = document.createElement('style');
    style.id = 'anxLibraryCardLabelsStyle';
    style.textContent = `
      .library-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))!important;align-items:start!important}
      .library-card.library-cover-card{position:relative!important;display:flex!important;flex-direction:column!important;min-width:0!important;background:#061827!important;border:1px solid rgba(120,190,235,.24)!important;border-radius:16px!important;overflow:hidden!important;text-align:left!important}
      .library-card.library-cover-card>img.library-card-cover,
      .library-card.library-cover-card>.library-card-cover{width:100%!important;aspect-ratio:4/5!important;height:auto!important;min-height:0!important;max-height:none!important;object-fit:cover!important;object-position:center!important;background:#03111e!important}
      .library-card-caption{display:block!important;width:100%!important;box-sizing:border-box!important;padding:12px 13px 13px!important;background:linear-gradient(180deg,#0b2740,#071a2c)!important;color:#fff!important;border-top:1px solid rgba(125,211,252,.16)!important}
      .library-card-caption-title{display:block!important;font-size:15px!important;font-weight:900!important;line-height:1.25!important;white-space:normal!important;overflow-wrap:anywhere!important;color:#fff!important}
      .library-card-caption-meta{display:flex!important;gap:7px!important;align-items:center!important;flex-wrap:wrap!important;margin-top:7px!important;font-size:12px!important;color:#b9d5e8!important}
      .library-card-caption-type{display:inline-flex!important;padding:3px 8px!important;border-radius:999px!important;background:rgba(32,170,255,.13)!important;border:1px solid rgba(69,190,255,.24)!important}
      .library-card-caption-code{opacity:.88!important}
      .library-no-photo{aspect-ratio:4/5!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important}
      .library-no-photo .library-no-photo-title{display:none!important}
      @media(max-width:700px){.library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.library-card-caption{padding:9px 10px 10px!important}.library-card-caption-title{font-size:13px!important}.library-card-caption-meta{font-size:11px!important}}
      @media(max-width:390px){.library-grid{grid-template-columns:1fr!important}.library-card-caption-title{font-size:14px!important}}
    `;
    document.head.appendChild(style);
  }

  function typeLabel(raw) {
    const map = {
      pez_marino: 'Pez marino', pez_dulce: 'Pez dulce', coral: 'Coral', invertebrado: 'Invertebrado',
      planta: 'Planta', microfauna: 'Microfauna', fitoplancton: 'Fitoplancton', producto: 'Producto',
      medicamento: 'Medicamento', sal: 'Sal', aditivo: 'Aditivo', alimento: 'Alimento', test: 'Test', equipamiento: 'Equipamiento'
    };
    return map[raw] || raw || 'Ficha';
  }

  function entryForButton(button) {
    const onclick = button.getAttribute('onclick') || '';
    const idMatch = onclick.match(/verFicha\(['\"]([^'\"]+)['\"]\)/);
    const id = idMatch ? idMatch[1] : '';
    const rows = window.ANX?.state?.libraryRows || [];
    return rows.find(row => String(row.id) === String(id)) || null;
  }

  function decorate(button) {
    if (!button || button.dataset.captionReady === 'true') return;
    const aria = button.getAttribute('aria-label') || '';
    const titleAttr = button.getAttribute('title') || '';
    const entry = entryForButton(button);
    const title = String(entry?.title || titleAttr || aria.replace(/^Abrir ficha:\s*/i, '') || 'Ficha').trim();
    const type = typeLabel(entry?.entry_type || '');
    const code = String(entry?.data?.product_code || entry?.data?.sku || entry?.data?.model || '').trim();

    const caption = document.createElement('span');
    caption.className = 'library-card-caption';
    const titleNode = document.createElement('span');
    titleNode.className = 'library-card-caption-title';
    titleNode.textContent = title;
    caption.appendChild(titleNode);

    const meta = document.createElement('span');
    meta.className = 'library-card-caption-meta';
    const typeNode = document.createElement('span');
    typeNode.className = 'library-card-caption-type';
    typeNode.textContent = type;
    meta.appendChild(typeNode);
    if (code && !title.toLowerCase().includes(code.toLowerCase())) {
      const codeNode = document.createElement('span');
      codeNode.className = 'library-card-caption-code';
      codeNode.textContent = code;
      meta.appendChild(codeNode);
    }
    caption.appendChild(meta);
    button.appendChild(caption);
    button.dataset.captionReady = 'true';
  }

  function scan(root) {
    ensureStyle();
    (root || document).querySelectorAll('.library-card.library-cover-card').forEach(decorate);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan(document));
  else scan(document);

  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('.library-card.library-cover-card')) decorate(node);
        scan(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();