/* AcuarioNexo · portada maestra fija para peces marinos y corales */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const SUPPORTED = new Set(['pez_marino', 'coral']);
  const TEMPLATE = 'marine-fish-coral-v2-fixed';
  let backgroundPromise = null;

  function clean(value) { return String(value ?? '').trim(); }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar la imagen para la portada.'));
      img.src = src;
    });
  }

  async function photoDataUrl(url) {
    const src = clean(url);
    if (!/^https?:\/\//i.test(src)) return src;
    try {
      const result = await ANX.supabase.functions.invoke('cover-image-proxy', { body: { url: src } });
      if (!result.error && result.data?.data_url) return result.data.data_url;
    } catch (_) {}
    return src;
  }

  async function backgroundDataUrl() {
    if (backgroundPromise) return backgroundPromise;
    backgroundPromise = (async () => {
      const version = encodeURIComponent(window.ANX_ASSET_VERSION || window.ACUARIONEXO_BUILD || 'dev');
      const response = await fetch(`src/library/ficha/library-cover-auto.js?v=${version}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar la plantilla oficial de portada.');
      const text = await response.text();
      const match = text.match(/const BG = '([^']+)'/);
      if (!match) throw new Error('No se encontró el fondo oficial de portada.');
      return match[1];
    })();
    return backgroundPromise;
  }

  function fitCover(iw, ih, w, h) {
    const scale = Math.max(w / iw, h / ih);
    return { w: iw * scale, h: ih * scale };
  }

  function fitFont(ctx, text, maxWidth, start, min, family) {
    let size = start;
    while (size > min) {
      ctx.font = family(size);
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    return size;
  }

  function drawFeatheredPhoto(ctx, img) {
    const x = 150, y = 255, w = 900, h = 620;
    const layer = document.createElement('canvas');
    layer.width = 1200; layer.height = 900;
    const l = layer.getContext('2d');
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const f = fitCover(iw, ih, w, h);
    const dx = x + (w - f.w) / 2;
    const dy = y + (h - f.h) / 2;
    l.drawImage(img, dx, dy, f.w, f.h);

    l.globalCompositeOperation = 'destination-in';
    l.save();
    l.filter = 'blur(34px)';
    l.fillStyle = '#fff';
    l.beginPath();
    l.ellipse(600, 565, 430, 290, 0, 0, Math.PI * 2);
    l.fill();
    l.restore();
    l.globalCompositeOperation = 'source-over';
    ctx.drawImage(layer, 0, 0);
  }

  function drawHeader(ctx, common, scientific) {
    const topFade = ctx.createLinearGradient(0, 0, 0, 285);
    topFade.addColorStop(0, 'rgba(1,12,35,.50)');
    topFade.addColorStop(1, 'rgba(1,12,35,0)');
    ctx.fillStyle = topFade;
    ctx.fillRect(0, 0, 1200, 300);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.78)';
    ctx.shadowBlur = 10;

    const commonFamily = s => `700 ${s}px Georgia, 'Times New Roman', serif`;
    const commonSize = fitFont(ctx, common, 960, 94, 48, commonFamily);
    ctx.font = commonFamily(commonSize);
    ctx.fillStyle = '#e2b44f';
    ctx.fillText(common, 600, 92);

    ctx.shadowBlur = 4;
    ctx.strokeStyle = '#d6a53a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(245, 166); ctx.lineTo(520, 166); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(680, 166); ctx.lineTo(955, 166); ctx.stroke();
    ctx.font = `34px Georgia, 'Times New Roman', serif`;
    ctx.fillStyle = '#e2b44f';
    ctx.fillText('❦', 600, 166);

    const sciFamily = s => `italic 500 ${s}px Georgia, 'Times New Roman', serif`;
    const sciSize = fitFont(ctx, scientific, 920, 58, 34, sciFamily);
    ctx.font = sciFamily(sciSize);
    ctx.fillStyle = '#e2b44f';
    ctx.shadowBlur = 8;
    ctx.fillText(scientific, 600, 220);
    ctx.shadowBlur = 0;
  }

  async function renderCover(entry, photoUrl) {
    if (!entry || !SUPPORTED.has(entry.entry_type)) throw new Error('Categoría no compatible con la portada maestra.');
    if (!clean(photoUrl)) throw new Error('La ficha necesita una foto interior real para generar la portada.');
    const [bgUrl, resolvedPhoto] = await Promise.all([backgroundDataUrl(), photoDataUrl(photoUrl)]);
    const [bg, photo] = await Promise.all([loadImage(bgUrl), loadImage(resolvedPhoto)]);
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 900;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bg, 0, 0, 1200, 900);
    drawFeatheredPhoto(ctx, photo);
    drawHeader(ctx, clean(entry.title || entry.scientific_name || 'AcuarioNexo'), clean(entry.scientific_name || ''));
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo generar la portada.')), 'image/jpeg', 0.94));
  }

  async function uploadCover(entry, blob) {
    const path = `library/${ANX.state.user.id}/organismos/cover-v2-${entry.id}-${Date.now()}.jpg`;
    const upload = await ANX.supabase.storage.from('library-images').upload(path, blob, {
      upsert: true, contentType: 'image/jpeg', cacheControl: '31536000'
    });
    if (upload.error) throw upload.error;
    return ANX.supabase.storage.from('library-images').getPublicUrl(path).data.publicUrl;
  }

  async function generateAndSave(id, photoUrl) {
    const entry = ANX.LibraryV3Core?.row?.(id) || (ANX.state.libraryRows || []).find(x => String(x.id) === String(id));
    if (!entry || !SUPPORTED.has(entry.entry_type)) return null;
    const sourcePhoto = clean(photoUrl || entry.photo_url);
    if (!sourcePhoto) throw new Error('La ficha necesita foto interior para generar la portada.');
    const blob = await renderCover(entry, sourcePhoto);
    const url = await uploadCover(entry, blob);
    const now = new Date().toISOString();
    const coverAsset = {
      original: url,
      generated_at: now,
      source_name: 'AcuarioNexo portada maestra',
      template: TEMPLATE,
      generated_from_photo_url: sourcePhoto,
      common_name_position: 'top',
      common_name_color: '#e2b44f',
      scientific_name_position: 'under_common_name',
      scientific_name_color: '#e2b44f',
      scientific_name_style: 'italic',
      specimen_position: 'center',
      fixed_background: true
    };
    const payload = {
      cover_url: url,
      image_assets: { ...(entry.image_assets || {}), cover: coverAsset },
      updated_at: now
    };
    const result = await ANX.supabase.from('library_entries').update(payload).eq('id', entry.id).select('*').single();
    if (result.error) throw result.error;
    Object.assign(entry, result.data || payload);
    return coverAsset;
  }

  ANX.LibraryCoverAuto = { SUPPORTED, renderCover, generateAndSave, templateId: TEMPLATE };
})();
