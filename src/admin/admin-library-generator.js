/* AcuarioNexo · Generador de fichas restringido a Admin */
(function () {
  const ANX = window.ANX = window.ANX || {};
  let refreshTimer = null;

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
    const { data, error } = await ANX.supabase.from('library_generation_jobs').select('*').order('queue_order', { ascending: true }).limit(100);
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
          <div><label>&nbsp;</label><button class="primary" onclick="adminGeneratorAdd()">Añadir a la cola</button></div>
          <div><label>&nbsp;</label><button onclick="adminGeneratorRun()">Actualizar estado</button></div>
        </div>${message ? `<p class="small">${esc(message)}</p>` : ''}
      </section>
      <section class="panel"><div class="panel-head"><h2>Cola</h2><button onclick="adminGenerator()">Actualizar</button></div>
        <div class="generator-queue">${cards || '<p class="small">No hay trabajos.</p>'}</div>
        <p class="small">Supabase procesa la cola en segundo plano aunque cierres la aplicación. Si no puede confirmar una identidad con fuentes reales, bloquea la ficha. Nunca publica automáticamente.</p>
      </section>`, 'admin');
  }

  function scheduleRefresh(delay = 15000) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => renderQueue('Procesamiento automático activo.'), delay);
  }

  async function patchJob(id, values) {
    const { error } = await ANX.supabase.from('library_generation_jobs').update(values).eq('id', id);
    if (error) throw error;
  }

  window.adminGenerator = async function () {
    if (!await requireAdmin()) return;
    if (ANX.loadModuleGroup) await ANX.loadModuleGroup('biblioteca');
    await renderQueue();
    scheduleRefresh();
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
    await renderQueue(`${rows.length} trabajo(s) añadidos. Supabase los procesará automáticamente.`);
    scheduleRefresh();
  };

  window.adminGeneratorRun = async function () {
    if (!await requireAdmin()) return;
    await renderQueue('Supabase procesa la cola automáticamente.');
    scheduleRefresh();
  };

  window.adminGeneratorRetry = async function (id) {
    if (!await requireAdmin()) return;
    await patchJob(id, { status:'pending', progress:0, error_code:null, error_message:null, started_at:null, completed_at:null });
    await renderQueue('Trabajo devuelto a la cola.');
    scheduleRefresh(1000);
  };

  ANX.AdminLibraryGenerator = { renderQueue, listJobs };
})();
