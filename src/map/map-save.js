/* AcuarioNexo · Map save */
(function () {
  function A() { return window.ANX || {}; }
  function S() { return A().MapState || {}; }

  async function saveMapIA() {
    const { supabase, state, byId, msg, currentAquarium } = A();
    const { MAP_PREFIX, readMap, writeMapDraft } = S();
    const aq = currentAquarium();
    const map = writeMapDraft(aq, window.__aqMap || readMap(aq));
    try {
      const persistentMap = { ...map };
      delete persistentMap.__signed_photos;
      const payload = MAP_PREFIX + JSON.stringify(persistentMap);
      const dims = {
        tank_length_cm: Number(aq?.tank_length_cm) || null,
        tank_width_cm: Number(aq?.tank_width_cm) || null,
        tank_height_cm: Number(aq?.tank_height_cm) || null,
        display_water_height_cm: Number(aq?.display_water_height_cm) || null,
        gross_liters: Number(aq?.gross_liters) || null,
        display_water_liters: Number(aq?.display_water_liters) || null
      };
      const result = await supabase.from('aquariums').update({ ai_summary: payload, ...dims }).eq('id', aq.id).eq('user_id', state.user.id);
      if (result.error) throw result.error;
      aq.ai_summary = payload;
      Object.assign(aq, dims);
      const cached = (state.aquariums || []).find(item => String(item.id) === String(aq.id));
      if (cached) Object.assign(cached, { ai_summary: payload, ...dims });
      if (window.ANX.MapMain?.renderMapIA) window.ANX.MapMain.renderMapIA(map);
      const x = byId('x');
      if (x) x.innerHTML = msg('Diseño 3D y dimensiones guardados.', 'success');
    } catch (e) {
      const x = byId('x');
      if (x) x.innerHTML = msg('No se pudo guardar el diseño 3D en Supabase. Revisa conexión o permisos: ' + e.message, 'error');
    }
  }

  window.ANX = window.ANX || {};
  window.ANX.MapSave = { saveMapIA };
})();
