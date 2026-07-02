/* AcuarioNexo · Biblioteca UI · sin carga heredada */
(function () {
  window.ANX = window.ANX || {};
  window.ANX.LibraryUI = window.ANX.LibraryUI || { active: true, owner: 'src/library/library-v3.js' };

  function loadFichaJson() {
    if (document.querySelector('script[data-module="library-ficha-json"]')) return;
    const script = document.createElement('script');
    script.src = 'src/library/ficha/ficha-json.js?v=pez-marino-contract-20260702';
    script.dataset.module = 'library-ficha-json';
    document.head.appendChild(script);
  }

  setTimeout(loadFichaJson, 800);
})();
