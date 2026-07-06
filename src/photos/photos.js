/* AcuarioNexo · photos */
(function () {
  const { supabase, state, byId, msg, token, isCurrent, currentAquarium, render, aqHeader } = window.ANX;
  const { photoCard } = window.ANX.PhotosCore;

  async function fotos() {
    const aq = currentAquarium();
    const t = token();
    render(aqHeader('fotos') + `<section class="panel"><div class="panel-head"><h2>Fotos</h2><button class="primary" onclick="formFoto()">Subir</button></div><div id="photoList">${msg('Cargando fotos...')}</div></section>`, 'acuarios');
    try {
      const { data, error } = await supabase.from('aquarium_photos').select('*').eq('aquarium_id', aq.id).order('created_at', { ascending: false }).limit(60);
      if (error) throw error;
      if (!isCurrent(t)) return;
      render(aqHeader('fotos') + `<section class="panel"><div class="panel-head"><h2>Fotos</h2><button class="primary" onclick="formFoto()">Subir</button></div><div id="photoDeleteStatus"></div><div class="gallery-grid">${(data || []).map(photoCard).join('') || '<p class="small">Sin fotos todavía.</p>'}</div></section>`, 'acuarios');
    } catch (e) {
      if (isCurrent(t)) render(aqHeader('fotos') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
    }
  }

  window.fotos = fotos;

  window.borrarFotoAcuario = async function (id, title = 'esta foto') {
    const aq = currentAquarium();
    if (!aq || !id || !state.user) return;
    if (!window.confirm(`Borrar "${title}"?\n\nEsta acción no se puede deshacer.`)) return;
    const box = byId('photoDeleteStatus');
    try {
      if (box) box.innerHTML = msg('Borrando foto...', 'notice');
      const { error } = await supabase.from('aquarium_photos')
        .delete()
        .eq('id', id)
        .eq('aquarium_id', aq.id)
        .eq('user_id', state.user.id);
      if (error) throw error;
      await fotos();
    } catch (e) {
      if (box) box.innerHTML = msg('No se pudo borrar la foto: ' + e.message, 'error');
    }
  };
})();
