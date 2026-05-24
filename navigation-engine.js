/* AcuarioNexo · arranque principal limpio · 25/05 */
(function(){
  function ready(fn){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true});
    else fn();
  }
  async function getSession(){
    const r=await window.s.auth.getSession();
    window.u=r.data.session?.user||null;
    const logout=document.getElementById('logoutBtn');
    if(logout){
      logout.classList.toggle('hidden',!window.u);
      logout.onclick=async()=>{await window.s.auth.signOut();location.replace(location.pathname+'?v='+Date.now())};
    }
    return window.u;
  }
  function card(title,body){
    return `<section class="card"><h2>${window.E(title)}</h2>${body||''}</section>`;
  }
  async function renderDashboard(){
    if(!window.u) return window.login();
    const {data,error}=await window.s.from('aquariums').select('id,name,aquarium_type,subtype,real_liters,liters,description,created_at').eq('user_id',window.u.id).order('created_at',{ascending:false});
    if(error) return window.S(card('Error',window.M(error.message,'error')));
    const acuarios=data||[];
    window.S(`<section class="hero-premium"><div><p>AcuarioNexo</p><h2>Mis acuarios</h2><span>${acuarios.length} acuarios guardados</span></div><button onclick="formA()">+</button></section>
      <section class="premium-block"><div class="block-head"><h2>Acuarios</h2><button onclick="formA()">Nuevo</button></div>
      <div class="aquarium-row">${acuarios.map(a=>`<article class="aqua-card" onclick="openA('${a.id}')"><div class="aqua-photo">${a.aquarium_type==='freshwater'?'🌿':'🐠'}</div><h3>${window.E(a.name)}</h3><p>${window.E(a.aquarium_type||'Acuario')} · ${window.E(a.subtype||'')}</p><span>${window.E(a.real_liters??a.liters??'-')} L</span><em>Abrir</em></article>`).join('')||'<p class="small">Sin acuarios todavía.</p>'}</div></section>
      <section class="dashboard-grid"><article><h3>Parámetros</h3><p>Últimas mediciones por acuario.</p><button onclick="acs()">Ver acuarios</button></article><article><h3>Avisos</h3><p>Tareas y pendientes.</p><button onclick="AcuarioNexoNavigation.safeGo('Avisos')">Abrir</button></article></section>`);
  }
  async function renderAcuarios(){
    if(!window.u) return window.login();
    const {data,error}=await window.s.from('aquariums').select('*').eq('user_id',window.u.id).order('created_at',{ascending:false});
    if(error) return window.S(card('Error',window.M(error.message,'error')));
    window.S(`<section class="card"><h2>Mis acuarios</h2><button class="primary" onclick="formA()">+ Nuevo acuario</button>${(data||[]).map(a=>`<div class="item"><h3>${window.E(a.name)}</h3><p>${window.E(a.aquarium_type)} · ${window.E(a.subtype||'')} · ${window.E(a.real_liters??a.liters??'-')} L</p><div class="grid"><button onclick="openA('${a.id}')">Abrir</button><button onclick="editA('${a.id}')">Editar</button><button class="danger" onclick="deleteA('${a.id}')">Borrar</button></div></div>`).join('')||window.M('Sin acuarios')}</section>`);
  }
  async function safeGo(name){
    const n=String(name||'Dashboard').toLowerCase();
    if(n.includes('acuario')) return renderAcuarios();
    if(n.includes('aviso')&&window.tareas) return window.tareas();
    if(n.includes('biblioteca')&&window.biblioteca) return window.biblioteca();
    if(n.includes('microfauna')&&window.microfauna) return window.microfauna();
    if(n.includes('inventario')&&window.inventario) return window.inventario();
    return renderDashboard();
  }
  async function boot(){
    try{
      await getSession();
      if(window.u) await renderDashboard();
      else window.login();
    }catch(e){
      window.S(card('Error de arranque',window.M(e.message||String(e),'error')));
    }
  }
  window.AcuarioNexoNavigation={safeGo,renderDashboard,renderAcuarios,boot};
  ready(boot);
})();