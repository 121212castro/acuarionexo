window.AcuarioNexoLoaderClean={version:'loader-clean-23-05-openai-v2'};
(function(){
  var build='loader-clean-23-05-openai-v2-'+Date.now();
  var files=['version-engine.js','cache-engine.js','state-engine.js','navigation-engine.js','fichas-engine.js','crop-visual-engine.js','product-crop-engine.js','ai-engine.js','gemini-engine.js','inventario-engine.js','microfauna-engine.js','parameters-engine.js',,
             'admin-engine.js','nav-visual-fix.js'];
  for(var i=0;i<files.length;i++){
    var s=document.createElement('script');
    s.src=files[i]+'?v='+build;
    document.body.appendChild(s);
  }
})();
