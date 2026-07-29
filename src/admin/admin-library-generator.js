/* AcuarioNexo · Generador de fichas restringido a Admin */
(function () {
  const ANX = window.ANX = window.ANX || {};
  let running = false;

  async function requireAdmin() {
    if (ANX.Admin?.requireAdmin) return ANX.Admin.requireAdmin();
    if (ANX.AdminCore?.loadAdminRole) await ANX.AdminCore.loadAdminRole();
    return !!ANX.AdminCore?.adminAllowed?.();
  }

  function esc(value) { return ANX.esc ? ANX.esc(value) : String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function normalizedSubject(value) { return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-ES'); }
  function labelStatus(status) { return ({pending:'Pendiente',identifying:'Identificando',generating:'Generando',completed:'Lista para fotos',blocked:'Bloqueada',failed:'Error',cancelled:'Cancelada'})[status] || status; }

  async function listJobs() {
    const { data, error } = await ANX.supabase.from('library_generation_jobs').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data || [];
  }

  async function renderQueue(message) {
    if (!await requireAdmin()) return;
    const jobs = await listJobs();
    const rows = jobs.map(job => `<tr><td>${esc(job.subject)}</td><td>${esc(job.entry_type)}</td><td>${esc(labelStatus(job.status))}</td><td>${esc(job.progress)} %</td><td>${job.library_entry_id ? `<button onclick="adminRevisarFichas()">Añadir fotos y revisar</button>` : esc(job.error_message || '')}</td></tr>`).join('');
    ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Generador de fichas</h2><p>Cola privada; nunca publica automáticamente</p></div></section>
      <section class="panel"><button onclick="adminPanel()">← Admin</button>
        <div class="form-grid">
          <div><label>Tipo de ficha</label><select id="generatorEntryType">${(ANX.LibraryV3Core?.types || []).filter(([k]) => k !== 'all').map(([k,n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join('')}</select></div>
          <div><label>Nombres, uno por línea</label><textarea id="generatorSubjects" rows="7" placeholder="Ej.: Salifert Nitrate Profi Test"></textarea></div>
          <div><label>&nbsp;</label><button class="primary" onclick="adminGeneratorAdd()">Añadir y procesar</button></div>
          <div><label>&nbsp;</label><button onclick="adminGeneratorRun()">Reanudar pendientes</button></div>
        </div>${message ? `<p class="small">${esc(message)}</p>` : ''}
      </section>
      <section class="panel"><div class="panel-head"><h2>Cola</h2><button onclick="adminGenerator()">Actualizar</button></div>
        <div class="table-wrap"><table><thead><tr><th>Ficha</th><th>Tipo</th><th>Estado</th><th>Progreso</th><th>Resultado</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No hay trabajos.</td></tr>'}</tbody></table></div>
        <p class="small">Solo llegan a revisión las fichas que superan identificación, fuentes y auditoría. Quedan privadas hasta añadir fotos y publicar manualmente.</p>
      </section>`, 'admin');
  }

  async function patchJob(id, values) {
    const { error } = await ANX.supabase.from('library_generation_jobs').update(values).eq('id', id);
    if (error) throw error;
  }

  async function existingEntry(job, identity) {
    let query = ANX.supabase.from('library_entries').select('id,title,scientific_name,status').eq('entry_type', job.entry_type).limit(1);
    if (identity?.scientific_name) query = query.ilike('scientific_name', identity.scientific_name);
    else query = query.ilike('title', identity?.title || job.subject);
    const { data, error } = await query;
    if (error) throw error;
    return data?.[0] || null;
  }

  async function processJob(job) {
    try {
      await patchJob(job.id, { status:'identifying', progress:15, started_at:new Date().toISOString(), attempts:(job.attempts || 0) + 1, error_code:null, error_message:null });
      const identified = await ANX.supabase.functions.invoke('library-identify', { body: { title:job.subject, entry_type:job.entry_type } });
      if (identified.error) throw identified.error;
      const identity = identified.data?.data || identified.data?.identify_result || identified.data;
      if (!identity?.identity_confirmed) {
        await patchJob(job.id, { status:'blocked', progress:35, identify_result:identity || null, error_code:'identity_required', error_message:'No se confirmó la identidad exacta con dos fuentes reales.' });
        return;
      }
      const duplicate = await existingEntry(job, identity);
      if (duplicate) {
        await patchJob(job.id, { status:'blocked', progress:100, identify_result:identity, library_entry_id:duplicate.id, error_code:'duplicate_entry', error_message:`Ya existe una ficha: ${duplicate.title}.` });
        return;
      }
      await patchJob(job.id, { status:'generating', progress:55, identify_result:identity });
      const generated = await ANX.supabase.functions.invoke('library-generate-draft', { body: { entry_type:job.entry_type, identify_result:identity, cover_url:null, photo_url:null } });
      if (generated.error) throw generated.error;
      const entry = generated.data?.data;
      if (!entry?.id) throw new Error('El generador no devolvió una ficha guardada.');
      const { error: reviewError } = await ANX.supabase.from('library_entries').update({ status:'review', visibility:'private', cover_url:null, photo_url:null }).eq('id', entry.id);
      if (reviewError) throw reviewError;
      await patchJob(job.id, { status:'completed', progress:100, library_entry_id:entry.id, completed_at:new Date().toISOString() });
    } catch (error) {
      await patchJob(job.id, { status:'failed', progress:0, error_code:'generation_failed', error_message:String(error?.message || error).slice(0, 1000) });
    }
  }

  window.adminGenerator = async function () {
    if (!await requireAdmin()) return;
    if (ANX.loadModuleGroup) await ANX.loadModuleGroup('biblioteca');
    return renderQueue();
  };

  window.adminGeneratorAdd = async function () {
    if (!await requireAdmin()) return;
    const entryType = document.getElementById('generatorEntryType')?.value;
    const raw = String(document.getElementById('generatorSubjects')?.value || '').split(/\n+/).map(v => v.trim()).filter(Boolean);
    const unique = [...new Map(raw.map(subject => [normalizedSubject(subject), subject])).values()];
    if (!entryType || !unique.length) return renderQueue('Indica un tipo y al menos un nombre.');
    const existing = await listJobs();
    const activeKeys = new Set(existing.filter(job => !['failed','cancelled'].includes(job.status)).map(job => `${job.entry_type}|${normalizedSubject(job.subject)}`));
    const subjects = unique.filter(subject => !activeKeys.has(`${entryType}|${normalizedSubject(subject)}`));
    if (!subjects.length) return renderQueue('Todos los nombres ya estaban en la cola.');
    const rows = subjects.map(subject => ({ requested_by:ANX.state.user.id, subject, entry_type:entryType, status:'pending', progress:0 }));
    const { error } = await ANX.supabase.from('library_generation_jobs').insert(rows);
    if (error) return renderQueue(error.message);
    await renderQueue(`${rows.length} trabajo(s) añadidos. Iniciando generación...`);
    return window.adminGeneratorRun();
  };

  window.adminGeneratorRun = async function () {
    if (!await requireAdmin() || running) return;
    running = true;
    try {
      const { data, error } = await ANX.supabase.from('library_generation_jobs').select('*').eq('status','pending').order('created_at', { ascending:true }).limit(10);
      if (error) throw error;
      for (const job of data || []) { await processJob(job); await renderQueue('Procesando cola...'); }
      await renderQueue('Bloque terminado. Las aprobadas están listas para fotos y revisión.');
    } catch (error) { await renderQueue(error.message || String(error)); }
    finally { running = false; }
  };

  ANX.AdminLibraryGenerator = { renderQueue, listJobs, processJob };
})();
