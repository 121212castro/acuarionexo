/* AcuarioNexo · Map UI helpers */
(function () {
  function A() { return window.ANX || {}; }
  function S() { return A().MapState || {}; }

  function photoChecklistHtml(map) {
    const { esc } = A();
    const { mapPhotos } = S();
    const photos = mapPhotos(map);
    const items = [
      ['front', 'Frontal'],
      ['left', 'Lateral izquierda'],
      ['right', 'Lateral derecha'],
      ['top', 'Superior']
    ];
    return `<div class="map-photo-checklist">${items.map(([key, label]) => `<span class="${photos[key] ? 'ok' : ''}">${photos[key] ? '✓' : '·'} ${esc(label)}</span>`).join('')}</div>`;
  }

  function mapMarkerHtml(marker) {
    const { esc } = A();
    const selected = window.__aqMap?.selected_id === marker.id ? ' selected' : '';
    return `<button class="map-pin ${esc(marker.type)}${selected}" style="left:${esc(marker.x)}%;top:${esc(marker.y)}%" onclick="selectMapMarker(event,'${esc(marker.id)}')" title="${esc(marker.label)} · profundidad ${esc(marker.z)}%">
      <span>${esc(marker.label.slice(0, 2).toUpperCase())}</span>
    </button>`;
  }

  function mapListHtml(map) {
    const { esc } = A();
    const { markerTypeLabel } = S();
    if (!map.markers.length) return '<p class="small">Sin puntos todavía. Escribe un nombre y toca la foto para colocar el primer coral, planta o roca.</p>';
    return map.markers.map(function (marker) {
      const active = map.selected_id === marker.id ? ' active' : '';
      return `<button class="map-list-item${active}" onclick="selectMapMarker(event,'${esc(marker.id)}')">
        <b>${esc(marker.label)}</b><span>${esc(markerTypeLabel(marker.type))}</span>
      </button>`;
    }).join('');
  }

  function mapEditorHtml(map) {
    const { esc } = A();
    const { selectedMapMarker } = S();
    const selected = selectedMapMarker(map);
    return `<section class="panel map-side">
      <h3>Punto seleccionado</h3>
      <label>Nombre</label><input id="mapMarkerLabel" value="${esc(selected?.label || '')}" placeholder="Ej. Euphyllia, Zoanthus, roca alta...">
      <label>Tipo</label><select id="mapMarkerType">
        <option value="coral" ${selected?.type === 'coral' ? 'selected' : ''}>Coral</option>
        <option value="plant" ${selected?.type === 'plant' ? 'selected' : ''}>Planta</option>
        <option value="rock" ${selected?.type === 'rock' ? 'selected' : ''}>Roca / zona</option>
        <option value="fish" ${selected?.type === 'fish' ? 'selected' : ''}>Pez</option>
        <option value="equipment" ${selected?.type === 'equipment' ? 'selected' : ''}>Equipo</option>
        <option value="other" ${selected?.type === 'other' ? 'selected' : ''}>Otro</option>
      </select>
      <label>Nota IA</label><textarea id="mapMarkerNote" placeholder="Luz media, flujo suave, dejar separación...">${esc(selected?.note || '')}</textarea>
      <label>Izquierda / derecha</label><input id="mapMarkerX" type="range" min="0" max="100" value="${esc(selected?.x ?? 50)}" oninput="previewMapMarkerPosition()">
      <label>Altura</label><input id="mapMarkerY" type="range" min="0" max="100" value="${esc(selected?.y ?? 50)}" oninput="previewMapMarkerPosition()">
      <label>Profundidad</label><input id="mapMarkerZ" type="range" min="0" max="100" value="${esc(selected?.z ?? 50)}" oninput="previewMapMarkerPosition()">
      <label>Tamaño 3D</label><input id="mapMarkerSize" type="range" min="6" max="32" value="${esc(selected?.size ?? 14)}" oninput="previewMapMarkerPosition()">
      <div class="map-actions">
        <button class="primary" onclick="updateMapMarker()">Actualizar punto</button>
        <button onclick="newMapMarker()">Nuevo punto</button>
        <button onclick="deleteMapMarker()">Borrar punto</button>
      </div>
      <h3>Colocados</h3>
      <div class="map-list">${mapListHtml(map)}</div>
    </section>`;
  }

  function mapStageHtml(map) {
    const { esc } = A();
    const { mapPhotos, photoCount } = S();
    const photos = mapPhotos(map);
    return `<div class="map-3d-wrap">
      <div class="map-3d-toolbar">
        <button onclick="setMap3DView('front')">Frontal</button>
        <button onclick="setMap3DView('left')">Izquierda</button>
        <button onclick="setMap3DView('right')">Derecha</button>
        <button onclick="setMap3DView('top')">Superior</button>
        <button onclick="rotateMap3D(-18)">Girar -</button>
        <button onclick="rotateMap3D(18)">Girar +</button>
      </div>
      <div id="map3dStage" class="map-3d-stage"></div>
      ${photoChecklistHtml(map)}
      ${photoCount(map) ? `<details class="map-reference-box"><summary>Referencia de foto para colocar puntos</summary>
        <div id="mapStage" class="map-photo-stage map-photo-reference" onclick="placeMapMarker(event)">
          <img src="${esc(photos.front || photos.left || photos.right || photos.top)}" alt="Foto de referencia del acuario">
          ${map.markers.map(mapMarkerHtml).join('')}
        </div>
      </details>` : `<div class="map-empty-photo compact">
        <b>Gemelo 3D preparado</b>
        <p class="small">Sube fotos frontal, laterales y superior para usarlas como referencia del acuario real.</p>
      </div>`}
    </div>`;
  }

  window.ANX = window.ANX || {};
  window.ANX.MapUI = { photoChecklistHtml, mapMarkerHtml, mapListHtml, mapEditorHtml, mapStageHtml };
})();