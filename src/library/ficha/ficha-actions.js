/* AcuarioNexo · Biblioteca · acciones y vista completa de ficha */
(function () {
  const ANX = window.ANX;
  const Core = ANX.LibraryV3Core;
  const { esc, render, byId, msg } = ANX;
  const { row, sources, typeName, statusName, libraryInfoNotice } = Core;

  function actionLabel() {
    return 'Añadir a mi acuario';
  }

  function imageHtml(url, alt, className) {
    return url ? `<img class="${className}" src="${esc(url)}" alt="${esc(alt)}">` : '';
  }

  function fichaImages(x) {
    const cover = imageHtml(x.cover_url, x.title || 'Foto portada', 'library-detail-cover');
    const photo = imageHtml(x.photo_url, x.title || 'Foto al abrir ficha', 'library-detail-photo');
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
      if (typeof window.pasarFichaAInventario !== 'function') throw new Error('El módulo de acuario no está disponible.');
      if (box) box.innerHTML = msg('Cargando acuarios disponibles...');
      await window.pasarFichaAInventario(id);
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo abrir el formulario del acuario.', 'error');
    }
  }

  function actionButtons(x, audit) {
    const id = esc(x.id);
    const label = esc(actionLabel(x.entry_type));
    const canManage = !!ANX.LibraryAdminPolicy?.canManageEntry?.(x.id) || !!ANX.state?.isAdmin;
    const addButton = audit.approved
      ? `<button class="primary" onclick="anadirFichaAlAcuario('${id}')">${label}</button>`
      : `<button disabled title="Completa todos los campos obligatorios antes de añadir a mi acuario">${label}</button>`;
    const editButton = canManage ? `<button onclick="formFicha('${id}')">Editar</button>` : '';
    const publishButton = ANX.state?.isAdmin
      ? (audit.approved ? `<button onclick="publicarFicha('${id}')">Publicar</button>` : `<button disabled title="Completa todos los campos obligatorios antes de publicar">Publicar</button>`)
      : '';
    const deleteButton = canManage ? `<button onclick="borrarFicha('${id}')">Borrar</button>` : '';
    return `${addButton}${editButton}${publishButton}${deleteButton}`;
  }

  window.anadirFichaAlAcuario = addToAquarium;

  window.verFicha = function (id) {
    const x = row(id);
    if (!x) return biblioteca();
    const audit = Core.S.audit(x);
    render(`<section class="library-detail">
      ${libraryInfoNotice()}
      <button onclick="biblioteca()">← Biblioteca</button>
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

  ANX.LibraryFichaActions = { actionLabel, fichaImages, fichaInformation, actionButtons, addToAquarium };
})();
