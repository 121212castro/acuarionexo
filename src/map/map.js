/* AcuarioNexo · map */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;

const MAP_PREFIX = 'ACUARIONEXO_MAP_V2:';

function mapKey(aq) {
  return `acuarionexo-map-v2-${aq?.id || 'local'}`;
}

function emptyMap(aq) {
  return {
    version: 2,
    photo_url: aq?.map_photo_url || aq?.__cover_url || aq?.cover_url || aq?.photo_url || aq?.image_url || '',
    markers: [],
    selected_id: '',
    updated_at: new Date().toISOString()
  };
}

function normalizeMap(raw, aq) {
  const base = emptyMap(aq);
  if (!raw || typeof raw !== 'object') return base;
  const markers = Array.isArray(raw.markers) ? raw.markers : [];
  return {
    ...base,
    ...raw,
    photo_url: raw.photo_url || base.photo_url,
    markers: markers.map(function (m) {
      return {
        id: String(m.id || `mk-${Date.now()}`),
        label: String(m.label || 'Punto'),
        type: String(m.type || 'coral'),
        note: String(m.note || ''),
        x: Math.max(0, Math.min(100, Number(m.x) || 50)),
        y: Math.max(0, Math.min(100, Number(m.y) || 50)),
        z: Math.max(0, Math.min(100, Number(m.z) || 50))
      };
    })
  };
}

function readMap(aq) {
  try {
    const local = localStorage.getItem(mapKey(aq));
    if (local) return normalizeMap(JSON.parse(local), aq);
  } catch (_) {}
  try {
    const text = String(aq?.ai_summary || '');
    if (text.startsWith(MAP_PREFIX)) return normalizeMap(JSON.parse(text.slice(MAP_PREFIX.length)), aq);
  } catch (_) {}
  return emptyMap(aq);
}

function writeMapLocal(aq, map) {
  const clean = normalizeMap({ ...map, updated_at: new Date().toISOString() }, aq);
  try { localStorage.setItem(mapKey(aq), JSON.stringify(clean)); } catch (_) {}
  window.__aqMap = clean;
  return clean;
}

function markerTypeLabel(type) {
  return {
    coral: 'Coral',
    plant: 'Planta',
    rock: 'Roca',
    fish: 'Pez',
    equipment: 'Equipo',
    other: 'Otro'
  }[type] || 'Punto';
}

function mapMarkerHtml(marker) {
  const selected = window.__aqMap?.selected_id === marker.id ? ' selected' : '';
  return `<button class="map-pin ${esc(marker.type)}${selected}" style="left:${esc(marker.x)}%;top:${esc(marker.y)}%" onclick="selectMapMarker(event,'${esc(marker.id)}')" title="${esc(marker.label)} · profundidad ${esc(marker.z)}%">
    <span>${esc(marker.label.slice(0, 2).toUpperCase())}</span>
  </button>`;
}

function mapListHtml(map) {
  if (!map.markers.length) return '<p class="small">Sin puntos todavía. Escribe un nombre y toca la foto para colocar el primer coral, planta o roca.</p>';
  return map.markers.map(function (marker) {
    const active = map.selected_id === marker.id ? ' active' : '';
    return `<button class="map-list-item${active}" onclick="selectMapMarker(event,'${esc(marker.id)}')">
      <b>${esc(marker.label)}</b><span>${esc(markerTypeLabel(marker.type))}</span>
    </button>`;
  }).join('');
}

function selectedMapMarker(map) {
  return map.markers.find(m => m.id === map.selected_id) || map.markers[0] || null;
}

function mapEditorHtml(map) {
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
  if (!map.photo_url) {
    return `<div class="map-empty-photo">
      <b>Falta foto del acuario</b>
      <p class="small">Sube una foto frontal del acuario. La IA 3D la usa como fondo para montar la urna y colocar puntos con profundidad.</p>
    </div>`;
  }
  return `<div class="map-3d-wrap">
    <div class="map-3d-toolbar">
      <button onclick="rotateMap3D(-18)">Girar izquierda</button>
      <button onclick="rotateMap3D(18)">Girar derecha</button>
      <button onclick="resetMap3D()">Frontal</button>
    </div>
    <div id="map3dStage" class="map-3d-stage"></div>
    <div id="mapStage" class="map-photo-stage map-photo-reference" onclick="placeMapMarker(event)">
      <img src="${esc(map.photo_url)}" alt="Foto del acuario para mapa IA">
      ${map.markers.map(mapMarkerHtml).join('')}
    </div>
  </div>`;
}

function renderMapIA(map) {
  const aq = currentAquarium();
  window.__aqMap = normalizeMap(map || window.__aqMap || readMap(aq), aq);
  const clean = window.__aqMap;
  render(aqHeader('mapa') + `<section class="panel map-panel">
    <div class="panel-head"><div><h2>Mapa IA</h2><p class="small">Foto real del acuario con puntos de colocación.</p></div><button onclick="saveMapIA()">Guardar</button></div>
    ${mapStageHtml(clean)}
    <label>Foto base del acuario</label><input id="mapPhotoFile" type="file" accept="image/*" onchange="previewMapPhoto()">
    <div id="mapPhotoPreview"></div>
    <button class="primary" onclick="saveMapPhoto()">Usar esta foto en el mapa</button>
    <div id="x"></div>
  </section>${mapEditorHtml(clean)}`, 'acuarios');
  requestAnimationFrame(function () { renderMap3D(clean); });
}

function mapaIA() {
  const aq = currentAquarium();
  if (!aq) return dashboard();
  renderMapIA(readMap(aq));
}
window.mapaIA = mapaIA;

window.previewMapPhoto = function () {
  const file = byId('mapPhotoFile')?.files?.[0];
  if (!file || !byId('mapPhotoPreview')) return;
  const url = URL.createObjectURL(file);
  byId('mapPhotoPreview').innerHTML = `<div class="photo-preview"><img src="${url}" alt="Foto base del mapa"></div>`;
};

window.saveMapPhoto = async function () {
  try {
    const aq = currentAquarium();
    const file = byId('mapPhotoFile')?.files?.[0];
    if (!file) throw new Error('Selecciona una foto del acuario.');
    byId('x').innerHTML = msg('Subiendo foto del mapa...');
    const publicUrl = await uploadAquariumImage(file, 'map');
    const row = { user_id: state.user.id, aquarium_id: aq.id, title: 'Mapa IA acuario', image_url: publicUrl, photo_url: publicUrl };
    const inserted = await supabase.from('aquarium_photos').insert(row);
    if (inserted.error) throw inserted.error;
    aq.__cover_url = aq.__cover_url || publicUrl;
    const map = writeMapLocal(aq, { ...(window.__aqMap || readMap(aq)), photo_url: publicUrl });
    renderMapIA(map);
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.placeMapMarker = function (event) {
  const aq = currentAquarium();
  const stage = byId('mapStage');
  if (!stage || !aq) return;
  const rect = stage.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  const map = window.__aqMap || readMap(aq);
  const label = val('mapMarkerLabel') || `Punto ${map.markers.length + 1}`;
  const type = val('mapMarkerType') || 'coral';
  const note = val('mapMarkerNote') || '';
  const selected = selectedMapMarker(map);
  if (selected && map.selected_id) {
    selected.x = x;
    selected.y = y;
    selected.label = label;
    selected.type = type;
    selected.note = note;
    writeMapLocal(aq, map);
    renderMapIA(map);
    return;
  }
  const marker = { id: `mk-${Date.now()}`, label, type, note, x, y, z: Number(val('mapMarkerZ')) || 50 };
  map.markers.push(marker);
  map.selected_id = marker.id;
  writeMapLocal(aq, map);
  renderMapIA(map);
};

function markerColor(type) {
  return {
    coral: 0xf472b6,
    plant: 0x22c55e,
    rock: 0xa3a3a3,
    fish: 0x0e8eff,
    equipment: 0xf59e0b,
    other: 0xe2e8f0
  }[type] || 0xe2e8f0;
}

function marker3DPosition(marker) {
  return {
    x: (Number(marker.x) - 50) * 1.2,
    y: (100 - Number(marker.y)) * 0.68 + 2,
    z: (Number(marker.z) - 50) * 0.7
  };
}

function containRect(srcW, srcH, boxW, boxH) {
  const ratio = Math.min(boxW / Math.max(1, srcW), boxH / Math.max(1, srcH));
  const w = srcW * ratio;
  const h = srcH * ratio;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
}

function tankPhotoPlaneSize(image) {
  const rect = containRect(image?.width || 16, image?.height || 9, 120, 72);
  return { w: rect.w, h: rect.h, y: 36 + (36 - rect.y - rect.h / 2) };
}

function renderMap3DFallback(map) {
  const stage = byId('map3dStage');
  if (!stage) return;
  stage.innerHTML = '';
  const width = Math.max(320, stage.clientWidth || 640);
  const height = Math.max(260, Math.round(width * 0.58));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * Math.min(window.devicePixelRatio || 1, 2));
  canvas.height = Math.round(height * Math.min(window.devicePixelRatio || 1, 2));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const scale = canvas.width / width;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  function drawBase(photo) {
    const pad = 28;
    const front = { x: pad, y: pad + 22, w: width - pad * 2 - 42, h: height - pad * 2 - 34 };
    const depth = 42;
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#03101d');
    bg.addColorStop(1, '#06243a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    if (photo) {
      const fit = containRect(photo.naturalWidth || photo.width, photo.naturalHeight || photo.height, front.w, front.h);
      ctx.save();
      ctx.globalAlpha = 0.68;
      ctx.drawImage(photo, front.x + fit.x, front.y + fit.y, fit.w, fit.h);
      ctx.restore();
    }

    const water = ctx.createLinearGradient(front.x, front.y, front.x, front.y + front.h);
    water.addColorStop(0, 'rgba(66, 211, 255, .18)');
    water.addColorStop(0.45, 'rgba(20, 125, 160, .12)');
    water.addColorStop(1, 'rgba(5, 25, 38, .28)');
    ctx.fillStyle = water;
    ctx.fillRect(front.x, front.y, front.w, front.h);

    ctx.fillStyle = 'rgba(160, 230, 255, .18)';
    ctx.fillRect(front.x + 2, front.y + 10, front.w - 4, 4);

    ctx.strokeStyle = 'rgba(125, 211, 252, .75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(front.x, front.y, front.w, front.h);
    ctx.beginPath();
    ctx.moveTo(front.x, front.y);
    ctx.lineTo(front.x + depth, front.y - depth);
    ctx.lineTo(front.x + front.w + depth, front.y - depth);
    ctx.lineTo(front.x + front.w, front.y);
    ctx.moveTo(front.x + front.w, front.y + front.h);
    ctx.lineTo(front.x + front.w + depth, front.y + front.h - depth);
    ctx.lineTo(front.x + front.w + depth, front.y - depth);
    ctx.moveTo(front.x + depth, front.y - depth);
    ctx.lineTo(front.x + depth, front.y + front.h - depth);
    ctx.lineTo(front.x, front.y + front.h);
    ctx.stroke();

    ctx.fillStyle = 'rgba(201, 179, 106, .72)';
    ctx.fillRect(front.x + 2, front.y + front.h - 28, front.w - 4, 26);

    ctx.fillStyle = 'rgba(255, 255, 255, .12)';
    ctx.fillRect(front.x + 10, front.y + 10, 2, front.h - 30);
    ctx.fillRect(front.x + front.w - 14, front.y + 10, 2, front.h - 30);

    map.markers.forEach(function (marker) {
      const x = front.x + (Number(marker.x) / 100) * front.w + ((Number(marker.z) - 50) / 100) * depth;
      const y = front.y + (Number(marker.y) / 100) * front.h - ((Number(marker.z) - 50) / 100) * depth;
      const selected = map.selected_id === marker.id;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(226, 232, 240, .8)';
      ctx.moveTo(x, y);
      ctx.lineTo(x, front.y + front.h - 28);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = `#${markerColor(marker.type).toString(16).padStart(6, '0')}`;
      ctx.arc(x, y, selected ? 9 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = selected ? 4 : 2;
      ctx.strokeStyle = selected ? '#ffffff' : 'rgba(255,255,255,.72)';
      ctx.stroke();
    });
  }

  if (map.photo_url) {
    const photo = new Image();
    photo.crossOrigin = 'anonymous';
    photo.onload = function () { drawBase(photo); };
    photo.onerror = function () { drawBase(null); };
    photo.src = map.photo_url;
  } else {
    drawBase(null);
  }
}

function renderMap3D(map) {
  const stage = byId('map3dStage');
  if (!stage) return;
  if (!window.THREE) {
    renderMap3DFallback(map);
    return;
  }
  stage.innerHTML = '';
  const width = Math.max(320, stage.clientWidth || 640);
  const height = Math.max(260, Math.round(width * 0.58));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03101d);
  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
  const rotation = window.__aqMapRotation || 0;
  const radians = rotation * Math.PI / 180;
  camera.position.set(Math.sin(radians) * 160, 70, Math.cos(radians) * 160);
  camera.lookAt(0, 34, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xdffaff, 0x082033, 2.6));
  const light = new THREE.DirectionalLight(0xffffff, 1.4);
  light.position.set(30, 90, 80);
  scene.add(light);

  const tank = new THREE.BoxGeometry(120, 72, 72);
  const edges = new THREE.EdgesGeometry(tank);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.78 }));
  line.position.y = 36;
  scene.add(line);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xbdefff,
    transparent: true,
    opacity: 0.13,
    roughness: 0.08,
    metalness: 0,
    transmission: 0.45,
    depthWrite: false
  });
  const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(120, 72), glassMaterial);
  frontGlass.position.set(0, 36, 36.05);
  scene.add(frontGlass);
  const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(72, 72), glassMaterial);
  leftGlass.rotation.y = Math.PI / 2;
  leftGlass.position.set(-60.05, 36, 0);
  scene.add(leftGlass);
  const rightGlass = leftGlass.clone();
  rightGlass.position.x = 60.05;
  scene.add(rightGlass);

  const water = new THREE.Mesh(
    new THREE.BoxGeometry(118, 64, 70),
    new THREE.MeshPhysicalMaterial({
      color: 0x1ba8d6,
      transparent: true,
      opacity: 0.18,
      roughness: 0.25,
      metalness: 0,
      transmission: 0.18,
      depthWrite: false
    })
  );
  water.position.y = 34;
  scene.add(water);

  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(118, 70),
    new THREE.MeshBasicMaterial({ color: 0x70e0ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 66.4;
  scene.add(surface);

  const sand = new THREE.Mesh(
    new THREE.BoxGeometry(120, 5, 72),
    new THREE.MeshStandardMaterial({ color: 0xc9b36a, roughness: 0.9 })
  );
  sand.position.y = 2.5;
  scene.add(sand);

  if (map.photo_url) {
    const texture = new THREE.TextureLoader().load(map.photo_url, function (loaded) {
      const plane = tankPhotoPlaneSize(loaded.image);
      back.geometry.dispose();
      back.geometry = new THREE.PlaneGeometry(plane.w, plane.h);
      back.position.y = plane.y;
      renderer.render(scene, camera);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 72),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    back.position.set(0, 36, -36.2);
    scene.add(back);
  }

  map.markers.forEach(function (marker) {
    const pos = marker3DPosition(marker);
    const group = new THREE.Group();
    const selected = map.selected_id === marker.id;
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(selected ? 3.8 : 3, 24, 16),
      new THREE.MeshStandardMaterial({ color: markerColor(marker.type), roughness: 0.35, metalness: 0.05 })
    );
    group.add(sphere);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, Math.max(4, pos.y), 12),
      new THREE.MeshStandardMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.7 })
    );
    stem.position.y = -Math.max(4, pos.y) / 2;
    group.add(stem);
    group.position.set(pos.x, pos.y, pos.z);
    scene.add(group);
  });

  renderer.render(scene, camera);
}

window.rotateMap3D = function (delta) {
  window.__aqMapRotation = (window.__aqMapRotation || 0) + delta;
  renderMap3D(window.__aqMap || readMap(currentAquarium()));
};

window.resetMap3D = function () {
  window.__aqMapRotation = 0;
  renderMap3D(window.__aqMap || readMap(currentAquarium()));
};

window.previewMapMarkerPosition = function () {
  const aq = currentAquarium();
  const map = window.__aqMap || readMap(aq);
  const marker = selectedMapMarker(map);
  if (!marker) return;
  marker.x = Number(val('mapMarkerX')) || marker.x;
  marker.y = Number(val('mapMarkerY')) || marker.y;
  marker.z = Number(val('mapMarkerZ')) || marker.z;
  renderMap3D(map);
};

window.selectMapMarker = function (event, id) {
  if (event?.stopPropagation) event.stopPropagation();
  const aq = currentAquarium();
  const map = window.__aqMap || readMap(aq);
  map.selected_id = id;
  writeMapLocal(aq, map);
  renderMapIA(map);
};

window.updateMapMarker = function () {
  const aq = currentAquarium();
  const map = window.__aqMap || readMap(aq);
  let marker = selectedMapMarker(map);
  if (!marker) {
    marker = { id: `mk-${Date.now()}`, x: Number(val('mapMarkerX')) || 50, y: Number(val('mapMarkerY')) || 50, z: Number(val('mapMarkerZ')) || 50, label: val('mapMarkerLabel') || 'Punto', type: val('mapMarkerType') || 'coral', note: val('mapMarkerNote') || '' };
    map.markers.push(marker);
    map.selected_id = marker.id;
  } else {
    marker.label = val('mapMarkerLabel') || marker.label;
    marker.type = val('mapMarkerType') || marker.type;
    marker.note = val('mapMarkerNote') || '';
    marker.x = Number(val('mapMarkerX')) || marker.x;
    marker.y = Number(val('mapMarkerY')) || marker.y;
    marker.z = Number(val('mapMarkerZ')) || marker.z;
  }
  writeMapLocal(aq, map);
  renderMapIA(map);
};

window.newMapMarker = function () {
  const aq = currentAquarium();
  const map = window.__aqMap || readMap(aq);
  map.selected_id = '';
  writeMapLocal(aq, map);
  renderMapIA(map);
};

window.deleteMapMarker = function () {
  const aq = currentAquarium();
  const map = window.__aqMap || readMap(aq);
  map.markers = map.markers.filter(m => m.id !== map.selected_id);
  map.selected_id = map.markers[0]?.id || '';
  writeMapLocal(aq, map);
  renderMapIA(map);
};

window.saveMapIA = async function () {
  const aq = currentAquarium();
  const map = writeMapLocal(aq, window.__aqMap || readMap(aq));
  try {
    const payload = MAP_PREFIX + JSON.stringify(map);
    const result = await supabase.from('aquariums').update({ ai_summary: payload }).eq('id', aq.id);
    if (result.error) throw result.error;
    aq.ai_summary = payload;
    renderMapIA(map);
    const x = byId('x');
    if (x) x.innerHTML = msg('Mapa IA guardado.', 'success');
  } catch (e) {
    const x = byId('x');
    if (x) x.innerHTML = msg('Mapa guardado en este dispositivo. Supabase no aceptó el guardado remoto: ' + e.message, 'notice');
  }
};
})();
