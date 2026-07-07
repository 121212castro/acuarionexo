/* AcuarioNexo · Biblioteca · política Admin */
(function () {
  const ANX = window.ANX || {};
  const core = ANX.LibraryV3Core || {};
  const { state, esc, msg, render, byId } = ANX;
  const { row, sources, typeName, statusName, libraryInfoNotice, S } = core;
  if (!state || !row || !S) return;

  function isAdmin() {
    return !!state.isAdmin;
  }

  function denyAdminOnly() {
    render(`<section class="panel">${msg('La creación y edición de fichas está restringida al panel Admin.', 'error')}<button onclick="biblioteca()">Volver a Biblioteca</button></section>`, 'biblioteca');
  }

  function adminOnly(fn) {
    return function () {
      if (!isAdmin()) return denyAdminOnly();
      return fn.apply(window, arguments);
    };
  }

  function inventoryButton(id, audit) {
    if (!audit.approved) return '<button disabled title="La ficha debe estar completa antes de añadirla al inventario">Añadir a mi inventario</button>';
    return `<button class="primary" onclick="pasarFichaAInventario('${esc(id)}')">Añadir a mi inventario</button>`;
  }

  function adminButtons(id, audit) {
    if (!isAdmin()) return '';
    return audit.approved
      ? `<button onclick="formFicha('${esc(id)}')">Editar</button><button onclick="publicarFicha('${esc(id)}')">Publicar</button><button class="ghost danger" onclick="borrarFicha('${esc(id)}')">Borrar</button>`
      : `<button onclick="formFicha('${esc(id)}')">Editar</button><button disabled title="Completa todos los campos obligatorios antes de publicar">Publicar</button><button class="ghost danger" onclick="borrarFicha('${esc(id)}')">Borrar</button>`;
  }

  const original = {
    nuevaFichaV3: window.nuevaFichaV3,
    formFicha: window.formFicha,
    guardarFicha: window.guardarFicha,
    auditarFicha: window.auditarFicha,
    publicarFicha: window.publicarFicha,
    borrarFicha: window.borrarFicha,
    copiarApartadosFicha: window.copiarApartadosFicha
  };

  if (typeof original.nuevaFichaV3 === 'function') window.nuevaFichaV3 = adminOnly(original.nuevaFichaV3);
  if (typeof original.formFicha === 'function') window.formFicha = adminOnly(original.formFicha);
  if (typeof original.guardarFicha === 'function') window.guardarFicha = adminOnly(original.guardarFicha);
  if (typeof original.auditarFicha === 'function') window.auditarFicha = adminOnly(original.auditarFicha);
  if (typeof original.publicarFicha === 'function') window.publicarFicha = adminOnly(original.publicarFicha);
  if (typeof original.borrarFicha === 'function') window.borrarFicha = adminOnly(original.borrarFicha);
  if (typeof original.copiarApartadosFicha === 'function') window.copiarApartadosFicha = adminOnly(original.copiarApartadosFicha);

  window.verFicha = function (id) {
    const x = row(id);
    if (!x) return biblioteca();
    const audit = S.audit(x);
    const actionButtons = `${inventoryButton(id, audit)}${adminButtons(id, audit)}`;
    render(`<section class="library-detail library-public-detail">
      ${libraryInfoNotice()}
      <button onclick="biblioteca()">← Biblioteca</button>
      <small>${esc(typeName(x.entry_type))} · ${esc(statusName(x.status))}</small>
      <h2>${esc(x.title || 'Ficha')}</h2>
      ${x.scientific_name ? `<p class="scientific">${esc(x.scientific_name)}</p>` : ''}
      ${x.cover_url ? `<img class="library-detail-photo" src="${esc(x.cover_url)}" alt="${esc(x.title || 'Portada')}" loading="lazy">` : ''}
      ${x.photo_url ? `<img class="library-detail-photo" src="${esc(x.photo_url)}" alt="${esc(x.title || 'Foto')}" loading="lazy">` : ''}
      <p>${esc(x.summary || '')}</p>
      ${isAdmin() && typeof ANX.LibraryV3Images?.imageBox === 'function' ? ANX.LibraryV3Images.imageBox(x) : ''}
      ${isAdmin() ? (typeof original.auditarFicha === 'function' ? '' : '') : ''}
      <div class="image-actions">${actionButtons}</div>
      <h3>Fuentes</h3>${sources(x.sources)}
    </section>`, 'biblioteca');
  };

  ANX.LibraryAdminPolicy = { isAdmin, denyAdminOnly };
})();