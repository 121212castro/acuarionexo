/* AcuarioNexo · Biblioteca router por modulo real */
(function() {
  const BUILD = 'library-router-v2';
  const MODULES = [
    { key: 'fish_marine', label: 'Peces marinos', desc: 'Fichas de peces marinos, comportamiento, alimentacion y compatibilidad.', icon: '🐠' },
    { key: 'fish_freshwater', label: 'Peces de agua dulce', desc: 'Fichas de dulce por especie y variedad.', icon: '🐟' },
    { key: 'coral', label: 'Corales', desc: 'SPS, LPS, blandos, ubicacion, luz, flujo y cuidados.', icon: '🪸' },
    { key: 'invertebrate', label: 'Invertebrados', desc: 'Gambas, caracoles, cangrejos, estrellas y otros invertebrados.', icon: '🦐' },
    { key: 'plant', label: 'Plantas y algas', desc: 'Plantas de dulce, macroalgas y algas utiles o problematicas.', icon: '🌿' },
    { key: 'microfauna', label: 'Microfauna', desc: 'Copepodos, rotiferos, artemia, fitoplancton e infusorios.', icon: '∞' },
    { key: 'medicine', label: 'Medicamentos', desc: 'Tratamientos, cuarentena, dosis y observaciones.', icon: '💊' },
    { key: 'product', label: 'Productos y sales', desc: 'Sales, aditivos, tests, alimentos y consumibles.', icon: '🧂' },
    { key: 'equipment', label: 'Equipamiento', desc: 'Bombas, luces, skimmer, filtros, calentadores y material tecnico.', icon: '⚙️' }
  ];

  function esc(x) {
    return (window.E ? window.E(x) : String(x ?? '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    }));
  }

  function msg(t, k) {
    return window.M ? window.M(t, k) : '<div class="' + (k || 'notice') + '">' + esc(t) + '</div>';
  }

  function val(id) {
    return (document.getElementById(id)?.value || '').trim();
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

  function clean(x) {
    return String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function norm(row) {
    return {
      id: row.id || '',
      nombre: row.title || row.nombre || row.nombre_comun || row.common_name || row.scientific_name || 'Ficha sin nombre',
      cientifico: row.scientific_name || row.nombre_cientifico || '',
      categoria: row.category || row.source_category || row.tipo || row.tipo_ficha || 'other',
      source_category: row.source_category || '',
      foto: row.photo_url || row.foto_url || row.foto || row.imagen || row.image_url || '',
      descripcion: row.description || row.descripcion || row.resumen || row.notes || '',
      raw: row
    };
  }

  function moduleKey(f) {
    const k = clean([f.categoria, f.source_category, f.raw?.category, f.raw?.source_category].filter(Boolean).join(' '));
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

  async function data(text) {
    let q = window.s.from('library_entries').select('*').limit(120);
    if (text) q = q.or('title.ilike.%' + text + '%,scientific_name.ilike.%' + text + '%,description.ilike.%' + text + '%');
    const r = await q;
    if (r.error) throw r.error;
    return (r.data || []).map(norm);
  }

  function modulesHtml(list) {
    const mods = MODULES.map(m => ({ ...m, n: list.filter(f => moduleKey(f) === m.key).length })).filter(m => m.n > 0);
    return '<div class="library-modules">' + mods.map(m =>
      '<button onclick="filtrarBibliotecaModulo(\'' + esc(m.key) + '\')"><b>' + esc(m.icon) + ' ' + m.n + '</b><span>' + esc(m.label) + '</span><small>' + esc(m.desc) + '</small></button>'
    ).join('') + '</div>';
  }

  function summary(f) {
    return String(f.descripcion || f.raw?.summary || f.raw?.resumen || '').trim();
  }

  function card(f, i) {
    const key = moduleKey(f);
    const addAnimal = window.q && isAnimalModule(key)
      ? '<button onclick="event.stopPropagation();importarAnimalBiblioteca(window.__bibliotecaVistaActual[' + i + '].raw)">Añadir a ' + esc(window.q.name || 'mi acuario') + '</button>'
      : '';
    const inv = !isAnimalModule(key)
      ? '<button onclick="event.stopPropagation();guardarFichaInventario(' + i + ')">Guardar en inventario</button>'
      : '';
    const text = summary(f);
    return '<article class="library-card" onclick="verFichaBiblioteca(' + i + ')">' +
      (f.foto ? '<img src="' + esc(f.foto) + '" alt="' + esc(f.nombre) + '" loading="lazy">' : '<div class="library-no-photo">' + esc(MODULES.find(m => m.key === key)?.icon || '□') + '</div>') +
      '<div class="library-card-body"><small>' + esc(moduleLabel(key)) + '</small><h3>' + esc(f.nombre) + '</h3>' +
      (f.cientifico ? '<p class="scientific">' + esc(f.cientifico) + '</p>' : '') +
      (text ? '<p>' + esc(text).slice(0, 180) + (text.length > 180 ? '…' : '') + '</p>' : '') +
      addAnimal + inv + '</div></article>';
  }

  window.renderBibliotecaLista = function(list, modulo) {
    const cont = document.getElementById('bibliotecaResultados');
    if (!cont) return;
    const filtered = modulo ? list.filter(f => moduleKey(f) === modulo) : list;
    window.__bibliotecaListaActual = list;
    window.__bibliotecaVistaActual = filtered;
    cont.innerHTML = modulesHtml(list) +
      '<div class="library-section-title"><h3>' + esc(modulo ? moduleLabel(modulo) : 'Fichas disponibles') + '</h3><p class="small">' + filtered.length + ' fichas encontradas.</p></div>' +
      (filtered.length ? '<div class="library-grid">' + filtered.map(card).join('') + '</div>' : msg('No encontre fichas con esa busqueda o modulo.'));
  };

  window.filtrarBibliotecaModulo = function(modulo) {
    window.renderBibliotecaLista(window.__bibliotecaListaActual || [], modulo);
  };

  window.buscarBibliotecaReal = async function() {
    const cont = document.getElementById('bibliotecaResultados');
    if (cont) cont.innerHTML = msg('Cargando biblioteca desde Supabase...');
    try {
      window.renderBibliotecaLista(await data(val('bibliotecaSearch')), null);
    } catch (e) {
      if (cont) cont.innerHTML = msg(e.message, 'error');
    }
  };

  window.biblioteca = async function() {
    render('<section class="panel library-panel"><div class="panel-head"><div><h2>Biblioteca</h2><p class="small">Fichas reales guardadas en Supabase, separadas por modulos.</p></div></div><div class="library-search"><input id="bibliotecaSearch" placeholder="Buscar pez, coral, invertebrado, producto..."><button class="primary" onclick="buscarBibliotecaReal()">Buscar</button></div><div id="bibliotecaResultados">' + msg('Cargando biblioteca desde Supabase...') + '</div></section>');
    await window.buscarBibliotecaReal();
  };

  window.guardarFichaInventario = async function(i) {
    const f = (window.__bibliotecaVistaActual || [])[i];
    if (!f) return;
    try {
      if (!window.u) throw new Error('Debes iniciar sesion.');
      const key = moduleKey(f);
      const row = {
        user_id: window.u.id,
        name: f.nombre,
        brand: f.cientifico || null,
        category: key === 'medicine' ? 'Medicamento' : key === 'equipment' ? 'Equipo' : 'Producto',
        quantity: 1,
        unit: 'unidad',
        min_stock: 0,
        notes: f.descripcion || '',
        ai_review_status: 'manual'
      };
      const r = await window.s.from('inventory_items').insert(row);
      if (r.error) throw r.error;
      alert('Guardado en inventario');
    } catch (e) {
      alert(e.message);
    }
  };

  window.verFichaBiblioteca = function(i) {
    const f = (window.__bibliotecaVistaActual || [])[i];
    if (!f) return;
    const key = moduleKey(f);
    render('<section class="panel library-detail"><button onclick="biblioteca()">← Volver</button>' +
      (f.foto ? '<img class="library-detail-photo" src="' + esc(f.foto) + '" alt="' + esc(f.nombre) + '">' : '') +
      '<p class="small">' + esc(moduleLabel(key)) + '</p><h2>' + esc(f.nombre) + '</h2>' +
      (f.cientifico ? '<p class="scientific">' + esc(f.cientifico) + '</p>' : '') +
      '<p>' + esc(summary(f) || 'Ficha pendiente de ampliar.') + '</p>' +
      '<div class="quick-actions">' + (!isAnimalModule(key) ? '<button onclick="guardarFichaInventario(' + i + ')"><span>▤</span>Guardar en inventario</button>' : '') + '</div>' +
      '</section>');
  };

  window.__ACUARIONEXO_LIBRARY_ROUTER__ = BUILD;
})();
