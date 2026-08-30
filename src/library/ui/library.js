/* AcuarioNexo · Biblioteca UI · sin carga heredada */
(function () {
  window.ANX = window.ANX || {};
  window.ANX.LibraryUI = window.ANX.LibraryUI || { active: true, owner: 'src/library/library-v3.js' };

  function loadScriptOnce(src, marker) {
    if (document.querySelector(`script[data-module="${marker}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.dataset.module = marker;
    document.head.appendChild(script);
  }

  function loadFichaJson() {
    loadScriptOnce('src/library/ficha/ficha-json.js?v=smart-json-quotes-20260705-1630', 'library-ficha-json');
  }

  function loadCardLabels() {
    const version = encodeURIComponent(window.ANX_ASSET_VERSION || window.ACUARIONEXO_BUILD || Date.now());
    loadScriptOnce(`src/library/ui/library-card-labels.js?v=${version}`, 'library-card-labels');
  }

  setTimeout(loadFichaJson, 800);
  setTimeout(loadCardLabels, 50);
})();