/* AcuarioNexo · evita timeout en inventario */
(function(){
  function X(){return window.ANX;}
  function aq(){return X().currentAquarium();}
  function aqId(item){return String(item.aquarium_id||'');}
  function card(x,item){return '<div class="item"><b>'+x.esc(item.name||'Item')+'</b><p class="small">'+x.esc(item.category||'Inventario')+' · '+x.esc(item.quantity??'-')+' '+x.esc(item.unit||'')+'</p></div>';}

  window.inventario = async function(scope='general'){
    const x=X();
    if(!x.state.user) return login();
    const a=aq();
    const isAq=scope==='aquarium'&&a;
    const active=isAq?'acuarios':'inventario';
    const head=isAq?x.aqHeader('inventario'):'';
    const title=isAq?('Inventario de '+(a.name||'acuario')):'Inventario general';
    const t=x.token();
    x.render(head+'<section class="panel"><div class="panel-head"><h2>'+x.esc(title)+'</h2><button class="primary" onclick="formInventario(\''+(isAq?'aquarium':'general')+'\')">Añadir</button></div>'+x.msg('Cargando inventario...')+'</section>',active);
    try{
      let q=x.supabase.from('inventory_items').select('id,name,category,quantity,unit,photo_url,aquarium_id,created_at').eq('user_id',x.state.user.id).order('created_at',{ascending:false}).limit(50);
      if(isAq) q=q.eq('aquarium_id',a.id); else q=q.is('aquarium_id',null);
      const r=await q;
      if(r.error) throw r.error;
      if(!x.isCurrent(t)) return;
      const html=(r.data||[]).map(function(i){return card(x,i);}).join('')||x.msg('Sin inventario todavía.');
      x.render(head+'<section class="panel"><div class="panel-head"><h2>'+x.esc(title)+'</h2><button class="primary" onclick="formInventario(\''+(isAq?'aquarium':'general')+'\')">Añadir</button></div>'+html+'</section>',active);
    }catch(e){
      if(x.isCurrent(t)) x.render(head+'<section class="panel">'+x.msg(e.message,'error')+'</section>',active);
    }
  };
})();