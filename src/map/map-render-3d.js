/* AcuarioNexo · Map render 3D */
(function () {
  function A() { return window.ANX || {}; }
  function S() { return A().MapState || {}; }

  function markerColor(type) {
    return { coral: 0xf472b6, plant: 0x22c55e, rock: 0xa3a3a3, fish: 0x0e8eff, equipment: 0xf59e0b, other: 0xe2e8f0 }[type] || 0xe2e8f0;
  }

  function marker3DScale(marker) {
    const raw = Number(marker.size || 18);
    return Math.max(0.7, Math.min(2.2, raw / 14));
  }

  function aquariumDimensions(aq) {
    const length = Math.max(45, Number(aq?.tank_length_cm) || 120);
    const depth = Math.max(25, Number(aq?.tank_width_cm) || 55);
    const height = Math.max(28, Number(aq?.tank_height_cm) || 60);
    const water = Math.max(12, Math.min(height, Number(aq?.display_water_height_cm) || height * 0.88));
    const scale = 126 / Math.max(length, depth, height);
    const w = Math.max(72, length * scale);
    const d = Math.max(34, depth * scale);
    const h = Math.max(42, height * scale);
    const waterH = Math.max(24, water * scale);
    return { source: { length, depth, height, water }, w, d, h, waterH, glass: 1.2, sandH: Math.max(3.4, Math.min(7.5, h * 0.075)), innerW: w - 6, innerD: d - 6 };
  }

  function marker3DPositionInTank(marker, tank) {
    return {
      x: ((Number(marker.x) || 50) - 50) / 100 * tank.innerW,
      y: tank.sandH + 2 + (100 - (Number(marker.y) || 50)) / 100 * Math.max(8, tank.waterH - tank.sandH - 8),
      z: ((Number(marker.z) || 50) - 50) / 100 * tank.innerD
    };
  }

  function material(color, options = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: options.roughness ?? 0.55, metalness: options.metalness ?? 0.04, transparent: options.transparent || false, opacity: options.opacity ?? 1, side: options.side || THREE.FrontSide });
  }

  function addRoundedBox(group, w, h, d, color, y, options = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, options));
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

  function addBaseAquascape(scene, tank) {
    const positions = [[-0.36, -0.22, 0.9, 1.15], [-0.18, -0.34, 0.72, 0.9], [0.02, -0.24, 1.18, 1.28], [0.23, -0.33, 0.78, 0.94], [0.38, -0.15, 0.92, 1.08], [-0.08, 0.12, 0.56, 0.7], [0.16, 0.1, 0.54, 0.66]];
    positions.forEach(function (item, index) {
      const rock = makeNoiseRock(index + 3);
      rock.position.set(item[0] * tank.innerW, tank.sandH + 0.8, item[1] * tank.innerD);
      rock.scale.set(item[3], item[4], item[3]);
      scene.add(rock);
    });
  }

  function addWaterFlow(scene, tank) {
    const flowMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
    for (let i = 0; i < 5; i += 1) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-tank.innerW * 0.46, tank.waterH * 0.74 - i * 3, tank.innerD * 0.38 - i * 2),
        new THREE.Vector3(-tank.innerW * 0.16, tank.waterH * 0.66 - i, tank.innerD * 0.1),
        new THREE.Vector3(tank.innerW * 0.18, tank.waterH * 0.62 + i, -tank.innerD * 0.04),
        new THREE.Vector3(tank.innerW * 0.46, tank.waterH * 0.58 + i * 2, -tank.innerD * 0.34 + i)
      ]);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.22, 8, false), flowMat));
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
    if (ctx.roundRect) ctx.roundRect(8, 16, 240, 54, 18); else ctx.rect(8, 16, 240, 54);
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
    [[-3.6, 1.8, 0, 5.7, 3.8, 4.6], [1.8, 2.2, -1.4, 4.4, 4.9, 4.1], [4.4, 1.4, 2.1, 3.7, 2.9, 3.5], [-0.8, 4.6, 1.2, 3.2, 4.1, 2.9]].forEach(function (c, i) {
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
    const base = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.4, 2.2, 18), material(selected ? 0xffd1e8 : 0x7f1d4d, { roughness: 0.72 }));
    base.position.y = 1.1;
    group.add(base);
    [-4, -2, 0, 2.4, 4.2].forEach(function (x, i) { addCoralBranch(group, x, (i % 2 ? -1.2 : 1.4), 7 + i * 0.9, 0.55, color, (i - 2) * 0.15); });
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
    const core = new THREE.Mesh(new THREE.SphereGeometry(selected ? 4.4 : 3.7, 24, 16), material(color, { roughness: 0.35, metalness: 0.08 }));
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
    group.scale.setScalar(marker3DScale(marker));
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

  function tankPhotoPlaneSize(image, tank) {
    const rect = containRect(image?.width || 16, image?.height || 9, tank.innerW, tank.waterH);
    return { w: rect.w, h: rect.h, y: tank.sandH + (tank.waterH - rect.y - rect.h / 2) };
  }

  function addPhotoPlane(scene, renderer, camera, url, setup) {
    if (!url || !window.THREE) return;
    let mesh;
    const texture = new THREE.TextureLoader().load(url, function (loaded) {
      if (setup.fit === 'front') {
        const plane = tankPhotoPlaneSize(loaded.image, setup.tank);
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(plane.w, plane.h);
        mesh.position.y = plane.y;
      }
      renderer.render(scene, camera);
    });
    if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
    mesh = new THREE.Mesh(new THREE.PlaneGeometry(setup.w, setup.h), new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: setup.opacity ?? 0.72, side: THREE.DoubleSide }));
    mesh.position.set(setup.x, setup.y, setup.z);
    mesh.rotation.set(setup.rx || 0, setup.ry || 0, setup.rz || 0);
    scene.add(mesh);
  }

  function addTankShell(scene, tank) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xc8f4ff, transparent: true, opacity: 0.17, roughness: 0.03, metalness: 0, transmission: 0.38, thickness: 1.6, depthWrite: false, side: THREE.DoubleSide });
    const backMat = glassMat.clone();
    backMat.opacity = 0.1;
    [[tank.w, tank.h, 0, tank.h / 2, tank.d / 2, 0, 0, 0, glassMat], [tank.w, tank.h, 0, tank.h / 2, -tank.d / 2, 0, 0, 0, backMat], [tank.d, tank.h, -tank.w / 2, tank.h / 2, 0, 0, Math.PI / 2, 0, glassMat], [tank.d, tank.h, tank.w / 2, tank.h / 2, 0, 0, Math.PI / 2, 0, glassMat]].forEach(function (p) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(p[0], p[1]), p[8]);
      mesh.position.set(p[2], p[3], p[4]);
      mesh.rotation.set(p[5], p[6], p[7]);
      scene.add(mesh);
    });
    const line = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(tank.w, tank.h, tank.d)), new THREE.LineBasicMaterial({ color: 0xb8ecff, transparent: true, opacity: 0.86 }));
    line.position.y = tank.h / 2;
    scene.add(line);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x07111b, roughness: 0.42, metalness: 0.55 });
    const rimH = 1.4;
    [[tank.w + 2, rimH, 1.4, 0, tank.h + rimH / 2, tank.d / 2], [tank.w + 2, rimH, 1.4, 0, tank.h + rimH / 2, -tank.d / 2], [1.4, rimH, tank.d + 2, -tank.w / 2, tank.h + rimH / 2, 0], [1.4, rimH, tank.d + 2, tank.w / 2, tank.h + rimH / 2, 0], [tank.w + 2, rimH, 1.4, 0, rimH / 2, tank.d / 2], [tank.w + 2, rimH, 1.4, 0, rimH / 2, -tank.d / 2], [1.4, rimH, tank.d + 2, -tank.w / 2, rimH / 2, 0], [1.4, rimH, tank.d + 2, tank.w / 2, rimH / 2, 0]].forEach(function (b) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b[0], b[1], b[2]), rimMat);
      mesh.position.set(b[3], b[4], b[5]);
      scene.add(mesh);
    });
  }

  function addSubstrate(scene, tank) {
    const geo = new THREE.PlaneGeometry(tank.w, tank.d, 22, 14);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.08) * 0.7 + Math.cos(y * 0.11) * 0.55 + (y / tank.d) * 1.8);
    }
    geo.computeVertexNormals();
    const sand = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xcbbf8a, roughness: 0.96, metalness: 0.02 }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = tank.sandH;
    scene.add(sand);
    const base = new THREE.Mesh(new THREE.BoxGeometry(tank.w, tank.sandH, tank.d), new THREE.MeshStandardMaterial({ color: 0x9b8457, roughness: 0.98 }));
    base.position.y = tank.sandH / 2;
    scene.add(base);
  }

  function addWaterVolume(scene, tank) {
    const water = new THREE.Mesh(new THREE.BoxGeometry(tank.w - 3, tank.waterH, tank.d - 3), new THREE.MeshPhysicalMaterial({ color: 0x19a7d8, transparent: true, opacity: 0.16, roughness: 0.18, metalness: 0, transmission: 0.24, depthWrite: false }));
    water.position.y = tank.waterH / 2;
    scene.add(water);
    const surfaceGeo = new THREE.PlaneGeometry(tank.w - 4, tank.d - 4, 30, 18);
    const pos = surfaceGeo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.12) * 0.22 + Math.cos(y * 0.16) * 0.18);
    }
    surfaceGeo.computeVertexNormals();
    const surface = new THREE.Mesh(surfaceGeo, new THREE.MeshPhysicalMaterial({ color: 0x8bedff, transparent: true, opacity: 0.34, roughness: 0.06, metalness: 0, transmission: 0.1, side: THREE.DoubleSide }));
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = tank.waterH;
    scene.add(surface);
    return surface;
  }

  function addLightingRig(scene, tank) {
    const fixture = new THREE.Mesh(new THREE.BoxGeometry(tank.w * 0.72, 2.8, 6), new THREE.MeshStandardMaterial({ color: 0x07111b, roughness: 0.28, metalness: 0.65 }));
    fixture.position.set(0, tank.h + 8, -tank.d * 0.08);
    scene.add(fixture);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(tank.w * 0.68, 4), new THREE.MeshBasicMaterial({ color: 0x76d7ff, transparent: true, opacity: 0.52, side: THREE.DoubleSide }));
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, tank.h + 6.2, -tank.d * 0.08);
    scene.add(glow);
  }

  function addDimensionLabel(scene, tank) {
    const text = `${Math.round(tank.source.length)} x ${Math.round(tank.source.depth)} x ${Math.round(tank.source.height)} cm`;
    addLabelSprite(scene, text, new THREE.Vector3(0, tank.h + 5, -tank.d * 0.48), false);
  }

  function cameraStateFor(view, tank) {
    const radius = Math.max(tank.w, tank.d, tank.h) * 1.72;
    if (view === 'left') return { rotation: -90, pitch: 0.4, zoom: radius };
    if (view === 'right') return { rotation: 90, pitch: 0.4, zoom: radius };
    if (view === 'top') return { rotation: 0, pitch: 1.42, zoom: radius * 1.05 };
    return { rotation: 0, pitch: 0.42, zoom: radius };
  }

  function applyCamera(camera, tank) {
    const rotation = window.__aqMapRotation || 0;
    const pitch = Math.max(0.18, Math.min(1.48, window.__aqMapPitch ?? 0.42));
    const zoom = window.__aqMapZoom || Math.max(tank.w, tank.d, tank.h) * 1.72;
    const radians = rotation * Math.PI / 180;
    const horizontal = Math.cos(pitch) * zoom;
    camera.position.set(Math.sin(radians) * horizontal, Math.sin(pitch) * zoom + tank.h * 0.24, Math.cos(radians) * horizontal);
    camera.lookAt(0, tank.h * 0.46, 0);
  }

  function renderMap3D(map) {
    const { byId, currentAquarium } = A();
    const { readMap, mapPhotos } = S();
    const stage = byId('map3dStage');
    if (!stage) return;
    if (!window.THREE) {
      stage.innerHTML = `<div class="map-empty-photo"><b>3D no disponible</b><p class="small">No se ha cargado el motor 3D. Reintenta actualizar la app.</p></div>`;
      return;
    }
    if (window.__aqMap3DDispose) window.__aqMap3DDispose();
    stage.innerHTML = '';
    const width = Math.max(320, stage.clientWidth || 640);
    const height = Math.max(260, stage.clientHeight || Math.round(width * 0.75));
    const aq = currentAquarium();
    const cleanMap = map || window.__aqMap || readMap(aq);
    const tank = aquariumDimensions(aq);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020b14);
    scene.fog = new THREE.Fog(0x020b14, 150, 420);
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    if (!window.__aqMapZoom) {
      const initial = cameraStateFor('front', tank);
      window.__aqMapRotation = initial.rotation;
      window.__aqMapPitch = initial.pitch;
      window.__aqMapZoom = initial.zoom;
    }
    applyCamera(camera, tank);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    stage.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdff8ff, 0x061727, 1.8));
    const light = new THREE.DirectionalLight(0xffffff, 1.35);
    light.position.set(tank.w * 0.28, tank.h * 1.7, tank.d * 1.2);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    scene.add(light);
    const reefLight = new THREE.PointLight(0x1aa7ff, 2.2, Math.max(tank.w, tank.d) * 2.4);
    reefLight.position.set(0, tank.h + 10, tank.d * 0.16);
    scene.add(reefLight);

    addTankShell(scene, tank);
    addSubstrate(scene, tank);
    const surface = addWaterVolume(scene, tank);
    addLightingRig(scene, tank);
    addDimensionLabel(scene, tank);

    const photos = mapPhotos(cleanMap);
    addPhotoPlane(scene, renderer, camera, photos.front, { tank, fit: 'front', w: tank.innerW, h: tank.waterH, x: 0, y: tank.waterH / 2, z: -tank.d / 2 - 0.35, opacity: 0.24 });
    addPhotoPlane(scene, renderer, camera, photos.left, { w: tank.innerD, h: tank.waterH, x: -tank.w / 2 - 0.35, y: tank.waterH / 2, z: 0, ry: Math.PI / 2, opacity: 0.18 });
    addPhotoPlane(scene, renderer, camera, photos.right, { w: tank.innerD, h: tank.waterH, x: tank.w / 2 + 0.35, y: tank.waterH / 2, z: 0, ry: -Math.PI / 2, opacity: 0.18 });
    addPhotoPlane(scene, renderer, camera, photos.top, { w: tank.innerW, h: tank.innerD, x: 0, y: tank.waterH + 0.42, z: 0, rx: -Math.PI / 2, opacity: 0.13 });

    addBaseAquascape(scene, tank);
    addWaterFlow(scene, tank);

    const animatedObjects = [];
    cleanMap.markers.forEach(function (marker) {
      const pos = marker3DPositionInTank(marker, tank);
      const group = createAquariumObject(marker);
      group.position.set(pos.x, pos.y, pos.z);
      group.rotation.y = marker.type === 'fish' ? Math.PI * 0.05 : (Number(marker.z) - 50) * 0.018;
      scene.add(group);
      addLabelSprite(scene, marker.label, new THREE.Vector3(pos.x, pos.y, pos.z), window.__aqMap?.selected_id === marker.id);
      animatedObjects.push(group);
    });

    if (!cleanMap.markers.length) {
      const hint = new THREE.Group();
      addRoundedBox(hint, 22, 8, 14, 0x0e8eff, 9, { roughness: 0.5, transparent: true, opacity: 0.75 });
      hint.position.set(0, 0, 0);
      scene.add(hint);
      addLabelSprite(scene, 'Sin puntos', new THREE.Vector3(0, tank.sandH + 10, 0), true);
    }

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', function (event) {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      window.__aqMapRotation = (window.__aqMapRotation || 0) + (event.clientX - lastX) * 0.35;
      window.__aqMapPitch = Math.max(0.18, Math.min(1.48, (window.__aqMapPitch ?? 0.42) + (lastY - event.clientY) * 0.006));
      lastX = event.clientX;
      lastY = event.clientY;
      applyCamera(camera, tank);
    });
    canvas.addEventListener('pointerup', function () { dragging = false; });
    canvas.addEventListener('wheel', function (event) {
      event.preventDefault();
      const minZoom = Math.max(tank.w, tank.d, tank.h) * 1.05;
      const maxZoom = Math.max(tank.w, tank.d, tank.h) * 2.8;
      window.__aqMapZoom = Math.max(minZoom, Math.min(maxZoom, (window.__aqMapZoom || maxZoom * 0.62) + event.deltaY * 0.15));
      applyCamera(camera, tank);
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
      surface.material.opacity = 0.28 + Math.sin(time * 1.8) * 0.045;
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

  function rotateMap3D(delta) {
    const { currentAquarium } = A();
    const { readMap } = S();
    window.__aqMapRotation = (window.__aqMapRotation || 0) + delta;
    renderMap3D(window.__aqMap || readMap(currentAquarium()));
  }

  function setMap3DView(view) {
    const { currentAquarium } = A();
    const { readMap } = S();
    const tank = aquariumDimensions(currentAquarium());
    const next = cameraStateFor(view, tank);
    window.__aqMapRotation = next.rotation;
    window.__aqMapPitch = next.pitch;
    window.__aqMapZoom = next.zoom;
    renderMap3D(window.__aqMap || readMap(currentAquarium()));
  }

  function resetMap3D() { setMap3DView('front'); }

  window.ANX = window.ANX || {};
  window.ANX.MapRender3D = { renderMap3D, rotateMap3D, setMap3DView, resetMap3D, aquariumDimensions };
})();