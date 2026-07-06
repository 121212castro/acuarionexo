/* AcuarioNexo · Biblioteca V3 imágenes */
(function () {
  const { supabase, state, esc, byId, msg } = window.ANX;
  const { row } = window.ANX.LibraryV3Core;

  function filenameExt(file) {
    return (file?.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  }

  function coverFolder(type) {
    return ['pez_marino','pez_dulce','coral','invertebrado','planta','microfauna'].includes(type) ? 'organismos' : (['sal','aditivo','alimento','medicamento','test','equipamiento','producto'].includes(type) ? 'productos' : 'general');
  }

  async function uploadLibraryImage(file, kind = 'photo', entryType = 'general') {
    const ext = filenameExt(file);
    const path = `library/${state.user.id}/${coverFolder(entryType)}/${kind}-${Date.now()}.${ext}`;
    const buckets = ['library-images','aquarium-photos','photos','animal-photos'];
    let lastError = null;
    for (const bucket of buckets) {
      const upload = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (!upload.error) return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      lastError = upload.error;
    }
    throw new Error(lastError?.message || 'No se pudo subir la imagen. Revisa Storage.');
  }

  async function setImage(id, field, inputId) {
    const x = row(id);
    const file = byId(inputId)?.files?.[0];
    if (!x || !file) throw new Error('Selecciona una imagen.');
    const url = await uploadLibraryImage(file, field, x.entry_type);
    const { error } = await supabase.from('library_entries').update({ [field]: url, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', state.user.id);
    if (error) throw error;
    x[field] = url;
    x.updated_at = new Date().toISOString();
    return url;
  }

  window.guardarImagenFicha = async function (id, field, inputId) {
    const box = byId('imageStatus') || byId('x');
    try {
      if (box) box.innerHTML = msg('Subiendo imagen...');
      await setImage(id, field, inputId);
      if (box) box.innerHTML = msg('Imagen guardada.', 'success');
      formFicha(id);
    } catch (e) {
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  window.previewLibraryImage = function (inputId, previewId) {
    const file = byId(inputId)?.files?.[0];
    const target = byId(previewId);
    if (!file || !target) return;
    const url = URL.createObjectURL(file);
    target.innerHTML = `<img src="${url}" alt="Previsualización">`;
  };

  function imageBox(x) {
    return `<section class="panel library-image-panel"><h3>Imágenes de la ficha</h3><div class="library-image-grid"><div><label>Foto portada</label><div id="coverPreview">${x.cover_url ? `<img src="${esc(x.cover_url)}" alt="Portada">` : msg('Sin portada','notice')}</div><input id="coverFile" type="file" accept="image/*" onchange="previewLibraryImage('coverFile','coverPreview')"><button onclick="guardarImagenFicha('${esc(x.id)}','cover_url','coverFile')">Guardar portada</button></div><div><label>Foto al abrir ficha</label><div id="photoPreview">${x.photo_url ? `<img src="${esc(x.photo_url)}" alt="Foto ficha">` : msg('Sin foto principal','notice')}</div><input id="photoFile" type="file" accept="image/*" onchange="previewLibraryImage('photoFile','photoPreview')"><button onclick="guardarImagenFicha('${esc(x.id)}','photo_url','photoFile')">Guardar foto ficha</button></div></div><div id="imageStatus"></div></section>`;
  }

  window.ANX.LibraryV3Images = {
    filenameExt,
    coverFolder,
    uploadLibraryImage,
    setImage,
    imageBox
  };
})();
