/* AcuarioNexo · Biblioteca · acciones y vista completa de ficha */
(function () {
  const ANX = window.ANX;
  const Core = ANX.LibraryV3Core;
  const { esc, render, byId, msg } = ANX;
  const { row, sources, typeName, statusName, libraryInfoNotice, responsiveImage, libraryBackButton, returnToLibrarySource } = Core;

  const CLASSIFICATION_FIELDS = [
    ['ecosystem', 'Medio'],
    ['environment', 'Entorno'],
    ['target_animals', 'Animales'],
    ['target_groups', 'Grupos recomendados'],
    ['diet_type', 'Tipo de dieta'],
    ['food_form', 'Formato'],
    ['feeding_zone', 'Zona de alimentación'],
    ['life_stage', 'Etapa']
  ];

  function actionScope(entryType) {
    const resolver = ANX.LibraryInventoryImport?.inventoryScopeForType;
    return typeof resolver === 'function' ? resolver(entryType) : 'general';
  }

  function actionLabel(entryType) {
    return actionScope(entryType) === 'aquarium' ? 'Añadir a mi acuario' : 'Añadir al inventario';
  }

  function fichaImages(x) {
    const cover = responsiveImage(x, 'cover', x.cover_url, 'library-detail-cover', x.title || 'Foto portada', 'eager');
    const photo = responsiveImage(x, 'photo', x.photo_url, 'library-detail-photo', x.title || 'Foto al abrir ficha', 'lazy');
    return `${cover}${photo}`;
  }

  function normalizedExternalLink(x) {
    const data = x?.data || {};
    const raw = data.external_link || data.commercial_link || x?.external_link || x?.commercial_link || null;
    if (!raw || typeof raw !== 'object' || raw.enabled !== true) return null;
    const url = String(raw.url || raw.product_url || '').trim();
    if (!url) return null;
    try {
      const parsed = new URL(url, window.location.origin);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      return {
        url: parsed.href,
        provider: String(raw.provider || raw.name || '').trim(),
        label: String(raw.button_label || raw.button_text || 'Ver producto').trim() || 'Ver producto',
        disclaimer: String(raw.disclaimer || '').trim(),
        sponsored: raw.sponsored === true,
        affiliate: raw.affiliate === true
      };
    } catch (_) {
      return null;
    }
  }

  function fichaExternalLink(x) {
    const link = normalizedExternalLink(x);
    if (!link) return '';
    const rel = ['noopener', 'noreferrer'];
    if (link.sponsored || link.affiliate) rel.push('sponsored');
    const provider = link.provider ? `<small class="library-external-provider">${esc(link.provider)}</small>` : '';
    const disclaimer = link.disclaimer ? `<p class="library-external-disclaimer">${esc(link.disclaimer)}</p>` : '';
    return `<section class="library-external-link" aria-label="Enlace externo">
      ${provider}
      <a class="primary library-external-button" href="${esc(link.url)}" target="_blank" rel="${rel.join(' ')}">${esc(link.label)}</a>
      ${disclaimer}
    </section>`;
  }

  function valueHtml(value) {
    if (value == null || value === '') return '';
    if (Array.isArray(value)) return esc(value.join(', '));
    if (typeof value === 'object') return esc(Object.values(value).filter(v => v != null && v !== '').join(', '));
    return esc(value);
  }

  function classificationText(value) {
    return String(value || '')
      .trim()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function classificationValues(value) {
    const list = Array.isArray(value) ? value : (value == null || value === '' ? [] : [value]);
    return [...new Set(list.map(classificationText).filter(Boolean))];
  }

  function fichaClassification(x) {
    const classification = x?.data?.ai_classification;
    if (!classification || typeof classification !== 'object' || Array.isArray(classification)) return '';
    const rows = CLASSIFICATION_FIELDS.map(([key, label]) => {
      const values = classificationValues(classification[key]);
      if (!values.length) return '';
      return `<div class="library-detail-field library-classification-field"><dt>${esc(label)}</dt><dd>${values.map(esc).join(', ')}</dd></div>`;
    }).filter(Boolean).join('');
    if (!rows) return '';
    return `<section class="library-detail-section library-classification" aria-label="Clasificación AcuarioNexo">
      <h3>Clasificación AcuarioNexo</h3>
      <dl>${rows}</dl>
    </section>`;
  }

  function fichaInformation(x) {
    const data = x.data || {};
    const sections = Core.S.templateFor(x.entry_type || 'producto');
    const html = sections.map(section => {
      const fields = section.fields.map(field => {
        if (['title', 'scientific_name', 'sources'].includes(field.id)) return '';
        const value = data[field.id] ?? x[field.id];
        const visible = valueHtml(value);
        return visible ? `<div class="library-detail-field"><dt>${esc(field.label)}</dt><dd>${visible}</dd></div>` : '';
      }).filter(Boolean).join('');
      return fields ? `<section class="library-detail-section"><h3>${esc(section.label)}</h3><dl>${fields}</dl></section>` : '';
    }).filter(Boolean).join('');
    return html || '<div class="notice">La ficha todavía no contiene información estructurada visible.</div>';
  }

  function fichaCanBeAdded(x, audit) {
    return !!x && !!audit?.approved;
  }

  function validationDetails(validation) {
    const result = validation?.result || validation || {};
    const raw = [];
    ['errors', 'missing_fields', 'warnings'].forEach(key => {
      const value = result[key] ?? validation?.[key];
      if (Array.isArray(value)) raw.push(...value);
    });
    const reason = result.reason || result.message || validation?.message;
    if (reason) raw.unshift(reason);
    return [...new Set(raw.map(value => String(value || '').trim()).filter(Boolean))].slice(0, 12);
  }

  async function addToAquarium(id) {
    let button = null;
    const box = byId('libraryActionStatus');
    try {
      button = byId(`libraryAddButton_${id}`);
      const x = row(id);
      if (!x) throw new Error('Ficha no encontrada.');
      const audit = Core.S.effectiveAudit(x);
      if (!fichaCanBeAdded(x, audit)) {
        const errors = (audit.errors || []).slice(0, 4).join(' · ');
        throw new Error(errors ? `La ficha debe corregirse antes de añadirla: ${errors}` : 'La ficha debe superar la auditoría antes de añadirse.');
      }
      const importer = ANX.LibraryInventoryImport;
      if (!importer || typeof importer.pasarFichaAInventario !== 'function') throw new Error('El importador de Biblioteca no está disponible.');
      if (button) { button.disabled = true; button.textContent = 'Preparando...'; }
      if (box) box.innerHTML = msg('Preparando destino...');
      await importer.pasarFichaAInventario(id);
    } catch (error) {
      if (button) { button.disabled = false; button.textContent = actionLabel(row(id)?.entry_type); }
      if (box) box.innerHTML = msg(error.message || 'No se pudo abrir el formulario de destino.', 'error');
    }
  }

  function persistedAudit(localAudit) {
    return {
      approved: localAudit.approved === true,
      errors: Array.isArray(localAudit.errors) ? localAudit.errors : [],
      warnings: Array.isArray(localAudit.warnings) ? localAudit.warnings : [],
      missing_fields: Array.isArray(localAudit.missing_fields) ? localAudit.missing_fields : [],
      source_count: Number(localAudit.source_count || 0),
      contract_integrity: localAudit.contract_integrity || null
    };
  }

  async function publishDirectly(id, x, localAudit) {
    const supabase = ANX.supabase;
    if (!supabase) throw new Error('Conexión con la base de datos no disponible.');
    const now = new Date().toISOString();
    const auditResult = { ...persistedAudit(localAudit), audited_at: now, engine: 'library-schema-single-source-v1', contract_source: 'LibrarySchema' };
    const validated = await supabase
      .from('library_entries')
      .update({ status: 'validated', validation_result: auditResult, validated_by: ANX.state.user.id, validated_at: now, updated_at: now })
      .eq('id', id)
      .select('*')
      .single();
    if (validated.error) throw validated.error;
    const published = await supabase
      .from('library_entries')
      .update({ status: 'published', published_at: now, updated_at: now })
      .eq('id', id)
      .eq('status', 'validated')
      .select('*')
      .single();
    if (published.error) throw published.error;
    if (published.data) Object.assign(x, published.data);
    return published.data;
  }

  async function validateAndPublish(id) {
    const box = byId('libraryActionStatus') || byId('x') || byId('aiBox');
    try {
      const x = row(id);
      if (!x) throw new Error('Ficha no encontrada.');
      const isAdmin = !!ANX.LibraryAdminPolicy?.isAdmin?.() || !!ANX.state?.isAdmin;
      if (!isAdmin) throw new Error('No tienes permiso para publicar fichas.');

      const localAudit = Core.S.audit(x);
      if (!localAudit.approved) {
        const details = (localAudit.errors || []).slice(0, 12).map(error => `<li>${esc(error)}</li>`).join('');
        throw new Error(`La ficha todavía no cumple el contrato único de ${esc(typeName(x.entry_type))}.${details ? `<ul>${details}</ul>` : ''}`);
      }

      const integrity = Core.S.contractIntegrityReport?.();
      if (integrity && !integrity.approved) {
        const details = (integrity.errors || []).slice(0, 12).map(error => `<li>${esc(error)}</li>`).join('');
        throw new Error(`El contrato interno no está alineado y se ha detenido la publicación.${details ? `<ul>${details}</ul>` : ''}`);
      }

      if (box) box.innerHTML = msg('Auditoría aprobada. Guardando validación y publicando...');
      const call = ANX.LibraryV3AI?.call;
      let publishedByEdge = false;
      let edgeError = null;

      if (typeof call === 'function') {
        try {
          const publication = await call('library-publish', {
            entry_id: id,
            contract_source: 'LibrarySchema',
            audit_result: persistedAudit(localAudit)
          });
          if (publication?.data) Object.assign(x, publication.data);
          publishedByEdge = String(x.status || publication?.data?.status || '').toLowerCase() === 'published';
        } catch (error) {
          edgeError = error;
          console.warn('library-publish no disponible; se usa el mismo flujo de dos estados desde el cliente.', error);
        }
      }

      if (!publishedByEdge) {
        try {
          await publishDirectly(id, x, localAudit);
        } catch (directError) {
          if (edgeError) directError.message = `${directError.message} · Servicio: ${edgeError.message || edgeError}`;
          throw directError;
        }
      }

      if (box) box.innerHTML = msg('Ficha auditada, validada y publicada correctamente.', 'success');
      await Core.load();
      await returnToLibrarySource();
    } catch (error) {
      const text = error?.message || 'No se pudo publicar la ficha.';
      if (box) box.innerHTML = `<div class="error">${esc(text)}</div>`;
    }
  }

  function actionButtons(x, audit) {
    const id = esc(x.id);
    const label = esc(actionLabel(x.entry_type));
    const isAdmin = !!ANX.LibraryAdminPolicy?.isAdmin?.() || !!ANX.state?.isAdmin;
    const isPublished = String(x.status || '').toLowerCase() === 'published';
    const canAdd = fichaCanBeAdded(x, audit);
    const addButton = canAdd
      ? `<button id="libraryAddButton_${id}" type="button" class="primary" data-library-add-id="${id}">${label}</button>`
      : `<button type="button" disabled title="Corrige los errores de auditoría antes de añadir esta ficha">${label}</button>`;
    const editButton = isAdmin ? `<button onclick="formFicha('${id}')">Editar</button>` : '';
    const publishButton = isAdmin && !isPublished
      ? (audit.approved ? `<button onclick="publicarFicha('${id}')">Validar y publicar</button>` : `<button disabled title="Completa todos los campos obligatorios antes de publicar">Publicar</button>`)
      : '';
    const deleteButton = isAdmin ? `<button onclick="borrarFicha('${id}')">Borrar</button>` : '';
    return `${addButton}${editButton}${publishButton}${deleteButton}`;
  }

  function bindLibraryActions() {
    document.querySelectorAll('[data-library-add-id]').forEach(function (button) {
      if (button.dataset.libraryActionBound === 'true') return;
      button.dataset.libraryActionBound = 'true';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        void addToAquarium(button.dataset.libraryAddId);
      });
    });
  }

  window.publicarFicha = validateAndPublish;

  window.verFicha = function (id) {
    const x = row(id);
    if (!x) return returnToLibrarySource();
    const audit = Core.S.effectiveAudit(x);
    render(`<section class="library-detail">
      ${libraryInfoNotice()}
      ${libraryBackButton()}
      <small>${esc(typeName(x.entry_type))} · ${esc(statusName(x.status))}</small>
      <h2>${esc(x.title || 'Ficha')}</h2>
      ${x.scientific_name ? `<p class="scientific">${esc(x.scientific_name)}</p>` : ''}
      ${fichaImages(x)}
      ${x.summary ? `<p class="library-detail-summary">${esc(x.summary)}</p>` : ''}
      ${fichaExternalLink(x)}
      <div class="image-actions">${actionButtons(x, audit)}</div>
      <div id="libraryActionStatus"></div>
      <div class="library-detail-information">
        ${fichaClassification(x)}
        ${fichaInformation(x)}
      </div>
      <h3>Fuentes</h3>
      ${sources(x.sources)}
    </section>`, 'biblioteca');
    bindLibraryActions();
  };

  ANX.LibraryFichaActions = { actionScope, actionLabel, fichaImages, fichaExternalLink, normalizedExternalLink, fichaClassification, fichaInformation, fichaCanBeAdded, actionButtons, bindLibraryActions, addToAquarium, validateAndPublish, validationDetails };
})();
