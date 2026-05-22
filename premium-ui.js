/* AcuarioNexo · portada premium real · nav activa estable */
(function(){
  const E=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const S=h=>{document.getElementById('app').innerHTML=h;scrollTo(0,0)};
  const setActive=n=>{try{localStorage.setItem('acuarionexo_active_nav',n)}catch(e){};window.acuarionexoActiveNav=n};
  const getActive=()=>window.acuarionexoActiveNav||localStorage.getItem('acuarionexo_active_nav')||'Dashboard';

  function topNav(active){
    active=active||getActive();
    const mods=[
      ['🏠','Dashboard','goDashboard()','nav-dashboard'],
      ['🐠','Acuarios','goAcuarios()','nav-acuarios'],
      ['🧪','Parámetros','goModulo("Parámetros")','nav-parametros'],
      ['🐟','Animales','goModulo("Animales")','nav-animales'],
      ['📷','Fotos','goModulo("Fotos")','nav-fotos'],
      ['🏥','Hospital','goModulo("Hospital")','nav-hospital'],
      ['🔌','Equipamiento','goModulo("Equipamiento")','nav-equipamiento'],
      ['🧬','ICP','goModulo("ICP")','nav-icp'],
      ['🧠','IA','goModulo("IA")','nav-ia'],
      ['📚','Biblioteca','goBiblioteca()','nav-biblioteca'],
      ['🦠','Microfauna','goMicrofauna()','nav-microfauna'],
      ['📦','Inventario','goInventario()','nav-inventario']
    ];
    return `<section class="premium-nav"><div class="premium-scroll">${mods.map(m=>`<button class="${m[3]} ${active===m[1]?'nav-active':''}" onclick="${m[2]}"><span>${m[0]}</span><small>${m[1]}</small></button>`).join('')}</div></section>`;
  }

  function bottomNav(){
    return `<nav class="bottom-nav"><button onclick="goDashboard()">🏠<small>Inicio</small></button><button onclick="goAcuarios()">🐠<small>Acuarios</small></button><button onclick="goAcuarios()">＋<small>Añadir</small></button><button onclick="goModulo('Timeline')">🕒<small>Timeline</small></button><button onclick="goModulo('IA')">🧠<small>IA</small></button></nav>`;
  }

  function moduloPantalla(nombre){
    setActive(nombre);
    const textos={
      'Parámetros':['🧪','Parámetros','Control y evolución de los valores del agua. Entra en un acuario para registrar mediciones reales.'],
      'Animales':['🐟','Animales','Animales guardados por acuario. Entra en un acuario para ver, añadir o editar peces, corales e invertebrados.'],
      'Fotos':['📷','Fotos','Galería y seguimiento visual por acuario.'],
      'Hospital':['🏥','Hospital','Control de cuarentena, síntomas, tratamientos y evolución.'],
      'Equipamiento':['🔌','Equipamiento','Bombas, luces, skimmer, garantías, compras y mantenimiento.'],
      'ICP':['🧬','ICP','Análisis ICP, tendencias y comparativas.'],
      'IA':['🧠','IA','Resumen, avisos y recomendaciones inteligentes.'],
      'Timeline':['🕒','Timeline','Actividad reciente, tareas y cambios importantes.']
    };
    const t=textos[nombre]||['📌',nombre,'Apartado de AcuarioNexo.'];
    S(topNav(nombre)+`<section class="premium-block"><h2>${t[0]} ${E(t[1])}</h2><p class="notice">${E(t[2])}</p><div class="dashboard-grid"><article><h3>Abrir acuario</h3><p>Para trabajar con datos reales, abre primero un acuario.</p><button onclick="goAcuarios()">Ir a Acuarios</button></article><article><h3>Estado</h3><p>Sección seleccionada: ${E(nombre)}</p><button onclick="goDashboard()">Volver al Dashboard</button></article></div></section>`+bottomNav());
  }

  async function premiumHome(){
    setActive('Dashboard');
    const {data:aqs=[]}=await window.s.from('aquariums').select('*').eq('user_id',window.u.id).order('created_at',{ascending:false}).limit(6);
    const reef=aqs[0]||{name:'Reef Castro',real_liters:'307',aquarium_type:'Marino'};
    S(topNav('Dashboard')+`
      <section class="hero-premium">
        <div><p>IA · Resumen general</p><h2>${E(reef.name||'AcuarioNexo')}</h2><span>Conectado a Supabase · sistema activo</span></div>
        <button onclick="hardRefreshAcuarioNexo&&hardRefreshAcuarioNexo()">↻</button>
      </section>
      <section class="quick-grid"><article><small>Temperatura</small><b>25.3°C</b><em>Estable</em></article><article><small>Salinidad</small><b>1.025</b><em>Correcta</em></article><article><small>KH</small><b>8.1</b><em>Vigilar</em></article><article><small>Alertas</small><b>2</b><em>Pendientes</em></article></section>
      <section class="premium-block"><div class="block-head"><h2>Mis acuarios</h2><button onclick="goAcuarios()">Ver todos</button></div><div class="aquarium-row">${aqs.length?aqs.map(a=>`<article class="aqua-card" onclick="openA('${a.id}')"><div class="aqua-photo">🌊</div><h3>${E(a.name)}</h3><p>${E(a.aquarium_type||'')}</p><span>${E(a.real_liters??a.liters??'-')} L</span><em>Todo estable</em></article>`).join(''):`<article class="aqua-card"><div class="aqua-photo">🌊</div><h3>Reef Castro</h3><p>Marino/Reef</p><span>307 L</span><em>Todo estable</em></article>`}</div></section>
      <section class="dashboard-grid"><article><h3>🧪 Parámetros críticos</h3><p>PO4 y KH en seguimiento.</p><button onclick="goModulo('Parámetros')">Abrir</button></article><article><h3>📋 Tareas hoy</h3><p>Cambio de agua · limpiar skimmer.</p><button onclick="tareas()">Abrir</button></article><article><h3>📷 Últimas fotos</h3><p>Galería visual por acuario.</p><button onclick="goModulo('Fotos')">Abrir</button></article><article><h3>🧠 IA recomendación</h3><p>Revisar tendencia de nutrientes.</p><button onclick="goModulo('IA')">Abrir</button></article></section>`+bottomNav());
  }

  const originalAcs=window.acs;
  const originalBiblioteca=window.biblioteca;
  const originalMicrofauna=window.microfauna;
  const originalInventario=window.inventario;

  window.menu=()=>topNav(getActive());
  window.goDashboard=()=>premiumHome();
  window.goModulo=nombre=>moduloPantalla(nombre);
  window.goAcuarios=async()=>{setActive('Acuarios'); if(typeof originalAcs==='function') return originalAcs();};
  window.goBiblioteca=()=>{setActive('Biblioteca'); if(typeof originalBiblioteca==='function') return originalBiblioteca(); moduloPantalla('Biblioteca')};
  window.goMicrofauna=()=>{setActive('Microfauna'); if(typeof originalMicrofauna==='function') return originalMicrofauna(); moduloPantalla('Microfauna')};
  window.goInventario=()=>{setActive('Inventario'); if(typeof originalInventario==='function') return originalInventario(); moduloPantalla('Inventario')};

  window.acs=window.goAcuarios;
  window.biblioteca=window.goBiblioteca;
  window.microfauna=window.goMicrofauna;
  window.inventario=window.goInventario;
  window.home=premiumHome;
  window.dashboard=premiumHome;

  if(window.u) premiumHome();
})();