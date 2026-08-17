/* AcuarioNexo · photos save */
(function () {
  const { supabase, state, byId, val, msg, currentAquarium, uploadAquariumImage } = window.ANX;

  window.saveFoto = async function () {
    try {
      const aq = currentAquarium();
      const file = byId('photoFile')?.files?.[0];
      if (!file) throw new Error('Selecciona una imagen.');
      byId('x').innerHTML = msg('Subiendo foto...');
      const photoRef = await uploadAquariumImage(file, 'gallery');
      const row = { user_id: state.user.id, aquarium_id: aq.id, title: val('photoTitle') || 'Foto de acuario', image_url: photoRef, photo_url: photoRef };
      const { error } = await supabase.from('aquarium_photos').insert(row);
      if (error) throw error;
      fotos();
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  };
})();
