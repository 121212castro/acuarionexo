/* AcuarioNexo · diseñador 3D independiente desde portada */
(function () {
  const ANX = window.ANX = window.ANX || {};
  let previousAquarium = null;

  function A() { return window.ANX || {}; }
  function S() { return A().MapState || {}; }
  function M() { return A().MapMain || {}; }

  function draftAquarium() {
    return {
      id: '__draft_3d__',
      __standalone_3d: true,
      name: 'Nuevo diseño 3D',
      aquarium_type: 'reef',
      type: 'reef',
      tank_length_cm: 80,
      tank_width_cm: 30,
      tank_height_cm: 35,
      display_water_height_cm: 32,
      gross_liters: 84,
      display_water_liters: 76.8,
      display_net_liters: 76.8,
      system_net_liters: 76.8,
      real_liters: 76.8,
      liters: 76.8,
      volume_liters: 76.8,
      ai_summary: ''
    };
  }

  function formHtml(aq) {
    const esc = A().esc || (v => String(v ?? ''));
    return `<section class="panel aq-3d-standalone">
      <div class="panel-head"><div><h2>Diseñar acuario 3D</h2><p class="small">Crea una urna virtual antes de darla de alta como acuario real.</p></div><button onclick="closeStandalone3DDesigner()">Salir</button></div>
      <label>Nombre del diseño</label><input id="aq3dDraftName" value="${esc(aq?.name || 'Nuevo diseño 3D')}" placeholder="Ej. Proyecto arrecife 300 L">
      <label>Tipo</label><select id="aq3dDraftType">
        <option value="reef" ${(aq?.aquarium_type || aq?.type) === 'reef' ? 'selected' : ''}>Marino arrecife</option>
        <option value="marine" ${(aq?.aquarium_type || aq?.type) === 'marine' ? 'selected' : ''}>Marino</option>
        <option value="freshwater" ${(aq?.aquarium_type || aq?.type) === 'freshwater' ? 'selected' : ''}>Agua dulce</option>
        <option value="other" ${(aq?.aquarium_type || aq?.type) === 'other' ? 'selected' : ''}>Otro</option>
      </select>
      <div class="map-actions"><button class="primary" onclick="saveStandalone3DAsAquarium()">Guardar como nuevo acuario</button></div>
      <div id="aq3dStandaloneStatus"></div>
    </section>`;
  }

  async function accountEntitlements() {
    try {
      const { data, error } = await A().supabase.rpc('app_entitlements');
      if (error) throw error;
      return data || {};
    } catch (_) {
      return { plan: 'free', aquarium_limit: 1 };
    }
  }

  async function saveAsAquarium() {
    const { supabase, state, byId, msg } = A();
    const aq = A().currentAquarium?.();
    const box = byId('aq3dStandaloneStatus');
    if (!state?.user || !aq?.__standalone_3d) return;
    try {
      const entitlements = await accountEntitlements();
      const limit = entitlements.aquarium_limit == null ? null : Number(entitlements.aquarium_limit);
      if (limit !== null && (state.aquariums || []).length >= limit) throw new Error('Has alcanzado el límite de acuarios de tu plan.');

      const name = String(byId('aq3dDraftName')?.value || '').trim();
      const type = String(byId('aq3dDraftType')?.value || 'reef').trim();
      if (!name) throw new Error('El nombre del acuario es obligatorio.');

      const map = S().writeMapDraft ? S().writeMapDraft(aq, window.__aqMap || S().emptyMap(aq)) : (window.__aqMap || {});
      const persistentMap = { ...map };
      delete persistentMap.__signed_photos;
      const prefix = S().MAP_PREFIX || 'ACUARIONEXO_MAP_V2:';
      const waterLiters = Number(aq.display_water_liters || ((Number(aq.tank_length_cm) * Number(aq.tank_width_cm) * Number(aq.display_water_height_cm)) / 1000) || 0);
      const grossLiters = Number(aq.gross_liters || ((Number(aq.tank_length_cm) * Number(aq.tank_width_cm) * Number(aq.tank_height_cm)) / 1000) || 0);
      const payload = {
        user_id: state.user.id,
        name,
        aquarium_type: type,
        type,
        tank_length_cm: Number(aq.tank_length_cm),
        tank_width_cm: Number(aq.tank_width_cm),
        tank_height_cm: Number(aq.tank_height_cm),
        display_water_height_cm: Number(aq.display_water_height_cm),
        gross_liters: grossLiters,
        display_water_liters: waterLiters,
        display_net_liters: waterLiters,
        system_net_liters: waterLiters,
        real_liters: waterLiters,
        liters: waterLiters,
        volume_liters: waterLiters,
        ai_summary: prefix + JSON.stringify(persistentMap)
      };

      if (box) box.innerHTML = msg('Guardando diseño como nuevo acuario...', 'notice');
      const { data, error } = await supabase.from('aquariums').insert(payload).select('*').single();
      if (error) throw error;
      const saved = data || payload;
      state.aquariums = [saved, ...(state.aquariums || []).filter(x => String(x.id) !== String(saved.id))];
      state.aquarium = saved;
      window.q = saved;
      if (box) box.innerHTML = msg('Acuario creado. Abriendo su Gemelo 3D...', 'success');
      await M().renderMapIA?.(S().readMap(saved));
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || error, 'error');
    }
  }

  async function open() {
    const { state } = A();
    if (!state?.user) return window.login?.();
    previousAquarium = state.aquarium || null;
    const aq = draftAquarium();
    state.aquarium = aq;
    window.q = aq;
    window.__aqMap = S().emptyMap ? S().emptyMap(aq) : { version: 2, markers: [], photos: {}, selected_id: '' };
    await M().renderMapIA?.(window.__aqMap);
  }

  function close() {
    const { state } = A();
    state.aquarium = previousAquarium && !previousAquarium.__standalone_3d ? previousAquarium : null;
    window.q = state.aquarium;
    window.__aqMap = null;
    previousAquarium = null;
    if (window.dashboard) window.dashboard();
  }

  ANX.MapStandalone = { open, close, formHtml, saveAsAquarium, draftAquarium };
  window.saveStandalone3DAsAquarium = saveAsAquarium;
  window.closeStandalone3DDesigner = close;
})();