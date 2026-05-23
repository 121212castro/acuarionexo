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
    'Parámetros':['🧪','Parámetros','Control y evolución de los valores del agua. Entra en un acuario para registrar mediciones reales.'],
    'Animales':['🐟','Animales','Animales guardados por acuario. Entra en un acuario para ver, añadir o editar peces, corales e invertebrados.'],
    'Fotos':['📷','Fotos','Galería y seguimiento visual por acuario.'],
    'Hospital':['🏥','Hospital','Control de cuarentena, síntomas, tratamientos y evolución.'],
    'Equipamiento':['🔌','Equipamiento','Bombas, luces, skimmer, garantías, compras y mantenimiento.'],
    'ICP':['🧬','ICP','Análisis ICP, tendencias y comparativas.'],
    'IA':['🧠','IA','Resumen, avisos y recomendaciones inteligentes.'],
    'Biblioteca':['📚','Biblioteca','Peces, corales, invertebrados, enfermedades, sales, medicamentos, alimentos y guías.'],
    'Microfauna':['🦠','Microfauna','Fitoplancton, copépodos, rotíferos, artemia, infusorios y cultivos.'],
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

  function cachedAcuarios(){
    try{return JSON.parse(localStorage.getItem('acuarionexo_dashboard_aqs')||'[]')}catch(e){return []}
  }
  function saveCachedAcuarios(aqs){
    try{localStorage.setItem('acuarionexo_dashboard_aqs',JSON.stringify((aqs||[]).slice(0,6)))}catch(e){}
  }
  function aquariumCards(aqs){
    return aqs&&aqs.length?aqs.map(a=>`<article class="aqua-card" onclick="openA('${a.id}')"><div class="aqua-photo">🌊</div><h3>${E(a.name)}</h3><p>${E(a.aquarium_type||'')}</p><span>${E(a.real_liters??a.liters??'-')} L</span><em>Todo estable</em></article>`).join(''):`<article class="aqua-card"><div class="aqua-photo">🌊</div><h3>Cargando...</h3><p>Supabase</p><span>...</span><em>Un momento</em></article>`;
  }
  function renderDashboard(aqs,loading){
    const reef=(aqs&&aqs[0])||{name:'AcuarioNexo',real_liters:'-',aquarium_type:'reef'};
    S(topNav('Dashboard')+`
      <section class="hero-premium"><div><p>IA · Resumen general</p><h2>${E(reef.name||'AcuarioNexo')}</h2><span>Conectado a Supabase · sistema activo${loading?' · cargando datos...':''}</span></div><button onclick="hardRefreshAcuarioNexo&&hardRefreshAcuarioNexo()">↻</button></section>
      <section class="quick-grid"><article><small>Temperatura</small><b>--</b><em>Sin cargar</em></article><article><small>Salinidad</small><b>--</b><em>Sin cargar</em></article><article><small>KH</small><b>--</b><em>Sin cargar</em></article><article><small>Alertas</small><b>--</b><em>Sin cargar</em></article></section>
      <section class="premium-block"><div class="block-head"><h2>Mis acuarios</h2><button onclick="goSection('Acuarios')">Ver todos</button></div><div id="dashboardAcuarios" class="aquarium-row">${aquariumCards(aqs||[])}</div></section>
      <section class="dashboard-grid"><article><h3>🧪 Parámetros</h3><p>Acceso rápido al control del agua.</p><button onclick="goSection('Parámetros')">Abrir</button></article><article><h3>🐟 Animales</h3><p>Inventario vivo por acuario.</p><button onclick="goSection('Animales')">Abrir</button></article><article><h3>📚 Biblioteca</h3><p>Fichas generales y guías.</p><button onclick="goSection('Biblioteca')">Abrir</button></article><article><h3>🦠 Microfauna</h3><p>Cultivos y alimentación viva.</p><button onclick="goSection('Microfauna')">Abrir</button></article></section>`+bottomNav());
  }
  function dashboard(){
    setActive('Dashboard');
    const cached=cachedAcuarios();
    renderDashboard(cached,true);
    if(!window.s||!window.u||!window.u.id)return;
    setTimeout(async function(){
      try{
        const {data:aqs=[]}=await window.s.from('aquariums').select('id,name,aquarium_type,real_liters,liters,created_at').eq('user_id',window.u.id).order('created_at',{ascending:false}).limit(6);
        saveCachedAcuarios(aqs||[]);
        if(getActive()==='Dashboard') renderDashboard(aqs||[],false);
      }catch(e){
        const el=document.getElementById('dashboardAcuarios');
        if(el)el.innerHTML='<article class="aqua-card"><div class="aqua-photo">⚠️</div><h3>No cargó</h3><p>'+E(e.message||'Error')+'</p><span>Dashboard</span><em>Reintentar</em></article>';
      }
    },20);
  }

  function section(nombre){
    setActive(nombre);
    const t=textos[nombre]||['📌',nombre,'Apartado de AcuarioNexo.'];
    S(topNav(nombre)+`<section class="premium-block"><h2>${t[0]} ${E(t[1])}</h2><p>${E(t[2])}</p><div class="dashboard-grid"><article><h3>Trabajar con datos reales</h3><p>Para registrar datos concretos, abre primero el acuario correspondiente.</p><button onclick="goSection('Acuarios')">Ir a Acuarios</button></article><article><h3>Ubicación actual</h3><p>Estás en: ${E(nombre)}</p><button onclick="goSection('Dashboard')">Volver al inicio</button></article></div></section>`+bottomNav());
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