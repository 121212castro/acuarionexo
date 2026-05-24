/* AcuarioNexo · navegación premium limpia y estable */
(function(){
  const E=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const app=()=>document.getElementById('app');
  const S=h=>{app().innerHTML=h;scrollTo(0,0);setTimeout(scrollActiveTab,60)};
  const setActive=n=>{try{localStorage.setItem('acuarionexo_active_nav',n)}catch(e){} window.acuarionexoActiveNav=n};
  const getActive=()=>window.acuarionexoActiveNav||localStorage.getItem('acuarionexo_active_nav')||'Dashboard';
  const aquariumColumns='id,name,aquarium_type,subtype,real_liters,liters,cover_photo_url,created_at,user_id';

  const tabs=[
    ['🏠','Dashboard','nav-dashboard'],['🐠','Acuarios','nav-acuarios'],['🧪','Parámetros','nav-parametros'],['🐟','Animales','nav-animales'],
    ['📷','Fotos','nav-fotos'],['🏥','Hospital','nav-hospital'],['🔌','Equipamiento','nav-equipamiento'],['🧬','ICP','nav-icp'],
    ['🧠','IA','nav-ia'],['📚','Biblioteca','nav-biblioteca'],['🦠','Microfauna','nav-microfauna'],['📦','Inventario','nav-inventario']
  ];

  const textos={
    'Parámetros':['🧪','Parámetros','Resumen global de parámetros. Para registrar o editar mediciones, abre primero el acuario correspondiente.'],
    'Animales':['🐟','Animales','Resumen global de animales. Las fichas completas quedan guardadas dentro de cada acuario.'],
    'Fotos':['📷','Fotos','Resumen visual global. Las galerías completas quedan guardadas dentro de cada acuario.'],
    'Hospital':['🏥','Hospital','Resumen global de hospital, cuarentena, síntomas y tratamientos.'],
    'Equipamiento':['🔌','Equipamiento','Resumen global de equipos, garantías, compras y mantenimiento.'],
    'ICP':['🧬','ICP','Resumen global de análisis ICP y avisos.'],
    'IA':['🧠','IA','Resumen y recomendaciones inteligentes.'],
    'Biblioteca':['📚','Biblioteca','Fichas generales y guías.'],
    'Microfauna':['🦠','Microfauna','Cultivos y alimentación viva.'],
    'Inventario':['📦','Inventario','Stock, comida, sales, medicación, repuestos, compras, garantías y facturas.'],
    'Timeline':['🕒','Timeline','Actividad reciente, tareas y cambios importantes.']
  };

  function scrollActiveTab(){
    const btn=document.querySelector('.premium-scroll .nav-active');
    if(btn) btn.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
  }

  function topNav(active){
    active=active||getActive();
    return `<section class="premium-nav"><div class="premium-scroll">${tabs.map(t=>`<button class="${t[2]} ${active===t[1]?'nav-active':''}" onclick="goSection('${t[1]}')"><span>${t[0]}</span><small>${t[1]}</small></button>`).join('')}</div></section>`;
  }

  function bottomNav(){
    return `<nav class="bottom-nav"><button onclick="goSection('Dashboard')">🏠<small>Inicio</small></button><button onclick="goSection('Acuarios')">🐠<small>Acuarios</small></button><button onclick="formA()">＋<small>Añadir</small></button><button onclick="goSection('Timeline')">🕒<small>Timeline</small></button><button onclick="goSection('IA')">🧠<small>IA</small></button></nav>`;
  }

  function cachedAcuarios(){try{return JSON.parse(localStorage.getItem('acuarionexo_dashboard_aqs')||'[]')}catch(e){return []}}
  function saveCachedAcuarios(aqs){try{localStorage.setItem('acuarionexo_dashboard_aqs',JSON.stringify((aqs||[]).slice(0,12)))}catch(e){}}

  async function fetchAquariumsSafe(limit){
    if(!window.s) return [];
    let query=window.s.from('aquariums').select(aquariumColumns).order('created_at',{ascending:false});
    if(limit) query=query.limit(limit);
    if(window.u&&window.u.id){
      const owned=await window.s.from('aquariums').select(aquariumColumns).eq('user_id',window.u.id).order('created_at',{ascending:false});
      if(owned.error) throw owned.error;
      if((owned.data||[]).length) return limit?(owned.data||[]).slice(0,limit):(owned.data||[]);
    }
    const visible=await query;
    if(visible.error) throw visible.error;
    return visible.data||[];
  }

  function aquariumKind(a){
    const t=String([a?.aquarium_type,a?.subtype,a?.name].join(' ')).toLowerCase();
    if(t.includes('fresh')||t.includes('dulce')||t.includes('betta')||t.includes('beta')||t.includes('escala')||t.includes('plant')) return 'fresh';
    return 'marine';
  }

  function coverStyle(a){
    const url=a?.cover_photo_url||'';
    if(url){
      return `style="background-image:linear-gradient(180deg,rgba(4,14,26,.06),rgba(4,14,26,.72)),url('${E(url)}')"`;
    }
    return '';
  }

  function tipoTexto(a){
    return aquariumKind(a)==='fresh'?'Dulce / Plantado':'Marino / Reef';
  }

  function litrosTexto(a){
    const l=a?.real_liters??a?.liters;
    return l?`${E(l)} L`:'Litros no definidos';
  }

  function aquariumCards(aqs){
    if(!aqs||!aqs.length){
      return `<article class="dashboard-empty"><h3>🐠 Sin acuarios visibles</h3><p>No se pudieron cargar los acuarios guardados.</p><button class="primary" onclick="goSection('Dashboard')">Reintentar</button></article>`;
    }

    return aqs.map(a=>{
      const kind=aquariumKind(a);
      return `<article class="dashboard-aqua-card" onclick="openA('${a.id}')"><div class="dashboard-aqua-cover dashboard-cover-${kind}" ${coverStyle(a)}><span>${kind==='fresh'?'🌿':'🪸'}</span></div><div class="dashboard-aqua-body"><h3>${E(a.name||'Acuario')}</h3><div class="dashboard-aqua-meta"><span>${E(tipoTexto(a))}</span><span>${litrosTexto(a)}</span></div><div class="dashboard-aqua-open">Abrir acuario</div></div></article>`;
    }).join('');
  }

  function aquariumListCards(aqs){
    if(!aqs||!aqs.length){
      return `<div class="dashboard-empty"><h3>🐠 Todavía no hay acuarios visibles</h3><p>Pulsa “Reintentar” para volver a sincronizar.</p><button class="primary" onclick="goSection('Acuarios')">Reintentar</button></div>`;
    }

    return `<div class="aquarium-premium-list">${aqs.map(a=>{
      const kind=aquariumKind(a);
      return `<article class="aquarium-premium-item"><div class="dashboard-aqua-cover dashboard-cover-${kind}" ${coverStyle(a)}><span>${kind==='fresh'?'🌿':'🪸'}</span></div><div class="aquarium-premium-info" onclick="openA('${a.id}')"><h3>${E(a.name||'Acuario')}</h3><p>${E(tipoTexto(a))} · ${litrosTexto(a)}</p><button class="primary">Abrir acuario</button></div><div class="aquarium-premium-actions"><button onclick="editA('${a.id}')">Editar</button><button class="danger" onclick="deleteA('${a.id}')">Borrar</button></div></article>`;
    }).join('')}</div>`;
  }

  function renderDashboard(aqs,loading){
    S(topNav('Dashboard')+`
      <section class="dashboard-hero-main">
        <div class="dashboard-hero-head">
          <div>
            <p class="dashboard-hero-kicker">Dashboard premium · AcuarioNexo</p>
            <h2>Mis acuarios</h2>
            <span>${loading?'Sincronizando datos desde Supabase...':'Acceso rápido a todos tus acuarios, parámetros, animales y estado general.'}</span>
          </div>
          <div class="dashboard-hero-actions">
            <button onclick="goSection('Acuarios')">🐠 Ver acuarios</button>
            <button onclick="hardRefreshAcuarioNexo&&hardRefreshAcuarioNexo()">↻ Actualizar</button>
          </div>
        </div>
        <div class="dashboard-aquarium-row">${aquariumCards(aqs||[])}</div>
      </section>

      <section class="dashboard-ai-card">
        <h3>🧠 Resumen IA global</h3>
        <p>${aqs&&aqs.length?`Sistema estable con ${aqs.length} acuarios cargados. Dashboard preparado para parámetros, avisos inteligentes, consumo, seguimiento visual y automatización.`:'Pulsa reintentar si no aparecen tus acuarios guardados.'}</p>
        <div class="dashboard-ai-pills"><span>Supabase conectado</span><span>Dashboard limpio</span><span>Navegación rápida</span><span>Acceso directo a ficha</span></div>
      </section>

      <section class="dashboard-utility-grid">
        <article><h3>🧪 Parámetros</h3><p>Lecturas, gráficas, tendencias y estado general por acuario.</p><button onclick="goSection('Parámetros')">Abrir parámetros</button></article>
        <article><h3>🐟 Animales</h3><p>Inventario vivo, seguimiento y estado de peces, corales e invertebrados.</p><button onclick="goSection('Animales')">Abrir animales</button></article>
        <article><h3>📚 Biblioteca</h3><p>Biblioteca técnica, fichas, guías y conocimiento integrado.</p><button onclick="goSection('Biblioteca')">Abrir biblioteca</button></article>
      </section>`+bottomNav());
  }

  function dashboard(){
    setActive('Dashboard');
    const cached=cachedAcuarios();
    renderDashboard(cached,true);
    setTimeout(async function(){
      try{
        const aqs=await fetchAquariumsSafe(12);
        saveCachedAcuarios(aqs||[]);
        if(getActive()==='Dashboard') renderDashboard(aqs||[],false);
      }catch(e){if(getActive()==='Dashboard') renderDashboard(cachedAcuarios(),false)}
    },20);
  }

  async function acuarioList(){
    setActive('Acuarios');
    const cached=cachedAcuarios();
    renderAcuarios(cached,true);
    try{
      const aqs=await fetchAquariumsSafe();
      saveCachedAcuarios(aqs||[]);
      if(getActive()==='Acuarios') renderAcuarios(aqs||[],false);
    }catch(e){
      S(topNav('Acuarios')+`<section class="premium-block"><h2>Acuarios</h2><div class="error">${E(e.message||'No se pudieron cargar los acuarios')}</div></section>`+bottomNav());
    }
  }

  function renderAcuarios(aqs,loading){
    S(topNav('Acuarios')+`
      <section class="premium-block aquariums-premium-screen">
        <div class="block-head"><div><p class="dashboard-hero-kicker">Gestión de acuarios</p><h2>Mis acuarios</h2><p>${loading?'Cargando acuarios...':'Abre directamente una ficha o crea un acuario nuevo.'}</p></div><button class="primary" onclick="formA()">+ Nuevo</button></div>
        ${aquariumListCards(aqs||[])}
      </section>`+bottomNav());
  }

  function section(nombre){
    setActive(nombre);
    const t=textos[nombre]||['📌',nombre,'Apartado de AcuarioNexo.'];
    const aqs=cachedAcuarios();
    S(topNav(nombre)+`<section class="premium-block"><h2>${t[0]} ${E(t[1])}</h2><p>${E(t[2])}</p><div class="dashboard-utility-grid"><article><h3>Acuarios activos</h3><p>${aqs.length||0} acuarios cargados y listos para trabajar.</p><button onclick="goSection('Acuarios')">Abrir acuarios</button></article><article><h3>Vista global</h3><p>Resumen general sin duplicar toda la información interna de cada ficha.</p><button onclick="goSection('Dashboard')">Volver al Dashboard</button></article><article><h3>Datos completos</h3><p>Las fichas completas siguen dentro de cada acuario.</p><button onclick="goSection('Acuarios')">Abrir ficha</button></article></div></section>`+bottomNav());
  }

  window.menu=()=>topNav(getActive());
  window.goSection=function(nombre){if(nombre==='Dashboard')return dashboard();if(nombre==='Acuarios')return acuarioList();return section(nombre)};
  window.home=dashboard;
  window.dashboard=dashboard;
  window.acs=acuarioList;
  window.biblioteca=()=>section('Biblioteca');
  window.microfauna=()=>section('Microfauna');
  window.inventario=()=>section('Inventario');

  if(window.u) dashboard();
})();