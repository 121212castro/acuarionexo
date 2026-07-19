/* AcuarioNexo · Biblioteca V3 · gestión única de imágenes originales */
(function () {
  const ANX = window.ANX;
  const { supabase, state, esc, byId, msg } = ANX;
  const { row } = ANX.LibraryV3Core;

  function assetKind(field) {
    return field === 'cover_url' || field === 'cover' ? 'cover' : 'photo';
  }

  function filenameExt(file) {
    return (file?.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  }

  function coverFolder(type) {
    return ['pez_marino','pez_dulce','coral','invertebrado','planta','microfauna'].includes(type)
      ? 'organismos'
      : (['sal','aditivo','alimento','medicamento','test','equipamiento','producto'].includes(type) ? 'productos' : 'general');
  }

  function assertAdmin() {
    const allowed = !!ANX.LibraryAdminPolicy?.isAdmin?.() || !!state.isAdmin;
    if (!allowed) throw new Error('No tienes permiso para modificar imágenes de Biblioteca.');
  }

  async function uploadToAvailableBucket(path, file, contentType) {
    const buckets = ['library-images','aquarium-photos','photos','animal-photos'];
    let lastError = null;
    for (const bucket of buckets) {
      const upload = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: contentType || file.type || 'application/octet-stream',
        cacheControl: '31536000'
      });
      if (!upload.error) return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      lastError = upload.error;
    }
    throw new Error(lastError?.message || 'No se pudo guardar la imagen en Storage.');
  }

  async function uploadResponsiveAsset(file, kind, entryType) {
    assertAdmin();
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('Selecciona un archivo de imagen válido.');
    const timestamp = Date.now();
    const ext = filenameExt(file);
    const path = `library/${state.user.id}/${coverFolder(entryType)}/${kind}-${timestamp}/original.${ext}`;
    const original = await uploadToAvailableBucket(path, file, file.type || 'application/octet-stream');
    return {
      original,
      generated_at: new Date().toISOString(),
      source_name: file.name || null
    };
  }

  async function saveResponsiveAsset(id, field, asset) {
    assertAdmin();
    const x = row(id);
    if (!x) throw new Error('Ficha no encontrada.');
    const kind = assetKind(field);
    const legacyField = kind === 'cover' ? 'cover_url' : 'photo_url';
    const updatedAt = new Date().toISOString();
    const payload = {
      image_assets: { ...(x.image_assets || {}), [kind]: asset },
      [legacyField]: asset.original,
      updated_at: updatedAt
    };

    const { data, error } = await supabase
      .from('library_entries')
      .update(payload)
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data?.id) throw new Error('La imagen se subió, pero la ficha no permitió guardar el cambio. Revisa la política RLS de administradores.');
    Object.assign(x, payload);
    return asset;
  }

  async function setImage(id, field, inputId) {
    assertAdmin();
    const x = row(id);
    const file = byId(inputId)?.files?.[0];
    if (!x || !file) throw new Error('Selecciona una imagen.');
    const kind = assetKind(field);
    const asset = await uploadResponsiveAsset(file, kind, x.entry_type);
    return saveResponsiveAsset(id, field, asset);
  }

  window.guardarImagenFicha = async function (id, field, inputId) {
    const box = byId('imageStatus') || byId('x');
    try {
      if (box) box.innerHTML = msg('Guardando la imagen original sin recortes ni filtros...');
      await setImage(id, field, inputId);
      if (box) box.innerHTML = msg('Imagen guardada y vinculada a la ficha.', 'success');
      formFicha(id);
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo guardar la imagen.', 'error');
    }
  };

  window.previewLibraryImage = function (inputId, previewId) {
    const file = byId(inputId)?.files?.[0];
    const target = byId(previewId);
    if (!file || !target) return;
    const url = URL.createObjectURL(file);
    target.innerHTML = `<img src="${url}" alt="Previsualización" onload="URL.revokeObjectURL(this.src)">`;
  };

  function currentPreview(x, kind, fallback, alt) {
    const url = x.image_assets?.[kind]?.original || fallback;
    return url ? `<img src="${esc(url)}" alt="${esc(alt)}">` : msg('Sin imagen', 'notice');
  }

  function imageBox(x) {
    return `<section class="panel library-image-panel">
      <h3>Imágenes de la ficha</h3>
      <p class="small">La aplicación conserva y muestra el archivo original. El encaje visual se realiza una sola vez mediante el diseño de la ficha.</p>
      <div class="library-image-grid">
        <div><label>Portada</label><div id="coverPreview" class="library-image-preview">${currentPreview(x, 'cover', x.cover_url, 'Portada')}</div><input id="coverFile" type="file" accept="image/*" onchange="previewLibraryImage('coverFile','coverPreview')"><button onclick="guardarImagenFicha('${esc(x.id)}','cover_url','coverFile')">Guardar portada</button></div>
        <div><label>Foto interior</label><div id="photoPreview" class="library-image-preview">${currentPreview(x, 'photo', x.photo_url, 'Foto interior')}</div><input id="photoFile" type="file" accept="image/*" onchange="previewLibraryImage('photoFile','photoPreview')"><button onclick="guardarImagenFicha('${esc(x.id)}','photo_url','photoFile')">Guardar foto interior</button></div>
      </div><div id="imageStatus"></div>
    </section>`;
  }

  ANX.LibraryV3Images = {
    assetKind,
    filenameExt,
    coverFolder,
    uploadResponsiveAsset,
    saveResponsiveAsset,
    setImage,
    imageBox
  };
})();