/* AcuarioNexo · backfill automático de portadas marinas pendientes */
(function () {
  const ANX = window.ANX = window.ANX || {};
  let running = false;
  let lastResult = null;

  function isAdmin() {
    return !!ANX.LibraryAdminPolicy?.isAdmin?.() || !!ANX.state?.isAdmin;
  }

  function ensureCached(entry) {
    ANX.state.libraryRows = Array.isArray(ANX.state.libraryRows) ? ANX.state.libraryRows : [];
    const index = ANX.state.libraryRows.findIndex(row => String(row.id) === String(entry.id));
    if (index >= 0) ANX.state.libraryRows[index] = { ...ANX.state.libraryRows[index], ...entry };
    else ANX.state.libraryRows.push(entry);
  }

  async function safePhotoUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) throw new Error('Falta foto interior.');
    if (/^data:image\//i.test(raw)) return raw;

    const invoked = await ANX.supabase.functions.invoke('cover-image-proxy', { body: { url: raw } });
    if (invoked.error) throw invoked.error;
    const dataUrl = String(invoked.data?.data_url || '').trim();
    if (!/^data:image\//i.test(dataUrl)) throw new Error(invoked.data?.error || 'No se pudo preparar la foto interior.');
    return dataUrl;
  }

  async function pendingCorals() {
    const result = await ANX.supabase
      .from('library_entries')
      .select('id,title,scientific_name,entry_type,status,photo_url,cover_url,image_assets,updated_at')
      .eq('entry_type', 'coral')
      .order('title', { ascending: true });
    if (result.error) throw result.error;
    return (result.data || []).filter(row => !String(row.cover_url || '').trim() && String(row.photo_url || '').trim());
  }

  async function backfillCoralCovers(options = {}) {
    if (running) return lastResult || { running: true };
    if (!ANX.supabase || !ANX.state?.user || !isAdmin()) return { skipped: true, reason: 'admin_only' };
    if (!ANX.LibraryCoverAuto?.generateAndSave) throw new Error('El generador oficial de portadas no está cargado.');

    running = true;
    const rows = await pendingCorals();
    const result = { total: rows.length, generated: 0, failed: 0, failures: [] };
    lastResult = result;

    try {
      for (const entry of rows) {
        try {
          ensureCached(entry);
          const prepared = await safePhotoUrl(entry.photo_url);
          await ANX.LibraryCoverAuto.generateAndSave(entry.id, prepared);
          result.generated += 1;
        } catch (error) {
          result.failed += 1;
          result.failures.push({ id: entry.id, title: entry.title, error: String(error?.message || error) });
          console.warn('AcuarioNexo: no se pudo generar portada', entry.title, error);
        }
      }
      if (options.reload !== false && result.generated && ANX.LibraryV3Core?.load) {
        try { await ANX.LibraryV3Core.load(); } catch (_) {}
      }
      return result;
    } finally {
      running = false;
      lastResult = result;
    }
  }

  async function autoRun() {
    if (!ANX.state?.user || !isAdmin()) return;
    try {
      const rows = await pendingCorals();
      if (!rows.length) return;
      const result = await backfillCoralCovers({ reload: false });
      console.info(`AcuarioNexo: backfill de portadas coral ${result.generated}/${result.total}`, result.failures || []);
    } catch (error) {
      console.warn('AcuarioNexo: backfill de portadas pendiente', error);
    }
  }

  ANX.LibraryCoverBackfill = { pendingCorals, backfillCoralCovers };
  window.regenerarPortadasCoralPendientes = backfillCoralCovers;

  setTimeout(autoRun, 900);
})();
