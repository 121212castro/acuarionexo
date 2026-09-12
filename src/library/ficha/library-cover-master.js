/* AcuarioNexo · portada maestra aprobada con recorte real del ejemplar */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const SUPPORTED = new Set(['pez_marino', 'coral']);
  const TEMPLATE = 'marine-fish-coral-v5-cutout';
  const ORT_SRC = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.min.js';
  const ORT_WASM = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
  const U2NET_MODEL = 'https://raw.githubusercontent.com/heyi1994/ai_background_removal/master/assets/models/u2netp.onnx';
  let backgroundPromise = null;
  let ortPromise = null;
  let sessionPromise = null;

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

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-anx-src="${src}"]`);
      if (existing?.dataset.loaded === 'true') return resolve();
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar el motor de recorte.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.anxSrc = src;
      script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
      script.onerror = () => reject(new Error('No se pudo cargar el motor de recorte.'));
      document.head.appendChild(script);
    });
  }

  async function ensureOrt() {
    if (!ortPromise) {
      ortPromise = (async () => {
        if (!window.ort) await loadScriptOnce(ORT_SRC);
        if (!window.ort) throw new Error('El motor de recorte no quedó disponible.');
        window.ort.env.wasm.wasmPaths = ORT_WASM;
        window.ort.env.wasm.numThreads = 1;
        return window.ort;
      })();
    }
    return ortPromise;
  }

  async function segmentationSession() {
    if (!sessionPromise) {
      sessionPromise = (async () => {
        const ort = await ensureOrt();
        return ort.InferenceSession.create(U2NET_MODEL, { executionProviders: ['wasm'] });
      })();
    }
    return sessionPromise;
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

  function fitContain(iw, ih, w, h) {
    const scale = Math.min(w / iw, h / ih);
    return { w: iw * scale, h: ih * scale };
  }

  function drawCoverImage(ctx, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
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

  function sourceCanvas(img, maxSide = 1500) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.min(1, maxSide / Math.max(iw, ih));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(iw * scale));
    canvas.height = Math.max(1, Math.round(ih * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function subjectCutout(img) {
    const ort = await ensureOrt();
    const session = await segmentationSession();
    const src = sourceCanvas(img);
    const size = 320;
    const prep = document.createElement('canvas');
    prep.width = size; prep.height = size;
    const pctx = prep.getContext('2d', { willReadFrequently: true });
    pctx.drawImage(src, 0, 0, size, size);
    const pixels = pctx.getImageData(0, 0, size, size).data;
    const tensorData = new Float32Array(3 * size * size);
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];
    for (let i = 0; i < size * size; i += 1) {
      tensorData[i] = (pixels[i * 4] / 255 - mean[0]) / std[0];
      tensorData[size * size + i] = (pixels[i * 4 + 1] / 255 - mean[1]) / std[1];
      tensorData[size * size * 2 + i] = (pixels[i * 4 + 2] / 255 - mean[2]) / std[2];
    }
    const inputName = session.inputNames[0];
    const feeds = {};
    feeds[inputName] = new ort.Tensor('float32', tensorData, [1, 3, size, size]);
    const outputs = await session.run(feeds);
    const out = outputs[session.outputNames[0]];
    if (!out?.data?.length) throw new Error('El recorte del ejemplar no devolvió máscara.');

    let min = Infinity, max = -Infinity;
    for (let i = 0; i < out.data.length; i += 1) {
      const v = Number(out.data[i]);
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = Math.max(1e-6, max - min);
    const mask = document.createElement('canvas');
    mask.width = size; mask.height = size;
    const mctx = mask.getContext('2d');
    const maskData = mctx.createImageData(size, size);
    for (let i = 0; i < size * size; i += 1) {
      let a = (Number(out.data[i]) - min) / range;
      a = Math.max(0, Math.min(1, (a - 0.08) / 0.84));
      a = a * a * (3 - 2 * a);
      const alpha = Math.round(a * 255);
      maskData.data[i * 4] = 255;
      maskData.data[i * 4 + 1] = 255;
      maskData.data[i * 4 + 2] = 255;
      maskData.data[i * 4 + 3] = alpha;
    }
    mctx.putImageData(maskData, 0, 0);

    const cut = document.createElement('canvas');
    cut.width = src.width; cut.height = src.height;
    const cctx = cut.getContext('2d');
    cctx.drawImage(src, 0, 0);
    cctx.globalCompositeOperation = 'destination-in';
    cctx.imageSmoothingEnabled = true;
    cctx.drawImage(mask, 0, 0, cut.width, cut.height);
    cctx.globalCompositeOperation = 'source-over';
    return cropAlpha(cut);
  }

  function cropAlpha(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (data[(y * width + x) * 4 + 3] > 24) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) throw new Error('No se pudo aislar el ejemplar de la foto real.');
    const margin = Math.round(Math.max(width, height) * 0.025);
    minX = Math.max(0, minX - margin); minY = Math.max(0, minY - margin);
    maxX = Math.min(width - 1, maxX + margin); maxY = Math.min(height - 1, maxY + margin);
    const out = document.createElement('canvas');
    out.width = Math.max(1, maxX - minX + 1);
    out.height = Math.max(1, maxY - minY + 1);
    out.getContext('2d').drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  }

  function drawHeader(ctx, common, scientific) {
    const fade = ctx.createLinearGradient(0, 0, 0, 330);
    fade.addColorStop(0, 'rgba(1,12,35,.55)');
    fade.addColorStop(1, 'rgba(1,12,35,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 1200, 340);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.82)';
    ctx.shadowBlur = 12;
    const commonFamily = s => `700 ${s}px Georgia, 'Times New Roman', serif`;
    const commonSize = fitFont(ctx, common, 1040, 106, 48, commonFamily);
    ctx.font = commonFamily(commonSize);
    ctx.fillStyle = '#e7bc58';
    ctx.fillText(common, 600, 112);
    const sciFamily = s => `italic 500 ${s}px Georgia, 'Times New Roman', serif`;
    const sciSize = fitFont(ctx, scientific, 980, 64, 34, sciFamily);
    ctx.font = sciFamily(sciSize);
    ctx.fillStyle = '#e7bc58';
    ctx.shadowBlur = 8;
    ctx.fillText(scientific, 600, 220);
    ctx.shadowBlur = 0;
  }

  async function renderCover(entry, photoUrl) {
    if (!entry || !SUPPORTED.has(entry.entry_type)) throw new Error('Categoría no compatible con la portada maestra.');
    if (!clean(photoUrl)) throw new Error('La ficha necesita una foto interior real para generar la portada.');
    const [bgUrl, resolvedPhoto] = await Promise.all([backgroundDataUrl(), photoDataUrl(photoUrl)]);
    const [bg, photo] = await Promise.all([loadImage(bgUrl), loadImage(resolvedPhoto)]);
    const cutout = await subjectCutout(photo);
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    drawCoverImage(ctx, bg, 0, 0, 1200, 1200);
    const fit = fitContain(cutout.width, cutout.height, 1050, 820);
    const x = 600 - fit.w / 2;
    const y = 345 + (820 - fit.h) / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.42)';
    ctx.shadowBlur = 18;
    ctx.drawImage(cutout, x, y, fit.w, fit.h);
    ctx.restore();
    drawHeader(ctx, clean(entry.title || entry.scientific_name || 'AcuarioNexo'), clean(entry.scientific_name || ''));
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo generar la portada.')), 'image/jpeg', 0.95));
  }

  async function uploadCover(entry, blob) {
    const path = `library/${ANX.state.user.id}/organismos/cover-v5-${entry.id}-${Date.now()}.jpg`;
    const upload = await ANX.supabase.storage.from('library-images').upload(path, blob, {
      upsert: true, contentType: 'image/jpeg', cacheControl: '31536000'
    });
    if (upload.error) throw upload.error;
    return ANX.supabase.storage.from('library-images').getPublicUrl(path).data.publicUrl;
  }

  async function generateAndSave(id, photoUrl) {
    const entry = ANX.LibraryV3Core?.row?.(id) || (ANX.state.libraryRows || []).find(x => String(x.id) === String(id));
    if (!entry || !SUPPORTED.has(entry.entry_type)) return null;
    if (String(entry.image_assets?.cover?.template || '') === 'manual-restored-approved' && !photoUrl) return entry.image_assets.cover;
    const sourcePhoto = clean(photoUrl || entry.photo_url);
    if (!sourcePhoto) throw new Error('La ficha necesita foto interior para generar la portada.');
    const blob = await renderCover(entry, sourcePhoto);
    const url = await uploadCover(entry, blob);
    const now = new Date().toISOString();
    const coverAsset = {
      original: url,
      generated_at: now,
      source_name: 'AcuarioNexo portada maestra · recorte real',
      template: TEMPLATE,
      generated_from_photo_url: sourcePhoto,
      common_name_position: 'top',
      common_name_color: '#e7bc58',
      scientific_name_position: 'under_common_name',
      scientific_name_color: '#e7bc58',
      scientific_name_style: 'italic',
      specimen_position: 'center',
      real_subject_cutout: true,
      fixed_background: true,
      aspect_ratio: '1:1'
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
