/* AcuarioNexo · Identificar por foto → Biblioteca → Inventario */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const { supabase, state, esc, byId, msg, render } = ANX;

  let previewUrl = '';

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo preparar la imagen.'));
      img.src = dataUrl;
    });
  }

  async function compactImage(file) {
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('Selecciona una imagen válida.');
    if (file.size > 18 * 1024 * 1024) throw new Error('La imagen es demasiado grande.');
    const original = await fileToDataUrl(file);
    const img = await loadImage(original);
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la imagen.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  }

  function confidenceText(value) {
    const n = Math.round((Number(value) || 0) * 100);
    return `${Math.max(0, Math.min(100, n))} %`;
  }

  function matchCard(row) {
    const image = row.cover_url || row.photo_url || '';
    return `<article class="item">
      ${image ? `<img src="${esc(image)}" alt="${esc(row.title || 'Ficha')}" style="width:84px;height:84px;object-fit:cover;border-radius:10px;float:left;margin:0 12px 8px 0">` : ''}
      <b>${esc(row.title || row.scientific_name || 'Ficha')}</b>
      ${row.scientific_name ? `<p class="scientific">${esc(row.scientific_name)}</p>` : ''}
      <p class="small">Coincidencia de biblioteca: ${esc(row.match_score)} %</p>
      <div class="quick-actions"><button onclick="photoIdentifyView('${esc(row.id)}')">Ver ficha</button><button class="primary" onclick="photoIdentifyAdd('${esc(row.id)}')">Añadir al inventario</button></div>
      <div style="clear:both"></div>
    </article>`;
  }

  window.identificarPorFoto = function () {
    if (!state.user) return window.login();
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Identificar por foto</h2><p>Foto → Biblioteca → Inventario</p></div></section>
      <section class="panel">
        <button onclick="dashboard()">← Inicio</button>
        <div class="panel-head"><h2>Haz una foto o elige una imagen</h2></div>
        <p class="small">La imagen se usa para identificar el elemento y buscar una ficha existente. No se añade nada al inventario sin tu confirmación.</p>
        <input id="photoIdentifyInput" type="file" accept="image/*">
        <div id="photoIdentifyPreview"></div>
        <div id="photoIdentifyStatus"></div>
      </section>`, 'inicio');
    const input = byId('photoIdentifyInput');
    if (input) input.onchange = window.photoIdentifyAnalyze;
  };

  window.photoIdentifyAnalyze = async function () {
    const input = byId('photoIdentifyInput');
    const file = input?.files?.[0];
    const status = byId('photoIdentifyStatus');
    try {
      if (!file) return;
      if (status) status.innerHTML = msg('Preparando imagen...');
      const imageDataUrl = await compactImage(file);
      previewUrl = imageDataUrl;
      const preview = byId('photoIdentifyPreview');
      if (preview) preview.innerHTML = `<img src="${esc(previewUrl)}" alt="Foto a identificar" style="width:100%;max-height:360px;object-fit:contain;border-radius:14px;margin:12px 0">`;
      if (status) status.innerHTML = msg('Identificando y buscando en Biblioteca...');
      const { data, error } = await supabase.functions.invoke('library-identify-photo', { body: { image_data_url: imageDataUrl } });
      if (error) throw error;
      if (data?.error) throw new Error(data.message || data.error);
      const id = data?.identification || {};
      const matches = Array.isArray(data?.matches) ? data.matches : [];
      const alternatives = Array.isArray(id.alternatives) && id.alternatives.length ? `<p class="small">Alternativas: ${esc(id.alternatives.join(' · '))}</p>` : '';
      const result = `<section class="panel">
        <div class="panel-head"><h2>Identificación</h2></div>
        <h3>${esc(id.common_name || id.scientific_name || 'Sin identificación concluyente')}</h3>
        ${id.scientific_name ? `<p class="scientific">${esc(id.scientific_name)}</p>` : ''}
        <p class="small">Categoría: ${esc(id.entry_type || 'general')} · Confianza: ${esc(confidenceText(id.confidence))}</p>
        ${id.notes ? `<p>${esc(id.notes)}</p>` : ''}${alternatives}
      </section>
      <section class="panel"><div class="panel-head"><h2>Coincidencias en Biblioteca</h2></div>
        ${matches.length ? matches.map(matchCard).join('') : `${msg('No encontré una ficha suficientemente coincidente en tu Biblioteca.', 'notice')}<button onclick="biblioteca()">Buscar manualmente en Biblioteca</button>`}
      </section>`;
      if (status) status.innerHTML = result;
    } catch (e) {
      if (status) status.innerHTML = msg(e.message || 'No se pudo identificar la foto.', 'error');
    }
  };

  window.photoIdentifyAdd = async function (id) {
    try {
      if (typeof window.pasarFichaAInventario !== 'function') throw new Error('No está disponible el flujo de Inventario.');
      return await window.pasarFichaAInventario(id);
    } catch (e) {
      const box = byId('photoIdentifyStatus');
      if (box) box.innerHTML = msg(e.message || 'No se pudo abrir el alta de Inventario.', 'error');
    }
  };

  window.photoIdentifyView = async function (id) {
    try {
      if (typeof window.biblioteca !== 'function') throw new Error('Biblioteca no disponible.');
      state.libraryFilter = 'all';
      await window.biblioteca();
      if (typeof window.verFicha === 'function') return window.verFicha(id);
      if (typeof window.abrirFicha === 'function') return window.abrirFicha(id);
    } catch (e) {
      render(`<section class="panel">${msg(e.message || 'No se pudo abrir la ficha.', 'error')}<button onclick="identificarPorFoto()">Volver</button></section>`, 'biblioteca');
    }
  };

  ANX.PhotoIdentify = { compactImage };
})();
