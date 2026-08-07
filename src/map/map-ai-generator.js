/* AcuarioNexo · Generador y editor IA de proyectos 3D */
(function () {
  const ANX = window.ANX = window.ANX || {};

  function currentAquariumDefaults() {
    const aq = ANX.currentAquarium?.() || {};
    return {
      width_cm: Number(aq.tank_length_cm || 80),
      depth_cm: Number(aq.tank_width_cm || 35),
      height_cm: Number(aq.tank_height_cm || 40),
      water_height_cm: Number(aq.display_water_height_cm || aq.tank_height_cm || 37)
    };
  }

  function editHtml() {
    const hasProject = !!ANX.MapAiGenerator?.lastProject;
    return `<section class="panel" id="mapAiEditorPanel" ${hasProject ? '' : 'hidden'}>
      <div class="panel-head"><div><h3>Modificar proyecto con IA</h3><p class="small">Da una orden concreta. Se creará un nuevo borrador completo y no se guardará hasta pulsar Guardar.</p></div></div>
      <label for="mapAiEditInstruction">Cambio solicitado</label>
      <textarea id="mapAiEditInstruction" rows="3" maxlength="2000" placeholder="Ejemplo: mueve la isla izquierda 10 cm hacia atrás y hazla 5 cm más alta."></textarea>
      <div class="quick-actions">
        <button type="button" data-map-edit="Deja 8 cm libres junto a todos los cristales para facilitar la limpieza.">Espacio de limpieza</button>
        <button type="button" data-map-edit="Haz la composición más asimétrica, manteniendo un pasillo central libre.">Más asimétrico</button>
        <button type="button" data-map-edit="Reduce la altura de las estructuras para dejar más espacio de nado superior.">Más espacio de nado</button>
      </div>
      <div><button class="primary" type="button" onclick="editMapAiProject()">Aplicar cambio</button><button type="button" onclick="undoMapAiEdit()" ${ANX.MapAiGenerator?.previousProject ? '' : 'disabled'}>Deshacer último cambio</button></div>
      <div id="mapAiEditStatus"></div>
    </section>`;
  }

  function formHtml() {
    const tank = currentAquariumDefaults();
    return `<section class="panel" id="mapAiGeneratorPanel" hidden>
      <div class="panel-head"><div><h3>Crear proyecto con IA</h3><p class="small">Describe el acuario y genera una propuesta 3D editable. No se guardará hasta pulsar Guardar.</p></div><button type="button" onclick="toggleMapAiGenerator(false)">Cerrar</button></div>
      <div class="form-grid">
        <label>Largo (cm)<input id="mapAiWidth" type="number" min="10" max="1000" step="1" value="${tank.width_cm}"></label>
        <label>Fondo (cm)<input id="mapAiDepth" type="number" min="10" max="500" step="1" value="${tank.depth_cm}"></label>
        <label>Alto (cm)<input id="mapAiHeight" type="number" min="10" max="500" step="1" value="${tank.height_cm}"></label>
        <label>Altura de agua (cm)<input id="mapAiWater" type="number" min="1" max="500" step="1" value="${tank.water_height_cm}"></label>
      </div>
      <label>Tipo de proyecto</label>
      <select id="mapAiType">
        <option value="freshwater">Agua dulce tropical</option>
        <option value="coldwater">Agua dulce fría</option>
        <option value="marine">Marino</option>
        <option value="reef">Arrecife</option>
        <option value="pond">Estanque</option>
        <option value="hospital">Hospital</option>
        <option value="quarantine">Cuarentena</option>
      </select>
      <label>Describe el acuario que tienes en mente</label>
      <textarea id="mapAiDescription" rows="5" maxlength="5000" placeholder="Ejemplo: acuario de arrecife con dos islas de roca, pasillo central, arena clara, dos bombas laterales y espacio libre junto a los cristales."></textarea>
      <button class="primary" type="button" onclick="generateMapAiProject()">Generar propuesta 3D</button>
      <div id="mapAiStatus"></div>
    </section>${editHtml()}`;
  }

  function numberValue(id) {
    const value = Number(document.getElementById(id)?.value);
    return Number.isFinite(value) ? value : null;
  }

  function markerFromEntity(entity) {
    const type = ['rock', 'plant', 'coral', 'equipment', 'fish'].includes(entity.entity_type) ? entity.entity_type : 'other';
    return {
      id: entity.id,
      label: entity.label,
      type,
      note: entity.note || '',
      x: entity.x,
      y: entity.y,
      z: entity.z,
      size: Math.max(6, Math.min(32, Number(entity.size) || 14))
    };
  }

  function projectToMap(project) {
    const validation = ANX.MapAiGeneratorContract.validate(project);
    if (!validation.approved) throw new Error(validation.errors.join(' · '));
    const map = ANX.MapAiGeneratorContract.toMapV3(validation.project);
    map.markers = (map.entities || []).map(markerFromEntity);
    map.selected_id = map.markers[0]?.id || '';
    return { validation, map };
  }

  function showDraft(project, options = {}) {
    const converted = projectToMap(project);
    window.__aqMap = ANX.MapState.normalizeMap(converted.map, ANX.currentAquarium?.());
    ANX.MapMain.renderMapIA(window.__aqMap);
    ANX.MapAiGenerator.lastProject = converted.validation.project;
    requestAnimationFrame(function () {
      const generatorPanel = document.getElementById('mapAiGeneratorPanel');
      if (generatorPanel && options.keepGeneratorOpen) generatorPanel.hidden = false;
      const editorPanel = document.getElementById('mapAiEditorPanel');
      if (editorPanel) editorPanel.hidden = false;
      bindExamples();
      const box = document.getElementById(options.statusId || 'mapAiStatus');
      if (box && options.message) box.innerHTML = ANX.msg(options.message, 'success');
    });
    return converted.validation;
  }

  async function generate() {
    const status = document.getElementById('mapAiStatus');
    try {
      const description = String(document.getElementById('mapAiDescription')?.value || '').trim();
      if (description.length < 12) throw new Error('Describe el proyecto con más detalle.');
      const tank = {
        width_cm: numberValue('mapAiWidth'),
        depth_cm: numberValue('mapAiDepth'),
        height_cm: numberValue('mapAiHeight'),
        water_height_cm: numberValue('mapAiWater')
      };
      const projectType = String(document.getElementById('mapAiType')?.value || 'freshwater');
      if (status) status.innerHTML = ANX.msg('Generando propuesta 3D...');
      const response = await ANX.supabase.functions.invoke('map-generate-project', { body: { description, tank, project_type: projectType } });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.message || response.data.error);
      ANX.MapAiGenerator.previousProject = null;
      const validation = showDraft(response.data.data, {
        keepGeneratorOpen: true,
        statusId: 'mapAiStatus',
        message: `Propuesta generada con ${response.data.data?.objects?.length || 0} objetos.`
      });
      if (validation.warnings.length) {
        const box = document.getElementById('mapAiStatus');
        if (box) box.innerHTML += ANX.msg(`Advertencias: ${validation.warnings.join(' · ')}`, 'notice');
      }
    } catch (error) {
      if (status) status.innerHTML = ANX.msg(error.message || 'No se pudo generar el proyecto.', 'error');
    }
  }

  async function edit() {
    const status = document.getElementById('mapAiEditStatus');
    try {
      const current = ANX.MapAiGenerator.lastProject || window.__aqMap?.ai_project;
      if (!current) throw new Error('Primero genera o abre un proyecto 3D creado con IA.');
      const instruction = String(document.getElementById('mapAiEditInstruction')?.value || '').trim();
      if (instruction.length < 3) throw new Error('Indica qué cambio quieres realizar.');
      if (status) status.innerHTML = ANX.msg('Aplicando el cambio al proyecto...');
      const response = await ANX.supabase.functions.invoke('map-edit-project', { body: { instruction, project: current } });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.message || response.data.error);
      const edited = response.data?.data?.project;
      const converted = projectToMap(edited);
      ANX.MapAiGenerator.previousProject = current;
      ANX.MapAiGenerator.lastProject = converted.validation.project;
      window.__aqMap = ANX.MapState.normalizeMap(converted.map, ANX.currentAquarium?.());
      ANX.MapMain.renderMapIA(window.__aqMap);
      requestAnimationFrame(function () {
        const panel = document.getElementById('mapAiEditorPanel');
        if (panel) panel.hidden = false;
        bindExamples();
        const box = document.getElementById('mapAiEditStatus');
        const summary = String(response.data?.data?.change_summary || 'Cambio aplicado al borrador.');
        const warnings = Array.isArray(response.data?.data?.warnings) ? response.data.data.warnings : [];
        if (box) box.innerHTML = ANX.msg(summary, 'success') + (warnings.length ? ANX.msg(warnings.join(' · '), 'notice') : '');
      });
    } catch (error) {
      if (status) status.innerHTML = ANX.msg(error.message || 'No se pudo modificar el proyecto.', 'error');
    }
  }

  function undo() {
    const previous = ANX.MapAiGenerator.previousProject;
    if (!previous) return;
    const current = ANX.MapAiGenerator.lastProject;
    const converted = projectToMap(previous);
    ANX.MapAiGenerator.lastProject = converted.validation.project;
    ANX.MapAiGenerator.previousProject = current || null;
    window.__aqMap = ANX.MapState.normalizeMap(converted.map, ANX.currentAquarium?.());
    ANX.MapMain.renderMapIA(window.__aqMap);
    requestAnimationFrame(function () {
      const panel = document.getElementById('mapAiEditorPanel');
      if (panel) panel.hidden = false;
      bindExamples();
      const box = document.getElementById('mapAiEditStatus');
      if (box) box.innerHTML = ANX.msg('Se restauró la versión anterior del borrador.', 'success');
    });
  }

  function bindExamples() {
    document.querySelectorAll('[data-map-edit]').forEach(function (button) {
      button.onclick = function () {
        const field = document.getElementById('mapAiEditInstruction');
        if (field) field.value = button.dataset.mapEdit || '';
      };
    });
  }

  function toggle(show) {
    const panel = document.getElementById('mapAiGeneratorPanel');
    if (panel) panel.hidden = show === false ? true : !panel.hidden;
    bindExamples();
  }

  window.toggleMapAiGenerator = toggle;
  window.generateMapAiProject = generate;
  window.editMapAiProject = edit;
  window.undoMapAiEdit = undo;
  ANX.MapAiGenerator = {
    formHtml,
    editHtml,
    generate,
    edit,
    undo,
    toggle,
    markerFromEntity,
    projectToMap,
    lastProject: window.__aqMap?.ai_project || null,
    previousProject: null
  };
})();