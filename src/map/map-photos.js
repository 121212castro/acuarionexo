/* AcuarioNexo · Map photos */
(function () {
  function A() { return window.ANX || {}; }
  function S() { return A().MapState || {}; }

  const angleLabels = { front: 'frontal', left: 'lateral izquierda', right: 'lateral derecha', top: 'superior' };

  function previewMapPhoto() {
    const { byId } = A();
    const file = byId('mapPhotoFile')?.files?.[0];
    if (!file || !byId('mapPhotoPreview')) return;
    const url = URL.createObjectURL(file);
    byId('mapPhotoPreview').innerHTML = `<div class="photo-preview"><img src="${url}" alt="Foto del gemelo virtual"></div>`;
  }

  async function saveMapPhoto() {
    const { supabase, state, byId, val, msg, currentAquarium, uploadAquariumImage, signedPhotoUrl } = A();
    const { readMap, writeMapDraft, storedMapPhotos } = S();
    try {
      const aq = currentAquarium();
      const file = byId('mapPhotoFile')?.files?.[0];
      if (!file) throw new Error('Selecciona una foto del acuario.');
      const angle = val('mapPhotoAngle') || 'front';
      byId('x').innerHTML = msg(`Subiendo foto ${angleLabels[angle] || angle}...`);
      const photoRef = await uploadAquariumImage(file, 'map');
      const row = { user_id: state.user.id, aquarium_id: aq.id, title: `Gemelo virtual · ${angleLabels[angle] || angle}`, image_url: photoRef, photo_url: photoRef };
      const inserted = await supabase.from('aquarium_photos').insert(row);
      if (inserted.error) throw inserted.error;
      if (!aq.__cover_source) {
        aq.__cover_source = photoRef;
        aq.__cover_url = await signedPhotoUrl(photoRef);
      }
      const current = window.__aqMap || readMap(aq);
      const photos = { ...storedMapPhotos(current), [angle]: photoRef };
      const map = writeMapDraft(aq, { ...current, photos, photo_url: photos.front || photoRef });
      if (window.ANX.MapMain?.renderMapIA) await window.ANX.MapMain.renderMapIA(map);
    } catch (e) {
      const { byId, msg } = A();
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  }

  window.ANX = window.ANX || {};
  window.ANX.MapPhotos = { previewMapPhoto, saveMapPhoto, angleLabels };
})();
