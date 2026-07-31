/* AcuarioNexo · flujo completo de fichas en revisión */
(function () {
  const ANX = window.ANX = window.ANX || {};
  let wrappedSave = null;
  let wrappedForm = null;

  function byId(id) { return document.getElementById(id); }
  function value(id) { return String(byId(id)?.value ?? '').trim(); }
  function numberValue(text) {
    const match = String(text ?? '').replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : '';
  }
  function array(value) { return Array.isArray(value) ? value : []; }

  function parseSources(text, normalizeSources) {
    const rows = String(text || '').split('\n').map(line => line.trim()).filter(Boolean);
    const sources = rows.map((line, index) => {
      const parts = line.split('|').map(part => part.trim());
      const url = parts.find(part => /^https?:\/\//i.test(part)) || '';
      if (!url) return null;
      const name = parts.find(part => part && !/^https?:\/\//i.test(part)) || `Fuente ${index + 1}`;
      return { name, url, used_for: parts[2] || '' };
    }).filter(Boolean);
    return typeof normalizeSources === 'function' ? normalizeSources(sources) : sources;
  }

  function readReviewPayload(entry) {
    const Core = ANX.LibraryV3Core;
    const S = Core?.S;
    const data = { ...(entry?.data || {}) };
    const template = S?.templateFor?.(entry.entry_type) || [];

    template.forEach(section => array(section.fields).forEach(field => {
      if (field.id === 'sources') return;
      const control = byId(`libData_${field.id}`);
      if (!control) return;
      if (control.type === 'checkbox') data[field.id] = !!control.checked;
      else if (field.type === 'number') data[field.id] = numberValue(control.value);
      else data[field.id] = String(control.value ?? '').trim();
    }));

    const externalEnabled = byId('libExternalEnabled');
    if (externalEnabled) {
      data.external_link = {
        enabled: !!externalEnabled.checked,
        provider: value('libExternalProvider'),
        url: value('libExternalUrl'),
        button_label: value('libExternalLabel') || 'Ver producto',
        link_type: value('libExternalType') || 'commercial',
        disclaimer: value('libExternalDisclaimer'),
        sponsored: !!byId('libExternalSponsored')?.checked,
        affiliate: !!byId('libExternalAffiliate')?.checked
      };
    }

    const sourceText = value('libSourcesRaw');
    const parsedSources = sourceText ? parseSources(sourceText, S?.normalizeSources) : array(entry.sources);
    const summary = value('libSummary');
    return {
      title: value('libTitle'),
      scientific_name: Core?.biologicalTypes?.has?.(entry.entry_type) ? (value('libScientific') || null) : null,
      summary,
      data,
      sections: { ...(entry.sections || {}), summary },
      tags: value('libTags').split(',').map(tag => tag.trim()).filter(Boolean),
      sources: parsedSources,
      status: 'review',
      visibility: 'private',
      updated_at: new Date().toISOString()
    };
  }

  function persistedReviewAudit(audit) {
    const errors = array(audit?.errors).map(String);
    return {
      approved: audit?.approved === true,
      errors,
      warnings: array(audit?.warnings),
      missing_fields: array(audit?.missing_fields),
      invalid_fields: array(audit?.invalid_fields),
      poor_fields: array(audit?.poor_fields),
      review_flags: errors,
      source_count: Number(audit?.source_count || 0),
      review_required: audit?.approved !== true,
      requires_review: audit?.approved !== true,
      audited_at: new Date().toISOString(),
      engine: 'library-schema-review-save-v1',
      contract_source: 'LibrarySchema'
    };
  }

  async function saveReview(id) {
    const Core = ANX.LibraryV3Core;
    const entry = Core?.row?.(id);
    const box = byId('x');
    if (!entry) throw new Error('Ficha no encontrada.');

    const payload = readReviewPayload(entry);
    const merged = { ...entry, ...payload };
    const audit = Core.S.audit(merged);
    payload.validation_result = persistedReviewAudit(audit);

    const query = ANX.supabase.from('library_entries').update(payload).eq('id', id);
    const secured = ANX.state?.user?.id ? query.eq('user_id', ANX.state.user.id) : query;
    const { data, error } = await secured.select('*').single();
    if (error) throw error;

    Object.assign(entry, data || payload);
    await Core.load();
    const refreshed = Core.row(id) || entry;
    if (box) {
      box.innerHTML = audit.approved
        ? ANX.msg('Cambios guardados. La ficha ya cumple el esquema y está lista para validar.', 'success')
        : ANX.msg(`Cambios guardados en revisión. Quedan ${array(audit.errors).length} apartado(s) pendientes.`, 'error');
    }
    setTimeout(() => {
      ANX.LibraryReviewHighlights?.markEntry?.(refreshed);
    }, 0);
    return refreshed;
  }

  function wrapSave() {
    const original = window.guardarFicha;
    if (typeof original !== 'function' || original === wrappedSave || original.__anxReviewWrapped) return false;
    const wrapper = async function (id) {
      const entry = ANX.LibraryV3Core?.row?.(id);
      if (!entry || String(entry.status).toLowerCase() !== 'review') return original.apply(this, arguments);
      const box = byId('x');
      try {
        return await saveReview(id);
      } catch (error) {
        if (box) box.innerHTML = ANX.msg(error?.message || 'No se pudo guardar la ficha en revisión.', 'error');
      }
    };
    wrapper.__anxReviewWrapped = true;
    wrappedSave = wrapper;
    window.guardarFicha = wrapper;
    return true;
  }

  function addDeleteButton(id) {
    const entry = ANX.LibraryV3Core?.row?.(id);
    if (!entry || String(entry.status).toLowerCase() !== 'review' || byId('libraryReviewDeleteButton')) return;
    const saveButton = [...document.querySelectorAll('button')].find(button => /guardar ficha/i.test(button.textContent || ''));
    if (!saveButton || typeof window.borrarFicha !== 'function') return;
    const button = document.createElement('button');
    button.id = 'libraryReviewDeleteButton';
    button.type = 'button';
    button.className = 'danger';
    button.textContent = 'Borrar ficha';
    button.onclick = () => window.borrarFicha(id);
    saveButton.insertAdjacentElement('afterend', button);
  }

  function wrapForm() {
    const original = window.formFicha;
    if (typeof original !== 'function' || original === wrappedForm || original.__anxReviewWorkflowWrapped) return false;
    const wrapper = function (id) {
      const result = original.apply(this, arguments);
      const finish = () => {
        wrapSave();
        addDeleteButton(id);
        const entry = ANX.LibraryV3Core?.row?.(id);
        ANX.LibraryReviewHighlights?.markEntry?.(entry);
      };
      if (result && typeof result.finally === 'function') result.finally(() => setTimeout(finish, 0));
      else setTimeout(finish, 0);
      return result;
    };
    wrapper.__anxReviewWorkflowWrapped = true;
    wrappedForm = wrapper;
    window.formFicha = wrapper;
    return true;
  }

  function install() {
    wrapSave();
    wrapForm();
  }

  const timer = setInterval(install, 250);
  setTimeout(() => clearInterval(timer), 60000);
  new MutationObserver(install).observe(document.documentElement, { childList: true, subtree: true });

  ANX.LibraryReviewWorkflow = { saveReview, readReviewPayload, persistedReviewAudit, install };
})();
