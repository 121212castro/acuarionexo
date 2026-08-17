/* AcuarioNexo · Map save */
(function () {
  function A() { return window.ANX || {}; }
  function S() { return A().MapState || {}; }

  async function saveMapIA() {
    const { supabase, byId, msg, currentAquarium } = A();
    const { MAP_PREFIX, readMap, writeMapDraft } = S();
    const aq = currentAquarium();
    const map = writeMapDraft(aq, window.__aqMap || readMap(aq));
    try {
      const persistentMap = { ...map };
      delete persistentMap.__signed_photos;
      const payload = MAP_PREFIX + JSON.stringify(persistentMap);
      const result = await supabase.from('aquariums').update({ ai_summary: payload }).eq('id', aq.id);
      if (result.error) throw result.error;
      aq.ai_summary = payload;
      if (window.ANX.MapMain?.renderMapIA) window.ANX.MapMain.renderMapIA(map);
      const x = byId('x');
      if (x) x.innerHTML = msg('Mapa IA guardado.', 'success');
    } catch (e) {
      const x = byId('x');
      if (x) x.innerHTML = msg('No se pudo guardar el mapa en Supabase. Revisa conexión o permisos: ' + e.message, 'error');
    }
  }

  window.ANX = window.ANX || {};
  window.ANX.MapSave = { saveMapIA };
})();
