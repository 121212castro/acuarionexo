/* AcuarioNexo · auditoría de fichas con respaldo local */
(function () {
  const ANX = window.ANX = window.ANX || {};

  function byId(id) {
    return document.getElementById(id);
  }

  function list(value) {
    return Array.isArray(value) ? value : [];
  }

  function persistedAudit(audit, engine) {
    return {
      approved: audit?.approved === true,
      errors: list(audit?.errors).map(String),
      warnings: list(audit?.warnings).map(String),
      missing_fields: list(audit?.missing_fields).map(String),
      invalid_fields: list(audit?.invalid_fields).map(String),
      poor_fields: list(audit?.poor_fields).map(String),
      source_count: Number(audit?.source_count || 0),
      review_required: audit?.approved !== true,
      requires_review: audit?.approved !== true,
      audited_at: new Date().toISOString(),
      engine: engine || 'library-schema-audit-local-v1',
      contract_source: 'LibrarySchema'
    };
  }

  function auditErrorHtml(audit) {
    const errors = list(audit?.errors);
    if (!errors.length) return ANX.msg('La ficha no supera la auditoría local.', 'error');
    const details = errors.slice(0, 12).map(function (error) {
      return '<li>' + ANX.esc(error) + '</li>';
    }).join('');
    return ANX.msg('La ficha todavía tiene campos obligatorios o reglas sin cumplir.', 'error') +
      '<ul class="small">' + details + '</ul>';
  }

  async function saveLocalAudit(id, entry, audit) {
    const payload = {
      validation_result: persistedAudit(audit, 'library-schema-audit-local-fallback-v1'),
      updated_at: new Date().toISOString()
    };

    let query = ANX.supabase
      .from('library_entries')
      .update(payload)
      .eq('id', id);

    if (ANX.state?.user?.id) query = query.eq('user_id', ANX.state.user.id);

    const result = await query.select('*').single();
    if (result.error) throw result.error;
    if (result.data) Object.assign(entry, result.data);
    else Object.assign(entry, payload);
    return result.data || payload;
  }

  window.auditarFicha = async function (id) {
    const Core = ANX.LibraryV3Core;
    const box = byId('x') || byId('aiBox');

    try {
      const entry = Core?.row?.(id);
      if (!entry) throw new Error('Ficha no encontrada.');

      const localAudit = Core.S.audit(entry);
      if (!localAudit.approved) {
        if (box) box.innerHTML = auditErrorHtml(localAudit);
        ANX.LibraryReviewHighlights?.markEntry?.(entry);
        return;
      }

      if (box) box.innerHTML = ANX.msg('Auditando ficha...');

      let remoteResult = null;
      try {
        const call = ANX.LibraryV3AI?.call;
        if (typeof call !== 'function') throw new Error('Servicio de auditoría no disponible.');
        remoteResult = await call('library-audit-card', { entry_id: id });
        const result = remoteResult?.result || remoteResult?.data?.result || remoteResult?.data || null;
        if (!result || result.approved !== true) {
          throw new Error('El servicio remoto no devolvió una aprobación válida.');
        }
      } catch (edgeError) {
        console.warn('library-audit-card falló; se conserva la auditoría local aprobada.', edgeError);
        await saveLocalAudit(id, entry, localAudit);
        if (box) box.innerHTML = ANX.msg('Ficha aprobada y auditoría guardada correctamente.', 'success');
        await Core.load();
        return;
      }

      if (remoteResult?.data && typeof remoteResult.data === 'object') Object.assign(entry, remoteResult.data);
      if (box) box.innerHTML = ANX.msg('Ficha aprobada y auditoría guardada correctamente.', 'success');
      await Core.load();
    } catch (error) {
      if (box) box.innerHTML = ANX.msg(error?.message || 'No se pudo auditar la ficha.', 'error');
    }
  };

  ANX.LibraryAuditFallback = { persistedAudit, saveLocalAudit };
})();
