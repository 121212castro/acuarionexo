window.AcuarioNexoNavVisualFix={version:'nav-visual-fix-23-05'};
(function(){
  function activeName(){return window.acuarionexoActiveNav||localStorage.getItem('acuarionexo_active_nav')||'Dashboard'}
  function fix(){
    var active=activeName();
    var buttons=document.querySelectorAll('.bottom-nav button');
    for(var i=0;i<buttons.length;i++){
      var b=buttons[i];
      b.classList.remove('bottom-active');
      var txt=(b.innerText||'').toLowerCase();
      if((active==='Dashboard'&&txt.indexOf('inicio')>=0)||(active==='Acuarios'&&txt.indexOf('acuarios')>=0)||(active==='Microfauna'&&txt.indexOf('microfauna')>=0)||(active==='Inventario'&&txt.indexOf('inventario')>=0)||(active==='IA'&&txt.indexOf('ia')>=0)){b.classList.add('bottom-active')}
    }
  }
  var st=document.createElement('style');
  st.textContent='.bottom-nav button:first-child{background:rgba(15,43,71,.82)!important}.bottom-nav button.bottom-active{background:linear-gradient(180deg,#0ea5e9,#075985)!important;border-color:#7dd3fc!important;color:#fff!important;box-shadow:0 0 18px rgba(14,165,233,.45)!important}';
  document.head.appendChild(st);
  new MutationObserver(fix).observe(document.body,{childList:true,subtree:true});
  setInterval(fix,500);
  setTimeout(fix,100);
})();
