window.AcuarioNexoLoaderClean={version:'loader-clean-24-05-dashboard-home'};
(function(){
  var build='loader-clean-24-05-dashboard-home-'+Date.now();
  var files=['version-engine.js','cache-engine.js','state-engine.js','navigation-engine.js','fichas-engine.js','ai-engine.js','gemini-engine.js','inventario-engine.js','microfauna-engine.js','parameters-engine.js','admin-engine.js','studio-gemini-engine.js','nav-visual-fix.js','dashboard-home-aquariums.js'];
  for(var i=0;i<files.length;i++){
    if(!files[i]) continue;
    var s=document.createElement('script');
    s.src=files[i]+'?v='+build;
    document.body.appendChild(s);
  }
})();
