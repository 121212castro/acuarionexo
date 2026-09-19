/* AcuarioNexo · regeneración controlada de portadas oficiales */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const CONTRACT = ANX.LibraryCoverContract;
  const REQUIRED_TEMPLATE = CONTRACT?.masterTemplate || 'marine-fish-master-v1-locked';
  const REQUIRED_CONTRACT_VERSION = CONTRACT?.version || 'cover-contract-v15';
  const MANUAL_TEMPLATES = new Set(['manual-approved','manual-restored-approved']);
  let running = false;

  function isAdmin() {
    return !!ANX.LibraryAdminPolicy?.isAdmin?.() || !!ANX.state?.isAdmin;
  }

  function legacyManualCover(row) {
    const template = String(row?.image_assets?.cover?.template || '').trim();
    const url = String(row?.image_assets?.cover?.original || row?.cover_url || '').trim();
    return !template && !!url && url.includes('/storage/v1/object/public/library-images/');
  }

  function protectedManual(row) {
    const template = String(row?.image_assets?.cover?.template || '').trim();
    return ((MANUAL_TEMPLATES.has(template) && !!String(row?.cover_url || '').trim()) || legacyManualCover(row));
  }

  function hasMasterTemplate(row) {
    if (protectedManual(row)) return true;
    const cover = row?.image_assets?.cover || {};
    const templateOk = String(cover.template || '') === REQUIRED_TEMPLATE;
    const contractOk = String(cover.contract_version || '') === REQUIRED_CONTRACT_VERSION;
    const urlOk = !!String(row?.cover_url || cover.original || '').trim();
    const currentPhoto = String(row?.photo_url || '').trim();
    const generatedFrom = String(cover.generated_from_photo_url || '').trim();
    const sourceOk = !generatedFrom || !currentPhoto || generatedFrom === currentPhoto;
    return templateOk && contractOk && urlOk && sourceOk;
  }

  async function pendingOfficialCovers(entryType) {
    if (!CONTRACT?.supports?.(entryType)) return [];
    const result = await ANX.supabase
      .from('library_entries')
      .select('id,title,scientific_name,entry_type,status,photo_url,cover_url,image_assets,updated_at')
      .eq('entry_type', entryType)
      .order('title', { ascending: true });
    if (result.error) throw result.error;
    return (result.data || []).filter(row => String(row.photo_url || '').trim() && !hasMasterTemplate(row));
  }

  async function generateAndSave(entry) {
    if (protectedManual(entry)) return entry.image_assets?.cover || { original: entry.cover_url, template: 'legacy-manual' };
    if (!ANX.LibraryCoverAuto?.generateAndSave || ANX.LibraryCoverAuto?.templateId !== REQUIRED_TEMPLATE) {
      throw new Error('La plantilla oficial de portada no está cargada.');
    }
    const cached = ANX.LibraryV3Core?.row?.(entry.id) || (ANX.state?.libraryRows || []).find(x => String(x.id) === String(entry.id));
    if (cached) Object.assign(cached, entry);
    return ANX.LibraryCoverAuto.generateAndSave(entry.id, entry.photo_url);
  }

  async function backfillOfficialCovers(entryType, options = {}) {
    if (running) return { running: true };
    if (!ANX.supabase || !ANX.state?.user || !isAdmin()) return { skipped: true, reason: 'admin_only' };
    if (!CONTRACT?.supports?.(entryType)) return { skipped: true, reason: 'unsupported_type' };
    running = true;
    const rows = await pendingOfficialCovers(entryType);
    const result = { entry_type: entryType, total: rows.length, generated: 0, failed: 0, failures: [] };
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

  async function backfillCoralCovers(options = {}) {
    return backfillOfficialCovers('coral', options);
  }

  async function backfillMarineFishCovers(options = {}) {
    return backfillOfficialCovers('pez_marino', options);
  }

  ANX.LibraryCoverBackfill = {
    pendingOfficialCovers,
    backfillOfficialCovers,
    backfillCoralCovers,
    backfillMarineFishCovers,
    hasMasterTemplate,
    protectedManual,
    legacyManualCover,
    requiredTemplate: REQUIRED_TEMPLATE,
    requiredContractVersion: REQUIRED_CONTRACT_VERSION,
    manualTemplates: [...MANUAL_TEMPLATES]
  };
  window.regenerarTodasPortadasCoral = backfillCoralCovers;
  window.regenerarPortadasCoralPendientes = backfillCoralCovers;
  window.regenerarPortadasPecesMarinosPendientes = backfillMarineFishCovers;
})();