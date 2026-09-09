/* AcuarioNexo · Map markers */
(function () {
  function A() { return window.ANX || {}; }
  function S() { return A().MapState || {}; }
  function F() { return A().MapModelFamilies || {}; }

  function currentMap() {
    const { currentAquarium } = A();
    const { readMap } = S();
    const aq = currentAquarium();
    return { aq, map: window.__aqMap || readMap(aq) };
  }

  function render(map) {
    if (window.ANX.MapMain?.renderMapIA) window.ANX.MapMain.renderMapIA(map);
  }

  function selectedFamily(type, label, note) {
    const { val } = A();
    return val('mapMarkerFamily') || F().resolveFamily?.({ type, label, note }) || '';
  }

  function placeMapMarker(event) {
    const { byId, val } = A();
    const { writeMapDraft, selectedMapMarker } = S();
    const { aq, map } = currentMap();
    const stage = byId('mapStage');
    if (!stage || !aq) return;
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const label = val('mapMarkerLabel') || `Punto ${map.markers.length + 1}`;
    const type = val('mapMarkerType') || 'coral';
    const note = val('mapMarkerNote') || '';
    const modelFamily = selectedFamily(type, label, note);
    const selected = selectedMapMarker(map);
    if (selected && map.selected_id) {
      selected.x = x;
      selected.y = y;
      selected.label = label;
      selected.type = type;
      selected.note = note;
      selected.model_family = modelFamily;
      writeMapDraft(aq, map);
      render(map);
      return;
    }
    const marker = { id: `mk-${Date.now()}`, label, type, note, model_family: modelFamily, x, y, z: Number(val('mapMarkerZ')) || 50, size: Number(val('mapMarkerSize')) || 14 };
    map.markers.push(marker);
    map.selected_id = marker.id;
    writeMapDraft(aq, map);
    render(map);
  }

  function previewMapMarkerPosition() {
    const { val } = A();
    const { selectedMapMarker } = S();
    const { map } = currentMap();
    const marker = selectedMapMarker(map);
    if (!marker) return;
    marker.x = Number(val('mapMarkerX')) || marker.x;
    marker.y = Number(val('mapMarkerY')) || marker.y;
    marker.z = Number(val('mapMarkerZ')) || marker.z;
    marker.size = Number(val('mapMarkerSize')) || marker.size || 14;
    marker.model_family = val('mapMarkerFamily') || marker.model_family || F().resolveFamily?.(marker) || '';
    if (window.ANX.MapRender3D?.renderMap3D) window.ANX.MapRender3D.renderMap3D(map);
  }

  function selectMapMarker(event, id) {
    if (event?.stopPropagation) event.stopPropagation();
    const { writeMapDraft } = S();
    const { aq, map } = currentMap();
    map.selected_id = id;
    writeMapDraft(aq, map);
    render(map);
  }

  function updateMapMarker() {
    const { val } = A();
    const { writeMapDraft, selectedMapMarker } = S();
    const { aq, map } = currentMap();
    let marker = selectedMapMarker(map);
    const type = val('mapMarkerType') || 'coral';
    const label = val('mapMarkerLabel') || 'Punto';
    const note = val('mapMarkerNote') || '';
    const modelFamily = selectedFamily(type, label, note);
    if (!marker) {
      marker = { id: `mk-${Date.now()}`, x: Number(val('mapMarkerX')) || 50, y: Number(val('mapMarkerY')) || 50, z: Number(val('mapMarkerZ')) || 50, size: Number(val('mapMarkerSize')) || 14, label, type, note, model_family: modelFamily };
      map.markers.push(marker);
      map.selected_id = marker.id;
    } else {
      marker.label = label || marker.label;
      marker.type = type || marker.type;
      marker.note = note;
      marker.model_family = modelFamily || marker.model_family || F().resolveFamily?.(marker) || '';
      marker.x = Number(val('mapMarkerX')) || marker.x;
      marker.y = Number(val('mapMarkerY')) || marker.y;
      marker.z = Number(val('mapMarkerZ')) || marker.z;
      marker.size = Number(val('mapMarkerSize')) || marker.size || 14;
    }
    writeMapDraft(aq, map);
    render(map);
  }

  function newMapMarker() {
    const { writeMapDraft } = S();
    const { aq, map } = currentMap();
    map.selected_id = '';
    writeMapDraft(aq, map);
    render(map);
  }

  function deleteMapMarker() {
    const { writeMapDraft } = S();
    const { aq, map } = currentMap();
    map.markers = map.markers.filter(m => m.id !== map.selected_id);
    map.selected_id = map.markers[0]?.id || '';
    writeMapDraft(aq, map);
    render(map);
  }

  window.ANX = window.ANX || {};
  window.ANX.MapMarkers = { placeMapMarker, previewMapMarkerPosition, selectMapMarker, updateMapMarker, newMapMarker, deleteMapMarker };
})();
