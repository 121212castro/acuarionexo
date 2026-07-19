/* AcuarioNexo · Biblioteca V3 imágenes */
(function () {
  const { supabase, state, esc, byId, msg } = window.ANX;
  const { row } = window.ANX.LibraryV3Core;

  const IMAGE_PROFILES = Object.freeze({
    cover_url: { width: 1200, height: 675, quality: 0.9, label: 'portada' },
    photo_url: { width: 1200, height: 900, quality: 0.9, label: 'foto de ficha' },
    photo: { width: 1200, height: 900, quality: 0.9, label: 'foto' }
  });

  function filenameExt(file) {
    return (file?.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  }

  function coverFolder(type) {
    return ['pez_marino','pez_dulce','coral','invertebrado','planta','microfauna'].includes(type) ? 'organismos' : (['sal','aditivo','alimento','medicamento','test','equipamiento','producto'].includes(type) ? 'productos' : 'general');
  }

  function profileFor(kind) {
    return IMAGE_PROFILES[kind] || IMAGE_PROFILES.photo;
  }

  async function decodeImage(source) {
    if (typeof createImageBitmap === 'function') {
      try { return await createImageBitmap(source, { imageOrientation: 'from-image' }); }
      catch (_) { return await createImageBitmap(source); }
    }
    const url = URL.createObjectURL(source);
    try {
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
      await image.decode();
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function drawCover(ctx, image, width, height) {
    const sourceWidth = image.width || image.naturalWidth;
    const sourceHeight = image.height || image.naturalHeight;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function drawContain(ctx, image, width, height, marginRatio) {
    const sourceWidth = image.width || image.naturalWidth;
    const sourceHeight = image.height || image.naturalHeight;
    const margin = Math.round(Math.min(width, height) * marginRatio);
    const availableWidth = width - margin * 2;
    const availableHeight = height - margin * 2;
    const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  async function canvasBlob(canvas, quality) {
    return await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen normalizada.')), 'image/jpeg', quality);
    });
  }

  async function normalizeLibraryImage(file, kind = 'photo') {
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('El archivo seleccionado no es una imagen válida.');
    const profile = profileFor(kind);
    const image = await decodeImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = profile.width;
    canvas.height = profile.height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('El dispositivo no permite procesar la imagen.');

    ctx.fillStyle = '#071a2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.filter = 'blur(28px) brightness(0.62)';
    drawCover(ctx, image, canvas.width, canvas.height);
    ctx.restore();

    ctx.fillStyle = 'rgba(3,16,29,.22)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawContain(ctx, image, canvas.width, canvas.height, kind === 'cover_url' ? 0.025 : 0.018);

    if (typeof image.close === 'function') image.close();
    const blob = await canvasBlob(canvas, profile.quality);
    return new File([blob], `${kind}-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  }

  async function imageFileFromUrl(url, kind) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo descargar la imagen existente para regenerarla.');
    const blob = await response.blob();
    return new File([blob], `${kind}-original`, { type: blob.type || 'image/jpeg', lastModified: Date.now() });
  }

  async function uploadLibraryImage(file, kind = 'photo', entryType = 'general') {
    const normalized = await normalizeLibraryImage(file, kind);
    const path = `library/${state.user.id}/${coverFolder(entryType)}/${kind}-${Date.now()}.jpg`;
    const buckets = ['library-images','aquarium-photos','photos','animal-photos'];
    let lastError = null;
    for (const bucket of buckets) {
      const upload = await supabase.storage.from(bucket).upload(path, normalized, { upsert: true, contentType: 'image/jpeg', cacheControl: '31536000' });
      if (!upload.error) return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      lastError = upload.error;
    }
    throw new Error(lastError?.message || 'No se pudo subir la imagen. Revisa Storage.');
  }

  async function saveImageUrl(id, field, url) {
    const x = row(id);
    if (!x) throw new Error('Ficha no encontrada.');
    const updatedAt = new Date().toISOString();
    const { error } = await supabase.from('library_entries').update({ [field]: url, updated_at: updatedAt }).eq('id', id).eq('user_id', state.user.id);
    if (error) throw error;
    x[field] = url;
    x.updated_at = updatedAt;
    return url;
  }

  async function setImage(id, field, inputId) {
    const x = row(id);
    const file = byId(inputId)?.files?.[0];
    if (!x || !file) throw new Error('Selecciona una imagen.');
    const url = await uploadLibraryImage(file, field, x.entry_type);
    return saveImageUrl(id, field, url);
  }

  async function regenerateImage(id, field) {
    const x = row(id);
    const currentUrl = x?.[field];
    if (!x || !currentUrl) throw new Error('Esta ficha no tiene una imagen que regenerar.');
    const source = await imageFileFromUrl(currentUrl, field);
    const url = await uploadLibraryImage(source, field, x.entry_type);
    return saveImageUrl(id, field, url);
  }

  window.guardarImagenFicha = async function (id, field, inputId) {
    const box = byId('imageStatus') || byId('x');
    try {
      if (box) box.innerHTML = msg('Corrigiendo proporción, orientación y tamaño...');
      await setImage(id, field, inputId);
      if (box) box.innerHTML = msg('Imagen normalizada y guardada.', 'success');
      formFicha(id);
    } catch (e) {
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  window.regenerarImagenFicha = async function (id, field) {
    const box = byId('imageStatus') || byId('x');
    try {
      if (box) box.innerHTML = msg('Regenerando imagen existente...');
      await regenerateImage(id, field);
      if (box) box.innerHTML = msg('Imagen regenerada con el formato correcto.', 'success');
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
    target.innerHTML = `<img src="${url}" alt="Previsualización" onload="URL.revokeObjectURL(this.src)">`;
  };

  function imageBox(x) {
    const coverRegenerate = x.cover_url ? `<button onclick="regenerarImagenFicha('${esc(x.id)}','cover_url')">Corregir portada actual</button>` : '';
    const photoRegenerate = x.photo_url ? `<button onclick="regenerarImagenFicha('${esc(x.id)}','photo_url')">Corregir foto actual</button>` : '';
    return `<section class="panel library-image-panel"><h3>Imágenes de la ficha</h3><p class="small">La app corrige automáticamente orientación, tamaño y proporción antes de guardar.</p><div class="library-image-grid"><div><label>Foto portada</label><div id="coverPreview">${x.cover_url ? `<img src="${esc(x.cover_url)}" alt="Portada">` : msg('Sin portada','notice')}</div><input id="coverFile" type="file" accept="image/*" onchange="previewLibraryImage('coverFile','coverPreview')"><button onclick="guardarImagenFicha('${esc(x.id)}','cover_url','coverFile')">Guardar portada</button>${coverRegenerate}</div><div><label>Foto al abrir ficha</label><div id="photoPreview">${x.photo_url ? `<img src="${esc(x.photo_url)}" alt="Foto ficha">` : msg('Sin foto principal','notice')}</div><input id="photoFile" type="file" accept="image/*" onchange="previewLibraryImage('photoFile','photoPreview')"><button onclick="guardarImagenFicha('${esc(x.id)}','photo_url','photoFile')">Guardar foto ficha</button>${photoRegenerate}</div></div><div id="imageStatus"></div></section>`;
  }

  window.ANX.LibraryV3Images = {
    IMAGE_PROFILES,
    filenameExt,
    coverFolder,
    profileFor,
    normalizeLibraryImage,
    uploadLibraryImage,
    setImage,
    regenerateImage,
    imageBox
  };
})();