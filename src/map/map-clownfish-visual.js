/* AcuarioNexo · visual específico para pez payaso en el Gemelo 3D */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const api = ANX.MapRender3D;
  if (!api || typeof api.renderMap3D !== 'function' || !window.THREE) return;
  const previousRender = api.renderMap3D.bind(api);

  function resolveFamily(marker) {
    return ANX.MapModelFamilies?.resolveFamily?.(marker) || String(marker?.model_family || '');
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
    const pitch = Math.max(0.18, Math.min(1.48, window.__aqMapPitch ?? 0.42));
    const zoom = window.__aqMapZoom || Math.max(tank.w, tank.d, tank.h) * 1.72;
    const radians = rotation * Math.PI / 180;
    const horizontal = Math.cos(pitch) * zoom;
    camera.position.set(Math.sin(radians) * horizontal, Math.sin(pitch) * zoom + tank.h * 0.24, Math.cos(radians) * horizontal);
    camera.lookAt(0, tank.h * 0.46, 0);
  }

  function mat(color, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.4, metalness: 0.02, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, side: opts.side || THREE.FrontSide });
  }

  function clownfish(marker) {
    const g = new THREE.Group();
    const orange = mat(0xff6a00, { roughness: 0.34 });
    const white = mat(0xffffff, { roughness: 0.28 });
    const black = mat(0x111111, { roughness: 0.42 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(4.6, 30, 20), orange);
    body.scale.set(1.55, 0.78, 0.62);
    body.position.y = 4.4;
    g.add(body);

    [[-1.8, 1.0], [1.05, 0.92]].forEach(function (b) {
      const edge = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.72, 10, 34), black);
      edge.rotation.y = Math.PI / 2;
      edge.scale.set(1, 0.72, 1);
      edge.position.set(b[0], 4.4, 0);
      g.add(edge);
      const band = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.48, 10, 34), white);
      band.rotation.y = Math.PI / 2;
      band.scale.set(1, 0.72, 1);
      band.position.set(b[0], 4.4, 0);
      g.add(band);
    });

    const tail = new THREE.Mesh(new THREE.ConeGeometry(3.1, 5.2, 3), orange);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-7.4, 4.4, 0);
    g.add(tail);
    const tailEdge = new THREE.Mesh(new THREE.ConeGeometry(3.45, 0.55, 3), black);
    tailEdge.rotation.z = Math.PI / 2;
    tailEdge.position.set(-9.7, 4.4, 0);
    g.add(tailEdge);

    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(2.1, 4, 3), black);
    dorsal.rotation.x = Math.PI;
    dorsal.position.set(0.2, 8.0, 0);
    g.add(dorsal);

    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), white);
    eyeWhite.position.set(5.6, 5.25, 1.65);
    g.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), black);
    pupil.position.set(5.9, 5.25, 1.88);
    g.add(pupil);

    const scale = Math.max(0.78, Math.min(2.1, (Number(marker.size) || 14) / 14));
    g.scale.setScalar(scale * 1.18);
    g.userData.swim = true;
    return g;
  }

  function addOverlay(map) {
    const stage = document.getElementById('map3dStage');
    if (!stage) return function () {};
    const markers = (map?.markers || []).filter(m => resolveFamily(m) === 'fish-clown');
    if (!markers.length) return function () {};

    const aq = ANX.currentAquarium?.();
    const tank = api.aquariumDimensions(aq);
    const width = Math.max(320, stage.clientWidth || 640);
    const height = Math.max(260, stage.clientHeight || Math.round(width * 0.75));
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
    renderer.domElement.dataset.clownfishOverlay = 'true';
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    applyCamera(camera, tank);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x102236, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(tank.w * 0.25, tank.h * 1.5, tank.d);
    scene.add(key);

    const objects = [];
    markers.forEach(function (marker, index) {
      const p = positionInTank(marker, tank);
      const fish = clownfish(marker);
      fish.position.set(p.x, p.y, p.z);
      fish.rotation.y = Math.PI * 0.03;
      fish.userData.baseX = p.x;
      fish.userData.baseY = p.y;
      fish.userData.phase = index * 0.9;
      scene.add(fish);
      objects.push(fish);
    });

    let stopped = false;
    const clock = new THREE.Clock();
    function animate() {
      if (stopped) return;
      const t = clock.getElapsedTime();
      applyCamera(camera, tank);
      objects.forEach(function (fish) {
        fish.position.x = fish.userData.baseX + Math.sin(t * 0.8 + fish.userData.phase) * 1.2;
        fish.position.y = fish.userData.baseY + Math.sin(t * 1.4 + fish.userData.phase) * 0.35;
        fish.rotation.y = Math.sin(t * 0.7 + fish.userData.phase) * 0.16;
      });
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    return function () {
      stopped = true;
      scene.traverse(function (obj) {
        obj.geometry?.dispose?.();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.filter(Boolean).forEach(m => m.dispose?.());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }

  api.renderMap3D = function (map) {
    previousRender(map);
    const priorDispose = window.__aqMap3DDispose;
    const overlayDispose = addOverlay(map || window.__aqMap || { markers: [] });
    window.__aqMap3DDispose = function () {
      try { overlayDispose(); } catch (_) {}
      try { priorDispose?.(); } catch (_) {}
    };
  };
})();
