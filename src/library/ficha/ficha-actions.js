/* AcuarioNexo · Biblioteca · acciones y vista completa de ficha */
(function () {
  const ANX = window.ANX;
  const Core = ANX.LibraryV3Core;
  const { esc, render, byId, msg } = ANX;
  const { row, sources, typeName, statusName, libraryInfoNotice, responsiveImage, libraryBackButton, returnToLibrarySource } = Core;

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

  function valueHtml(value) {
    if (value == null || value === '') return '';
    if (Array.isArray(value)) return esc(value.join(', '));
    if (typeof value === 'object') return esc(Object.values(value).filter(v => v != null && v !== '').join(', '));
    return esc(value);
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

  async function addToAquarium(id) {
    const box = byId('libraryActionStatus');
    try {
      const importer = ANX.LibraryInventoryImport;
      if (!importer || typeof importer.pasarFichaAInventario !== 'function') throw new Error('El importador de Biblioteca no está disponible.');
      if (box) box.innerHTML = msg('Preparando destino...');
      await importer.pasarFichaAInventario(id);
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo abrir el formulario de destino.', 'error');
    }
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
        const details = (localAudit.errors || []).slice(0, 8).map(error => `<li>${esc(error)}</li>`).join('');
        throw new Error(`La ficha todavía no cumple todos los campos obligatorios.${details ? `<ul>${details}</ul>` : ''}`);
      }

      const call = ANX.LibraryV3AI?.call;
      if (typeof call !== 'function') throw new Error('El servicio de validación de Biblioteca no está disponible.');

      if (box) box.innerHTML = msg('Validando ficha antes de publicar...');
      if (String(x.status || '').toLowerCase() !== 'validated') {
        const validation = await call('library-audit-card', { entry_id: id });
        if (!validation?.result?.approved) throw new Error('La validación no aprobó la ficha. Revisa los campos indicados.');
        if (validation.data) Object.assign(x, validation.data);
      }

      if (box) box.innerHTML = msg('Publicando ficha...');
      const publication = await call('library-publish', { entry_id: id });
      if (publication?.data) Object.assign(x, publication.data);
      await Core.load();
      await returnToLibrarySource();
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo publicar la ficha.', 'error');
    }
  }

  function actionButtons(x, audit) {
    const id = esc(x.id);
    const label = esc(actionLabel(x.entry_type));
    const isAdmin = !!ANX.LibraryAdminPolicy?.isAdmin?.() || !!ANX.state?.isAdmin;
    const isPublished = String(x.status || '').toLowerCase() === 'published';
    const addButton = audit.approved
      ? `<button class="primary" onclick="anadirFichaAlAcuario('${id}')">${label}</button>`
      : `<button disabled title="Completa todos los campos obligatorios antes de añadir esta ficha">${label}</button>`;
    const editButton = isAdmin ? `<button onclick="formFicha('${id}')">Editar</button>` : '';
    const publishButton = isAdmin && !isPublished
      ? (audit.approved ? `<button onclick="publicarFicha('${id}')">Validar y publicar</button>` : `<button disabled title="Completa todos los campos obligatorios antes de publicar">Publicar</button>`)
      : '';
    const deleteButton = isAdmin ? `<button onclick="borrarFicha('${id}')">Borrar</button>` : '';
    return `${addButton}${editButton}${publishButton}${deleteButton}`;
  }

  window.anadirFichaAlAcuario = addToAquarium;
  window.publicarFicha = validateAndPublish;

  window.verFicha = function (id) {
    const x = row(id);
    if (!x) return returnToLibrarySource();
    const audit = Core.S.audit(x);
    render(`<section class="library-detail">
      ${libraryInfoNotice()}
      ${libraryBackButton()}
      <small>${esc(typeName(x.entry_type))} · ${esc(statusName(x.status))}</small>
      <h2>${esc(x.title || 'Ficha')}</h2>
      ${x.scientific_name ? `<p class="scientific">${esc(x.scientific_name)}</p>` : ''}
      ${fichaImages(x)}
      ${x.summary ? `<p class="library-detail-summary">${esc(x.summary)}</p>` : ''}
      <div class="image-actions">${actionButtons(x, audit)}</div>
      <div id="libraryActionStatus"></div>
      <div class="library-detail-information">${fichaInformation(x)}</div>
      <h3>Fuentes</h3>
      ${sources(x.sources)}
    </section>`, 'biblioteca');
  };

  ANX.LibraryFichaActions = { actionScope, actionLabel, fichaImages, fichaInformation, actionButtons, addToAquarium, validateAndPublish };
})();