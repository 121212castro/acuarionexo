window.AcuarioNexoLoaderClean={version:'loader-clean-23-05'};
(function(){
  var files=['version-engine.js','cache-engine.js','state-engine.js','navigation-engine.js','fichas-engine.js','crop-visual-engine.js','product-crop-engine.js','ai-engine.js','gemini-engine.js','inventario-engine.js','microfauna-engine.js','parameters-engine.js','nav-visual-fix.js'];
  for(var i=0;i<files.length;i++){
    var s=document.createElement('script');
    s.src=files[i]+'?v=loader-clean-23-05';
    document.body.appendChild(s);
  }
})();
