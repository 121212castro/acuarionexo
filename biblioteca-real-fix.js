/* AcuarioNexo · Biblioteca real desde Supabase
   Corrige la pantalla vacía de Biblioteca y muestra fichas reales con buscador y módulos.
*/
(function () {
  var MODULOS = [
    { key: 'fish_marine', label: 'Peces marinos', desc: 'Fichas de peces marinos, comportamiento, alimentacion y compatibilidad.', icon: '🐠', grupo: 'Peces' },
    { key: 'fish_freshwater', label: 'Peces de agua dulce', desc: 'Fichas de dulce por especie y variedad.', icon: '🐟', grupo: 'Peces' },
    { key: 'coral', label: 'Corales', desc: 'SPS, LPS, blandos, ubicacion, luz, flujo y cuidados.', icon: '🪸', grupo: 'Corales' },
    { key: 'invertebrate', label: 'Invertebrados', desc: 'Gambas, caracoles, cangrejos, estrellas y otros invertebrados.', icon: '🦐', grupo: 'Invertebrados' },
    { key: 'plant', label: 'Plantas y algas', desc: 'Plantas de dulce, macroalgas y algas utiles o problematicas.', icon: '🌿', grupo: 'Plantas y algas' },
    { key: 'microfauna', label: 'Microfauna', desc: 'Copepodos, rotiferos, artemia, fitoplancton e infusorios.', icon: '∞', grupo: 'Microfauna' },
    { key: 'medicamento', label: 'Medicamentos', desc: 'Tratamientos, cuarentena, dosis y observaciones.', icon: '💊', grupo: 'Productos y equipo' },
    { key: 'producto', label: 'Productos y sales', desc: 'Sales, aditivos, tests, alimentos y consumibles.', icon: '🧂', grupo: 'Productos y equipo' },
    { key: 'equipo', label: 'Equipamiento', desc: 'Bombas, luces, skimmer, filtros, calentadores y material tecnico.', icon: '⚙️', grupo: 'Productos y equipo' }
  ];

  function byId(id) { return document.getElementById(id); }
  function safe(x) {
    return String(x ?? '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
    });
  }

  function normalizaFicha(x) {
    var nombre = x.title || x.nombre || x.nombre_comun || x.common_name || x.nombre_cientifico || x.scientific_name || 'Ficha sin nombre';
    var cientifico = x.scientific_name || x.nombre_cientifico || x.scientific || '';
    var categoria = x.category || x.tipo || x.tipo_ficha || x.grupo || x.seccion || 'general';
    var foto = x.photo_url || x.foto_url || x.foto || x.imagen || x.image_url || x.url_foto || '';
    var descripcion = x.description || x.descripcion || x.descripcion_detallada || x.resumen || x.notes || '';
    return {
      id: x.id || x.slug || nombre,
      nombre: nombre,
      cientifico: cientifico,
      categoria: categoria,
      foto: foto,
      descripcion: descripcion,
      raw: x
    };
  }

  function etiquetaCategoria(c) {
    var k = String(c || '').toLowerCase();
    if (k.includes('coral')) return 'Corales';
    if (k.includes('fish') || k.includes('pez') || k.includes('peces') || k.includes('marino') || k.includes('dulce')) return 'Peces';
    if (k.includes('invert') || k.includes('crust') || k.includes('molus')) return 'Invertebrados';
    if (k.includes('plant') || k.includes('alga')) return 'Plantas y algas';
    if (k.includes('micro')) return 'Microfauna';
    if (k.includes('product') || k.includes('producto') || k.includes('sal') || k.includes('equip') || k.includes('medic') || k.includes('test') || k.includes('alimento')) return 'Productos y equipo';
    return 'General';
  }

  async function consultaTabla(nombreTabla, texto) {
    var supa = window.s;
    if (!supa) return [];
    try {
      var q = supa.from(nombreTabla).select('*').limit(60);
      if (texto) {
        if (nombreTabla === 'biblioteca_fichas') {
          q = q.or('nombre.ilike.%' + texto + '%,nombre_cientifico.ilike.%' + texto + '%,descripcion.ilike.%' + texto + '%');
        } else {
          q = q.or('title.ilike.%' + texto + '%,scientific_name.ilike.%' + texto + '%,description.ilike.%' + texto + '%');
        }
      }
      var r = await q;
      if (r.error || !Array.isArray(r.data)) return [];
      return r.data.map(normalizaFicha);
    } catch (e) {
      return [];
    }
  }

  async function cargarBiblioteca(texto) {
    var a = await consultaTabla('biblioteca_fichas', texto);
    var b = await consultaTabla('library_entries', texto);
    var map = new Map();
    a.concat(b).forEach(function (f) {
      var key = (f.nombre + '|' + f.cientifico).toLowerCase();
      if (!map.has(key)) map.set(key, f);
    });
    return Array.from(map.values());
  }

  function tarjetaFicha(f) {
    return '<article class="library-card">' +
      (f.foto ? '<img src="' + safe(f.foto) + '" alt="' + safe(f.nombre) + '" loading="lazy">' : '<div class="library-no-photo">🐠</div>') +
      '<div class="library-card-body">' +
        '<small>' + safe(etiquetaCategoria(f.categoria)) + '</small>' +
        '<h3>' + safe(f.nombre) + '</h3>' +
        (f.cientifico ? '<p class="scientific">' + safe(f.cientifico) + '</p>' : '') +
        (f.descripcion ? '<p>' + safe(f.descripcion).slice(0, 180) + (String(f.descripcion).length > 180 ? '…' : '') + '</p>' : '') +
        (window.q ? '<button onclick="importarAnimalBiblioteca(' + safe(JSON.stringify(f.raw)) + ')">Añadir a ' + safe(window.q.name || 'mi acuario') + '</button>' : '') +
      '</div>' +
    '</article>';
  }

  function moduleCount(lista, modulo) {
    return lista.filter(function (f) { return etiquetaCategoria(f.categoria) === modulo.grupo; }).length;
  }

  function resumenModulos(lista) {
    return '<div class="library-modules">' + MODULOS.map(function (m) {
      var n = moduleCount(lista, m);
      return '<button onclick="filtrarBibliotecaModulo(\'' + safe(m.grupo) + '\')"><b>' + safe(m.icon) + ' ' + n + '</b><span>' + safe(m.label) + '</span><small>' + safe(m.desc) + '</small></button>';
    }).join('') + '</div>';
  }

  window.renderBibliotecaLista = function (lista, modulo) {
    var cont = byId('bibliotecaResultados');
    if (!cont) return;
    var filtrada = modulo ? lista.filter(function (f) { return etiquetaCategoria(f.categoria) === modulo; }) : lista;
    window.__bibliotecaListaActual = lista;
    var titulo = modulo ? '<h3>' + safe(modulo) + '</h3>' : '<h3>Fichas disponibles</h3>';
    cont.innerHTML = resumenModulos(lista) +
      '<div class="library-section-title">' + titulo + '<p class="small">' + filtrada.length + ' fichas encontradas.</p></div>' +
      (filtrada.length
        ? '<div class="library-grid">' + filtrada.map(tarjetaFicha).join('') + '</div>'
        : '<div class="notice">No encontré fichas con esa búsqueda o módulo.</div>');
  };

  window.filtrarBibliotecaModulo = function (modulo) {
    window.renderBibliotecaLista(window.__bibliotecaListaActual || [], modulo);
  };

  window.buscarBibliotecaReal = async function () {
    var texto = (byId('bibliotecaSearch')?.value || '').trim();
    var cont = byId('bibliotecaResultados');
    if (cont) cont.innerHTML = '<div class="notice">Cargando biblioteca desde Supabase…</div>';
    var lista = await cargarBiblioteca(texto);
    window.renderBibliotecaLista(lista, null);
  };

  window.biblioteca = async function () {
    var html = '<section class="panel library-panel">' +
      '<div class="panel-head"><div><h2>Biblioteca</h2><p class="small">Fichas reales guardadas en Supabase, separadas por módulos.</p></div></div>' +
      '<div class="library-search"><input id="bibliotecaSearch" placeholder="Buscar pez, coral, invertebrado, producto…"><button class="primary" onclick="buscarBibliotecaReal()">Buscar</button></div>' +
      '<div id="bibliotecaResultados"><div class="notice">Cargando biblioteca desde Supabase…</div></div>' +
      '</section>';
    if (typeof window.S === 'function') {
      window.S(html + '<div style="height:140px"></div>' + (typeof bottomNav === 'function' ? bottomNav('biblioteca') : '<nav class="bottom-nav"><button onclick="dashboard()"><span>⌂</span><small>Inicio</small></button><button class="active" onclick="biblioteca()"><span>□</span><small>Biblioteca</small></button></nav>'));
    } else if (window.A) {
      window.A.innerHTML = html;
    }
    await window.buscarBibliotecaReal();
  };

  var css = document.createElement('style');
  css.textContent = '\n.library-search{display:grid;grid-template-columns:1fr auto;gap:10px;margin:14px 0 18px}.library-modules{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 0 16px}.library-modules button{text-align:left;padding:14px;border-radius:18px;min-height:118px}.library-modules b{display:block;font-size:20px}.library-modules span{display:block;font-size:13px;font-weight:800;margin-top:4px}.library-modules small{display:block;font-size:11px;line-height:1.25;opacity:.76;margin-top:5px}.library-section-title{margin:2px 0 12px}.library-section-title h3{margin:0 0 2px}.library-grid{display:grid;grid-template-columns:1fr;gap:14px}.library-card{display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:start;padding:12px;border:1px solid rgba(120,180,255,.22);border-radius:20px;background:rgba(255,255,255,.04)}.library-card img,.library-no-photo{width:96px;height:96px;border-radius:16px;object-fit:cover;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;font-size:34px}.library-card h3{margin:3px 0 2px;font-size:18px}.library-card p{margin:4px 0}.library-card small{opacity:.8}.library-card .scientific{font-style:italic;opacity:.8}@media (min-width:760px){.library-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.library-modules{grid-template-columns:repeat(3,minmax(0,1fr))}}\n';
  document.head.appendChild(css);
})();
