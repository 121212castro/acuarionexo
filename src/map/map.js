/* AcuarioNexo · Map coordinator */
(function () {
  function A() { return window.ANX || {}; }
  function S() { return A().MapState || {}; }
  function UI() { return A().MapUI || {}; }
  function R3D() { return A().MapRender3D || {}; }
  function PH() { return A().MapPhotos || {}; }
  function MK() { return A().MapMarkers || {}; }
  function SV() { return A().MapSave || {}; }
  function B() { return A().MapBuilder || {}; }
  function ST() { return A().MapStandalone || {}; }

  const dependencyPromises = {};
  function loadDependency(src, test) {
    if (test()) return Promise.resolve(true);
    if (dependencyPromises[src]) return dependencyPromises[src];
    dependencyPromises[src] = new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = src + '?v=' + encodeURIComponent(window.ANX_ASSET_VERSION || 'dev');
      script.async = false;
      script.onload = function () { test() ? resolve(true) : reject(new Error('El módulo no quedó disponible: ' + src)); };
      script.onerror = function () { reject(new Error('No se pudo cargar ' + src)); };
      document.body.appendChild(script);
    });
    return dependencyPromises[src];
  }

  async function ensureAiGenerator() {
    await loadDependency('src/map/map-ai-generator-contract.js', function () { return !!A().MapAiGeneratorContract; });
    await loadDependency('src/map/map-ai-generator.js', function () { return !!A().MapAiGenerator; });
    return A().MapAiGenerator;
  }

  async function renderMapIA(map) {
    const { currentAquarium, render, aqHeader } = A();
    const { normalizeMap, readMap, hydrateMapPhotos } = S();
    const { mapStageHtml, mapEditorHtml } = UI();
    const aq = currentAquarium();
    if (!aq) return window.dashboard ? window.dashboard() : null;
    const standalone = !!aq.__standalone_3d;
    const normalized = normalizeMap(map || window.__aqMap || readMap(aq), aq);
    window.__aqMap = typeof hydrateMapPhotos === 'function' ? await hydrateMapPhotos(normalized) : normalized;
    const clean = window.__aqMap;
    const builderHtml = B().formHtml ? B().formHtml(aq) : '';
    const contextHeader = standalone ? '' : aqHeader('mapa');
    const standaloneHtml = standalone && ST().formHtml ? ST().formHtml(aq) : '';
    const topActions = standalone ? '' : '<button class="primary" onclick="saveMapIA()">Guardar diseño</button>';
    const title = standalone ? 'Diseñador de acuario 3D' : 'Constructor de acuario 3D';
    const subtitle = standalone
      ? 'Diseña una urna desde cero. Cuando termines puedes guardarla como un nuevo acuario.'
      : 'Diseña la urna con sus medidas reales y coloca dentro rocas, corales, plantas, peces y equipos.';

    render(contextHeader + standaloneHtml + `<section class="panel map-panel">
      <div class="panel-head"><div><h2>${title}</h2><p class="small">${subtitle}</p></div><div>${topActions}</div></div>
      ${builderHtml}
      ${mapStageHtml(clean)}
      <details class="map-reference-box"><summary>Fotos de referencia (opcional)</summary>
        <p class="small">Las fotos no forman el acuario 3D. Solo sirven como guía para reproducir un montaje existente.</p>
        <label>Ángulo de foto</label><select id="mapPhotoAngle">
          <option value="front">Frontal</option>
          <option value="left">Lateral izquierda</option>
          <option value="right">Lateral derecha</option>
          <option value="top">Superior</option>
        </select>
        <label>Foto del acuario</label><input id="mapPhotoFile" type="file" accept="image/*" onchange="previewMapPhoto()">
        <div id="mapPhotoPreview"></div>
        <button onclick="saveMapPhoto()">Guardar foto de referencia</button>
      </details>
      <div id="x"></div>
    </section>${mapEditorHtml(clean)}`, standalone ? 'inicio' : 'acuarios');
    requestAnimationFrame(function () { R3D().renderMap3D(clean); });
  }

  async function mapaIA() {
    const { currentAquarium } = A();
    const { readMap } = S();
    const aq = currentAquarium();
    if (!aq) return window.dashboard ? window.dashboard() : null;
    await renderMapIA(readMap(aq));
  }

  window.openMapAiGenerator = async function () {
    try {
      const generator = await ensureAiGenerator();
      const mount = document.getElementById('mapAiGeneratorMount');
      if (mount) mount.outerHTML = generator.formHtml();
      generator.toggle(true);
    } catch (error) {
      const box = document.getElementById('x');
      if (box) box.innerHTML = A().msg(error.message || error, 'error');
    }
  };

  window.mapaIA = mapaIA;
  window.previewAquarium3DSize = function () { return B().preview?.(); };
  window.saveAquarium3DSize = function () { return B().save?.(); };
  window.resetAquarium3DView = function () { return B().resetView?.(); };
  window.previewMapPhoto = function () { return PH().previewMapPhoto(); };
  window.saveMapPhoto = function () { return PH().saveMapPhoto(); };
  window.placeMapMarker = function (event) { return MK().placeMapMarker(event); };
  window.previewMapMarkerPosition = function () { return MK().previewMapMarkerPosition(); };
  window.selectMapMarker = function (event, id) { return MK().selectMapMarker(event, id); };
  window.updateMapMarker = function () { return MK().updateMapMarker(); };
  window.newMapMarker = function () { return MK().newMapMarker(); };
  window.deleteMapMarker = function () { return MK().deleteMapMarker(); };
  window.rotateMap3D = function (delta) { return R3D().rotateMap3D(delta); };
  window.setMap3DView = function (view) { return R3D().setMap3DView(view); };
  window.resetMap3D = function () { return R3D().resetMap3D(); };
  window.saveMapIA = function () { return SV().saveMapIA(); };

  window.ANX = window.ANX || {};
  window.ANX.MapMain = { mapaIA, renderMapIA, ensureAiGenerator };
})();