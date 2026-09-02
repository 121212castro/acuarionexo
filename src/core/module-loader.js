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
      'src/library/core/library-admin-policy.js',
      'src/library/audit-fallback.js'
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
    assistant: [
      'src/assistant/core/assistant-contract.js',
      'src/assistant/core/assistant-library-search.js',
      'src/assistant/core/assistant-aquarium-context.js',
      'src/assistant/assistant-portal.js'
    ],
    ia: [
      'src/inventory/inventory-core.js',
      'src/ai/ai.js',
      'src/ai/ai-library-v3.js',
      'src/ai/ai-alerts-extra.js',
      'src/ai/ai-access.js'
    ],
    parametros: [
      'src/ai/ai.js',
      'src/ai/ai-alerts-extra.js',
      'src/parameters/parameters-core.js',
      'src/parameters/parameters-alert-helpers.js',
      'src/parameters/parameters-manual.js',
      'src/parameters/parameters.js',
      'src/parameters/measurements-advanced.js',
      'src/parameters/parameters-compact-form.js',
      'src/parameters/parameters-ai-fallback.js',
      'src/ai/ai-access.js'
    ],
    tareas: [
      'src/tasks/tasks-core.js',
      'src/tasks/tasks-form.js',
      'src/tasks/tasks.js'
    ],
    admin: [
      'src/admin/admin.js'
    ],
    settings: [
      'src/settings/settings.js',
      'src/support/settings-support-link.js',
      'src/status/settings-status-link.js',
      'src/ai/ai-access.js'
    ],
    support: [
      'src/support/support.js'
    ],
    status: [
      'src/status/status-core.js',
      'src/status/status-ui.js',
      'src/status/status.js',
      'src/ai/ai-access.js'
    ]
  };

  function scriptKey(src) {
    return src.replace(/[?#].*$/, '');
  }

  function scriptSrc(src, attempt) {
    if (/^https?:\/\//i.test(src)) return src;
    return src + '?v=' + version + '&attempt=' + attempt;
  }

  function preloadGroupAssets(list) {
    list.filter(src => !/^https?:\/\//i.test(src)).forEach(function (src) {
      const key = scriptKey(src);
      if (loadedScripts.has(key) || document.querySelector('link[data-preload-key="' + key + '"]')) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = scriptSrc(src, 1);
      link.dataset.preloadKey = key;
      document.head.appendChild(link);
    });
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function removeFailedScripts(key) {
    document.querySelectorAll('script[data-src-key="' + key + '"]').forEach(function (script) {
      if (script.dataset.loaded !== 'true') script.remove();
    });
  }

  function loadScriptAttempt(src, attempt) {
    const key = scriptKey(src);
    return new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = scriptSrc(src, attempt);
      script.async = false;
      script.dataset.srcKey = key;
      script.dataset.loaded = 'false';
      script.onload = function () {
        script.dataset.loaded = 'true';
        loadedScripts.add(key);
        resolve();
      };
      script.onerror = function () {
        script.remove();
        reject(new Error('No se pudo cargar ' + src));
      };
      document.body.appendChild(script);
    });
  }

  async function loadScript(src) {
    const key = scriptKey(src);
    const loadedTag = document.querySelector('script[data-src-key="' + key + '"][data-loaded="true"]');
    if (loadedScripts.has(key) || loadedTag) {
      loadedScripts.add(key);
      return true;
    }

    removeFailedScripts(key);
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await loadScriptAttempt(src, attempt);
        return true;
      } catch (error) {
        lastError = error;
        removeFailedScripts(key);
        if (attempt < 3) await wait(attempt * 700);
      }
    }
    throw lastError || new Error('No se pudo cargar ' + src);
  }

  async function loadModuleGroup(name) {
    if (loadedGroups.has(name)) return true;
    if (pendingGroups.has(name)) return pendingGroups.get(name);
    const list = GROUPS[name];
    if (!list) throw new Error('Grupo de módulo no registrado: ' + name);
    preloadGroupAssets(list);
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
  proxy('assistantPortal', 'assistant', 'Asistente AcuarioNexo', 'inicio');
  proxy('iaAcuarioNexo', 'ia', 'Inteligencia artificial', 'avisos');
  proxy('parametros', 'parametros', 'Parámetros', 'acuarios');
  proxy('tareasAcuario', 'tareas', 'Tareas', 'acuarios');
  proxy('tareas', 'tareas', 'Avisos', 'avisos');
  proxy('adminPanel', 'admin', 'Admin', 'admin');
  proxy('settings', 'settings', 'Ajustes', 'inicio');
  proxy('support', 'support', 'Soporte', 'inicio');
  proxy('statusCenter', 'status', 'Centro de Estado', 'inicio');

  ANX.loadModuleGroup = loadModuleGroup;
  ANX.preloadLibrary = async function () {
    if (!ANX.state?.user) return false;
    await loadModuleGroup('biblioteca');
    if (typeof ANX.LibraryV3Core?.preload === 'function') await ANX.LibraryV3Core.preload();
    return true;
  };
})();
