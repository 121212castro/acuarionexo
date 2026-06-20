/* AcuarioNexo · selector galeria/camara */
(function () {
  window.pickAqCover = function (mode) {
    const input = document.getElementById('aqCoverFile');
    if (!input) return;
    if (mode === 'camera') input.setAttribute('capture', 'environment');
    else input.removeAttribute('capture');
    input.click();
  };
})();
