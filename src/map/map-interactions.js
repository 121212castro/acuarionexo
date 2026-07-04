/* AcuarioNexo · Map interactions */
(function () {
  const MAP_PREFIX = 'ACUARIONEXO_MAP_V2:';
  let mapPointerStart = null;

  function clamp(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function setMapInput(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = String(value);
  }

  function mapInput(id, fallback) {
    const el = document.getElementById(id);
    const value = el ? el.value : '';
    return value === '' ? fallback : value;
  }

  function readDraftMap(aq) {
    if (window.__aqMap && typeof window.__aqMap === 'object') return window.__aqMap;
    try {
      const text = String(aq?.ai_summary || '');
      if (text.startsWith(MAP_PREFIX)) return JSON.parse(text.slice(MAP_PREFIX.length));
    } catch (_) {}
    return { version: 2, photo_url: '', photos: { front: '', left: '', right: '', top: '' }, markers: [], selected_id: '', updated_at: new Date().toISOString() };
  }

  function writeDraftMap(aq, map) {
    map.version = 2;
    map.markers = Array.isArray(map.markers) ? map.markers : [];
    map.updated_at = new Date().toISOString();
    window.__aqMap = map;
    if (aq) aq.ai_summary = MAP_PREFIX + JSON.stringify(map);
  }

  function placeMapPointFrom3D(event) {
    const stage = document.getElementById('map3dStage');
    const canvas = stage?.querySelector('canvas');
    const aq = window.ANX?.currentAquarium ? window.ANX.currentAquarium() : window.state?.aquarium;
    if (!stage || !canvas || !aq || !stage.contains(event.target)) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    const z = clamp(mapInput('mapMarkerZ', 50), 0, 100);
    const size = clamp(mapInput('mapMarkerSize', 14), 6, 32);
    const map = readDraftMap(aq);
    map.markers = Array.isArray(map.markers) ? map.markers : [];

    let marker = map.selected_id ? map.markers.find(function (item) { return String(item.id) === String(map.selected_id); }) : null;
    if (!marker) {
      marker = { id: 'mk-' + Date.now(), label: '', type: 'coral', note: '', x, y, z, size };
      map.markers.push(marker);
      map.selected_id = marker.id;
    }

    marker.label = mapInput('mapMarkerLabel', '') || ('Punto ' + map.markers.length);
    marker.type = mapInput('mapMarkerType', 'coral') || 'coral';
    marker.note = mapInput('mapMarkerNote', '') || '';
    marker.x = x;
    marker.y = y;
    marker.z = z;
    marker.size = size;

    setMapInput('mapMarkerX', Math.round(x));
    setMapInput('mapMarkerY', Math.round(y));
    setMapInput('mapMarkerZ', Math.round(z));
    setMapInput('mapMarkerSize', Math.round(size));
    writeDraftMap(aq, map);

    if (typeof window.updateMapMarker === 'function') window.updateMapMarker();
    else if (typeof window.mapaIA === 'function') window.mapaIA();
  }

  function installMap3DPointPlacement() {
    document.addEventListener('pointerdown', function (event) {
      const stage = document.getElementById('map3dStage');
      if (!stage || !stage.contains(event.target)) return;
      mapPointerStart = { x: event.clientX, y: event.clientY, t: Date.now(), target: event.target };
    }, true);

    document.addEventListener('pointerup', function (event) {
      const start = mapPointerStart;
      mapPointerStart = null;
      const stage = document.getElementById('map3dStage');
      if (!start || !stage || !stage.contains(event.target)) return;
      const dx = Math.abs(event.clientX - start.x);
      const dy = Math.abs(event.clientY - start.y);
      const dt = Date.now() - start.t;
      if (dx <= 8 && dy <= 8 && dt <= 650) placeMapPointFrom3D(event);
    }, true);
  }

  installMap3DPointPlacement();

  window.ANX = window.ANX || {};
  window.ANX.MapInteractions = { placeMapPointFrom3D };
})();
