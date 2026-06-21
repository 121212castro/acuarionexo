/* AcuarioNexo · router fix secciones del acuario */
(function(){
  function A(){return window.ANX;}
  function aq(){return A().currentAquarium();}

  window.animales = async function(){
    const x=A(), a=aq(), t=x.token();
    x.render(x.aqHeader('animales')+'<section class="panel"><div class="panel-head"><h2>Animales</h2><button onclick="formAnimal()">Añadir</button></div>'+x.msg('Cargando animales...')+'</section>','acuarios');
    try{
      const r=await x.supabase.from('animals').select('*').eq('aquarium_id',a.id).order('created_at',{ascending:false});
      if(r.error) throw r.error; if(!x.isCurrent(t)) return;
      const html=(r.data||[]).map(function(v){return '<div class="item"><b>'+x.esc(v.common_name||'Animal')+'</b><p>'+x.esc(v.scientific_name||'')+'</p><p class="small">'+x.esc(v.category||'otro')+' · '+x.esc(v.status||'active')+'</p></div>';}).join('')||x.msg('Sin animales registrados.');
      x.render(x.aqHeader('animales')+'<section class="panel"><div class="panel-head"><h2>Animales</h2><button onclick="formAnimal()">Añadir</button></div>'+html+'</section>','acuarios');
    }catch(e){x.render(x.aqHeader('animales')+'<section class="panel">'+x.msg(e.message,'error')+'</section>','acuarios');}
  };

  window.fotos = async function(){
    const x=A(), a=aq(), t=x.token();
    x.render(x.aqHeader('fotos')+'<section class="panel"><div class="panel-head"><h2>Fotos</h2><button onclick="formFoto()">Subir</button></div>'+x.msg('Cargando fotos...')+'</section>','acuarios');
    try{
      const r=await x.supabase.from('aquarium_photos').select('*').eq('aquarium_id',a.id).order('created_at',{ascending:false}).limit(60);
      if(r.error) throw r.error; if(!x.isCurrent(t)) return;
      const html=(r.data||[]).map(function(p){const u=x.photoUrl(p);return '<div class="item gallery-card">'+(u?'<img src="'+x.esc(u)+'" alt="Foto" loading="lazy">':'')+'<b>'+x.esc(p.title||p.caption||'Foto')+'</b></div>';}).join('')||'<p class="small">Sin fotos todavía.</p>';
      x.render(x.aqHeader('fotos')+'<section class="panel"><div class="panel-head"><h2>Fotos</h2><button onclick="formFoto()">Subir</button></div><div class="gallery-grid">'+html+'</div></section>','acuarios');
    }catch(e){x.render(x.aqHeader('fotos')+'<section class="panel">'+x.msg(e.message,'error')+'</section>','acuarios');}
  };

  if (typeof window.parametros !== 'function') {
    window.parametros = async function(){
      const x=A(), a=aq(), t=x.token();
      x.render(x.aqHeader('parametros')+'<section class="panel"><div class="panel-head"><h2>Parámetros</h2><button onclick="formParametro()">Añadir</button></div>'+x.msg('Cargando parámetros...')+'</section>','acuarios');
      try{
        const r=await x.supabase.from('aquarium_measurements').select('*').eq('aquarium_id',a.id).order('measured_at',{ascending:false}).limit(80);
        if(r.error) throw r.error; if(!x.isCurrent(t)) return;
        const html=(r.data||[]).map(function(p){return '<div class="item"><b>'+x.esc(p.parameter_label||p.parameter_key||'Parámetro')+'</b><p>'+x.esc(p.display_value||p.raw_text||p.normalized_value||'-')+'</p><p class="small">'+x.dateText(p.measured_at||p.created_at)+'</p></div>';}).join('')||x.msg('Sin mediciones todavía.');
        x.render(x.aqHeader('parametros')+'<section class="panel"><div class="panel-head"><h2>Parámetros</h2><button onclick="formParametro()">Añadir</button></div>'+html+'</section>','acuarios');
      }catch(e){x.render(x.aqHeader('parametros')+'<section class="panel">'+x.msg(e.message,'error')+'</section>','acuarios');}
    };
  }

  const old=window.openAqSection;
  window.openAqSection=function(section){
    if(section==='animales') return window.animales();
    if(section==='fotos') return window.fotos();
    if(section==='parametros') return window.parametros();
    return old ? old(section) : null;
  };
})();
