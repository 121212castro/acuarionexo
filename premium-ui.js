/* AcuarioNexo · navegación premium limpia y estable */
(function(){
  const E=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const app=()=>document.getElementById('app');
  const S=h=>{app().innerHTML=h;scrollTo(0,0);setTimeout(scrollActiveTab,60)};
  const setActive=n=>{try{localStorage.setItem('acuarionexo_active_nav',n)}catch(e){} window.acuarionexoActiveNav=n};
  const getActive=()=>window.acuarionexoActiveNav||localStorage.getItem('acuarionexo_active_nav')||'Dashboard';

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
    'IA':['🧠','IA','Resumen, avisos y recomendaciones inteligentes.'],
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
    return `<nav class="bottom-nav"><button onclick="goSection('Dashboard')">🏠<small>Inicio</small></button><button onclick="goSection('Acuarios')">🐠<small>Acuarios</small></button><button onclick="goSection('Acuarios')">＋<small>Añadir</small></button><button onclick="goSection('Timeline')">🕒<small>Timeline</small></button><button onclick="goSection('IA')">🧠<small>IA</small></button></nav>`;
  }

  function cachedAcuarios(){try{return JSON.parse(localStorage.getItem('acuarionexo_dashboard_aqs')||'[]')}catch(e){return []}}
  function saveCachedAcuarios(aqs){try{localStorage.setItem('acuarionexo_dashboard_aqs',JSON.stringify((aqs||[]).slice(0,8)))}catch(e){}}
  function aquariumKind(a){
    const t=String([a?.aquarium_type,a?.subtype,a?.name].join(' ')).toLowerCase();
    if(t.includes('fresh')||t.includes('dulce')||t.includes('betta')||t.includes('beta')||t.includes('escala'))return 'fresh';
    return 'marine';
  }
  function coverStyle(a){
    if(a?.cover_url||a?.photo_url||a?.image_url){return `style="background-image:linear-gradient(180deg,rgba(4,14,26,.12),rgba(4,14,26,.70)),url('${E(a.cover_url||a.photo_url||a.image_url)}')"`}
    return '';
  }
  function aquariumCards(aqs){
    return aqs&&aqs.length?aqs.map(a=>{const kind=aquariumKind(a);return `<article class="aqua-card aqua-${kind}" onclick="openA('${a.id}')"><div class="aqua-photo aqua-cover-${kind}" ${coverStyle(a)}><span>${kind==='fresh'?'🌿':'🪸'}</span></div><h3>${E(a.name)}</h3><p>${E(a.aquarium_type||'')}</p><span>${E(a.real_liters??a.liters??'-')} L</span><em>Tocar para abrir</em></article>`}).join(''):`<article class="aqua-card"><div class="aqua-photo aqua-cover-marine"><span>🌊</span></div><h3>Cargando...</h3><p>Supabase</p><span>...</span><em>Un momento</em></article>`;
  }

  function renderDashboard(aqs,loading){
    const reef=(aqs&&aqs[0])||{name:'AcuarioNexo',real_liters:'-',aquarium_type:'reef'};
    S(topNav('Dashboard')+`
      <section class="hero-premium"><div><p>IA · Resumen general</p><h2>${E(reef.name||'AcuarioNexo')}</h2><span>Conectado a Supabase · sistema activo${loading?' · cargando datos...':''}</span></div><button onclick="hardRefreshAcuarioNexo&&hardRefreshAcuarioNexo()">↻</button></section>
      <section class="quick-grid"><article><small>Acuarios</small><b>${aqs?.length||'--'}</b><em>Activos</em></article><article><small>Parámetros</small><b>↗</b><em>Resumen global</em></article><article><small>Animales</small><b>↗</b><em>Resumen global</em></article><article><small>Alertas</small><b>--</b><em>IA global</em></article></section>
      <section class="premium-block"><div class="block-head"><h2>Mis acuarios</h2><button onclick="goSection('Acuarios')">Ver todos</button></div><div id="dashboardAcuarios" class="aquarium-row">${aquariumCards(aqs||[])}</div></section>
      <section class="dashboard-grid"><article><h3>🧪 Parámetros</h3><p>Últimas lecturas y avisos de todos los acuarios.</p><button onclick="goSection('Parámetros')">Abrir</button></article><article><h3>🐟 Animales</h3><p>Resumen de animales guardados por acuario.</p><button onclick="goSection('Animales')">Abrir</button></article><article><h3>📚 Biblioteca</h3><p>Fichas generales y guías.</p><button onclick="goSection('Biblioteca')">Abrir</button></article><article><h3>🦠 Microfauna</h3><p>Cultivos y alimentación viva.</p><button onclick="goSection('Microfauna')">Abrir</button></article></section>`+bottomNav());
  }

  function dashboard(){
    setActive('Dashboard');
    const cached=cachedAcuarios();
    renderDashboard(cached,true);
    if(!window.s||!window.u||!window.u.id)return;
    setTimeout(async function(){
      try{
        const {data:aqs=[]}=await window.s.from('aquariums').select('id,name,aquarium_type,subtype,real_liters,liters,cover_url,photo_url,image_url,created_at').eq('user_id',window.u.id).order('created_at',{ascending:false}).limit(8);
        saveCachedAcuarios(aqs||[]);
        if(getActive()==='Dashboard') renderDashboard(aqs||[],false);
      }catch(e){}
    },20);
  }

  function section(nombre){
    setActive(nombre);
    const t=textos[nombre]||['📌',nombre,'Apartado de AcuarioNexo.'];
    const aqs=cachedAcuarios();
    S(topNav(nombre)+`<section class="premium-block"><h2>${t[0]} ${E(t[1])}</h2><p>${E(t[2])}</p><section class="quick-grid"><article><small>Acuarios</small><b>${aqs.length||'--'}</b><em>con datos</em></article><article><small>Vista</small><b>Global</b><em>resumen</em></article><article><small>Detalle</small><b>Ficha</b><em>dentro del acuario</em></article><article><small>Estado</small><b>IA</b><em>pendiente</em></article></section><div class="dashboard-grid"><article><h3>Resumen de ${E(nombre)}</h3><p>Aquí se verán algunos datos rápidos de todos los acuarios, sin duplicar toda la información.</p><button onclick="goSection('Acuarios')">Abrir acuario concreto</button></article><article><h3>Datos completos</h3><p>Las entradas completas se guardan dentro del acuario y dentro del apartado correspondiente.</p><button onclick="goSection('Acuarios')">Ir a Acuarios</button></article></div></section>`+bottomNav());
  }

  const oldAcs=window.acs;
  async function acuarioList(){
    setActive('Acuarios');
    if(typeof oldAcs==='function'){
      await oldAcs();
      setTimeout(scrollActiveTab,80);
      return;
    }
    section('Acuarios');
  }

  window.menu=()=>topNav(getActive());
  window.goSection=function(nombre){
    if(nombre==='Dashboard') return dashboard();
    if(nombre==='Acuarios') return acuarioList();
    return section(nombre);
  };
  window.home=dashboard;
  window.dashboard=dashboard;
  window.acs=acuarioList;
  window.biblioteca=()=>section('Biblioteca');
  window.microfauna=()=>section('Microfauna');
  window.inventario=()=>section('Inventario');

  if(window.u) dashboard();
})();