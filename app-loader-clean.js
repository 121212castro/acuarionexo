window.AcuarioNexoLoaderClean={version:'loader-clean-23-05'};
(function(){
  var files=['version-engine.js','cache-engine.js','state-engine.js','navigation-engine.js','fichas-engine.js','ai-engine.js','inventario-engine.js','microfauna-engine.js','parameters-engine.js'];
  for(var i=0;i<files.length;i++){
    var s=document.createElement('script');
    s.src=files[i]+'?v=loader-clean-23-05';
    document.body.appendChild(s);
  }
})();
