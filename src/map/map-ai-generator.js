/* AcuarioNexo · Generador IA de proyectos 3D */
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
    </section>`;
  }

  function numberValue(id) {
    const value = Number(document.getElementById(id)?.value);
    return Number.isFinite(value) ? value : null;
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
      const response = await ANX.supabase.functions.invoke('map-generate-project', {
        body: { description, tank, project_type: projectType }
      });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.message || response.data.error);
      const validation = ANX.MapAiGeneratorContract.validate(response.data.data);
      if (!validation.approved) throw new Error(validation.errors.join(' · '));
      const map = ANX.MapAiGeneratorContract.toMapV3(validation.project);
      window.__aqMap = ANX.MapState.normalizeMap(map, ANX.currentAquarium?.());
      ANX.MapMain.renderMapIA(window.__aqMap);
      requestAnimationFrame(function () {
        const panel = document.getElementById('mapAiGeneratorPanel');
        if (panel) panel.hidden = false;
        const box = document.getElementById('mapAiStatus');
        const warningText = validation.warnings.length ? ` Advertencias: ${validation.warnings.join(' · ')}` : '';
        if (box) box.innerHTML = ANX.msg(`Propuesta generada con ${validation.project.objects.length} objetos.${warningText}`, 'success');
      });
      ANX.MapAiGenerator.lastProject = validation.project;
    } catch (error) {
      if (status) status.innerHTML = ANX.msg(error.message || 'No se pudo generar el proyecto.', 'error');
    }
  }

  function toggle(show) {
    const panel = document.getElementById('mapAiGeneratorPanel');
    if (panel) panel.hidden = show === false ? true : !panel.hidden;
  }

  window.toggleMapAiGenerator = toggle;
  window.generateMapAiProject = generate;
  ANX.MapAiGenerator = { formHtml, generate, toggle, lastProject: null };
})();