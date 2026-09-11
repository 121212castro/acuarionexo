/* AcuarioNexo · portada maestra v3 para coral y pez marino */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const REQUIRED_TEMPLATE = 'marine-fish-coral-v3-square-master';
  let running = false;

  function isAdmin() {
    return !!ANX.LibraryAdminPolicy?.isAdmin?.() || !!ANX.state?.isAdmin;
  }

  function cachedRow(id) {
    return ANX.LibraryV3Core?.row?.(id) || (ANX.state?.libraryRows || []).find(x => String(x.id) === String(id));
  }

  async function generateAndSave(id) {
    if (!ANX.supabase || !ANX.state?.user || !isAdmin()) throw new Error('Solo administración puede generar portadas oficiales.');
    const invoked = await ANX.supabase.functions.invoke('backfill-coral-covers', { body: { id } });
    if (invoked.error) throw invoked.error;
    if (invoked.data?.error) throw new Error(invoked.data.error);
    const fresh = await ANX.supabase.from('library_entries').select('*').eq('id', id).single();
    if (fresh.error) throw fresh.error;
    const current = cachedRow(id);
    if (current) Object.assign(current, fresh.data);
    return fresh.data?.image_assets?.cover || null;
  }

  if (ANX.LibraryCoverAuto) {
    ANX.LibraryCoverAuto.generateAndSave = generateAndSave;
    ANX.LibraryCoverAuto.templateId = REQUIRED_TEMPLATE;
  }

  function hasMasterTemplate(row) {
    return String(row?.image_assets?.cover?.template || '') === REQUIRED_TEMPLATE && !!String(row?.cover_url || '').trim();
  }

  async function pendingCorals() {
    const result = await ANX.supabase
      .from('library_entries')
      .select('id,title,scientific_name,entry_type,status,photo_url,cover_url,image_assets,updated_at')
      .eq('entry_type', 'coral')
      .order('title', { ascending: true });
    if (result.error) throw result.error;
    return (result.data || []).filter(row => String(row.photo_url || '').trim() && !hasMasterTemplate(row));
  }

  async function backfillCoralCovers(options = {}) {
    if (running) return { running: true };
    if (!ANX.supabase || !ANX.state?.user || !isAdmin()) return { skipped: true, reason: 'admin_only' };
    running = true;
    const rows = await pendingCorals();
    const result = { total: rows.length, generated: 0, failed: 0, failures: [] };
    try {
      for (const entry of rows) {
        try {
          await generateAndSave(entry.id);
          result.generated += 1;
        } catch (error) {
          result.failed += 1;
          result.failures.push({ id: entry.id, title: entry.title, error: String(error?.message || error) });
        }
      }
      if (options.reload !== false && result.generated && ANX.LibraryV3Core?.load) {
        try { await ANX.LibraryV3Core.load(); } catch (_) {}
      }
      return result;
    } finally {
      running = false;
    }
  }

  ANX.LibraryCoverBackfill = { pendingCorals, backfillCoralCovers, requiredTemplate: REQUIRED_TEMPLATE };
  window.regenerarTodasPortadasCoral = backfillCoralCovers;
  window.regenerarPortadasCoralPendientes = backfillCoralCovers;
})();
