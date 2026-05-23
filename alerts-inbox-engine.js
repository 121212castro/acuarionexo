window.AcuarioNexoAlertsInbox={version:'alerts-inbox-23-05'};
(function(){
  function key(){return 'an_alerts_inbox_'+((window.u&&window.u.id)||'local')}
  function read(){try{return JSON.parse(localStorage.getItem(key())||'[]')}catch(e){return []}}
  function write(a){localStorage.setItem(key(),JSON.stringify(a))}
  function id(a){return [a.tipo,a.titulo,a.mensaje].join('|').toLowerCase()}
  function sync(generated){
    var inbox=read();
    var existing={};
    inbox.forEach(function(a){existing[a.uid]=true});
    (generated||[]).forEach(function(a){
      var uid=id(a);
      if(!existing[uid]){inbox.unshift({uid:uid,tipo:a.tipo||'aviso',nivel:a.nivel||'normal',titulo:a.titulo||'Aviso',mensaje:a.mensaje||'',estado:'pendiente',created_at:new Date().toISOString()})}
    });
    write(inbox);
    updateBadge();
    return inbox;
  }
  function pending(){return read().filter(function(a){return a.estado!=='realizada'&&a.estado!=='descartada'})}
  function setStatus(uid,status){var a=read();a.forEach(function(x){if(x.uid===uid){x.estado=status;x.updated_at=new Date().toISOString()}});write(a);updateBadge();return a}
  function updateBadge(){
    var n=pending().length;
    var old=document.getElementById('alerts-badge-fixed');
    if(!old){old=document.createElement('button');old.id='alerts-badge-fixed';old.onclick=function(){if(window.renderAlertsInbox)window.renderAlertsInbox()};document.body.appendChild(old)}
    old.innerHTML='🔔 '+n;
    old.style.cssText='position:fixed;right:14px;bottom:88px;z-index:9999;border-radius:999px;background:'+(n?'#dc2626':'#0f766e')+';color:white;padding:10px 14px;font-weight:900;box-shadow:0 8px 22px rgba(0,0,0,.35)';
  }
  window.renderAlertsInbox=function(){
    var list=read();
    var html=list.length?list.map(function(a){return '<article class="item"><h3>'+a.titulo+' · '+a.estado+'</h3><p>'+a.mensaje+'</p><div class="grid2"><button onclick="AcuarioNexoAlertsInbox.readed(\''+a.uid+'\');renderAlertsInbox()">👁️ Leída</button><button class="primary" onclick="AcuarioNexoAlertsInbox.done(\''+a.uid+'\');renderAlertsInbox()">✅ Realizada</button><button onclick="AcuarioNexoAlertsInbox.later(\''+a.uid+'\');renderAlertsInbox()">🕒 Posponer</button><button class="danger" onclick="AcuarioNexoAlertsInbox.dismiss(\''+a.uid+'\');renderAlertsInbox()">Descartar</button></div></article>'}).join(''):'<p class="notice">No hay avisos pendientes.</p>';
    var app=document.getElementById('app');
    if(app){window.acuarionexoActiveNav='Avisos';app.innerHTML=(window.menu?window.menu():'')+'<section class="premium-block"><h2>🔔 Avisos</h2><p>Los avisos quedan guardados hasta marcarlos como leídos, realizados o descartados.</p>'+html+'</section>'}
  };
  window.AcuarioNexoAlertsInbox.sync=sync;
  window.AcuarioNexoAlertsInbox.read=read;
  window.AcuarioNexoAlertsInbox.pending=pending;
  window.AcuarioNexoAlertsInbox.readed=function(uid){return setStatus(uid,'leida')};
  window.AcuarioNexoAlertsInbox.done=function(uid){return setStatus(uid,'realizada')};
  window.AcuarioNexoAlertsInbox.later=function(uid){return setStatus(uid,'pospuesta')};
  window.AcuarioNexoAlertsInbox.dismiss=function(uid){return setStatus(uid,'descartada')};
  setTimeout(updateBadge,800);
})();
