window.AcuarioNexoDashboardHomeAquariums={version:'dashboard-home-aquariums-24-05-data-safe-compact-schema'};
(function(){
  function esc(x){return String(x??'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]})}
  function app(){return document.getElementById('app')}
  function setActive(n){try{localStorage.setItem('acuarionexo_active_nav',n)}catch(e){} window.acuarionexoActiveNav=n}
  function getActive(){return window.acuarionexoActiveNav||localStorage.getItem('acuarionexo_active_nav')||'Dashboard'}
  function kind(a){var t=String([a&&a.aquarium_type,a&&a.subtype,a&&a.name].join(' ')).toLowerCase();return /fresh|dulce|betta|beta|escala|plant|comunitario/.test(t)?'fresh':'marine'}
  function litros(a){var l=a&&((a.real_liters!=null&&a.real_liters!=='')?a.real_liters:a.liters);return l?esc(l)+' L':'Litros pendientes'}
  function tipo(a){return kind(a)==='fresh'?'Dulce / Plantado':'Marino / Reef'}
  function cover(a){var url=a&&(a.cover_photo_url||a.photo_url||a.image_url||a.main_photo_url||'');return url?'style="background-image:linear-gradient(180deg,rgba(4,14,26,.04),rgba(4,14,26,.74)),url(\''+esc(url)+'\')"':''}
  function topNav(active){
    active=active||getActive();
    var tabs=[['🏠','Dashboard','nav-dashboard'],['🐠','Acuarios','nav-acuarios'],['🧪','Parámetros','nav-parametros'],['🐟','Animales','nav-animales'],['📷','Fotos','nav-fotos'],['🏥','Hospital','nav-hospital'],['🔌','Equipamiento','nav-equipamiento'],['🧬','ICP','nav-icp'],['🧠','IA','nav-ia'],['📚','Biblioteca','nav-biblioteca'],['🦠','Microfauna','nav-microfauna'],['📦','Inventario','nav-inventario']];
    return '<section class="premium-nav acn-compact-nav"><div class="premium-scroll">'+tabs.map(function(t){return '<button class="'+t[2]+' '+(active===t[1]?'nav-active':'')+'" onclick="goSection(\''+t[1]+'\')"><span>'+t[0]+'</span><small>'+t[1]+'</small></button>'}).join('')+'</div></section>'
  }
  function bottomNav(){return '<nav class="bottom-nav"><button onclick="goSection(\'Dashboard\')">🏠<small>Inicio</small></button><button onclick="goSection(\'Dashboard\')">🐠<small>Acuarios</small></button><button onclick="formA()">＋<small>Añadir</small></button><button onclick="goSection(\'Timeline\')">🕒<small>Timeline</small></button><button onclick="goSection(\'IA\')">🧠<small>IA</small></button></nav>'}
  function cards(aqs){
    if(!aqs||!aqs.length)return '<article class="dashboard-empty"><h3>🐠 Sin acuarios visibles</h3><p>No se han podido cargar los acuarios guardados en esta sesión.</p><button class="primary" onclick="dashboard()">↻ Reintentar</button></article>';
    return aqs.map(function(a){var k=kind(a);return '<article class="home-aqua-card" onclick="openA(\''+a.id+'\')"><div class="home-aqua-cover dashboard-cover-'+k+'" '+cover(a)+'><span>'+(k==='fresh'?'🌿':'🪸')+'</span></div><div class="home-aqua-info"><h3>'+esc(a.name||'Acuario')+'</h3><p>'+esc(tipo(a))+' · '+litros(a)+'</p><em>Entrar</em></div></article>'}).join('')
  }
  function saveCache(aqs){try{localStorage.setItem('acuarionexo_dashboard_aqs',JSON.stringify((aqs||[]).slice(0,40)))}catch(e){}}
  function cached(){try{return JSON.parse(localStorage.getItem('acuarionexo_dashboard_aqs')||'[]')}catch(e){return []}}
  function render(aqs,loading){
    setActive('Dashboard');
    var h=topNav('Dashboard')+'<section class="home-aquariums-hero"><div class="home-hero-head"><div><p class="dashboard-hero-kicker">Página principal</p><h2>Mis acuarios</h2><span>'+(loading?'Cargando acuarios guardados...':'Toca una tarjeta para entrar directamente en el acuario.')+'</span></div><button class="primary" onclick="formA()">+ Nuevo</button></div><div class="home-aquariums-grid">'+cards(aqs||[])+'</div></section><section class="dashboard-ai-card compact-ai"><h3>🧠 Resumen global</h3><p>'+(aqs&&aqs.length?'Tienes '+aqs.length+' acuarios cargados. Desde aquí entras directamente en cada ficha para parámetros, animales, fotos e historial.':'Cuando se carguen acuarios, aparecerán aquí con foto y acceso directo.')+'</p></section>'+bottomNav();
    app().innerHTML=h;window.scrollTo(0,0)
  }
  async function fetchAquariumsSafe(){
    if(!window.s)return [];
    var columns='id,name,aquarium_type,subtype,real_liters,liters,cover_photo_url,created_at,user_id';
    if(window.u&&window.u.id){
      var owned=await window.s.from('aquariums').select(columns).eq('user_id',window.u.id).order('created_at',{ascending:false});
      if(owned.error)throw owned.error;
      if((owned.data||[]).length)return owned.data||[];
    }
    var visible=await window.s.from('aquariums').select(columns).order('created_at',{ascending:false}).limit(40);
    if(visible.error)throw visible.error;
    return visible.data||[];
  }
  async function dashboard(){
    render(cached(),true);
    try{var aqs=await fetchAquariumsSafe();saveCache(aqs);render(aqs,false)}catch(e){render(cached(),false)}
  }
  function style(){
    if(document.getElementById('homeAquaStyle'))return;
    var st=document.createElement('style');st.id='homeAquaStyle';st.textContent='\n      .topbar{padding-top:calc(10px + env(safe-area-inset-top))!important;padding-bottom:7px!important;gap:8px!important}.brand-logo{width:42px!important;height:42px!important;font-size:25px!important}.topbar h1{font-size:29px!important}.topbar p{font-size:12px!important;margin-top:2px!important}.top-actions{gap:8px!important}.ghost{min-width:58px!important;padding:8px 8px!important;border-radius:16px!important}.ghost small{font-size:10px!important}.connection-pill{font-size:12px!important}.acn-compact-nav{margin:6px 0 10px!important;padding:8px 0!important}.acn-compact-nav .premium-scroll{gap:9px!important}.acn-compact-nav .premium-scroll button{width:78px!important;min-width:78px!important;min-height:62px!important;border-radius:18px!important;padding:8px 6px!important}.acn-compact-nav .premium-scroll span{font-size:24px!important}.acn-compact-nav .premium-scroll small{font-size:11px!important}.home-aquariums-hero{border:1px solid var(--line);border-radius:22px;margin:10px 0;padding:12px;background:radial-gradient(circle at 15% 0,rgba(27,154,230,.24),transparent 34%),linear-gradient(180deg,rgba(14,43,71,.98),rgba(7,25,45,.98));box-shadow:0 12px 24px rgba(0,0,0,.20)}.home-hero-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}.home-hero-head h2{font-size:30px;margin:3px 0;color:#fff}.home-hero-head span{color:#c9deef;font-size:15px;line-height:1.3}.home-hero-head button{width:auto;white-space:nowrap;padding:10px 14px!important}.home-aquariums-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.home-aqua-card{min-height:196px;border-radius:20px;overflow:hidden;border:1px solid rgba(150,210,255,.24);background:linear-gradient(180deg,#123858,#081d33);box-shadow:0 10px 18px rgba(0,0,0,.16);cursor:pointer}.home-aqua-cover{height:104px;background-size:cover;background-position:center;display:grid;place-items:center;font-size:42px;position:relative}.home-aqua-cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55))}.home-aqua-cover span{position:relative;z-index:2}.home-aqua-info{padding:10px 11px 12px}.home-aqua-info h3{font-size:21px;margin:0 0 5px}.home-aqua-info p{margin:0 0 8px;color:#c5d8e8;font-size:13px;line-height:1.25}.home-aqua-info em{display:inline-flex;border-radius:999px;background:rgba(34,197,94,.16);color:#99f6c4;padding:6px 10px;font-style:normal;font-weight:900}.dashboard-empty{padding:14px!important}.dashboard-empty h3{font-size:24px!important}.compact-ai{padding:12px!important;border-radius:20px!important}.compact-ai h3{font-size:19px!important}.compact-ai p{font-size:14px!important;margin-bottom:0!important}@media(max-width:760px){.home-aquariums-grid{grid-template-columns:1fr}.home-aqua-card{min-height:188px}.home-aqua-cover{height:96px}}@media(max-width:430px){.topbar{padding-top:calc(8px + env(safe-area-inset-top))!important}.brand-logo{display:none!important}.topbar h1{font-size:28px!important}.home-hero-head{display:block}.home-hero-head button{margin-top:9px;width:100%;padding:10px!important}.home-aqua-info h3{font-size:20px}.acn-compact-nav .premium-scroll button{width:74px!important;min-width:74px!important;min-height:58px!important}.acn-compact-nav .premium-scroll span{font-size:22px!important}.acn-compact-nav .premium-scroll small{font-size:10px!important}.bottom-nav button{min-height:56px!important}}\n    ';document.head.appendChild(st)
  }
  function install(){
    style();
    window.dashboard=dashboard;window.home=dashboard;
    var oldGo=window.goSection;
    window.goSection=function(n){if(n==='Dashboard'||n==='Acuarios')return dashboard();if(typeof oldGo==='function')return oldGo(n)};
    setTimeout(function(){if(getActive()==='Dashboard'||getActive()==='Acuarios')dashboard()},80)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();