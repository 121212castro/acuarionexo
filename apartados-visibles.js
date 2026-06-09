/* AcuarioNexo · apartados visibles
   Recupera pantallas vacías con módulos navegables sin tocar el núcleo. */
(function(){
  function byId(id){ return document.getElementById(id); }
  function escapeHtml(x){ return String(x ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function notice(t,k='notice'){ return `<div class="${k}">${escapeHtml(t)}</div>`; }
  function render(html){ if (typeof window.S === 'function') return window.S(html); const app = byId('app'); if(app) app.innerHTML = html; }
  function shell(body, active){
    const item = (id,label,icon,fn) => `<button class="${active===id?'active':''}" onclick="${fn}"><span>${icon}</span><small>${label}</small></button>`;
    render(body + '<div style="height:140px"></div>' + `<nav class="bottom-nav">${item('inicio','Inicio','⌂','dashboard()')}${item('acuarios','Acuarios','▣','dashboard()')}${item('biblioteca','Biblioteca','□','biblioteca()')}${item('avisos','Avisos','♢','tareas()')}${item('microfauna','Microfauna','∞','microfauna()')}</nav>`);
  }
  const modulosBiblioteca = [
    ['fish_marine','Peces marinos','Fichas de peces marinos, comportamiento, alimentación y compatibilidad.','🐠'],
    ['fish_freshwater','Peces de agua dulce','Fichas de dulce por especie/variedad, sin grupos mezclados.','🐟'],
    ['coral','Corales','SPS, LPS, blandos, ubicación, luz, flujo y cuidados.','🪸'],
    ['invertebrate','Invertebrados','Gambas, caracoles, cangrejos, estrellas y otros invertebrados.','🦐'],
    ['plant','Plantas y algas','Plantas de dulce, macroalgas y algas útiles o problemáticas.','🌿'],
    ['microfauna','Microfauna','Copépodos, rotíferos, artemia, fitoplancton e infusorios.','∞'],
    ['medicamento','Medicamentos','Tratamientos, cuarentena, dosis y observaciones.','💊'],
    ['producto','Productos y sales','Sales, aditivos, tests, alimentos y consumibles.','🧂'],
    ['equipo','Equipamiento','Bombas, luces, skimmer, filtros, calentadores y material técnico.','⚙️']
  ];
  function moduleCard(m){ return `<article class="item" onclick="bibliotecaModulo('${m[0]}')"><div style="font-size:34px;margin-bottom:8px">${m[3]}</div><b>${escapeHtml(m[1])}</b><p class="small">${escapeHtml(m[2])}</p><button>Entrar</button></article>`; }
  async function fetchLibraryRows(modulo, q){
    const s = window.s;
    if(!s) return [];
    const rows = [];
    try{
      let req = s.from('library_entries').select('*').limit(50);
      if(q) req = req.or(`title.ilike.%${q}%,scientific_name.ilike.%${q}%`);
      const r = await req;
      if(!r.error && r.data) rows.push(...r.data);
    }catch(e){}
    try{
      let req2 = s.from('biblioteca_fichas').select('*').limit(50);
      if(q) req2 = req2.or(`nombre.ilike.%${q}%,nombre_cientifico.ilike.%${q}%`);
      const r2 = await req2;
      if(!r2.error && r2.data) rows.push(...r2.data);
    }catch(e){}
    return rows.map(x => ({
      nombre: x.title || x.nombre || x.nombre_comun || x.common_name || x.nombre_cientifico || 'Ficha sin nombre',
      cientifico: x.scientific_name || x.nombre_cientifico || '',
      tipo: x.category || x.tipo || x.tipo_ficha || '',
      foto: x.photo_url || x.foto_url || x.foto || x.imagen || x.image_url || '',
      descripcion: x.description || x.descripcion || x.descripcion_detallada || ''
    }));
  }
  function fichaCard(x){ return `<article class="item">${x.foto ? `<img src="${escapeHtml(x.foto)}" style="width:100%;max-height:170px;object-fit:cover;border-radius:14px;margin-bottom:8px">` : ''}<b>${escapeHtml(x.nombre)}</b>${x.cientifico ? `<p><i>${escapeHtml(x.cientifico)}</i></p>` : ''}${x.tipo ? `<p class="small">${escapeHtml(x.tipo)}</p>` : ''}${x.descripcion ? `<p>${escapeHtml(x.descripcion).slice(0,240)}</p>` : ''}</article>`; }
  window.biblioteca = function(){
    shell(`<section class="panel"><h2>Biblioteca</h2><p>Fichas generales separadas por módulos.</p><label>Buscar en biblioteca</label><input id="busquedaBiblioteca" placeholder="Ej. Gramma, payaso, euphyllia, sal..."><button class="primary" onclick="buscarBibliotecaGeneral()">Buscar</button></section><section class="panel"><div class="panel-head"><h2>Módulos</h2></div><div class="form-grid">${modulosBiblioteca.map(moduleCard).join('')}</div></section>`, 'biblioteca');
  };
  window.buscarBibliotecaGeneral = async function(){
    const q = (byId('busquedaBiblioteca')?.value || '').trim();
    shell(`<section class="panel"><button onclick="biblioteca()">← Volver</button><h2>Resultados biblioteca</h2>${notice('Buscando...')}</section>`, 'biblioteca');
    const data = await fetchLibraryRows('', q);
    shell(`<section class="panel"><button onclick="biblioteca()">← Volver</button><h2>Resultados biblioteca</h2><p class="small">${data.length} fichas encontradas.</p>${data.length ? data.map(fichaCard).join('') : notice('No aparecen fichas en las tablas actuales.')}</section>`, 'biblioteca');
  };
  window.bibliotecaModulo = async function(modulo){
    const m = modulosBiblioteca.find(x => x[0] === modulo) || [modulo, modulo, '', '□'];
    shell(`<section class="panel"><button onclick="biblioteca()">← Volver</button><h2>${escapeHtml(m[1])}</h2>${notice('Cargando fichas...')}</section>`, 'biblioteca');
    const data = await fetchLibraryRows(modulo, '');
    shell(`<section class="panel"><button onclick="biblioteca()">← Volver</button><h2>${escapeHtml(m[1])}</h2><p class="small">${escapeHtml(m[2])}</p>${data.length ? data.map(fichaCard).join('') : notice('Módulo visible, pero sin fichas recuperadas de Supabase.')}</section>`, 'biblioteca');
  };
  window.tareas = function(){ shell(`<section class="panel"><h2>Avisos</h2><p>Tareas, alertas y recordatorios.</p><div class="form-grid"><article class="item"><b>Mediciones</b><p class="small">Avisos por parámetros fuera de rango.</p></article><article class="item"><b>Mantenimiento</b><p class="small">Cambios de agua, limpieza, skimmer y filtros.</p></article><article class="item"><b>Animales</b><p class="small">Cuarentena, alimentación y seguimiento.</p></article></div></section>`, 'avisos'); };
  window.microfauna = function(){ shell(`<section class="panel"><h2>Microfauna</h2><p>Cultivos vivos separados por módulo.</p><div class="form-grid"><article class="item"><b>Fitoplancton</b><p class="small">Nannochloropsis, luz, salinidad y cosechas.</p></article><article class="item"><b>Copépodos</b><p class="small">Densidad, alimentación y reproducción.</p></article><article class="item"><b>Rotíferos</b><p class="small">Cultivo, cosecha y mantenimiento.</p></article><article class="item"><b>Artemia</b><p class="small">Eclosión, enriquecimiento y uso.</p></article></div></section>`, 'microfauna'); };
})();
