/* AcuarioNexo · regeneración segura de portadas de coral */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const REQUIRED_TEMPLATE = 'marine-fish-coral-v5-cutout';
  const MANUAL_TEMPLATE = 'manual-restored-approved';
  let running = false;

  function isAdmin() {
    return !!ANX.LibraryAdminPolicy?.isAdmin?.() || !!ANX.state?.isAdmin;
  }

  function protectedManual(row) {
    return String(row?.image_assets?.cover?.template || '') === MANUAL_TEMPLATE && !!String(row?.cover_url || '').trim();
  }

  function hasMasterTemplate(row) {
    return protectedManual(row) || (String(row?.image_assets?.cover?.template || '') === REQUIRED_TEMPLATE && !!String(row?.cover_url || '').trim());
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

  async function generateAndSave(entry) {
    if (protectedManual(entry)) return entry.image_assets.cover;
    if (!ANX.LibraryCoverAuto?.generateAndSave || ANX.LibraryCoverAuto?.templateId !== REQUIRED_TEMPLATE) {
      throw new Error('La plantilla maestra v5 no está cargada.');
    }
    const cached = ANX.LibraryV3Core?.row?.(entry.id) || (ANX.state?.libraryRows || []).find(x => String(x.id) === String(entry.id));
    if (cached) Object.assign(cached, entry);
    return ANX.LibraryCoverAuto.generateAndSave(entry.id, entry.photo_url);
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
          await generateAndSave(entry);
          result.generated += 1;
        } catch (error) {
          result.failed += 1;
          result.failures.push({ id: entry.id, title: entry.title, error: String(error?.message || error) });
          console.warn('AcuarioNexo: portada pendiente', entry.title, error);
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

  async function autoRun() {
    if (!ANX.state?.user || !isAdmin()) return;
    try {
      const rows = await pendingCorals();
      if (!rows.length) return;
      console.info(`AcuarioNexo: regenerando ${rows.length} portadas de coral con recorte real v5.`);
      const result = await backfillCoralCovers({ reload: false });
      console.info(`AcuarioNexo: portadas v5 ${result.generated}/${result.total}`, result.failures || []);
      if (result.generated && ANX.LibraryV3Core?.load) {
        try { await ANX.LibraryV3Core.load(); } catch (_) {}
      }
    } catch (error) {
      console.warn('AcuarioNexo: regeneración de portadas pendiente', error);
    }
  }

  ANX.LibraryCoverBackfill = { pendingCorals, backfillCoralCovers, requiredTemplate: REQUIRED_TEMPLATE, manualTemplate: MANUAL_TEMPLATE };
  window.regenerarTodasPortadasCoral = backfillCoralCovers;
  window.regenerarPortadasCoralPendientes = backfillCoralCovers;
  setTimeout(autoRun, 1000);
})();
