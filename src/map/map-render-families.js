/* AcuarioNexo · procedural reusable 3D family overlay */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const baseApi = ANX.MapRender3D;
  if (!baseApi || typeof baseApi.renderMap3D !== 'function') return;
  const baseRender = baseApi.renderMap3D.bind(baseApi);

  function familyApi() { return ANX.MapModelFamilies || {}; }
  function mat(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.48,
      metalness: options.metalness ?? 0.03,
      transparent: !!options.transparent,
      opacity: options.opacity ?? 1,
      side: options.side || THREE.FrontSide
    });
  }
  function mesh(group, geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    group.add(m);
    return m;
  }
  function branch(group, x, z, h, r, color, tilt = 0) {
    const m = mesh(group, new THREE.CylinderGeometry(r, r * 1.2, h, 9), mat(color), x, h / 2, z);
    m.rotation.z = tilt;
    mesh(group, new THREE.SphereGeometry(r * 1.8, 10, 7), mat(color), x + Math.sin(tilt) * h * 0.45, h, z);
  }

  function coralBranching(group, color) {
    mesh(group, new THREE.CylinderGeometry(4.5, 5.2, 2, 16), mat(0x795548), 0, 1, 0);
    [[0,0,10,.7,0],[-3,1,8,.55,-.22],[3,-1,8.5,.55,.22],[-1.5,-2.5,7,.48,-.14],[2,2.4,6.6,.45,.18]].forEach(v => branch(group, v[0], v[1], v[2], v[3], color, v[4]));
  }
  function coralPlate(group, color) {
    const m = mat(color, { roughness: 0.58, side: THREE.DoubleSide });
    [0, 1, 2].forEach(function (i) {
      const plate = mesh(group, new THREE.CylinderGeometry(5.7 - i * 0.8, 4.8 - i * 0.7, 0.7, 26), m, (i - 1) * 1.6, 2.2 + i * 2.2, (i % 2 ? -1.2 : 1.2), 1.4, 1, 0.76);
      plate.rotation.z = (i - 1) * 0.12;
    });
  }
  function coralMassive(group, color) {
    const body = mesh(group, new THREE.SphereGeometry(5.2, 24, 14), mat(color, { roughness: 0.62 }), 0, 4.2, 0, 1.2, .8, 1);
    body.rotation.y = .4;
    for (let i = 0; i < 14; i += 1) {
      const a = i / 14 * Math.PI * 2;
      mesh(group, new THREE.TorusGeometry(.55, .16, 7, 14), mat(0xfde68a), Math.cos(a) * 4.3, 4.4 + Math.sin(i * 1.8) * 1.8, Math.sin(a) * 2.6).rotation.x = Math.PI / 2;
    }
  }
  function coralBrain(group, color) {
    const body = mesh(group, new THREE.SphereGeometry(5.4, 28, 16), mat(color, { roughness: .72 }), 0, 4, 0, 1.35, .78, 1.05);
    body.rotation.y = .3;
    const lineMat = mat(0xfbcfe8, { roughness: .5 });
    [-2.7, -1.35, 0, 1.35, 2.7].forEach(function (x, i) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 2.5, -4), new THREE.Vector3(x + (i % 2 ? .8 : -.8), 4.2, -1), new THREE.Vector3(x, 5, 2.2), new THREE.Vector3(x + .5, 4.2, 4)
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .16, 7, false), lineMat));
    });
  }
  function coralTentacled(group, color) {
    mesh(group, new THREE.CylinderGeometry(4.6, 5.1, 2, 18), mat(0x8b5e3c), 0, 1, 0);
    const tentMat = mat(color, { roughness: .42 });
    for (let i = 0; i < 18; i += 1) {
      const a = i / 18 * Math.PI * 2;
      const r = 1.3 + (i % 4) * .7;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(a) * r, 2, Math.sin(a) * r),
        new THREE.Vector3(Math.cos(a) * (r + 1.2), 5, Math.sin(a) * (r + .8)),
        new THREE.Vector3(Math.cos(a + .18) * (r + 2.4), 7 + (i % 3), Math.sin(a + .18) * (r + 1.7))
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 14, .28, 7, false), tentMat));
      const end = curve.getPoint(1);
      mesh(group, new THREE.SphereGeometry(.7, 9, 7), tentMat, end.x, end.y, end.z, 1.5, .7, 1.1);
    }
  }
  function coralFlower(group, color) {
    mesh(group, new THREE.CylinderGeometry(4.5, 5, 2, 18), mat(0x73543c), 0, 1, 0);
    for (let i = 0; i < 12; i += 1) {
      const a = i / 12 * Math.PI * 2;
      const x = Math.cos(a) * (2.2 + (i % 3));
      const z = Math.sin(a) * (2.2 + (i % 3));
      branch(group, x, z, 5 + (i % 4), .22, color, (i % 2 ? .14 : -.14));
      for (let p = 0; p < 6; p += 1) {
        const pa = p / 6 * Math.PI * 2;
        mesh(group, new THREE.SphereGeometry(.38, 8, 6), mat(color), x + Math.cos(pa) * 1.05, 6.2 + (i % 4), z + Math.sin(pa) * 1.05, 1.6, .55, 1);
      }
    }
  }
  function coralMushroom(group, color) {
    const disc = mesh(group, new THREE.SphereGeometry(5.2, 28, 12), mat(color, { roughness: .64 }), 0, 2.1, 0, 1.4, .34, 1.15);
    disc.rotation.y = .4;
    mesh(group, new THREE.CylinderGeometry(1.1, 1.5, 2.2, 16), mat(0x795548), 0, .8, 0);
  }
  function coralZoanthid(group, color) {
    for (let i = 0; i < 18; i += 1) {
      const a = i * 2.399;
      const r = 1.2 + .42 * Math.sqrt(i) * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      mesh(group, new THREE.CylinderGeometry(.38, .55, 2.1 + (i % 3) * .35, 9), mat(0x6b4f37), x, 1.2, z);
      const polyp = mesh(group, new THREE.CylinderGeometry(1.05, .75, .38, 14), mat(color), x, 2.45 + (i % 3) * .35, z, 1, .45, 1);
      polyp.rotation.y = a;
    }
  }
  function coralLeather(group, color) {
    mesh(group, new THREE.CylinderGeometry(1.8, 2.8, 7, 14), mat(color, { roughness: .75 }), 0, 3.5, 0);
    const cap = mesh(group, new THREE.SphereGeometry(5.2, 24, 12), mat(color, { roughness: .68 }), 0, 7.2, 0, 1.25, .3, 1);
    cap.rotation.z = .08;
  }
  function coralXenia(group, color) {
    for (let i = 0; i < 11; i += 1) {
      const a = i / 11 * Math.PI * 2;
      const r = 1 + (i % 4);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      branch(group, x, z, 4 + (i % 4), .2, color, (i % 2 ? .12 : -.12));
      for (let p = 0; p < 7; p += 1) {
        const pa = p / 7 * Math.PI * 2;
        const leaf = mesh(group, new THREE.SphereGeometry(.46, 8, 6), mat(color), x + Math.cos(pa) * .8, 4.4 + (i % 4), z + Math.sin(pa) * .8, 1.7, .4, .55);
        leaf.rotation.y = pa;
      }
    }
  }
  function coralGorgonian(group, color) {
    const gmat = mat(color, { roughness: .6 });
    const paths = [[0,0,0],[1,1,0],[-1,2,0],[2,3,0],[-2,4,0],[1,5,0],[-1,6,0]];
    paths.forEach(function (_, i) {
      const x = (i - 3) * 1.25;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1, 0), new THREE.Vector3(x * .35, 4, 0), new THREE.Vector3(x, 8 + Math.abs(i - 3), (i % 2 ? 1 : -1))
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, .2, 7, false), gmat));
      if (i > 0 && i < 6) {
        const curve2 = new THREE.CatmullRomCurve3([new THREE.Vector3(x * .25, 4, 0), new THREE.Vector3(x * 1.3, 6, .4), new THREE.Vector3(x * 1.65, 7, .8)]);
        group.add(new THREE.Mesh(new THREE.TubeGeometry(curve2, 12, .14, 6, false), gmat));
      }
    });
  }

  function fishBase(group, color, sx, sy, tailSize) {
    const body = mesh(group, new THREE.SphereGeometry(4.1, 26, 16), mat(color, { roughness: .34, metalness: .08 }), 0, 4.3, 0, sx, sy, .68);
    const fin = mat(0x93c5fd, { transparent: true, opacity: .72, side: THREE.DoubleSide });
    const tail = mesh(group, new THREE.ConeGeometry(tailSize, 5, 3), fin, -6.7 * sx / 1.5, 4.3, 0);
    tail.rotation.z = Math.PI / 2;
    const eye = mesh(group, new THREE.SphereGeometry(.48, 9, 7), mat(0xffffff), 4.3 * sx / 1.5, 5, 1.45);
    mesh(group, new THREE.SphereGeometry(.2, 8, 6), mat(0x020617), eye.position.x + .25, 5, 1.67);
    group.userData.swim = true;
    return body;
  }
  function fishSeahorse(group, color) {
    mesh(group, new THREE.SphereGeometry(2.4, 20, 14), mat(color), 0, 6.4, 0, .75, 1.35, .7);
    const snout = mesh(group, new THREE.CylinderGeometry(.35, .55, 3.4, 10), mat(color), 2.25, 7.4, 0);
    snout.rotation.z = Math.PI / 2;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,5,0),new THREE.Vector3(-1,3,0),new THREE.Vector3(.5,1.4,0),new THREE.Vector3(1.6,2.1,0)]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 22, .45, 8, false), mat(color)));
    group.userData.swim = true;
  }

  function plantFamily(group, family, color) {
    const stem = mat(0x166534, { roughness: .7 });
    const leaf = mat(color, { roughness: .62, side: THREE.DoubleSide });
    if (family === 'plant-moss') {
      for (let i = 0; i < 28; i += 1) {
        const a = i * 2.399, r = .5 + Math.sqrt(i) * .65;
        mesh(group, new THREE.SphereGeometry(.7, 8, 6), leaf, Math.cos(a) * r, 1.2 + (i % 4) * .45, Math.sin(a) * r, 1.5, .8, 1.2);
      }
      return;
    }
    if (family === 'plant-grass') {
      for (let i = 0; i < 18; i += 1) {
        const blade = mesh(group, new THREE.BoxGeometry(.24, 7 + (i % 5), .09), leaf, (i % 6 - 2.5) * .8, 3.7 + (i % 5) / 2, (Math.floor(i / 6) - 1) * .8);
        blade.rotation.z = (i % 3 - 1) * .12;
      }
      return;
    }
    const count = family === 'plant-rosette' ? 10 : family === 'plant-rhizome' ? 7 : 8;
    for (let i = 0; i < count; i += 1) {
      const x = family === 'plant-rosette' ? 0 : (i - count / 2) * .65;
      const st = mesh(group, new THREE.CylinderGeometry(.18, .3, 5 + i % 4, 7), stem, x, 2.5 + (i % 4) / 2, 0);
      st.rotation.z = family === 'plant-rosette' ? (i - count / 2) * .16 : (i % 3 - 1) * .08;
      const lf = mesh(group, new THREE.SphereGeometry(1.5, 12, 8), leaf, x + Math.sin(st.rotation.z) * 2, 5.2 + i % 4, 0, .55, 1.25, .14);
      lf.rotation.z = st.rotation.z;
    }
  }

  function equipmentFamily(group, family, color) {
    const dark = mat(0x111827, { roughness: .38, metalness: .4 });
    const accent = mat(color, { roughness: .28, metalness: .2 });
    if (family === 'equipment-heater') {
      mesh(group, new THREE.CylinderGeometry(.8, .8, 10, 16), dark, 0, 5, 0);
      mesh(group, new THREE.CylinderGeometry(.88, .88, 2, 16), accent, 0, 9, 0);
    } else if (family === 'equipment-light') {
      mesh(group, new THREE.BoxGeometry(12, 1.6, 4), dark, 0, 7, 0);
      mesh(group, new THREE.PlaneGeometry(10, 2.5), new THREE.MeshBasicMaterial({ color: 0x9ee8ff, side: THREE.DoubleSide }), 0, 6.1, 0).rotation.x = Math.PI / 2;
    } else if (family === 'equipment-skimmer') {
      mesh(group, new THREE.CylinderGeometry(2.5, 3, 8, 20), dark, 0, 4, 0);
      mesh(group, new THREE.CylinderGeometry(2.1, 2.5, 3.2, 20), accent, 0, 9.2, 0, 1, 1, 1);
    } else if (family === 'equipment-filter') {
      mesh(group, new THREE.BoxGeometry(7, 9, 5), dark, 0, 4.5, 0);
      mesh(group, new THREE.BoxGeometry(5.2, 1.2, 3.6), accent, 0, 8, 0);
    } else {
      mesh(group, new THREE.BoxGeometry(7, 6, 5), dark, 0, 4, 0);
      const nozzle = mesh(group, new THREE.CylinderGeometry(1.1, 1.4, 5, 16), accent, 5, 4, 0);
      nozzle.rotation.z = Math.PI / 2;
    }
  }

  function familyColor(family) {
    if (/branching|plate/.test(family)) return 0xf973a6;
    if (/brain|massive/.test(family)) return 0xef6f9d;
    if (/tentacled|flower/.test(family)) return 0x4ade80;
    if (/mushroom/.test(family)) return 0x8b5cf6;
    if (/zoanthid/.test(family)) return 0xf59e0b;
    if (/leather|xenia|gorgonian/.test(family)) return 0xa3e635;
    if (/fish-/.test(family)) return 0x0e8eff;
    if (/plant-/.test(family)) return 0x22c55e;
    if (/equipment-/.test(family)) return 0xf59e0b;
    return 0xcbd5e1;
  }

  function buildObject(marker) {
    const group = new THREE.Group();
    const family = familyApi().resolveFamily ? familyApi().resolveFamily(marker) : String(marker.model_family || 'other-generic');
    const color = familyColor(family);
    if (family === 'coral-branching-sps') coralBranching(group, color);
    else if (family === 'coral-plating-sps') coralPlate(group, color);
    else if (family === 'coral-brain-lps') coralBrain(group, color);
    else if (family === 'coral-tentacled-lps') coralTentacled(group, color);
    else if (family === 'coral-flower-lps') coralFlower(group, color);
    else if (family === 'coral-mushroom') coralMushroom(group, color);
    else if (family === 'coral-zoanthid') coralZoanthid(group, color);
    else if (family === 'coral-leather') coralLeather(group, color);
    else if (family === 'coral-xenia') coralXenia(group, color);
    else if (family === 'coral-gorgonian') coralGorgonian(group, color);
    else if (family === 'coral-massive-lps' || family === 'coral-generic') coralMassive(group, color);
    else if (family === 'fish-seahorse') fishSeahorse(group, color);
    else if (family.startsWith('fish-')) {
      const dims = {
        'fish-tang': [1.5, .82, 3.8], 'fish-angelfish': [1.25, 1.05, 3.4], 'fish-butterfly': [1.28, 1.08, 3.5],
        'fish-wrasse': [1.72, .55, 2.8], 'fish-goby': [1.82, .42, 2.4], 'fish-clown': [1.22, .72, 3.0], 'fish-generic': [1.5, .72, 3.4]
      }[family] || [1.5, .72, 3.4];
      fishBase(group, color, dims[0], dims[1], dims[2]);
    } else if (family.startsWith('plant-')) plantFamily(group, family, color);
    else if (family.startsWith('equipment-')) equipmentFamily(group, family, color);
    else if (family === 'rock-generic') {
      for (let i = 0; i < 5; i += 1) mesh(group, new THREE.IcosahedronGeometry(1, 1), mat(0x8b8172, { roughness: .95 }), (i - 2) * 2, 1.7 + i % 2, (i % 3 - 1) * 1.5, 3, 2.4, 2.8);
    } else mesh(group, new THREE.SphereGeometry(3.8, 18, 12), mat(color), 0, 4, 0);
    group.scale.setScalar(Math.max(.7, Math.min(2.2, (Number(marker.size) || 14) / 14)));
    group.userData.family = family;
    return group;
  }

  function positionInTank(marker, tank) {
    return {
      x: ((Number(marker.x) || 50) - 50) / 100 * tank.innerW,
      y: tank.sandH + 2 + (100 - (Number(marker.y) || 50)) / 100 * Math.max(8, tank.waterH - tank.sandH - 8),
      z: ((Number(marker.z) || 50) - 50) / 100 * tank.innerD
    };
  }
  function applyCamera(camera, tank) {
    const rotation = window.__aqMapRotation || 0;
    const pitch = Math.max(.18, Math.min(1.48, window.__aqMapPitch ?? .42));
    const zoom = window.__aqMapZoom || Math.max(tank.w, tank.d, tank.h) * 1.72;
    const radians = rotation * Math.PI / 180;
    const horizontal = Math.cos(pitch) * zoom;
    camera.position.set(Math.sin(radians) * horizontal, Math.sin(pitch) * zoom + tank.h * .24, Math.cos(radians) * horizontal);
    camera.lookAt(0, tank.h * .46, 0);
  }

  function renderFamilyOverlay(map) {
    const stage = document.getElementById('map3dStage');
    if (!stage || !window.THREE) return;
    const aq = ANX.currentAquarium?.();
    const tank = baseApi.aquariumDimensions(aq);
    const cleanMap = map || window.__aqMap || { markers: [] };
    const width = Math.max(320, stage.clientWidth || 640);
    const height = Math.max(260, stage.clientHeight || Math.round(width * .75));
    stage.style.position = 'relative';
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.dataset.mapFamilyOverlay = 'true';
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, .1, 1000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x0b1f2f, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(tank.w * .25, tank.h * 1.6, tank.d);
    scene.add(key);
    const objects = [];
    (cleanMap.markers || []).forEach(function (marker, index) {
      const object = buildObject(marker);
      const pos = positionInTank(marker, tank);
      object.position.set(pos.x, pos.y, pos.z);
      object.rotation.y = marker.type === 'fish' ? .1 : (Number(marker.z) - 50) * .018;
      object.userData.index = index;
      scene.add(object);
      objects.push(object);
    });

    let stopped = false;
    const clock = new THREE.Clock();
    function animate() {
      if (stopped) return;
      const t = clock.getElapsedTime();
      applyCamera(camera, tank);
      objects.forEach(function (o, i) {
        if (o.userData.swim) {
          o.rotation.y = Math.sin(t * .75 + i) * .16;
          o.position.y += Math.sin(t * 1.5 + i) * .006;
        }
      });
      renderer.render(scene, camera);
      window.__aqMapFamilyFrame = requestAnimationFrame(animate);
    }
    animate();

    return function dispose() {
      stopped = true;
      if (window.__aqMapFamilyFrame) cancelAnimationFrame(window.__aqMapFamilyFrame);
      scene.traverse(function (obj) {
        obj.geometry?.dispose?.();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.filter(Boolean).forEach(m => m.dispose?.());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }

  function renderMap3D(map) {
    const cleanMap = map || window.__aqMap || { markers: [] };
    const baseMap = { ...cleanMap, markers: [] };
    baseRender(baseMap);
    const baseDispose = window.__aqMap3DDispose;
    const familyDispose = renderFamilyOverlay(cleanMap);
    window.__aqMap3DDispose = function () {
      try { familyDispose?.(); } catch (_) {}
      try { baseDispose?.(); } catch (_) {}
    };
  }

  ANX.MapRender3D = { ...baseApi, renderMap3D };
})();
