window.AcuarioNexoNavigation={version:'navigation-clean-23-05'};
(function(){
  function active(name){
    window.acuarionexoActiveNav=name;
    localStorage.setItem('acuarionexo_active_nav',name);
  }
  function bottom(){
    return '<nav class="bottom-nav">'
      +'<button onclick="goSection(\'Dashboard\')">🏠<small>Inicio</small></button>'
      +'<button onclick="goSection(\'Acuarios\')">🐠<small>Acuarios</small></button>'
      +'<button onclick="goSection(\'Microfauna\')">🦠<small>Microfauna</small></button>'
      +'<button onclick="goSection(\'Inventario\')">📦<small>Inventario</small></button>'
      +'<button onclick="goSection(\'IA\')">🧠<small>IA</small></button>'
      +'</nav>';
  }
  function top(name){
    active(name);
    return window.menu ? window.menu() : '';
  }
  function render(name,html){
    var app=document.getElementById('app');
    if(!app) return;
    app.innerHTML=top(name)+html+bottom();
    scrollTo(0,0);
    setTimeout(function(){
      var el=document.querySelector('.premium-scroll .nav-active');
      if(el) el.scrollIntoView({inline:'center',block:'nearest'});
    },80);
  }
  window.AcuarioNexoNavigation.active=active;
  window.AcuarioNexoNavigation.bottom=bottom;
  window.AcuarioNexoNavigation.top=top;
  window.AcuarioNexoNavigation.render=render;
})();
