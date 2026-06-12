/* AcuarioNexo · Seguro animales biblioteca */
(function() {
  const BUILD = 'library-animal-guard-v1';

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

  function nav(active) {
    const item = (id, label, icon, fn) => '<button class="' + (active === id ? 'active' : '') + '" onclick="' + fn + '"><span>' + icon + '</span><small>' + label + '</small></button>';
    return '<div style="height:140px"></div><nav class="bottom-nav">' +
      item('inicio', 'Inicio', '⌂', 'dashboard()') +
      item('acuarios', 'Acuarios', '▣', 'dashboard()') +
      item('biblioteca', 'Biblioteca', '□', 'biblioteca()') +
      item('avisos', 'Avisos', '♢', 'tareas()') +
      item('microfauna', 'Microfauna', '∞', 'microfauna()') +
    '</nav>';
  }

  function render(html) {
    if (window.S) window.S(html + nav('biblioteca'));
  }

  function normalizeFicha(row) {
    const raw = row?.raw || row || {};
    return {
      raw,
      nombre: row?.nombre || raw.title || raw.nombre || raw.nombre_comun || raw.common_name || raw.scientific_name || 'Ficha sin nombre',
      cientifico: row?.cientifico || raw.scientific_name || raw.nombre_cientifico || '',
      categoria: row?.categoria || raw.category || raw.source_category || raw.tipo || raw.tipo_ficha || 'other',
      foto: row?.foto || raw.photo_url || raw.foto_url || raw.foto || raw.imagen || raw.image_url || '',
      descripcion: row?.descripcion || raw.description || raw.descripcion || raw.resumen || raw.notes || ''
    };
  }

  function isAnimalFicha(f) {
    const x = normalizeFicha(f);
    const text = clean([x.categoria, x.raw?.source_category, x.nombre, x.cientifico, x.descripcion].filter(Boolean).join(' '));
    if (/medic|medicine|tratamiento|producto|product|sal\b|salt|aditivo|alimento|equip|equipment|skimmer|bomba|filtro|luz/.test(text)) return false;
    return /fish|pez|peces|marino|fresh|dulce|coral|invert|gamba|camaron|caracol|cangrejo|crust|molus|planta|plant|alga|microfauna|copep|rotifer|artemia/.test(text);
  }

  function label(f) {
    const x = normalizeFicha(f);
    const text = clean([x.categoria, x.raw?.source_category, x.nombre, x.descripcion].filter(Boolean).join(' '));
    if (/coral/.test(text)) return 'Corales';
    if (/invert|gamba|camaron|caracol|cangrejo|crust|molus/.test(text)) return 'Invertebrados';
    if (/planta|plant|alga/.test(text)) return 'Plantas y algas';
    if (/microfauna|copep|rotifer|artemia/.test(text)) return 'Microfauna';
    if (/fresh|dulce/.test(text)) return 'Peces de agua dulce';
    return 'Peces marinos';
  }

  function sectionBody(f) {
    const x = normalizeFicha(f);
    const fields = [
      ['Resumen rapido', x.descripcion],
      ['Compatibilidad', x.raw?.compatibility],
      ['Alimentacion', x.raw?.feeding || x.raw?.diet],
      ['Parametros', typeof x.raw?.parameters === 'object' ? JSON.stringify(x.raw.parameters) : x.raw?.parameters],
      ['Reef safe', x.raw?.reef_safe],
      ['Fuentes', x.raw?.references_text || x.raw?.source_url]
    ].filter(([, body]) => String(body || '').trim());
    return fields.map(([title, body], idx) => '<details class="library-detail-section" ' + (idx === 0 ? 'open' : '') + '><summary>' + esc(title) + '</summary><p>' + esc(body).replaceAll('\n', '<br>') + '</p></details>').join('');
  }

  const previousGuardar = window.guardarFichaInventario;
  window.guardarFichaInventario = async function(i) {
    const f = (window.__bibliotecaVistaActual || [])[i];
    if (f && isAnimalFicha(f)) {
      alert('Las fichas de animales no van al inventario. Abre un acuario y añadelas en Animales.');
      return;
    }
    return previousGuardar ? previousGuardar(i) : undefined;
  };

  const previousVer = window.verFichaBiblioteca;
  window.verFichaBiblioteca = function(i) {
    const f = (window.__bibliotecaVistaActual || [])[i];
    if (!f || !isAnimalFicha(f)) return previousVer ? previousVer(i) : undefined;
    const x = normalizeFicha(f);
    const action = window.q?.id
      ? '<button onclick="importarAnimalBiblioteca(window.__bibliotecaVistaActual[' + i + '].raw || window.__bibliotecaVistaActual[' + i + '])"><span>＋</span>Añadir a ' + esc(window.q.name || 'este acuario') + '</button>'
      : '<button onclick="dashboard()"><span>▣</span>Abrir un acuario para añadir</button>';
    render('<section class="panel library-detail"><button onclick="biblioteca()">← Volver</button>' +
      (x.foto ? '<img class="library-detail-photo" src="' + esc(x.foto) + '" alt="' + esc(x.nombre) + '">' : '') +
      '<p class="small">' + esc(label(f)) + ' · Se guarda por acuario</p>' +
      '<h2>' + esc(x.nombre) + '</h2>' +
      (x.cientifico ? '<p class="scientific">' + esc(x.cientifico) + '</p>' : '') +
      '<div class="quick-actions">' + action + '</div>' +
      msg('Esta ficha no se guarda en Inventario. Se añade al apartado Animales del acuario que tengas abierto.', 'notice') +
      sectionBody(f) +
    '</section>');
  };

  window.__ACUARIONEXO_LIBRARY_ANIMAL_GUARD__ = BUILD;
})();
