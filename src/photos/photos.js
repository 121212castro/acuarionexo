/* AcuarioNexo · photos */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;

function photoCard(p) {
  const url = photoUrl(p);
  return `<div class="item gallery-card">
    ${url ? `<img src="${esc(url)}" alt="${esc(p.title || 'Foto')}" loading="lazy">` : ''}
    <b>${esc(p.title || p.caption || 'Foto')}</b>
  </div>`;
}

async function fotos() {
  const aq = currentAquarium();
  const t = token();
  render(aqHeader('fotos') + `<section class="panel"><div class="panel-head"><h2>Fotos</h2><button class="primary" onclick="formFoto()">Subir</button></div><div id="photoList">${msg('Cargando fotos...')}</div></section>`, 'acuarios');
  try {
    const { data, error } = await supabase.from('aquarium_photos').select('*').eq('aquarium_id', aq.id).order('created_at', { ascending: false }).limit(60);
    if (error) throw error;
    if (!isCurrent(t)) return;
    render(aqHeader('fotos') + `<section class="panel"><div class="panel-head"><h2>Fotos</h2><button class="primary" onclick="formFoto()">Subir</button></div><div class="gallery-grid">${(data || []).map(photoCard).join('') || '<p class="small">Sin fotos todavía.</p>'}</div></section>`, 'acuarios');
  } catch (e) {
    if (isCurrent(t)) render(aqHeader('fotos') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
  }
}

window.formFoto = function () {
  render(aqHeader('fotos') + `<section class="panel">
    <button onclick="openAqSection('fotos')">← Volver</button>
    <h2>Subir foto</h2>
    <label>Título</label><input id="photoTitle" placeholder="Vista general, evolución, coral nuevo...">
    <label>Imagen</label><input id="photoFile" type="file" accept="image/*" onchange="previewPhoto()">
    <div id="photoPreview"></div>
    <button class="primary" onclick="saveFoto()">Guardar foto</button>
    <div id="x"></div>
  </section>`, 'acuarios');
};

window.previewPhoto = function () {
  const file = byId('photoFile')?.files?.[0];
  if (!file || !byId('photoPreview')) return;
  const url = URL.createObjectURL(file);
  byId('photoPreview').innerHTML = `<div class="photo-preview"><img src="${url}" alt="Previsualización"></div>`;
};

window.saveFoto = async function () {
  try {
    const aq = currentAquarium();
    const file = byId('photoFile')?.files?.[0];
    if (!file) throw new Error('Selecciona una imagen.');
    byId('x').innerHTML = msg('Subiendo foto...');
    const publicUrl = await uploadAquariumImage(file, 'gallery');
    const row = { user_id: state.user.id, aquarium_id: aq.id, title: val('photoTitle') || 'Foto de acuario', image_url: publicUrl, photo_url: publicUrl };
    const { error } = await supabase.from('aquarium_photos').insert(row);
    if (error) throw error;
    fotos();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};
})();
