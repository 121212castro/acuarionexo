/* AcuarioNexo · portada automática fija para pez_marino y coral */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const SUPPORTED = new Set(['pez_marino','coral']);
  const BG = 'data:image/jpeg;base64,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';

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar la imagen para crear la portada.'));
      img.src = src;
    });
  }

  function fitContain(sw, sh, bw, bh) {
    const r = Math.min(bw / sw, bh / sh);
    return { w: sw * r, h: sh * r };
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function fitText(ctx, text, maxWidth, startPx, family) {
    let size = startPx;
    while (size > 28) {
      ctx.font = family(size);
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    return size;
  }

  async function renderCover(entry, photoUrl) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    const [bg, photo] = await Promise.all([loadImage(BG), loadImage(photoUrl)]);
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    const box = { x: 190, y: 205, w: 820, h: 500 };
    const f = fitContain(photo.naturalWidth || photo.width, photo.naturalHeight || photo.height, box.w, box.h);
    const x = box.x + (box.w - f.w) / 2;
    const y = box.y + (box.h - f.h) / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 26;
    roundedRect(ctx, x, y, f.w, f.h, 24);
    ctx.clip();
    ctx.drawImage(photo, x, y, f.w, f.h);
    ctx.restore();

    const common = String(entry.title || '').trim();
    const scientific = String(entry.scientific_name || '').trim();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const commonFamily = s => `700 ${s}px Georgia, 'Times New Roman', serif`;
    const commonSize = fitText(ctx, common, 1040, 68, commonFamily);
    ctx.font = commonFamily(commonSize);
    ctx.fillStyle = '#d6a53a';
    ctx.shadowColor = 'rgba(0,0,0,.7)';
    ctx.shadowBlur = 10;
    ctx.fillText(common, 600, 82);

    const sciFamily = s => `italic 500 ${s}px Georgia, 'Times New Roman', serif`;
    const sciSize = fitText(ctx, scientific, 1040, 58, sciFamily);
    ctx.font = sciFamily(sciSize);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,.8)';
    ctx.shadowBlur = 9;
    ctx.fillText(scientific, 600, 830);

    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo generar la portada.')), 'image/jpeg', 0.92));
  }

  async function uploadCover(entry, blob) {
    const path = `library/${ANX.state.user.id}/organismos/auto-cover-${entry.id}-${Date.now()}.jpg`;
    const upload = await ANX.supabase.storage.from('library-images').upload(path, blob, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '31536000'
    });
    if (upload.error) throw upload.error;
    return ANX.supabase.storage.from('library-images').getPublicUrl(path).data.publicUrl;
  }

  async function generateAndSave(id, photoUrl) {
    const entry = ANX.LibraryV3Core?.row?.(id) || (ANX.state.libraryRows || []).find(x => String(x.id) === String(id));
    if (!entry || !SUPPORTED.has(entry.entry_type)) return null;
    if (!photoUrl) throw new Error('La ficha necesita foto interior para generar la portada.');
    const blob = await renderCover(entry, photoUrl);
    const url = await uploadCover(entry, blob);
    const now = new Date().toISOString();
    const coverAsset = {
      original: url,
      generated_at: now,
      source_name: 'AcuarioNexo portada automática',
      template: 'marine-fish-coral-v1',
      generated_from_photo_url: photoUrl,
      common_name_position: 'top',
      common_name_color: '#d6a53a',
      scientific_name_position: 'bottom',
      scientific_name_color: '#ffffff',
      scientific_name_style: 'italic'
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

  ANX.LibraryCoverAuto = { SUPPORTED, renderCover, generateAndSave, templateId: 'marine-fish-coral-v1' };
})();
