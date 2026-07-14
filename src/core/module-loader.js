/* AcuarioNexo · cargador de módulos bajo demanda */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const version = encodeURIComponent(window.ANX_ASSET_VERSION || window.ACUARIONEXO_BUILD || 'dev');
  const loadedGroups = new Set();
  const pendingGroups = new Map();
  const loadedScripts = new Set();

  const GROUPS = {
    biblioteca: [
      'src/library/core/library-schema.js',
      'src/library/core/library-schema-rules.js',
      'src/library/ui/library.js',
      'src/library/inventory/library-inventory-import.js',
      'src/library/library-v3-core.js',
      'src/library/library-v3-template.js',
      'src/library/library-v3-images.js',
      'src/library/library-v3-ai.js',
      'src/library/library-v3-ficha.js',
      'src/library/ficha/ficha-actions.js',
      'src/library/library-v3.js',
      'src/library/ficha/ficha-type-tools.js',
      'src/library/ficha/ficha-chat-import.js',
      'src/library/core/library-admin-policy.js'
    ],
    animales: [
      'src/animals/animals-core.js',
      'src/animals/animals.js'
    ],
    mapa: [
      'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js',
      'src/map/map-v3-model.js',
      'src/map/map-state.js',
      'src/map/map-ui.js',
      'src/map/map-photos.js',
      'src/map/map-markers.js',
      'src/map/map-render-3d.js',
      'src/map/map-save.js',
      'src/map/map.js',
      'src/map/map-interactions.js'
    ],
    fotos: [
      'src/photos/photos-core.js',
      'src/photos/photos-form.js',
      'src/photos/photos-save.js',
      'src/photos/photos.js'
    ],
    inventario: [
      'src/inventory/inventory-core.js',
      'src/inventory/inventory-list.js',
      'src/inventory/inventory-form.js',
      'src/inventory/inventory.js',
      'src/inventory/inventory-ui.js'
    ],
    microfauna: [
      'src/microfauna/microfauna-core.js',
      'src/microfauna/microfauna-form.js',
      'src/microfauna/microfauna-save.js',
      'src/microfauna/microfauna.js'
    ],
    ia: [
      'src/ai/ai.js',
      'src/ai/ai-library-v3.js',
      'src/ai/ai-alerts-extra.js'
    ],
    parametros: [
      'src/ai/ai.js',
      'src/ai/ai-alerts-extra.js',
      'src/parameters/parameters-core.js',
      'src/parameters/parameters-alert-helpers.js',
      'src/parameters/parameters-manual.js',
      'src/parameters/parameters.js',
      'src/parameters/measurements-advanced.js',
      'src/parameters/parameters-ai-fallback.js'
    ],
    tareas: [
      'src/tasks/tasks-core.js',
      'src/tasks/tasks-form.js',
      'src/tasks/tasks.js'
    ],
    admin: [
      'src/admin/admin.js'
    ]
  };

  function scriptKey(src) {
    return src.replace(/[?#].*$/, '');
  }

  function scriptSrc(src) {
    if (/^https?:\/\//i.test(src)) return src;
    return src + '?v=' + version;
  }

  function loadScript(src) {
    const key = scriptKey(src);
    if (loadedScripts.has(key) || document.querySelector('script[data-src-key="' + key + '"]')) {
      loadedScripts.add(key);
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = scriptSrc(src);
      script.async = false;
      script.dataset.srcKey = key;
      script.onload = function () {
        loadedScripts.add(key);
        resolve();
      };
      script.onerror = function () {
        reject(new Error('No se pudo cargar ' + src));
      };
      document.body.appendChild(script);
    });
  }

  async function loadModuleGroup(name) {
    if (loadedGroups.has(name)) return true;
    if (pendingGroups.has(name)) return pendingGroups.get(name);
    const list = GROUPS[name];
    if (!list) throw new Error('Grupo de módulo no registrado: ' + name);
    const job = (async function () {
      for (let i = 0; i < list.length; i += 1) await loadScript(list[i]);
      loadedGroups.add(name);
      pendingGroups.delete(name);
      return true;
    })().catch(function (error) {
      pendingGroups.delete(name);
      throw error;
    });
    pendingGroups.set(name, job);
    return job;
  }

  function loadingPanel(label, active) {
    if (!ANX.render || !ANX.msg) return;
    ANX.render('<section class="panel">' + ANX.msg('Cargando ' + label + '...') + '</section>', active || 'inicio');
  }

  function moduleError(error, active) {
    if (!ANX.render || !ANX.msg) return;
    ANX.render('<section class="panel">' + ANX.msg(error.message || error, 'error') + '</section>', active || 'inicio');
  }

  function proxy(globalName, groupName, label, active) {
    const proxyFn = async function () {
      const args = Array.from(arguments);
      try {
        loadingPanel(label || groupName, active || groupName);
        await loadModuleGroup(groupName);
        const real = window[globalName];
        if (real === proxyFn || typeof real !== 'function') throw new Error(globalName + ' no quedó disponible.');
        return real.apply(window, args);
      } catch (error) {
        moduleError(error, active || groupName);
      }
    };
    window[globalName] = window[globalName] || proxyFn;
  }

  proxy('biblioteca', 'biblioteca', 'Biblioteca', 'biblioteca');
  proxy('animales', 'animales', 'Animales', 'acuarios');
  proxy('mapaIA', 'mapa', 'Mapa IA', 'acuarios');
  proxy('fotos', 'fotos', 'Fotos', 'acuarios');
  proxy('inventario', 'inventario', 'Inventario', 'inventario');
  proxy('microfauna', 'microfauna', 'Microfauna', 'microfauna');
  proxy('parametros', 'parametros', 'Parámetros', 'acuarios');
  proxy('tareas', 'tareas', 'Avisos', 'avisos');
  proxy('adminPanel', 'admin', 'Admin', 'admin');

  ANX.loadModuleGroup = loadModuleGroup;
})();
