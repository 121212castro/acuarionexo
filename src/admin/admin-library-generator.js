/* AcuarioNexo · Generador de fichas restringido a Admin */
(function () {
  const ANX = window.ANX = window.ANX || {};
  let running = false;
  let pollTimer = null;

  async function requireAdmin() {
    if (ANX.Admin?.requireAdmin) return ANX.Admin.requireAdmin();
    if (ANX.AdminCore?.loadAdminRole) await ANX.AdminCore.loadAdminRole();
    return !!ANX.AdminCore?.adminAllowed?.();
  }

  function esc(value) { return ANX.esc ? ANX.esc(value) : String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function cleanSubject(value) { return String(value || '').trim().replace(/^\s*\d+\s*[\.\)\-:]\s*/, '').replace(/\s+/g, ' '); }
  function normalizedSubject(value) { return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-ES'); }
  function labelStatus(status) { return ({pending:'Pendiente',identifying:'Identificando categoría y versión',generating:'Generando',completed:'Lista para fotos',blocked:'Bloqueada',failed:'Error',cancelled:'Cancelada'})[status] || status; }
  function labelType(type) {
    const match = (ANX.LibraryV3Core?.types || []).find(([key]) => key === type);
    return match?.[1] || (type && type !== 'auto' ? type : 'Pendiente de identificar');
  }

  async function listJobs() {
    const { data, error } = await ANX.supabase.from('library_generation_jobs').select('*').order('created_at', { ascending: true }).limit(100);
    if (error) throw error;
    return data || [];
  }

  async function renderQueue(message) {
    if (!await requireAdmin()) return;
    const jobs = await listJobs();
    const cards = jobs.map((job, index) => {
      const identity = job.identify_result || {};
      const version = identity.version || identity.product_code || identity.presentation || '';
      const canRetry = ['blocked', 'failed', 'cancelled'].includes(job.status);
      const action = job.library_entry_id
        ? '<button class="primary" onclick="adminRevisarFichas()">Añadir fotos y revisar</button>'
        : canRetry ? `<button onclick="adminGeneratorRetry('${esc(job.id)}')">Reintentar</button>` : '';
      const error = job.error_message ? `<p class="generator-error">${esc(job.error_message)}</p>` : '';
      return `<article class="generator-job">
        <div class="generator-job-head"><span class="generator-number">${index + 1}</span><div><h3>${esc(cleanSubject(job.subject))}</h3><small>${esc(identity.brand || identity.manufacturer || identity.requested_brand || '')}</small></div><strong class="generator-status status-${esc(job.status)}">${esc(labelStatus(job.status))}</strong></div>
        <dl class="generator-meta">
          <div><dt>Categoría</dt><dd>${esc(labelType(job.entry_type))}</dd></div>
          <div><dt>Versión / referencia</dt><dd>${esc(version || 'N/D')}</dd></div>
          <div><dt>Progreso</dt><dd>${esc(job.progress)} %</dd></div>
        </dl>${error}${action ? `<div class="generator-actions">${action}</div>` : ''}
      </article>`;
    }).join('');
    ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Generador de fichas</h2><p>Introduce nombres; AcuarioNexo identifica categoría, producto, organismo y versión exacta</p></div></section>
      <section class="panel"><button onclick="adminPanel()">← Admin</button>
        <div class="form-grid">
          <div><label>Nombres, uno por línea</label><textarea id="generatorSubjects" rows="9" placeholder="Nuclear Mix\nPower Mysis\nArtemia nauplio"></textarea></div>
          <div><label>Fabricante o marca común del lote</label><input id="generatorBrand" placeholder="Ej.: Power Aquaculture"></div>
          <div><label>&nbsp;</label><button class="primary" onclick="adminGeneratorAdd()">Añadir y procesar</button></div>
          <div><label>&nbsp;</label><button onclick="adminGeneratorRun()">Reanudar pendientes</button></div>
        </div>${message ? `<p class="small">${esc(message)}</p>` : ''}
      </section>
      <section class="panel"><div class="panel-head"><h2>Cola</h2><button onclick="adminGenerator()">Actualizar</button></div>
        <div class="generator-queue">${cards || '<p class="small">No hay trabajos.</p>'}</div>
        <p class="small">La app determina la categoría y la versión aplicable. Si no puede confirmarlas con fuentes reales, bloquea la ficha. Nunca publica automáticamente.</p>
      </section>`, 'admin');
  }

  function scheduleNextPass(delay = 8000) {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(() => {
      if (typeof window.adminGeneratorRun === 'function') window.adminGeneratorRun();
    }, delay);
  }

  async function patchJob(id, values) {
    const { error } = await ANX.supabase.from('library_generation_jobs').update(values).eq('id', id);
    if (error) throw error;
  }

  async function existingEntry(job, identity, entryType) {
    let query = ANX.supabase.from('library_entries').select('id,title,scientific_name,status').eq('entry_type', entryType).limit(1);
    if (identity?.scientific_name) query = query.ilike('scientific_name', identity.scientific_name);
    else query = query.ilike('title', identity?.title || job.subject);
    const { data, error } = await query;
    if (error) throw error;
    return data?.[0] || null;
  }

  async function processJob(job) {
    try {
      const savedState = job.identify_result?.generation_state || null;
      if (job.status === 'generating' && savedState?.response_id) {
        return continueGeneration(job, job.identify_result, savedState);
      }
      await patchJob(job.id, { status:'identifying', progress:15, started_at:new Date().toISOString(), attempts:(job.attempts || 0) + 1, error_code:null, error_message:null });
      const requestedBrand = cleanSubject(job.identify_result?.requested_brand || '');
      const identified = await ANX.supabase.functions.invoke('library-identify', { body: { title:cleanSubject(job.subject), brand:requestedBrand, notes:requestedBrand ? `El fabricante o marca exigido por este lote es ${requestedBrand}. Descarta candidatos de otras marcas.` : '', entry_type:'auto' } });
      if (identified.error) throw identified.error;
      const identity = identified.data?.data || identified.data?.identify_result || identified.data;
      const resolvedType = identity?.entry_type;
      if (!identity?.identity_confirmed || !resolvedType || resolvedType === 'auto' || resolvedType === 'general') {
        await patchJob(job.id, { status:'blocked', progress:35, identify_result:identity || null, error_code:'identity_required', error_message:'No se confirmó la categoría, identidad o versión exacta con dos fuentes reales.' });
        return;
      }

      await patchJob(job.id, { entry_type:resolvedType, identify_result:identity, progress:40 });
      const duplicate = await existingEntry(job, identity, resolvedType);
      if (duplicate) {
        await patchJob(job.id, { status:'blocked', progress:100, library_entry_id:duplicate.id, error_code:'duplicate_entry', error_message:`Ya existe una ficha: ${duplicate.title}.` });
        return;
      }

      await patchJob(job.id, { status:'generating', progress:50 });
      return continueGeneration(job, identity, null);
    } catch (error) {
      await patchJob(job.id, { status:'failed', progress:0, error_code:'generation_failed', error_message:String(error?.message || error).slice(0, 1000) });
    }
  }

  async function continueGeneration(job, identity, generationState) {
    try {
      const generated = await ANX.supabase.functions.invoke('library-generate-draft', { body: {
        entry_type:identity.entry_type || job.entry_type,
        identify_result:identity,
        cover_url:null,
        photo_url:null,
        response_id:generationState?.response_id || null,
        attempt:generationState?.attempt || 0
      } });
      if (generated.error) throw generated.error;
      const result = generated.data?.data;
      if (result?.response_id) {
        const nextIdentity = { ...identity, generation_state: { response_id:result.response_id, attempt:result.attempt || 0, phase:result.phase, status:result.status } };
        const progress = result.phase === 'repairing' ? Math.min(90, 70 + ((result.attempt || 1) * 5)) : 60;
        await patchJob(job.id, { status:'generating', progress, identify_result:nextIdentity });
        return false;
      }
      const entry = result;
      if (!entry?.id) throw new Error('El generador no devolvió una ficha guardada.');
      const { error: reviewError } = await ANX.supabase.from('library_entries').update({ status:'review', visibility:'private', cover_url:null, photo_url:null }).eq('id', entry.id);
      if (reviewError) throw reviewError;
      await patchJob(job.id, { status:'completed', progress:100, library_entry_id:entry.id, completed_at:new Date().toISOString() });
      return true;
    } catch (error) {
      await patchJob(job.id, { status:'failed', progress:0, error_code:'generation_failed', error_message:String(error?.message || error).slice(0, 1000) });
      return false;
    }
  }

  window.adminGenerator = async function () {
    if (!await requireAdmin()) return;
    if (ANX.loadModuleGroup) await ANX.loadModuleGroup('biblioteca');
    const jobs = await listJobs();
    await renderQueue();
    if (jobs.some(job => ['pending','generating'].includes(job.status))) scheduleNextPass(500);
  };

  window.adminGeneratorAdd = async function () {
    if (!await requireAdmin()) return;
    const raw = String(document.getElementById('generatorSubjects')?.value || '').split(/\n+/).map(cleanSubject).filter(Boolean);
    const brand = cleanSubject(document.getElementById('generatorBrand')?.value || '');
    const unique = [...new Map(raw.map(subject => [normalizedSubject(subject), subject])).values()];
    if (!unique.length) return renderQueue('Introduce al menos un nombre.');
    const existing = await listJobs();
    const activeSubjects = new Set(existing.filter(job => !['failed','cancelled'].includes(job.status)).map(job => normalizedSubject(job.subject)));
    const subjects = unique.filter(subject => !activeSubjects.has(normalizedSubject(subject)));
    if (!subjects.length) return renderQueue('Todos los nombres ya estaban en la cola.');
    const rows = subjects.map(subject => ({ requested_by:ANX.state.user.id, subject, identify_result:brand ? { requested_brand:brand } : null, entry_type:'auto', status:'pending', progress:0 }));
    const { error } = await ANX.supabase.from('library_generation_jobs').insert(rows);
    if (error) return renderQueue(error.message);
    await renderQueue(`${rows.length} trabajo(s) añadidos. Iniciando identificación automática...`);
    return window.adminGeneratorRun();
  };

  window.adminGeneratorRun = async function () {
    if (!await requireAdmin() || running) return;
    running = true;
    try {
      const { data, error } = await ANX.supabase.from('library_generation_jobs').select('*').in('status',['pending','generating']).order('created_at', { ascending:true }).limit(10);
      if (error) throw error;
      for (const job of data || []) { await processJob(job); await renderQueue('Procesando cola por etapas...'); }
      const { count, error:countError } = await ANX.supabase.from('library_generation_jobs').select('id', { count:'exact', head:true }).in('status',['pending','generating']);
      if (countError) throw countError;
      const unfinished = Number(count || 0) > 0;
      await renderQueue(unfinished ? 'Las búsquedas continúan. Puedes cerrar la aplicación y reanudar después.' : 'Bloque terminado. Las aprobadas están listas para fotos y revisión.');
      if (unfinished) scheduleNextPass();
    } catch (error) { await renderQueue(error.message || String(error)); }
    finally { running = false; }
  };

  window.adminGeneratorRetry = async function (id) {
    if (!await requireAdmin()) return;
    await patchJob(id, { status:'pending', progress:0, error_code:null, error_message:null, started_at:null, completed_at:null });
    await renderQueue('Trabajo devuelto a la cola.');
    return window.adminGeneratorRun();
  };

  ANX.AdminLibraryGenerator = { renderQueue, listJobs, processJob };
})();
