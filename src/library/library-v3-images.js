/* AcuarioNexo · Biblioteca V3 · gestión única de imágenes originales */
(function () {
  const ANX = window.ANX;
  const { supabase, state, esc, byId, msg } = ANX;
  const { row } = ANX.LibraryV3Core;

  const ASSET_KINDS = new Set(['cover', 'photo', 'map', 'taxonomy']);

  function assetKind(field) {
    const value = String(field || '').toLowerCase();
    if (value === 'cover_url' || value === 'cover') return 'cover';
    if (value === 'photo_url' || value === 'photo') return 'photo';
    if (value === 'map_url' || value === 'map' || value === 'distribution_map') return 'map';
    if (value === 'taxonomy_url' || value === 'taxonomy' || value === 'taxonomy_tree') return 'taxonomy';
    return 'photo';
  }

  function legacyFieldForKind(kind) {
    return ({ cover: 'cover_url', photo: 'photo_url' })[kind] || null;
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
    if (!ASSET_KINDS.has(kind)) throw new Error('Tipo de imagen no permitido.');
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
    const legacyField = legacyFieldForKind(kind);
    const updatedAt = new Date().toISOString();
    const payload = {
      image_assets: { ...(x.image_assets || {}), [kind]: asset },
      updated_at: updatedAt
    };
    if (legacyField) payload[legacyField] = asset.original;

    const { data, error } = await supabase
      .from('library_entries')
      .update(payload)
      .eq('id', id)
      .select('id, image_assets, cover_url, photo_url')
      .maybeSingle();

    if (error) throw error;
    if (!data?.id) throw new Error('La imagen se subió, pero la ficha no permitió guardar el cambio. Revisa la política RLS de administradores.');
    Object.assign(x, payload, data);
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
      if (box) box.innerHTML = msg('Imagen actualizada. El cambio se refleja en Biblioteca y en la ficha sin invalidar la auditoría.', 'success');
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

  function imageControl(x, kind, label, fallback, inputId, previewId) {
    return `<div>
      <label>${esc(label)}</label>
      <div id="${esc(previewId)}" class="library-image-preview">${currentPreview(x, kind, fallback, label)}</div>
      <input id="${esc(inputId)}" type="file" accept="image/*" onchange="previewLibraryImage('${esc(inputId)}','${esc(previewId)}')">
      <button type="button" onclick="guardarImagenFicha('${esc(x.id)}','${esc(kind)}','${esc(inputId)}')">Cambiar ${esc(label.toLowerCase())}</button>
    </div>`;
  }

  function imageBox(x) {
    const biological = ['pez_marino','pez_dulce','coral','invertebrado','planta','microfauna'].includes(x.entry_type);
    return `<section class="panel library-image-panel">
      <h3>Imágenes de la ficha</h3>
      <p class="small">El administrador puede sustituir cualquier imagen en cualquier momento. Cambiar imágenes no modifica el contenido científico ni obliga a repetir la auditoría.</p>
      <div class="library-image-grid">
        ${imageControl(x, 'cover', 'Portada', x.cover_url, 'coverFile', 'coverPreview')}
        ${imageControl(x, 'photo', 'Foto interior', x.photo_url, 'photoFile', 'photoPreview')}
        ${biological ? imageControl(x, 'map', 'Mapa de distribución', null, 'mapFile', 'mapPreview') : ''}
        ${biological ? imageControl(x, 'taxonomy', 'Árbol taxonómico', null, 'taxonomyFile', 'taxonomyPreview') : ''}
      </div>
      <div id="imageStatus"></div>
    </section>`;
  }

  ANX.LibraryV3Images = {
    ASSET_KINDS,
    assetKind,
    legacyFieldForKind,
    filenameExt,
    coverFolder,
    uploadResponsiveAsset,
    saveResponsiveAsset,
    setImage,
    imageBox
  };
})();