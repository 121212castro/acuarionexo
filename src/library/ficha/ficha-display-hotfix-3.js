/* AcuarioNexo · corrección vista ficha y portada */
(function () {
  const ANX = window.ANX || {};
  const core = ANX.LibraryV3Core || {};
  const esc = ANX.esc || function (value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  };

  if (!ANX.render || !core.S || !core.row || !core.sources) return;

  function auditHtml(audit, limit) {
    const errors = audit.errors || [];
    if (!errors.length) return ANX.msg('Ficha completa. No quedan campos obligatorios vacíos.', 'success');
    const max = limit || 6;
    return `${ANX.msg(`Ficha bloqueada: quedan ${errors.length} campos obligatorios o reglas sin cumplir.`, 'error')}<ul class="small">${errors.slice(0, max).map(error => `<li>${esc(error)}</li>`).join('')}</ul>${errors.length > max ? `<p class="small">Y ${errors.length - max} incidencias más.</p>` : ''}`;
  }

  function coverHtml(x) {
    if (!x.cover_url) return '';
    const commonName = x.title || 'Ficha';
    const scientificName = x.scientific_name || '';
    return `<div class="library-cover-fixed"><img class="library-detail-photo" src="${esc(x.cover_url)}" alt="${esc(commonName || 'Portada')}"><div class="library-cover-fixed-title">${esc(commonName)}</div>${scientificName ? `<div class="library-cover-fixed-subtitle">${esc(scientificName)}</div>` : ''}</div>`;
  }

  window.verFicha = function (id) {
    const x = core.row(id);
    if (!x) return window.biblioteca();
    const audit = core.S.audit(x);
    const actionButtons = audit.approved
      ? `<button onclick="formFicha('${esc(id)}')">Editar</button><button onclick="pasarFichaAInventario('${esc(id)}')">Añadir al acuario</button><button onclick="publicarFicha('${esc(id)}')">Publicar</button><button onclick="borrarFicha('${esc(id)}')">Borrar</button>`
      : `<button onclick="formFicha('${esc(id)}')">Editar</button><button disabled title="Completa todos los campos obligatorios antes de añadir al acuario">Añadir al acuario</button><button disabled title="Completa todos los campos obligatorios antes de publicar">Publicar</button><button onclick="borrarFicha('${esc(id)}')">Borrar</button>`;
    ANX.render(`<section class="library-detail">${core.libraryInfoNotice()}<button onclick="biblioteca()">← Biblioteca</button><small>${esc(core.typeName(x.entry_type))} · ${esc(core.statusName(x.status))}</small><h2>${esc(x.title || 'Ficha')}</h2>${x.scientific_name ? `<p class="scientific">${esc(x.scientific_name)}</p>` : ''}${coverHtml(x)}${x.photo_url ? `<img class="library-detail-photo" src="${esc(x.photo_url)}" alt="${esc(x.title || 'Ficha original')}">` : ''}<p>${esc(x.summary || '')}</p>${auditHtml(audit, 6)}<div class="image-actions">${actionButtons}</div><h3>Fuentes</h3>${core.sources(x.sources)}</section>`, 'biblioteca');
  };
})();
