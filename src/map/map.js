/* AcuarioNexo · Map coordinator */
(function () {
  function A() { return window.ANX || {}; }
  function S() { return A().MapState || {}; }
  function UI() { return A().MapUI || {}; }
  function R3D() { return A().MapRender3D || {}; }
  function PH() { return A().MapPhotos || {}; }
  function MK() { return A().MapMarkers || {}; }
  function SV() { return A().MapSave || {}; }

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

  function renderMapIA(map) {
    const { currentAquarium, render, aqHeader } = A();
    const { normalizeMap, readMap } = S();
    const { mapStageHtml, mapEditorHtml } = UI();
    const aq = currentAquarium();
    window.__aqMap = normalizeMap(map || window.__aqMap || readMap(aq), aq);
    const clean = window.__aqMap;
    const generatorHtml = A().MapAiGenerator?.formHtml ? A().MapAiGenerator.formHtml() : '<div id="mapAiGeneratorMount"></div>';
    render(aqHeader('mapa') + `<section class="panel map-panel">
      <div class="panel-head"><div><h2>Gemelo 3D</h2><p class="small">Pecera navegable con volumen real, sustrato, rocas y objetos 3D colocables.</p></div><div><button onclick="openMapAiGenerator()">Crear con IA</button><button onclick="saveMapIA()">Guardar</button></div></div>
      ${mapStageHtml(clean)}
      <label>Ángulo de foto</label><select id="mapPhotoAngle">
        <option value="front">Frontal</option>
        <option value="left">Lateral izquierda</option>
        <option value="right">Lateral derecha</option>
        <option value="top">Superior</option>
      </select>
      <label>Foto del acuario</label><input id="mapPhotoFile" type="file" accept="image/*" onchange="previewMapPhoto()">
      <div id="mapPhotoPreview"></div>
      <button class="primary" onclick="saveMapPhoto()">Guardar foto de este ángulo</button>
      <div id="x"></div>
    </section>${generatorHtml}${mapEditorHtml(clean)}`, 'acuarios');
    requestAnimationFrame(function () { R3D().renderMap3D(clean); });
  }

  function mapaIA() {
    const { currentAquarium } = A();
    const { readMap } = S();
    const aq = currentAquarium();
    if (!aq) return window.dashboard ? window.dashboard() : null;
    renderMapIA(readMap(aq));
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