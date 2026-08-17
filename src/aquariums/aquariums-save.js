/* AcuarioNexo · aquariums save */
(function () {
  const { supabase, state, byId, msg, currentAquarium, uploadAquariumImage, signedPhotoUrl } = window.ANX;
  const { aquariumPayload } = window.ANX.AquariumsForm;
  const { loadAquariums } = window.ANX.AquariumsCore || {};

  async function accountEntitlements() {
    try {
      const { data, error } = await supabase.rpc('app_entitlements');
      if (error) throw error;
      return data || {};
    } catch (_) {
      return { plan: 'free', aquarium_limit: 1, ai_allowed: false };
    }
  }

  window.guardarNuevoAcuario = async function () {
    const box = byId('editAqStatus');
    if (!state.user) return login();
    try {
      const entitlements = await accountEntitlements();
      const limit = entitlements.aquarium_limit == null ? null : Number(entitlements.aquarium_limit);
      if (limit !== null) {
        const currentCount = Array.isArray(state.aquariums) ? state.aquariums.length : 0;
        if (currentCount >= limit) throw new Error('El plan Gratis permite crear 1 acuario. Las funciones manuales y la Biblioteca siguen disponibles.');
      }
      const insert = Object.assign({ user_id: state.user.id }, aquariumPayload());
      if (!insert.name) throw new Error('El nombre del acuario es obligatorio.');
      if (box) box.innerHTML = msg('Creando acuario...', 'notice');
      const { data, error } = await supabase.from('aquariums').insert(insert).select('*').single();
      if (error) throw error;
      const saved = data || insert;
      if (typeof loadAquariums === 'function') await loadAquariums();
      else state.aquariums = [saved, ...(state.aquariums || [])];
      state.aquarium = saved;
      window.q = saved;
      if (window.listaAcuarios) window.listaAcuarios();
      else if (window.resumenAcuario) window.resumenAcuario();
    } catch (e) { if (box) box.innerHTML = msg(e.message, 'error'); }
  };

  async function saveSelectedAquariumPhoto(aq) {
    const file = byId('editAqPhoto')?.files?.[0];
    if (!file) return null;
    if (!file.type || !file.type.startsWith('image/')) throw new Error('El archivo seleccionado no es una imagen válida.');
    const photoRef = await uploadAquariumImage(file, 'covers');
    const row = {
      user_id: state.user.id,
      aquarium_id: aq.id,
      title: 'Foto principal del acuario',
      image_url: photoRef,
      photo_url: photoRef
    };
    const { error } = await supabase.from('aquarium_photos').insert(row);
    if (error) throw error;
    return photoRef;
  }

  window.guardarEdicionAcuario = async function () {
    const box = byId('editAqStatus');
    if (!state.user) return login();
    const aq = currentAquarium();
    if (!aq) return listaAcuarios();
    try {
      const update = aquariumPayload();
      if (!update.name) throw new Error('El nombre del acuario es obligatorio.');
      if (box) box.innerHTML = msg('Guardando cambios...', 'notice');
      const { data, error } = await supabase.from('aquariums').update(update).eq('id', aq.id).eq('user_id', state.user.id).select('*').single();
      if (error) throw error;
      let saved = Object.assign({}, aq, data || update);
      const selectedPhoto = byId('editAqPhoto')?.files?.[0];
      if (selectedPhoto) {
        if (box) box.innerHTML = msg('Subiendo la foto del acuario...', 'notice');
        const photoRef = await saveSelectedAquariumPhoto(saved);
        if (photoRef) {
          saved.__cover_source = photoRef;
          saved.__cover_url = await signedPhotoUrl(photoRef);
        }
      }
      if (typeof loadAquariums === 'function') {
        await loadAquariums();
        saved = (state.aquariums || []).find(function (item) { return String(item.id) === String(aq.id); }) || saved;
      } else {
        state.aquariums = (state.aquariums || []).map(function (item) { return String(item.id) === String(aq.id) ? saved : item; });
      }
      state.aquarium = saved;
      window.q = saved;
      if (window.resumenAcuario) window.resumenAcuario();
    } catch (e) { if (box) box.innerHTML = msg(e.message, 'error'); }
  };
})();
