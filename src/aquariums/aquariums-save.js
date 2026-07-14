/* AcuarioNexo · aquariums save */
(function () {
  const { supabase, state, byId, msg, currentAquarium, uploadAquariumImage } = window.ANX;
  const { aquariumPayload } = window.ANX.AquariumsForm;
  const { loadAquariums } = window.ANX.AquariumsCore || {};

  window.guardarNuevoAcuario = async function () {
    const box = byId('editAqStatus');
    if (!state.user) return login();
    try {
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
    const publicUrl = await uploadAquariumImage(file, 'covers');
    const row = {
      user_id: state.user.id,
      aquarium_id: aq.id,
      title: 'Foto principal del acuario',
      image_url: publicUrl,
      photo_url: publicUrl
    };
    const { error } = await supabase.from('aquarium_photos').insert(row);
    if (error) throw error;
    return publicUrl;
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
        const publicUrl = await saveSelectedAquariumPhoto(saved);
        if (publicUrl) saved.__cover_url = publicUrl;
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