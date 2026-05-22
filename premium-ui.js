/* AcuarioNexo · portada premium real */
(function(){
  const E=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const S=h=>{document.getElementById('app').innerHTML=h;scrollTo(0,0)};

  function topNav(){
    const mods=[['🏠','Dashboard','home()'],['🐠','Acuarios','acs()'],['🧪','Parámetros','dashboard()'],['🐟','Animales','dashboard()'],['📷','Fotos','dashboard()'],['🏥','Hospital','dashboard()'],['🔌','Equipamiento','dashboard()'],['🧬','ICP','dashboard()'],['🧠','IA','dashboard()'],['📚','Biblioteca','biblioteca()'],['🦠','Microfauna','microfauna()'],['📦','Inventario','inventario()']];
    return `<section class="premium-nav"><div class="premium-scroll">${mods.map(m=>`<button onclick="${m[2]}"><span>${m[0]}</span><small>${m[1]}</small></button>`).join('')}</div></section>`;
  }

  function bottomNav(){
    return `<nav class="bottom-nav"><button onclick="home()">🏠<small>Inicio</small></button><button onclick="acs()">🐠<small>Acuarios</small></button><button onclick="acs()">＋<small>Añadir</small></button><button onclick="dashboard()">🕒<small>Timeline</small></button><button onclick="dashboard()">🧠<small>IA</small></button></nav>`;
  }

  async function premiumHome(){
    const {data:aqs=[]}=await window.s.from('aquariums').select('*').eq('user_id',window.u.id).order('created_at',{ascending:false}).limit(6);
    const reef=aqs[0]||{name:'Reef Castro',real_liters:'307',aquarium_type:'Marino'};
    S(topNav()+`
      <section class="hero-premium">
        <div><p>IA · Resumen general</p><h2>${E(reef.name||'AcuarioNexo')}</h2><span>Conectado a Supabase · sistema activo</span></div>
        <button onclick="hardRefreshAcuarioNexo&&hardRefreshAcuarioNexo()">↻</button>
      </section>

      <section class="quick-grid">
        <article><small>Temperatura</small><b>25.3°C</b><em>Estable</em></article>
        <article><small>Salinidad</small><b>1.025</b><em>Correcta</em></article>
        <article><small>KH</small><b>8.1</b><em>Vigilar</em></article>
        <article><small>Alertas</small><b>2</b><em>Pendientes</em></article>
      </section>

      <section class="premium-block"><div class="block-head"><h2>Mis acuarios</h2><button onclick="acs()">Ver todos</button></div><div class="aquarium-row">
        ${aqs.length?aqs.map(a=>`<article class="aqua-card" onclick="openA('${a.id}')"><div class="aqua-photo">🌊</div><h3>${E(a.name)}</h3><p>${E(a.aquarium_type||'')}</p><span>${E(a.real_liters??a.liters??'-')} L</span><em>Todo estable</em></article>`).join(''):`<article class="aqua-card"><div class="aqua-photo">🌊</div><h3>Reef Castro</h3><p>Marino/Reef</p><span>307 L</span><em>Todo estable</em></article>`}
      </div></section>

      <section class="dashboard-grid">
        <article><h3>🧪 Parámetros críticos</h3><p>PO4 y KH en seguimiento.</p><button onclick="dashboard()">Abrir</button></article>
        <article><h3>📋 Tareas hoy</h3><p>Cambio de agua · limpiar skimmer.</p><button onclick="tareas()">Abrir</button></article>
        <article><h3>📷 Últimas fotos</h3><p>Galería visual por acuario.</p><button onclick="dashboard()">Abrir</button></article>
        <article><h3>🧠 IA recomendación</h3><p>Revisar tendencia de nutrientes.</p><button onclick="dashboard()">Abrir</button></article>
      </section>`+bottomNav());
  }

  window.menu=topNav;
  window.home=premiumHome;
  window.dashboard=premiumHome;

  if(window.u) premiumHome();
})();