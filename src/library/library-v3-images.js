/* AcuarioNexo · Biblioteca V3 · gestión única de imágenes originales */
(function () {
  const ANX = window.ANX;
  const { supabase, state, esc, byId, msg } = ANX;
  const { row } = ANX.LibraryV3Core;
  const AUTO_TYPES = new Set(['pez_marino','coral']);

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

  async function uploadLibraryImage(path, file, contentType) {
    const bucket = 'library-images';
    const upload = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: contentType || file.type || 'application/octet-stream',
      cacheControl: '31536000'
    });
    if (upload.error) throw upload.error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function uploadResponsiveAsset(file, kind, entryType) {
    assertAdmin();
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('Selecciona un archivo de imagen válido.');
    const timestamp = Date.now();
    const ext = filenameExt(file);
    const path = `library/${state.user.id}/${coverFolder(entryType)}/${kind}-${timestamp}/original.${ext}`;
    const original = await uploadLibraryImage(path, file, file.type || 'application/octet-stream');
    return { original, generated_at: new Date().toISOString(), source_name: file.name || null };
  }

  async function updateEntry(id, payload) {
    const result = await supabase.from('library_entries').update(payload).eq('id', id).select('*').single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function saveResponsiveAsset(id, field, asset) {
    assertAdmin();
    const x = row(id);
    if (!x) throw new Error('Ficha no encontrada.');
    const kind = assetKind(field);
    const legacyField = kind === 'cover' ? 'cover_url' : 'photo_url';
    const previousStatus = String(x.status || '').toLowerCase();
    const wasPublished = previousStatus === 'published';
    const now = new Date().toISOString();
    const payload = {
      image_assets: { ...(x.image_assets || {}), [kind]: asset },
      [legacyField]: asset.original,
      updated_at: now
    };

    try {
      if (wasPublished) {
        const validated = await updateEntry(id, { status: 'validated', updated_at: now });
        Object.assign(x, validated);
      }
      const updated = await updateEntry(id, payload);
      Object.assign(x, updated);
      if (wasPublished) {
        const republished = await updateEntry(id, { status: 'published', published_at: x.published_at || now, updated_at: new Date().toISOString() });
        Object.assign(x, republished);
      }
      return asset;
    } catch (error) {
      if (wasPublished && String(x.status || '').toLowerCase() !== 'published') {
        try {
          const restored = await updateEntry(id, { status: 'published', published_at: x.published_at || now, updated_at: new Date().toISOString() });
          Object.assign(x, restored);
        } catch (_) {}
      }
      throw error;
    }
  }

  async function generateOfficialCover(id, entryType, photoUrl) {
    if (!AUTO_TYPES.has(entryType)) return null;
    if (!ANX.LibraryCoverAuto?.generateAndSave) throw new Error('El generador oficial de portada no está cargado.');
    return ANX.LibraryCoverAuto.generateAndSave(id, photoUrl);
  }

  async function saveFileDirect(id, field, file) {
    assertAdmin();
    const x = row(id);
    if (!x) throw new Error('Ficha no encontrada.');
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('Arrastra un archivo de imagen válido.');
    const kind = assetKind(field);
    const asset = await uploadResponsiveAsset(file, kind, x.entry_type);
    await saveResponsiveAsset(id, field, asset);
    if (kind === 'photo' && AUTO_TYPES.has(x.entry_type)) {
      await generateOfficialCover(id, x.entry_type, asset.original);
    }
    return asset;
  }

  async function setImage(id, field, inputId) {
    const file = byId(inputId)?.files?.[0];
    if (!file) throw new Error('Selecciona una imagen.');
    return saveFileDirect(id, field, file);
  }

  function previewFile(file, previewId) {
    const target = byId(previewId);
    if (!file || !target) return;
    const url = URL.createObjectURL(file);
    target.querySelectorAll('img').forEach(img => img.remove());
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Previsualización';
    img.onload = () => URL.revokeObjectURL(url);
    target.prepend(img);
  }

  async function handleDroppedFile(zone, file) {
    if (!zone || !file) return;
    const id = zone.dataset.entryId;
    const field = zone.dataset.field;
    const previewId = zone.dataset.previewId || zone.id;
    const box = byId('imageStatus') || byId('x');
    if (!id || !field) throw new Error('La zona de imagen no tiene ficha o campo asociado.');
    if (!String(file.type || '').startsWith('image/')) throw new Error('Arrastra un archivo de imagen válido.');
    previewFile(file, previewId);
    const x = row(id);
    const autoCover = assetKind(field) === 'photo' && AUTO_TYPES.has(x?.entry_type);
    if (box) box.innerHTML = msg(autoCover ? 'Subiendo foto y creando portada oficial...' : 'Subiendo imagen...');
    await saveFileDirect(id, field, file);
    if (box) box.innerHTML = msg(autoCover ? 'Foto subida desde el escritorio y portada actualizada.' : 'Imagen subida desde el escritorio.', 'success');
    formFicha(id);
  }

  window.guardarImagenFicha = async function (id, field, inputId) {
    const box = byId('imageStatus') || byId('x');
    try {
      const x = row(id);
      const autoCover = assetKind(field) === 'photo' && AUTO_TYPES.has(x?.entry_type);
      if (box) box.innerHTML = msg(autoCover ? 'Guardando foto interior y creando portada oficial...' : 'Guardando imagen...');
      await setImage(id, field, inputId);
      if (box) box.innerHTML = msg(autoCover ? 'Foto interior guardada y portada oficial actualizada.' : 'Imagen cambiada correctamente.', 'success');
      formFicha(id);
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo guardar la imagen.', 'error');
    }
  };

  window.previewLibraryImage = function (inputId, previewId) {
    previewFile(byId(inputId)?.files?.[0], previewId);
  };

  window.dragLibraryImage = function (event, previewId, active) {
    event.preventDefault();
    event.stopPropagation();
    const target = byId(previewId);
    if (target) target.classList.toggle('library-image-drop-active', !!active);
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  };

  window.dropLibraryImageAndSave = async function (event, id, field, previewId) {
    event.preventDefault();
    event.stopPropagation();
    const target = byId(previewId);
    if (target) target.classList.remove('library-image-drop-active');
    const box = byId('imageStatus') || byId('x');
    const image = Array.from(event.dataTransfer?.files || []).find(file => String(file.type || '').startsWith('image/'));
    if (!image) {
      if (box) box.innerHTML = msg('Arrastra un archivo de imagen válido.', 'error');
      return;
    }
    try {
      await handleDroppedFile(target, image);
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo subir la imagen arrastrada.', 'error');
    }
  };

  window.pasteLibraryImageAndSave = async function (event, id, field, previewId) {
    const items = Array.from(event.clipboardData?.items || []);
    const item = items.find(x => String(x.type || '').startsWith('image/'));
    const image = item?.getAsFile?.() || null;
    if (!image) return;
    event.preventDefault();
    const box = byId('imageStatus') || byId('x');
    try {
      const zone = byId(previewId);
      await handleDroppedFile(zone, image);
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo guardar la imagen pegada.', 'error');
    }
  };

  function currentPreview(x, kind, fallback, alt) {
    const url = x.image_assets?.[kind]?.original || fallback;
    return url ? `<img src="${esc(url)}" alt="${esc(alt)}">` : msg('Sin imagen', 'notice');
  }

  function dropPreview(id, inputId, entryId, field, content) {
    return `<div id="${id}" class="library-image-preview library-image-dropzone" tabindex="0"
      data-entry-id="${esc(entryId)}" data-field="${esc(field)}" data-preview-id="${id}"
      ondragenter="dragLibraryImage(event,'${id}',true)"
      ondragover="dragLibraryImage(event,'${id}',true)"
      ondragleave="dragLibraryImage(event,'${id}',false)"
      ondrop="dropLibraryImageAndSave(event,'${esc(entryId)}','${field}','${id}')"
      onpaste="pasteLibraryImageAndSave(event,'${esc(entryId)}','${field}','${id}')"
      onclick="document.getElementById('${inputId}')?.click()">${content}<span class="library-image-drop-hint">Arrastra aquí una foto desde el escritorio · se guarda al soltarla · también puedes pegar con ⌘V</span></div>`;
  }

  function imageBox(x) {
    const auto = AUTO_TYPES.has(x.entry_type);
    const coverControl = auto
      ? `<div><label>Portada oficial automática</label><div id="coverPreview" class="library-image-preview">${currentPreview(x, 'cover', x.cover_url, 'Portada')}</div><p class="small">Se genera desde la foto interior real con el fondo maestro de AcuarioNexo.</p></div>`
      : `<div><label>Portada</label>${dropPreview('coverPreview', 'coverFile', x.id, 'cover_url', currentPreview(x, 'cover', x.cover_url, 'Portada'))}<input id="coverFile" type="file" accept="image/*" onchange="previewLibraryImage('coverFile','coverPreview')"><button type="button" onclick="guardarImagenFicha('${esc(x.id)}','cover_url','coverFile')">Guardar portada</button></div>`;

    return `<section class="panel library-image-panel">
      <h3>Imágenes de la ficha</h3>
      <p class="small">Arrastra la foto interior desde el escritorio sobre su recuadro: se sube y se guarda directamente al soltarla.</p>
      <div class="library-image-grid">
        ${coverControl}
        <div><label>Foto interior</label>${dropPreview('photoPreview', 'photoFile', x.id, 'photo_url', currentPreview(x, 'photo', x.photo_url, 'Foto interior'))}<input id="photoFile" type="file" accept="image/*" onchange="previewLibraryImage('photoFile','photoPreview')"><button type="button" onclick="guardarImagenFicha('${esc(x.id)}','photo_url','photoFile')">Guardar foto interior</button></div>
      </div><div id="imageStatus"></div>
    </section>`;
  }

  if (!window.__anxLibraryDropCaptureInstalled) {
    window.__anxLibraryDropCaptureInstalled = true;
    document.addEventListener('dragover', function (event) {
      const zone = event.target?.closest?.('.library-image-dropzone');
      if (!zone) return;
      event.preventDefault();
      event.stopPropagation();
      zone.classList.add('library-image-drop-active');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }, true);
    document.addEventListener('dragleave', function (event) {
      const zone = event.target?.closest?.('.library-image-dropzone');
      if (!zone) return;
      const next = event.relatedTarget;
      if (!next || !zone.contains(next)) zone.classList.remove('library-image-drop-active');
    }, true);
    document.addEventListener('drop', async function (event) {
      const zone = event.target?.closest?.('.library-image-dropzone');
      if (!zone) return;
      event.preventDefault();
      event.stopPropagation();
      zone.classList.remove('library-image-drop-active');
      const box = byId('imageStatus') || byId('x');
      const image = Array.from(event.dataTransfer?.files || []).find(file => String(file.type || '').startsWith('image/'));
      if (!image) {
        if (box) box.innerHTML = msg('Arrastra un archivo de imagen válido.', 'error');
        return;
      }
      try {
        await handleDroppedFile(zone, image);
      } catch (error) {
        if (box) box.innerHTML = msg(error.message || 'No se pudo subir la imagen arrastrada.', 'error');
      }
    }, true);
  }

  ANX.LibraryV3Images = { assetKind, filenameExt, coverFolder, uploadResponsiveAsset, saveResponsiveAsset, saveFileDirect, setImage, imageBox, generateOfficialCover };
})();