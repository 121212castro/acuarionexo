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

  async function invokeImageUpdate(id, kind, entryType, file) {
    assertAdmin();
    if (!ASSET_KINDS.has(kind)) throw new Error('Tipo de imagen no permitido.');
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('Selecciona un archivo de imagen válido.');

    const body = new FormData();
    body.append('entry_id', String(id));
    body.append('kind', kind);
    body.append('entry_type', entryType || 'general');
    body.append('file', file, file.name || `imagen.${filenameExt(file)}`);

    const { data, error } = await supabase.functions.invoke('library-image-update', { body });
    if (error) throw new Error(error.message || 'No se pudo guardar la imagen.');
    if (!data?.ok || !data?.entry?.id) throw new Error(data?.error || 'No se pudo guardar la imagen.');
    return data;
  }

  async function uploadResponsiveAsset(file, kind, entryType, id) {
    const data = await invokeImageUpdate(id, kind, entryType, file);
    return data.asset;
  }

  async function saveResponsiveAsset(id, field, asset) {
    const x = row(id);
    if (!x) throw new Error('Ficha no encontrada.');
    const kind = assetKind(field);
    const legacyField = legacyFieldForKind(kind);
    const payload = { image_assets: { ...(x.image_assets || {}), [kind]: asset } };
    if (legacyField) payload[legacyField] = asset.original;
    Object.assign(x, payload);
    return asset;
  }

  async function setImage(id, field, inputId) {
    assertAdmin();
    const x = row(id);
    const file = byId(inputId)?.files?.[0];
    if (!x || !file) throw new Error('Selecciona una imagen.');
    const kind = assetKind(field);
    const data = await invokeImageUpdate(id, kind, x.entry_type, file);
    Object.assign(x, data.entry);
    return data.asset;
  }

  window.guardarImagenFicha = async function (id, field, inputId) {
    const box = byId('imageStatus') || byId('x');
    try {
      if (box) box.innerHTML = msg('Guardando imagen...');
      await setImage(id, field, inputId);
      if (box) box.innerHTML = msg('Imagen actualizada correctamente.', 'success');
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
      <p class="small">Las imágenes se pueden cambiar en cualquier momento, sin validar ni publicar de nuevo la ficha.</p>
      <div class="library-image-grid">
        ${imageControl(x, 'cover', 'Portada', x.cover_url, 'coverFile', 'coverPreview')}
        ${imageControl(x, 'photo', 'Foto interior', x.photo_url, 'photoFile', 'photoPreview')}
        ${biological ? imageControl(x, 'map', 'Mapa de distribución', null, 'mapFile', 'mapPreview') : ''}
        ${biological ? imageControl(x, 'taxonomy', 'Árbol taxonómico', null, 'taxonomyFile', 'taxonomyPreview') : ''}
      </div>
      <div id="imageStatus"></div>
    </section>`;
  }

  function referenceObject(x, key) {
    const value = x?.sections?.[key] ?? x?.data?.[key] ?? null;
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  }

  function referenceRows(value) {
    if (!value) return '';
    return Object.entries(value)
      .filter(([, item]) => item != null && item !== '' && (!Array.isArray(item) || item.length))
      .map(([key, item]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
        const text = Array.isArray(item) ? item.join(', ') : (typeof item === 'object' ? Object.values(item).join(', ') : item);
        return `<div class="library-detail-field"><dt>${esc(label)}</dt><dd>${esc(text)}</dd></div>`;
      })
      .join('');
  }

  function referenceVisualSection(x, kind, title, dataKey) {
    const image = x?.image_assets?.[kind]?.original || '';
    const rows = referenceRows(referenceObject(x, dataKey));
    if (!image && !rows) return '';
    return `<section class="library-detail-section library-reference-visual">
      <h3>${esc(title)}</h3>
      ${image ? `<div class="library-media-frame library-media-frame--${esc(kind)}"><img class="library-detail-photo" src="${esc(image)}" alt="${esc(title + ' de ' + (x.title || 'la ficha'))}" loading="lazy"></div>` : ''}
      ${rows ? `<dl>${rows}</dl>` : ''}
    </section>`;
  }

  function injectReferenceVisuals(id) {
    const x = row(id);
    const host = document.querySelector('.library-detail-information');
    if (!x || !host || byId('libraryReferenceVisuals')) return;
    const html = [
      referenceVisualSection(x, 'map', 'Mapa de distribución', 'distribution_map'),
      referenceVisualSection(x, 'taxonomy', 'Árbol taxonómico', 'taxonomy_tree')
    ].filter(Boolean).join('');
    if (!html) return;
    const box = document.createElement('div');
    box.id = 'libraryReferenceVisuals';
    box.className = 'library-detail-information library-reference-visuals';
    box.innerHTML = html;
    host.insertAdjacentElement('afterend', box);
  }

  function installReferenceVisuals() {
    const current = window.verFicha;
    if (typeof current !== 'function' || current.__referenceVisualsWrapped) return false;
    const wrapped = function (id) {
      const result = current.apply(this, arguments);
      requestAnimationFrame(() => injectReferenceVisuals(id));
      return result;
    };
    wrapped.__referenceVisualsWrapped = true;
    window.verFicha = wrapped;
    return true;
  }

  let referenceInstallAttempts = 0;
  const referenceInstallTimer = setInterval(function () {
    referenceInstallAttempts += 1;
    if (installReferenceVisuals() || referenceInstallAttempts >= 40) clearInterval(referenceInstallTimer);
  }, 100);

  ANX.LibraryV3Images = {
    ASSET_KINDS,
    assetKind,
    legacyFieldForKind,
    filenameExt,
    coverFolder,
    uploadResponsiveAsset,
    saveResponsiveAsset,
    setImage,
    imageBox,
    injectReferenceVisuals,
    installReferenceVisuals
  };
})();