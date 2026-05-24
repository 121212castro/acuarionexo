window.AcuarioNexoNavVisualFix={version:'nav-sync-minimal-24-05'};
(function(){
  function activeName(){return window.acuarionexoActiveNav||localStorage.getItem('acuarionexo_active_nav')||'Dashboard'}
  function fix(){
    var active=activeName();
    var buttons=document.querySelectorAll('.bottom-nav button,.premium-scroll button');
    for(var i=0;i<buttons.length;i++){
      var b=buttons[i];
      var txt=(b.innerText||'').toLowerCase();
      b.classList.remove('bottom-active','nav-active','active');
      if((active==='Dashboard'&&(txt.indexOf('inicio')>=0||txt.indexOf('dashboard')>=0))||(active==='Acuarios'&&txt.indexOf('acuarios')>=0)||(active==='Parámetros'&&txt.indexOf('parámetros')>=0)||(active==='Animales'&&txt.indexOf('animales')>=0)||(active==='Fotos'&&txt.indexOf('fotos')>=0)||(active==='Avisos'&&txt.indexOf('avisos')>=0)||(active==='Admin'&&txt.indexOf('admin')>=0)){
        if(b.closest('.bottom-nav')) b.classList.add('bottom-active','active');
        else b.classList.add('nav-active','active');
      }
    }
  }
  new MutationObserver(fix).observe(document.body,{childList:true,subtree:true});
  setTimeout(fix,100);
  setTimeout(fix,700);
})();