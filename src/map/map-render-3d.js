/* AcuarioNexo · Map render 3D bridge */
(function () {
  function A() { return window.ANX || {}; }

  function renderMap3D(map) {
    if (window.ANX.MapMain?.renderMap3D) return window.ANX.MapMain.renderMap3D(map);
    const stage = A().byId ? A().byId('map3dStage') : null;
    if (stage) stage.innerHTML = '<div class="map-empty-photo"><b>3D pendiente de inicializar</b><p class="small">El coordinador del mapa todavía no ha terminado de cargar.</p></div>';
  }

  function rotateMap3D(delta) {
    if (window.ANX.MapMain?.rotateMap3D) return window.ANX.MapMain.rotateMap3D(delta);
    window.__aqMapRotation = (window.__aqMapRotation || 0) + delta;
    renderMap3D(window.__aqMap);
  }

  function setMap3DView(view) {
    if (window.ANX.MapMain?.setMap3DView) return window.ANX.MapMain.setMap3DView(view);
  }

  function resetMap3D() {
    setMap3DView('front');
  }

  window.ANX = window.ANX || {};
  window.ANX.MapRender3D = { renderMap3D, rotateMap3D, setMap3DView, resetMap3D };
})();