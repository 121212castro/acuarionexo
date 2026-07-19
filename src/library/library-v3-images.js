/* AcuarioNexo · Biblioteca V3 · originales y variantes responsivas */
(function () {
  const { supabase, state, esc, byId, msg } = window.ANX;
  const { row } = window.ANX.LibraryV3Core;

  const IMAGE_PROFILES = Object.freeze({
    cover: {
      mobile: { width: 480, height: 270, quality: 0.86 },
      tablet: { width: 800, height: 450, quality: 0.88 },
      desktop: { width: 1200, height: 675, quality: 0.9 }
    },
    photo: {
      mobile: { width: 480, height: 360, quality: 0.86 },
      tablet: { width: 800, height: 600, quality: 0.88 },
      desktop: { width: 1200, height: 900, quality: 0.9 }
    }
  });

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

  function imageDimensions(image) {
    return {
      width: image.width || image.naturalWidth || 1,
      height: image.height || image.naturalHeight || 1
    };
  }

  function drawCover(ctx, image, width, height) {
    const source = imageDimensions(image);
    const scale = Math.max(width / source.width, height / source.height);
    const drawWidth = source.width * scale;
    const drawHeight = source.height * scale;
    ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function drawContain(ctx, image, width, height, marginRatio) {
    const source = imageDimensions(image);
    const margin = Math.round(Math.min(width, height) * marginRatio);
    const availableWidth = width - margin * 2;
    const availableHeight = height - margin * 2;
    const scale = Math.min(availableWidth / source.width, availableHeight / source.height);
    const drawWidth = source.width * scale;
    const drawHeight = source.height * scale;
    ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function canvasBlob(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('No se pudo generar la variante de imagen.')),
        'image/jpeg',
        quality
      );
    });
  }

  async function createVariant(image, profile, kind, label) {
    const canvas = document.createElement('canvas');
    canvas.width = profile.width;
    canvas.height = profile.height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('El dispositivo no permite procesar imágenes.');

    ctx.fillStyle = '#071a2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.filter = 'blur(30px) brightness(0.58)';
    drawCover(ctx, image, canvas.width, canvas.height);
    ctx.restore();
    ctx.fillStyle = 'rgba(3,16,29,.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawContain(ctx, image, canvas.width, canvas.height, kind === 'cover' ? 0.022 : 0.016);

    const blob = await canvasBlob(canvas, profile.quality);
    return new File([blob], `${kind}-${label}-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  }

  async function createResponsiveFiles(file, kind) {
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('Selecciona un archivo de imagen válido.');
    const image = await decodeImage(file);
    try {
      const profiles = IMAGE_PROFILES[kind];
      const entries = await Promise.all(Object.entries(profiles).map(async ([label, profile]) => [label, await createVariant(image, profile, kind, label)]));
      return Object.fromEntries(entries);
    } finally {
      if (typeof image.close === 'function') image.close();
    }
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
    const timestamp = Date.now();
    const base = `library/${state.user.id}/${coverFolder(entryType)}/${kind}-${timestamp}`;
    const originalExt = filenameExt(file);
    const variants = await createResponsiveFiles(file, kind);

    const original = await uploadToAvailableBucket(`${base}/original.${originalExt}`, file, file.type || 'application/octet-stream');
    const mobile = await uploadToAvailableBucket(`${base}/mobile.jpg`, variants.mobile, 'image/jpeg');
    const tablet = await uploadToAvailableBucket(`${base}/tablet.jpg`, variants.tablet, 'image/jpeg');
    const desktop = await uploadToAvailableBucket(`${base}/desktop.jpg`, variants.desktop, 'image/jpeg');

    return {
      original,
      mobile,
      tablet,
      desktop,
      generated_at: new Date().toISOString(),
      source_name: file.name || null
    };
  }

  async function saveResponsiveAsset(id, field, asset) {
    const x = row(id);
    if (!x) throw new Error('Ficha no encontrada.');
    const kind = assetKind(field);
    const imageAssets = { ...(x.image_assets || {}), [kind]: asset };
    const legacyField = kind === 'cover' ? 'cover_url' : 'photo_url';
    const updatedAt = new Date().toISOString();
    const payload = {
      image_assets: imageAssets,
      [legacyField]: asset.desktop,
      updated_at: updatedAt
    };
    const { error } = await supabase.from('library_entries').update(payload).eq('id', id).eq('user_id', state.user.id);
    if (error) throw error;
    Object.assign(x, payload);
    return asset;
  }

  async function setImage(id, field, inputId) {
    const x = row(id);
    const file = byId(inputId)?.files?.[0];
    if (!x || !file) throw new Error('Selecciona una imagen.');
    const kind = assetKind(field);
    const asset = await uploadResponsiveAsset(file, kind, x.entry_type);
    return saveResponsiveAsset(id, field, asset);
  }

  async function fileFromUrl(url, name) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo descargar la imagen original.');
    const blob = await response.blob();
    return new File([blob], name || 'imagen-original', { type: blob.type || 'image/jpeg', lastModified: Date.now() });
  }

  async function regenerateImage(id, field) {
    const x = row(id);
    if (!x) throw new Error('Ficha no encontrada.');
    const kind = assetKind(field);
    const current = x.image_assets?.[kind];
    const originalUrl = current?.original;
    if (!originalUrl) throw new Error('Esta ficha antigua no conserva el original. Sube de nuevo la imagen original una sola vez.');
    const source = await fileFromUrl(originalUrl, `${kind}-original`);
    const asset = await uploadResponsiveAsset(source, kind, x.entry_type);
    return saveResponsiveAsset(id, field, asset);
  }

  window.guardarImagenFicha = async function (id, field, inputId) {
    const box = byId('imageStatus') || byId('x');
    try {
      if (box) box.innerHTML = msg('Guardando original y generando versiones para móvil, tablet y ordenador...');
      await setImage(id, field, inputId);
      if (box) box.innerHTML = msg('Imagen responsiva generada correctamente.', 'success');
      formFicha(id);
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo procesar la imagen.', 'error');
    }
  };

  window.regenerarImagenFicha = async function (id, field) {
    const box = byId('imageStatus') || byId('x');
    try {
      if (box) box.innerHTML = msg('Regenerando todas las versiones desde el original...');
      await regenerateImage(id, field);
      if (box) box.innerHTML = msg('Versiones responsivas regeneradas.', 'success');
      formFicha(id);
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo regenerar la imagen.', 'error');
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
    const asset = x.image_assets?.[kind];
    const url = asset?.tablet || asset?.desktop || fallback;
    return url ? `<img src="${esc(url)}" alt="${esc(alt)}">` : msg('Sin imagen', 'notice');
  }

  function imageBox(x) {
    const coverHasOriginal = !!x.image_assets?.cover?.original;
    const photoHasOriginal = !!x.image_assets?.photo?.original;
    const coverRegenerate = coverHasOriginal ? `<button onclick="regenerarImagenFicha('${esc(x.id)}','cover_url')">Regenerar portada desde original</button>` : '';
    const photoRegenerate = photoHasOriginal ? `<button onclick="regenerarImagenFicha('${esc(x.id)}','photo_url')">Regenerar foto desde original</button>` : '';
    return `<section class="panel library-image-panel">
      <h3>Imágenes responsivas</h3>
      <p class="small">Cada archivo original se conserva intacto. La app genera automáticamente versiones para móvil, tablet y ordenador.</p>
      <div class="library-image-grid">
        <div><label>Portada original</label><div id="coverPreview">${currentPreview(x, 'cover', x.cover_url, 'Portada')}</div><input id="coverFile" type="file" accept="image/*" onchange="previewLibraryImage('coverFile','coverPreview')"><button onclick="guardarImagenFicha('${esc(x.id)}','cover_url','coverFile')">Subir y generar portada</button>${coverRegenerate}</div>
        <div><label>Foto interior original</label><div id="photoPreview">${currentPreview(x, 'photo', x.photo_url, 'Foto interior')}</div><input id="photoFile" type="file" accept="image/*" onchange="previewLibraryImage('photoFile','photoPreview')"><button onclick="guardarImagenFicha('${esc(x.id)}','photo_url','photoFile')">Subir y generar foto interior</button>${photoRegenerate}</div>
      </div><div id="imageStatus"></div>
    </section>`;
  }

  window.ANX.LibraryV3Images = {
    IMAGE_PROFILES,
    assetKind,
    filenameExt,
    coverFolder,
    createResponsiveFiles,
    uploadResponsiveAsset,
    saveResponsiveAsset,
    setImage,
    regenerateImage,
    imageBox
  };
})();