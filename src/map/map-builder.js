/* AcuarioNexo · Constructor de urna 3D a escala real */
(function () {
  function A() { return window.ANX || {}; }
  function R() { return A().MapRender3D || {}; }

  function n(value, fallback) {
    const x = Number(value);
    return Number.isFinite(x) && x > 0 ? x : fallback;
  }

  function dimensions(aq) {
    const length = n(aq?.tank_length_cm, 80);
    const width = n(aq?.tank_width_cm, 30);
    const height = n(aq?.tank_height_cm, 35);
    const water = Math.min(height, n(aq?.display_water_height_cm, Math.max(1, height - 3)));
    return { length, width, height, water };
  }

  function liters(d) {
    return {
      gross: (d.length * d.width * d.height) / 1000,
      water: (d.length * d.width * d.water) / 1000
    };
  }

  function formHtml(aq) {
    const { esc } = A();
    const d = dimensions(aq);
    const l = liters(d);
    return `<section class="panel aq-3d-builder">
      <div class="panel-head"><div><h3>Constructor de urna 3D</h3><p class="small">Introduce las medidas reales. La urna se redibuja a escala al instante.</p></div></div>
      <div class="quick-actions aq-3d-dimensions">
        <label>Largo (cm)<input id="aq3dLength" type="number" min="20" max="1000" step="0.1" value="${esc(d.length)}" oninput="previewAquarium3DSize()"></label>
        <label>Fondo (cm)<input id="aq3dWidth" type="number" min="15" max="500" step="0.1" value="${esc(d.width)}" oninput="previewAquarium3DSize()"></label>
        <label>Alto (cm)<input id="aq3dHeight" type="number" min="15" max="500" step="0.1" value="${esc(d.height)}" oninput="previewAquarium3DSize()"></label>
        <label>Altura de agua (cm)<input id="aq3dWater" type="number" min="1" max="500" step="0.1" value="${esc(d.water)}" oninput="previewAquarium3DSize()"></label>
      </div>
      <div class="quick-actions">
        <article class="summary-card"><div><small>Volumen geométrico</small><h2 id="aq3dGross">${l.gross.toFixed(1)} L</h2></div></article>
        <article class="summary-card"><div><small>Agua hasta altura indicada</small><h2 id="aq3dWaterLiters">${l.water.toFixed(1)} L</h2></div></article>
      </div>
      <div class="map-actions"><button class="primary" onclick="saveAquarium3DSize()">Guardar medidas de la urna</button><button onclick="resetAquarium3DView()">Centrar vista</button></div>
      <div id="aq3dBuilderStatus"></div>
    </section>`;
  }

  function readForm() {
    const { byId } = A();
    const length = n(byId('aq3dLength')?.value, 80);
    const width = n(byId('aq3dWidth')?.value, 30);
    const height = n(byId('aq3dHeight')?.value, 35);
    const water = Math.min(height, n(byId('aq3dWater')?.value, Math.max(1, height - 3)));
    return { length, width, height, water };
  }

  function applyDraft(d) {
    const aq = A().currentAquarium?.();
    if (!aq) return null;
    aq.tank_length_cm = d.length;
    aq.tank_width_cm = d.width;
    aq.tank_height_cm = d.height;
    aq.display_water_height_cm = d.water;
    const l = liters(d);
    aq.gross_liters = Number(l.gross.toFixed(2));
    aq.display_water_liters = Number(l.water.toFixed(2));
    return aq;
  }

  function preview() {
    const { byId } = A();
    const d = readForm();
    if (Number(byId('aq3dWater')?.value) > d.height && byId('aq3dWater')) byId('aq3dWater').value = d.water;
    const l = liters(d);
    if (byId('aq3dGross')) byId('aq3dGross').textContent = `${l.gross.toFixed(1)} L`;
    if (byId('aq3dWaterLiters')) byId('aq3dWaterLiters').textContent = `${l.water.toFixed(1)} L`;
    applyDraft(d);
    window.__aqMapZoom = null;
    if (R().renderMap3D) R().renderMap3D(window.__aqMap);
  }

  async function save() {
    const { supabase, state, currentAquarium, byId, msg } = A();
    const aq = currentAquarium?.();
    const box = byId('aq3dBuilderStatus');
    if (!aq || !state?.user) return;
    const d = readForm();
    const l = liters(d);
    if (d.water > d.height) {
      if (box) box.innerHTML = msg('La altura de agua no puede superar el alto de la urna.', 'error');
      return;
    }
    const payload = {
      tank_length_cm: d.length,
      tank_width_cm: d.width,
      tank_height_cm: d.height,
      display_water_height_cm: d.water,
      gross_liters: Number(l.gross.toFixed(2)),
      display_water_liters: Number(l.water.toFixed(2))
    };
    if (box) box.innerHTML = msg('Guardando dimensiones...', 'notice');
    const { error } = await supabase.from('aquariums').update(payload).eq('id', aq.id).eq('user_id', state.user.id);
    if (error) {
      if (box) box.innerHTML = msg('No se pudieron guardar las dimensiones: ' + error.message, 'error');
      return;
    }
    Object.assign(aq, payload);
    const listItem = (state.aquariums || []).find(x => String(x.id) === String(aq.id));
    if (listItem) Object.assign(listItem, payload);
    if (box) box.innerHTML = msg(`Urna guardada a escala real: ${d.length} × ${d.width} × ${d.height} cm.`, 'success');
    if (R().renderMap3D) R().renderMap3D(window.__aqMap);
  }

  function resetView() {
    window.__aqMapZoom = null;
    if (R().resetMap3D) R().resetMap3D();
  }

  window.ANX = window.ANX || {};
  window.ANX.MapBuilder = { dimensions, liters, formHtml, preview, save, resetView };
})();
