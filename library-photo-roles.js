/* AcuarioNexo · Roles de foto en Biblioteca */
(function() {
  const BUILD = 'library-photo-roles-v2-cover-only-list';
  const MODULES = [
    { key: 'fish_marine', label: 'Peces marinos', icon: '🐠' },
    { key: 'fish_freshwater', label: 'Peces de agua dulce', icon: '🐟' },
    { key: 'coral', label: 'Corales', icon: '🪸' },
    { key: 'invertebrate', label: 'Invertebrados', icon: '🦐' },
    { key: 'plant', label: 'Plantas y algas', icon: '🌿' },
    { key: 'microfauna', label: 'Microfauna', icon: '∞' },
    { key: 'medicine', label: 'Medicamentos', icon: '💊' },
    { key: 'product', label: 'Productos y sales', icon: '🧂' },
    { key: 'equipment', label: 'Equipamiento', icon: '⚙️' }
  ];

  function esc(x) {
    return (window.E ? window.E(x) : String(x ?? '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    }));
  }

  function msg(t, k) {
    return window.M ? window.M(t, k) : '<div class="' + (k || 'notice') + '">' + esc(t) + '</div>';
  }

  function clean(x) {
    return String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function installStyles() {
    if (document.getElementById('libraryPhotoRolesStyles')) return;
    const style = document.createElement('style');
    style.id = 'libraryPhotoRolesStyles';
    style.textContent = '' +
      '.library-grid{display:grid;grid-template-columns:1fr;gap:18px}' +
      '.library-card.library-cover-card{position:relative;display:block;padding:0;overflow:hidden;border-radius:22px;background:rgba(5,20,34,.55);border:1px solid rgba(137,190,215,.25)}' +
      '.library-card.library-cover-card img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;object-position:center;border-radius:22px}' +
      '.library-card.library-cover-card .library-no-photo{min-height:220px;display:grid;place-items:center;font-size:48px}' +
      '.library-card.library-cover-card .library-cover-title{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}' +
      '.library-card.library-cover-card button[data-admin-delete-library]{position:absolute;right:14px;bottom:14px;width:auto;min-width:0;margin:0;padding:10px 14px;border-radius:16px;background:rgba(74,38,54,.92);box-shadow:0 10px 24px rgba(0,0,0,.35)}';
    document.head.appendChild(style);
  }

  function moduleKey(f) {
    const raw = f.raw || {};
    const k = clean([f.categoria, f.source_category, raw.category, raw.source_category].filter(Boolean).join(' '));
    const text = clean([f.nombre, f.cientifico, f.descripcion].filter(Boolean).join(' '));
    if (/medic|medicine|tratamiento|treatment|coppersafe|cobre|copper|antiparasit/.test(k + ' ' + text)) return 'medicine';
    if (/equip|equipment|skimmer|bomba|luz|filtro|calentador|reactor/.test(k + ' ' + text)) return 'equipment';
    if (/product|producto|sal\b|salt|alimento|food|test|aditivo|additive|consumible/.test(k + ' ' + text)) return 'product';
    if (/coral/.test(k)) return 'coral';
    if (/invert|crust|molus|gamba|caracol|cangrejo|erizo|estrella/.test(k + ' ' + text)) return 'invertebrate';
    if (/plant|planta|alga/.test(k + ' ' + text)) return 'plant';
    if (/micro|copep|rotifer|artemia|fito/.test(k + ' ' + text)) return 'microfauna';
    if (/fresh|dulce/.test(k + ' ' + text)) return 'fish_freshwater';
    if (/fish_marine|pez_marino|marine|marino|arrecife|reef/.test(k + ' ' + text)) return 'fish_marine';
    if (/fish|pez|peces/.test(k)) return 'fish_marine';
    return 'product';
  }

  function moduleLabel(key) {
    return (MODULES.find(m => m.key === key) || { label: 'Productos y sales' }).label;
  }

  function isAnimalModule(key) {
    return ['fish_marine', 'fish_freshwater', 'coral', 'invertebrate', 'plant', 'microfauna'].includes(key);
  }

  function summary(f) {
    return String(f.descripcion || f.raw?.summary || f.raw?.resumen || '').trim();
  }

  function coverPhoto(f) {
    const raw = f.raw || {};
    return raw.cover_photo_url || raw.cover_photo || raw.coverPhoto || f.cover_photo_url || f.cover_photo || f.foto || raw.photo_url || '';
  }

  function speciesPhoto(f) {
    const raw = f.raw || {};
    return raw.species_photo_url || raw.species_photo || raw.speciesPhoto || f.species_photo_url || f.species_photo || raw.photo_url || f.foto || '';
  }

  function modulesHtml(list) {
    const mods = MODULES.map(m => ({ ...m, n: list.filter(f => moduleKey(f) === m.key).length })).filter(m => m.n > 0);
    return '<div class="library-modules">' + mods.map(m =>
      '<button onclick="filtrarBibliotecaModulo(\'' + esc(m.key) + '\')"><b>' + esc(m.icon) + ' ' + m.n + '</b><span>' + esc(m.label) + '</span></button>'
    ).join('') + '</div>';
  }

  function card(f, i) {
    const key = moduleKey(f);
    const photo = coverPhoto(f);
    return '<article class="library-card library-cover-card" onclick="verFichaBiblioteca(' + i + ')" aria-label="Abrir ' + esc(f.nombre) + '">' +
      (photo ? '<img src="' + esc(photo) + '" alt="' + esc(f.nombre) + '" loading="lazy">' : '<div class="library-no-photo">' + esc(MODULES.find(m => m.key === key)?.icon || '□') + '</div>') +
      '<span class="library-cover-title">' + esc(moduleLabel(key)) + ' · ' + esc(f.nombre) + '</span>' +
      '</article>';
  }

  window.renderBibliotecaLista = function(list, modulo) {
    installStyles();
    const cont = document.getElementById('bibliotecaResultados');
    if (!cont) return;
    const filtered = modulo ? list.filter(f => moduleKey(f) === modulo) : list;
    window.__bibliotecaListaActual = list;
    window.__bibliotecaVistaActual = filtered;
    cont.innerHTML = modulesHtml(list) +
      '<div class="library-section-title"><h3>' + esc(modulo ? moduleLabel(modulo) : 'Fichas disponibles') + '</h3><p class="small">' + filtered.length + ' fichas encontradas.</p></div>' +
      (filtered.length ? '<div class="library-grid">' + filtered.map(card).join('') + '</div>' : msg('No encontre fichas con esa busqueda o modulo.'));
  };

  const previousVer = window.verFichaBiblioteca;
  window.verFichaBiblioteca = function(i) {
    const f = (window.__bibliotecaVistaActual || [])[i];
    if (!f) return;
    const key = moduleKey(f);
    if (isAnimalModule(key) && previousVer) return previousVer(i);
    const photo = speciesPhoto(f);
    window.S('<section class="panel library-detail"><button onclick="biblioteca()">← Volver</button>' +
      (photo ? '<img class="library-detail-photo" src="' + esc(photo) + '" alt="' + esc(f.nombre) + '">' : '') +
      '<p class="small">' + esc(moduleLabel(key)) + '</p><h2>' + esc(f.nombre) + '</h2>' +
      (f.cientifico ? '<p class="scientific">' + esc(f.cientifico) + '</p>' : '') +
      '<p>' + esc(summary(f) || 'Ficha pendiente de ampliar.') + '</p>' +
      '<div class="quick-actions">' + (!isAnimalModule(key) ? '<button onclick="guardarFichaInventario(' + i + ')"><span>▤</span>Guardar ficha completa</button>' : '') + '</div>' +
      '</section>');
  };

  window.__ACUARIONEXO_LIBRARY_PHOTO_ROLES__ = BUILD;
})();
