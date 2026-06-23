/* AcuarioNexo · map */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;

const MAP_PREFIX = 'ACUARIONEXO_MAP_V2:';

function emptyMap(aq) {
  const front = aq?.map_photo_url || aq?.__cover_url || aq?.cover_url || aq?.photo_url || aq?.image_url || '';
  return {
    version: 2,
    photo_url: front,
    photos: { front, left: '', right: '', top: '' },
    markers: [],
    selected_id: '',
    updated_at: new Date().toISOString()
  };
}

function normalizeMap(raw, aq) {
  const base = emptyMap(aq);
  if (!raw || typeof raw !== 'object') return base;
  const markers = Array.isArray(raw.markers) ? raw.markers : [];
  const rawPhotos = raw.photos && typeof raw.photos === 'object' ? raw.photos : {};
  const photos = {
    front: rawPhotos.front || raw.photo_url || base.photo_url || '',
    left: rawPhotos.left || '',
    right: rawPhotos.right || '',
    top: rawPhotos.top || ''
  };
  return {
    ...base,
    ...raw,
    photos,
    photo_url: photos.front,
    markers: markers.map(function (m) {
      return {
        id: String(m.id || `mk-${Date.now()}`),
        label: String(m.label || 'Punto'),
        type: String(m.type || 'coral'),
        note: String(m.note || ''),
        x: Math.max(0, Math.min(100, Number(m.x) || 50)),
        y: Math.max(0, Math.min(100, Number(m.y) || 50)),
        z: Math.max(0, Math.min(100, Number(m.z) || 50)),
        size: Math.max(6, Math.min(32, Number(m.size) || 14))
      };
    })
  };
}

function readMap(aq) {
  try {
    const text = String(aq?.ai_summary || '');
    if (text.startsWith(MAP_PREFIX)) return normalizeMap(JSON.parse(text.slice(MAP_PREFIX.length)), aq);
  } catch (_) {}
  return emptyMap(aq);
}

function writeMapDraft(aq, map) {
  const clean = normalizeMap({ ...map, updated_at: new Date().toISOString() }, aq);
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

function mapPhotos(map) {
  const photos = map?.photos && typeof map.photos === 'object' ? map.photos : {};
  return {
    front: photos.front || map?.photo_url || '',
    left: photos.left || '',
    right: photos.right || '',
    top: photos.top || ''
  };
}

function photoCount(map) {
  return Object.values(mapPhotos(map)).filter(Boolean).length;
}

function photoChecklistHtml(map) {
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
  const photos = mapPhotos(map);
  return `<div class="map-3d-wrap">
    <div class="map-3d-toolbar">
      <button onclick="rotateMap3D(-18)">Girar izquierda</button>
      <button onclick="rotateMap3D(18)">Girar derecha</button>
      <button onclick="resetMap3D()">Frontal</button>
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

function renderMapIA(map) {
  const aq = currentAquarium();
  window.__aqMap = normalizeMap(map || window.__aqMap || readMap(aq), aq);
  const clean = window.__aqMap;
  render(aqHeader('mapa') + `<section class="panel map-panel">
    <div class="panel-head"><div><h2>Gemelo 3D</h2><p class="small">Pecera navegable con volumen real, sustrato, rocas y objetos 3D colocables.</p></div><button onclick="saveMapIA()">Guardar</button></div>
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
  byId('mapPhotoPreview').innerHTML = `<div class="photo-preview"><img src="${url}" alt="Foto del gemelo virtual"></div>`;
};

window.saveMapPhoto = async function () {
  try {
    const aq = currentAquarium();
    const file = byId('mapPhotoFile')?.files?.[0];
    if (!file) throw new Error('Selecciona una foto del acuario.');
    const angle = val('mapPhotoAngle') || 'front';
    const angleLabels = { front: 'frontal', left: 'lateral izquierda', right: 'lateral derecha', top: 'superior' };
    byId('x').innerHTML = msg(`Subiendo foto ${angleLabels[angle] || angle}...`);
    const publicUrl = await uploadAquariumImage(file, 'map');
    const row = { user_id: state.user.id, aquarium_id: aq.id, title: `Gemelo virtual · ${angleLabels[angle] || angle}`, image_url: publicUrl, photo_url: publicUrl };
    const inserted = await supabase.from('aquarium_photos').insert(row);
    if (inserted.error) throw inserted.error;
    aq.__cover_url = aq.__cover_url || publicUrl;
    const current = window.__aqMap || readMap(aq);
    const photos = { ...mapPhotos(current), [angle]: publicUrl };
    const map = writeMapDraft(aq, { ...current, photos, photo_url: photos.front || publicUrl });
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
    writeMapDraft(aq, map);
    renderMapIA(map);
    return;
  }
  const marker = { id: `mk-${Date.now()}`, label, type, note, x, y, z: Number(val('mapMarkerZ')) || 50, size: Number(val('mapMarkerSize')) || 14 };
  map.markers.push(marker);
  map.selected_id = marker.id;
  writeMapDraft(aq, map);
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

function marker3DScale(marker) {
  const raw = Number(marker.size || 18);
  return Math.max(0.7, Math.min(2.2, raw / 14));
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.04,
    transparent: options.transparent || false,
    opacity: options.opacity ?? 1,
    side: options.side || THREE.FrontSide
  });
}

function addRoundedBox(group, w, h, d, color, y, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material(color, options)
  );
  mesh.position.y = y;
  group.add(mesh);
  return mesh;
}

function makeNoiseRock(seed) {
  const group = new THREE.Group();
  const base = material(0x776f63, { roughness: 0.96 });
  const moss = material(0x45614f, { roughness: 0.9 });
  const count = 5 + (seed % 4);
  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), i === count - 1 ? moss : base);
    const angle = (i / count) * Math.PI * 2 + seed * 0.37;
    const radius = 2.2 + ((seed + i) % 3);
    mesh.position.set(Math.cos(angle) * radius, 1.8 + ((seed + i) % 4) * 0.7, Math.sin(angle) * radius);
    mesh.scale.set(3.2 + ((seed + i) % 5), 2.4 + ((seed * 2 + i) % 4), 2.7 + ((seed + i * 3) % 5));
    mesh.rotation.set(seed * 0.2 + i, seed * 0.17, i * 0.41);
    group.add(mesh);
  }
  return group;
}

function addBaseAquascape(scene) {
  const positions = [
    [-32, 0, -12, 0.9, 1.15],
    [-18, 0, -21, 0.72, 0.9],
    [0, 0, -16, 1.18, 1.28],
    [20, 0, -20, 0.78, 0.94],
    [34, 0, -9, 0.92, 1.08],
    [-8, 0, 5, 0.56, 0.7],
    [13, 0, 6, 0.54, 0.66]
  ];
  positions.forEach(function (item, index) {
    const rock = makeNoiseRock(index + 3);
    rock.position.set(item[0], 2.8, item[2]);
    rock.scale.set(item[3], item[4], item[3]);
    scene.add(rock);
  });
}

function addWaterFlow(scene) {
  const flowMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i += 1) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-48, 42 - i * 4, 23 - i * 4),
      new THREE.Vector3(-18, 39 - i * 2, 8 - i),
      new THREE.Vector3(18, 36 + i, -4 + i),
      new THREE.Vector3(47, 34 + i * 2, -18 + i * 3)
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.22, 8, false), flowMat);
    scene.add(tube);
  }
}

function addLabelSprite(scene, text, position, selected) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = selected ? 'rgba(14,142,255,0.92)' : 'rgba(3,16,29,0.82)';
  ctx.strokeStyle = selected ? 'rgba(255,255,255,0.75)' : 'rgba(125,211,252,0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(8, 16, 240, 54, 18);
  } else {
    ctx.rect(8, 16, 240, 54);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f8fbff';
  ctx.font = '700 24px -apple-system, BlinkMacSystemFont, Segoe UI, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text || 'Punto').slice(0, 18), 128, 43);
  const texture = new THREE.CanvasTexture(canvas);
  if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.position.copy(position);
  sprite.position.y += 15;
  sprite.scale.set(22, 8, 1);
  scene.add(sprite);
}

function addRockModel(group, color, selected) {
  const base = material(0x8b8172, { roughness: 0.95 });
  const accent = material(color, { roughness: 0.9 });
  const chunks = [
    [-3.6, 1.8, 0, 5.7, 3.8, 4.6],
    [1.8, 2.2, -1.4, 4.4, 4.9, 4.1],
    [4.4, 1.4, 2.1, 3.7, 2.9, 3.5],
    [-0.8, 4.6, 1.2, 3.2, 4.1, 2.9]
  ];
  chunks.forEach(function (c, i) {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), i === 3 && selected ? accent : base);
    mesh.position.set(c[0], c[1], c[2]);
    mesh.scale.set(c[3], c[4], c[5]);
    mesh.rotation.set(0.4 + i, 0.7 * i, 0.2);
    group.add(mesh);
  });
}

function addCoralBranch(group, x, z, height, radius, color, tilt) {
  const coralMat = material(color, { roughness: 0.5 });
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.2, height, 10), coralMat);
  branch.position.set(x, height / 2, z);
  branch.rotation.z = tilt;
  group.add(branch);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(radius * 2.2, 12, 8), coralMat);
  tip.position.set(x + Math.sin(tilt) * height * 0.5, height, z);
  group.add(tip);
}

function addCoralModel(group, color, selected) {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(4.6, 5.4, 2.2, 18),
    material(selected ? 0xffd1e8 : 0x7f1d4d, { roughness: 0.72 })
  );
  base.position.y = 1.1;
  group.add(base);
  [-4, -2, 0, 2.4, 4.2].forEach(function (x, i) {
    addCoralBranch(group, x, (i % 2 ? -1.2 : 1.4), 7 + i * 0.9, 0.55, color, (i - 2) * 0.15);
  });
}

function addFishModel(group, color, selected) {
  const bodyMat = material(color, { roughness: 0.32, metalness: 0.12 });
  const finMat = material(selected ? 0xfef3c7 : 0x93c5fd, { roughness: 0.38, transparent: true, opacity: 0.82, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.SphereGeometry(4.2, 28, 18), bodyMat);
  body.scale.set(1.55, 0.72, 0.62);
  body.position.y = 4.5;
  group.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(3.4, 5.4, 3), finMat);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-7.4, 4.5, 0);
  group.add(tail);
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.2, 3), finMat);
  dorsal.rotation.x = Math.PI;
  dorsal.position.set(0.8, 8.2, 0);
  group.add(dorsal);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.58, 10, 8), material(0xffffff));
  eye.position.set(5.7, 5.3, 1.6);
  group.add(eye);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), material(0x03101d));
  pupil.position.set(6.05, 5.3, 1.85);
  group.add(pupil);
  group.userData.swim = true;
}

function addEquipmentModel(group, color, selected) {
  const bodyMat = material(0x111827, { roughness: 0.42, metalness: 0.35 });
  const accent = material(selected ? 0x7dd3fc : color, { roughness: 0.28, metalness: 0.18 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(8.5, 7, 5), bodyMat);
  body.position.y = 5;
  group.add(body);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 7, 18), accent);
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.set(6.8, 5, 0);
  group.add(nozzle);
  [-2.4, 2.4].forEach(function (z) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.2, 16), material(0x64748b, { roughness: 0.6 }));
    cup.rotation.x = Math.PI / 2;
    cup.position.set(-4.8, 5, z);
    group.add(cup);
  });
}

function addPlantModel(group, color, selected) {
  const stemMat = material(0x166534, { roughness: 0.65 });
  const leafMat = material(selected ? 0xbbf7d0 : color, { roughness: 0.58, side: THREE.DoubleSide });
  [-3, -1.5, 0, 1.8, 3.2].forEach(function (x, i) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 8 + i, 8), stemMat);
    stem.position.set(x, 4 + i * 0.45, 0);
    stem.rotation.z = (i - 2) * 0.12;
    group.add(stem);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(2.2, 14, 8), leafMat);
    leaf.scale.set(0.55, 1.2, 0.16);
    leaf.position.set(x + (i - 2) * 0.5, 8 + i * 0.8, 0);
    leaf.rotation.z = (i - 2) * 0.3;
    group.add(leaf);
  });
}

function addGenericModel(group, color, selected) {
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(selected ? 4.4 : 3.7, 24, 16),
    material(color, { roughness: 0.35, metalness: 0.08 })
  );
  core.position.y = 4;
  group.add(core);
}

function createAquariumObject(marker) {
  const group = new THREE.Group();
  const selected = window.__aqMap?.selected_id === marker.id;
  const color = markerColor(marker.type);
  if (marker.type === 'rock') addRockModel(group, color, selected);
  else if (marker.type === 'coral') addCoralModel(group, color, selected);
  else if (marker.type === 'fish') addFishModel(group, color, selected);
  else if (marker.type === 'equipment') addEquipmentModel(group, color, selected);
  else if (marker.type === 'plant') addPlantModel(group, color, selected);
  else addGenericModel(group, color, selected);
  const scale = marker3DScale(marker);
  group.scale.setScalar(scale);
  group.userData.markerId = marker.id;
  group.userData.selected = selected;
  return group;
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

function addPhotoPlane(scene, renderer, camera, url, setup) {
  if (!url || !window.THREE) return;
  let mesh;
  const texture = new THREE.TextureLoader().load(url, function (loaded) {
    if (setup.fit === 'front') {
      const plane = tankPhotoPlaneSize(loaded.image);
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(plane.w, plane.h);
      mesh.position.y = plane.y;
    }
    renderer.render(scene, camera);
  });
  if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  else if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
  mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(setup.w, setup.h),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: setup.opacity ?? 0.72, side: THREE.DoubleSide })
  );
  mesh.position.set(setup.x, setup.y, setup.z);
  mesh.rotation.set(setup.rx || 0, setup.ry || 0, setup.rz || 0);
  scene.add(mesh);
}
function renderMap3D(map) {
  const stage = byId('map3dStage');
  if (!stage) return;
  if (!window.THREE) {
    stage.innerHTML = `<div class="map-empty-photo"><b>3D no disponible</b><p class="small">No se ha cargado el motor 3D. Reintenta actualizar la app.</p></div>`;
    return;
  }
  if (window.__aqMap3DDispose) window.__aqMap3DDispose();
  stage.innerHTML = '';
  const width = Math.max(320, stage.clientWidth || 640);
  const height = Math.max(260, Math.round(width * 0.58));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020b14);
  scene.fog = new THREE.Fog(0x020b14, 145, 330);
  const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 1000);
  const rotation = window.__aqMapRotation || 0;
  const radians = rotation * Math.PI / 180;
  const zoom = window.__aqMapZoom || 160;
  camera.position.set(Math.sin(radians) * zoom, 72, Math.cos(radians) * zoom);
  camera.lookAt(0, 34, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  else if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  stage.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xe0fbff, 0x082033, 2.2));
  const light = new THREE.DirectionalLight(0xffffff, 1.4);
  light.position.set(30, 90, 80);
  scene.add(light);
  const reefLight = new THREE.PointLight(0x1aa7ff, 1.8, 180);
  reefLight.position.set(0, 70, 12);
  scene.add(reefLight);

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

  const photos = mapPhotos(map);
  addPhotoPlane(scene, renderer, camera, photos.front, { fit: 'front', w: 112, h: 64, x: 0, y: 36, z: -36.45, opacity: 0.18 });
  addPhotoPlane(scene, renderer, camera, photos.left, { w: 64, h: 64, x: -60.45, y: 36, z: 0, ry: Math.PI / 2, opacity: 0.14 });
  addPhotoPlane(scene, renderer, camera, photos.right, { w: 64, h: 64, x: 60.45, y: 36, z: 0, ry: -Math.PI / 2, opacity: 0.14 });
  addPhotoPlane(scene, renderer, camera, photos.top, { w: 112, h: 64, x: 0, y: 66.9, z: 0, rx: -Math.PI / 2, opacity: 0.1 });

  addBaseAquascape(scene);
  addWaterFlow(scene);

  const animatedObjects = [];
  map.markers.forEach(function (marker) {
    const pos = marker3DPosition(marker);
    const group = createAquariumObject(marker);
    group.position.set(pos.x, pos.y, pos.z);
    group.rotation.y = marker.type === 'fish' ? Math.PI * 0.05 : (Number(marker.z) - 50) * 0.018;
    scene.add(group);
    addLabelSprite(scene, marker.label, new THREE.Vector3(pos.x, pos.y, pos.z), window.__aqMap?.selected_id === marker.id);
    animatedObjects.push(group);
  });

  if (!map.markers.length) {
    const hint = new THREE.Group();
    addRoundedBox(hint, 22, 8, 14, 0x0e8eff, 9, { roughness: 0.5, transparent: true, opacity: 0.75 });
    hint.position.set(0, 0, 0);
    scene.add(hint);
    addLabelSprite(scene, 'Añade puntos', new THREE.Vector3(0, 11, 0), true);
  }

  let dragging = false;
  let lastX = 0;
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', function (event) {
    dragging = true;
    lastX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', function (event) {
    if (!dragging) return;
    window.__aqMapRotation = (window.__aqMapRotation || 0) + (event.clientX - lastX) * 0.35;
    lastX = event.clientX;
    const r = (window.__aqMapRotation || 0) * Math.PI / 180;
    const z = window.__aqMapZoom || 160;
    camera.position.set(Math.sin(r) * z, 72, Math.cos(r) * z);
    camera.lookAt(0, 34, 0);
  });
  canvas.addEventListener('pointerup', function () { dragging = false; });
  canvas.addEventListener('wheel', function (event) {
    event.preventDefault();
    window.__aqMapZoom = Math.max(112, Math.min(230, (window.__aqMapZoom || 160) + event.deltaY * 0.15));
    const r = (window.__aqMapRotation || 0) * Math.PI / 180;
    const z = window.__aqMapZoom;
    camera.position.set(Math.sin(r) * z, 72, Math.cos(r) * z);
    camera.lookAt(0, 34, 0);
  }, { passive: false });

  let stopped = false;
  const clock = new THREE.Clock();
  function animate() {
    if (stopped) return;
    const time = clock.getElapsedTime();
    animatedObjects.forEach(function (object, index) {
      if (object.userData.swim) {
        object.position.x += Math.sin(time * 1.4 + index) * 0.018;
        object.rotation.y = Math.sin(time * 0.9 + index) * 0.22;
        object.position.y += Math.sin(time * 1.7 + index) * 0.01;
      } else if (object.userData.selected) {
        object.rotation.y += 0.012;
      }
    });
    surface.material.opacity = 0.14 + Math.sin(time * 1.8) * 0.035;
    renderer.render(scene, camera);
    window.__aqMap3DFrame = requestAnimationFrame(animate);
  }
  window.__aqMap3DDispose = function () {
    stopped = true;
    if (window.__aqMap3DFrame) cancelAnimationFrame(window.__aqMap3DFrame);
    scene.traverse(function (obj) {
      if (obj.geometry) obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.filter(Boolean).forEach(function (mat) {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });
    });
    renderer.dispose();
  };
  animate();
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
  marker.size = Number(val('mapMarkerSize')) || marker.size || 14;
  renderMap3D(map);
};

window.selectMapMarker = function (event, id) {
  if (event?.stopPropagation) event.stopPropagation();
  const aq = currentAquarium();
  const map = window.__aqMap || readMap(aq);
  map.selected_id = id;
  writeMapDraft(aq, map);
  renderMapIA(map);
};

window.updateMapMarker = function () {
  const aq = currentAquarium();
  const map = window.__aqMap || readMap(aq);
  let marker = selectedMapMarker(map);
  if (!marker) {
    marker = { id: `mk-${Date.now()}`, x: Number(val('mapMarkerX')) || 50, y: Number(val('mapMarkerY')) || 50, z: Number(val('mapMarkerZ')) || 50, size: Number(val('mapMarkerSize')) || 14, label: val('mapMarkerLabel') || 'Punto', type: val('mapMarkerType') || 'coral', note: val('mapMarkerNote') || '' };
    map.markers.push(marker);
    map.selected_id = marker.id;
  } else {
    marker.label = val('mapMarkerLabel') || marker.label;
    marker.type = val('mapMarkerType') || marker.type;
    marker.note = val('mapMarkerNote') || '';
    marker.x = Number(val('mapMarkerX')) || marker.x;
    marker.y = Number(val('mapMarkerY')) || marker.y;
    marker.z = Number(val('mapMarkerZ')) || marker.z;
    marker.size = Number(val('mapMarkerSize')) || marker.size || 14;
  }
  writeMapDraft(aq, map);
  renderMapIA(map);
};

window.newMapMarker = function () {
  const aq = currentAquarium();
  const map = window.__aqMap || readMap(aq);
  map.selected_id = '';
  writeMapDraft(aq, map);
  renderMapIA(map);
};

window.deleteMapMarker = function () {
  const aq = currentAquarium();
  const map = window.__aqMap || readMap(aq);
  map.markers = map.markers.filter(m => m.id !== map.selected_id);
  map.selected_id = map.markers[0]?.id || '';
  writeMapDraft(aq, map);
  renderMapIA(map);
};

window.saveMapIA = async function () {
  const aq = currentAquarium();
  const map = writeMapDraft(aq, window.__aqMap || readMap(aq));
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
    if (x) x.innerHTML = msg('No se pudo guardar el mapa en Supabase. Revisa conexión o permisos: ' + e.message, 'error');
  }
};
})();
