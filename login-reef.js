/* AcuarioNexo · login reef V2 */
(function(){
  function isLoginCard(card){
    if(!card) return false;
    var title = card.querySelector('h2');
    return !!(title && /entrar/i.test(title.textContent||'') && card.querySelector('#email') && card.querySelector('#password'));
  }

  function enhanceLogin(){
    var card = document.querySelector('.auth-card');
    var active = isLoginCard(card);
    document.body.classList.toggle('login-reef-active', active);

    var refresh = document.getElementById('refreshAppBtn');
    if(refresh){
      refresh.classList.add('compact-refresh');
      refresh.setAttribute('aria-label','Refrescar app');
      refresh.innerHTML = '↻';
    }

    if(!active) return;
    card.classList.add('login-card');

    var h2 = card.querySelector('h2');
    if(h2 && !card.querySelector('.login-subtitle')){
      var p = document.createElement('p');
      p.className = 'login-subtitle';
      p.textContent = 'Accede a tus acuarios';
      h2.insertAdjacentElement('afterend', p);
    }

    Array.prototype.forEach.call(card.querySelectorAll('button'), function(btn){
      var txt = (btn.textContent || '').trim().toLowerCase();
      if(txt === 'crear cuenta' || txt === 'olvidé mi contraseña' || txt === 'olvide mi contraseña'){
        btn.classList.add('login-link-button');
        if(txt.indexOf('olvid') === 0) btn.textContent = '¿Olvidaste tu contraseña?';
      }
    });
  }

  enhanceLogin();
  new MutationObserver(enhanceLogin).observe(document.body,{childList:true,subtree:true});
})();
