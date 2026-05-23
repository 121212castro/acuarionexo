window.AcuarioNexoPerformance={version:'performance-23-05'};
(function(){
  function bottom(){return '<nav class="bottom-nav"><button onclick="goSection(\'Dashboard\')">🏠<small>Inicio</small></button><button onclick="goSection(\'Acuarios\')">🐠<small>Acuarios</small></button><button onclick="goSection(\'Acuarios\')">＋<small>Añadir</small></button><button onclick="goSection(\'Timeline\')">🕒<small>Timeline</small></button><button onclick="goSection(\'IA\')">🧠<small>IA</small></button></nav>'}
  function top(){window.acuarionexoActiveNav='Dashboard';localStorage.setItem('acuarionexo_active_nav','Dashboard');return window.menu?window.menu():''}
  function renderFastDashboard(){
    var app=document.getElementById('app');if(!app)return;
    app.innerHTML=top()+'<section class="hero-premium"><div><p>IA · Resumen general</p><h2>AcuarioNexo</h2><span>Cargando datos reales...</span></div><button onclick="hardRefreshAcuarioNexo&&hardRefreshAcuarioNexo()">↻</button></section><section class="quick-grid"><article><small>Temperatura</small><b>-</b><em>Cargando</em></article><article><small>Salinidad</small><b>-</b><em>Cargando</em></article><article><small>KH</small><b>-</b><em>Cargando</em></article><article><small>Alertas</small><b>-</b><em>Cargando</em></article></section><section class="premium-block"><div class="block-head"><h2>Mis acuarios</h2><button onclick="goSection(\'Acuarios\')">Ver todos</button></div><p class="notice">Cargando acuarios...</p></section>'+bottom();
    setTimeout(function(){if(window.dashboardOriginalPremium)window.dashboardOriginalPremium()},60);
  }
  if(window.dashboard&&!window.dashboardOriginalPremium){window.dashboardOriginalPremium=window.dashboard}
  if(window.home&&!window.homeOriginalPremium){window.homeOriginalPremium=window.home}
  window.dashboard=renderFastDashboard;
  window.home=renderFastDashboard;
  var old=window.goSection;
  window.goSection=function(n){if(n==='Dashboard')return renderFastDashboard();return old?old(n):null};
})();
