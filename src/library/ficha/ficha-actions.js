/* AcuarioNexo · Biblioteca · acciones de ficha */
(function () {
  const ANX = window.ANX;
  const Core = ANX.LibraryV3Core;
  const Ficha = ANX.LibraryV3Ficha;
  const { esc, render } = ANX;
  const { row, sources, typeName, statusName, libraryInfoNotice } = Core;

  function actionLabel() {
    return 'Añadir al acuario';
  }

  function fichaPhoto(x) {
    return x.photo_url
      ? `<img class="library-detail-photo" src="${esc(x.photo_url)}" alt="${esc(x.title || 'Foto al abrir ficha')}">`
      : '';
  }

  window.verFicha = function (id) {
    const x = row(id);
    if (!x) return biblioteca();
    const audit = Core.S.audit(x);
    const label = actionLabel(x.entry_type);
    const actionButtons = audit.approved
      ? `<button onclick="formFicha('${esc(id)}')">Editar</button><button onclick="pasarFichaAInventario('${esc(id)}')">${esc(label)}</button><button onclick="publicarFicha('${esc(id)}')">Publicar</button><button onclick="borrarFicha('${esc(id)}')">Borrar</button>`
      : `<button onclick="formFicha('${esc(id)}')">Editar</button><button disabled title="Completa todos los campos obligatorios antes de añadir al acuario">${esc(label)}</button><button disabled title="Completa todos los campos obligatorios antes de publicar">Publicar</button><button onclick="borrarFicha('${esc(id)}')">Borrar</button>`;
    render(`<section class="library-detail">${libraryInfoNotice()}<button onclick="biblioteca()">← Biblioteca</button><small>${esc(typeName(x.entry_type))} · ${esc(statusName(x.status))}</small><h2>${esc(x.title || 'Ficha')}</h2>${x.scientific_name ? `<p class="scientific">${esc(x.scientific_name)}</p>` : ''}${fichaPhoto(x)}<p>${esc(x.summary || '')}</p>${Ficha.auditHtml(audit, 6)}<div class="image-actions">${actionButtons}</div><h3>Fuentes</h3>${sources(x.sources)}</section>`, 'biblioteca');
  };

  ANX.LibraryFichaActions = { actionLabel, fichaPhoto };
})();
