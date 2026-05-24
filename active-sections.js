/* AcuarioNexo · secciones activas limpias */
(function(){
  function esc(x){ return window.E ? window.E(x) : String(x ?? '').replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]}) }
  function msg(t,k){ return window.M ? window.M(t,k) : '<div class="'+(k||'notice')+'">'+esc(t)+'</div>' }
  function render(html,nav){ if(window.S){ window.S(html + (typeof bottomNavSafe==='function'?bottomNavSafe(nav):'')); } }
  function shell(html,nav){
    var bn = document.querySelector('.bottom-nav');
    if(window.S){
      var old = window.__activeBottomNav || '';
      if(!old && bn) old = bn.outerHTML;
      window.__activeBottomNav = old;
      window.S(html + old.replaceAll('class="active"','class=""'));
      markNav(nav);
    }
  }
  function markNav(nav){
    try{
      document.querySelectorAll('.bottom-nav button').forEach(function(b){ b.classList.remove('active'); });
      var map={inicio:0,acuarios:1,biblioteca:2,avisos:3,microfauna:4};
      var i=map[nav];
      if(i!=null){ var b=document.querySelectorAll('.bottom-nav button')[i]; if(b)b.classList.add('active'); }
    }catch(e){}
  }
  function topAcuario(){ return window.am ? window.am() : '' }
  function requireAcuario(){
    if(!window.q){ if(window.dashboard) window.dashboard(); return false; }
    return true;
  }
  function dateLabel(x){
    if(!x) return 'Sin fecha';
    var d=new Date(x);
    if(isNaN(d)) return 'Sin fecha';
    return d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function activePanel(title,body,nav){ shell('<section class="panel"><h2>'+esc(title)+'</h2>'+body+'</section>',nav||'inicio') }

  var previousAm = window.am;
  window.am=function(){
    if(!window.q) return '';
    var l=window.q.real_liters ?? window.q.liters ?? '-';
    var t=window.q.aquarium_type || window.q.subtype || 'Acuario';
    return '<section class="tank-head"><button onclick="dashboard()">←</button><div><h2>'+esc(window.q.name)+'</h2><p>'+esc(l)+' L · '+esc(t)+'</p></div></section>'+
      '<nav class="tank-tabs">'+
      '<button onclick="panel()">Resumen</button>'+
      '<button onclick="pars()">Parámetros</button>'+
      '<button onclick="anis()">Animales</button>'+
      '<button onclick="fotos()">Fotos</button>'+
      '<button onclick="historialAcuario()">Historial</button>'+
      '<button onclick="equipamientoAcuario()">Equipamiento</button>'+
      '<button onclick="mantenimientoAcuario()">Mantenimiento</button>'+
      '</nav>';
  };

  var previousPanel = window.panel;
  window.panel=function(){
    if(!requireAcuario()) return;
    shell(topAcuario()+'<section class="panel"><h2>Ficha actual</h2><p>Todo lo que guardes aquí pertenece a <b>'+esc(window.q.name)+'</b>.</p><div class="quick-actions"><button onclick="pars()"><span>🧪</span>Parámetros</button><button onclick="anis()"><span>🐟</span>Animales</button><button onclick="fotos()"><span>📷</span>Fotos</button><button onclick="historialAcuario()"><span>📜</span>Historial</button><button onclick="equipamientoAcuario()"><span>⚙️</span>Equipamiento</button><button onclick="mantenimientoAcuario()"><span>🧽</span>Mantenimiento</button></div>'+(window.q.description?'<p>'+esc(window.q.description)+'</p>':'')+'</section>','acuarios');
  };

  window.fotos=async function(){
    if(!requireAcuario()) return;
    shell(topAcuario()+'<section class="panel"><div class="panel-head"><h2>Fotos</h2><button onclick="formFotoAcuario()">Añadir</button></div><div id="photoList">'+msg('Cargando fotos...')+'</div></section>','acuarios');
    try{
      var r=await window.s.from('aquarium_photos').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false});
      if(r.error) throw r.error;
      var html=(r.data||[]).map(function(p){
        var url=p.photo_url||p.url||p.public_url||p.image_url||'';
        return '<div class="item">'+(url?'<img src="'+esc(url)+'" style="width:100%;max-height:220px;object-fit:cover;border-radius:14px;margin-bottom:8px">':'')+'<b>'+esc(p.title||p.caption||'Foto')+'</b><p class="small">'+esc(dateLabel(p.created_at||p.taken_at))+'</p>'+(p.notes?'<p>'+esc(p.notes)+'</p>':'')+'</div>';
      }).join('') || msg('Todavía no hay fotos guardadas para este acuario.');
      var el=document.getElementById('photoList'); if(el) el.innerHTML=html;
    }catch(e){
      var el=document.getElementById('photoList'); if(el) el.innerHTML=msg('No se pudieron cargar fotos: '+e.message,'error');
    }
  };

  window.formFotoAcuario=function(){
    if(!requireAcuario()) return;
    shell(topAcuario()+'<section class="panel"><button onclick="fotos()">← Volver</button><h2>Añadir foto</h2><label>Título</label><input id="phTitle"><label>Foto desde cámara</label><input id="phCam" type="file" accept="image/*" capture="environment"><label>Foto desde galería</label><input id="phGal" type="file" accept="image/*"><label>Notas</label><textarea id="phNotes"></textarea><button class="primary" onclick="saveFotoAcuario()">Guardar foto</button><div id="x"></div></section>','acuarios');
  };

  window.saveFotoAcuario=async function(){
    try{
      var f=(document.getElementById('phCam')?.files?.[0])||(document.getElementById('phGal')?.files?.[0]);
      if(!f) throw new Error('Selecciona una foto.');
      var ext=(f.name.split('.').pop()||'jpg').toLowerCase();
      var path='aquariums/'+window.u.id+'/'+window.q.id+'/'+Date.now()+'.'+ext;
      var last=null, url=null;
      for(const b of ['aquarium-photos','photos']){
        var up=await window.s.storage.from(b).upload(path,f,{upsert:true,contentType:f.type||'image/jpeg'});
        if(!up.error){ url=window.s.storage.from(b).getPublicUrl(path).data.publicUrl; break; }
        last=up.error;
      }
      if(!url) throw last || new Error('No se pudo subir la foto.');
      var row={user_id:window.u.id,aquarium_id:window.q.id,title:(document.getElementById('phTitle')?.value||'').trim()||'Foto',photo_url:url,notes:(document.getElementById('phNotes')?.value||'').trim()||null};
      var r=await window.s.from('aquarium_photos').insert(row);
      if(r.error) throw r.error;
      fotos();
    }catch(e){ var x=document.getElementById('x'); if(x)x.innerHTML=msg(e.message,'error'); }
  };

  window.historialAcuario=async function(){
    if(!requireAcuario()) return;
    shell(topAcuario()+'<section class="panel"><h2>Historial</h2><div id="histList">'+msg('Cargando historial...')+'</div></section>','acuarios');
    try{
      var items=[];
      var m=await window.s.from('aquarium_measurements').select('measured_at,parameter_label,display_value,test_method_label,notes').eq('aquarium_id',window.q.id).order('measured_at',{ascending:false}).limit(40);
      if(!m.error)(m.data||[]).forEach(function(x){items.push({d:x.measured_at,t:'Parámetro',b:(x.parameter_label||'Medición')+' · '+(x.display_value||''),n:x.test_method_label||x.notes||''})});
      var a=await window.s.from('animals').select('created_at,common_name,scientific_name,category,status,notes').eq('aquarium_id',window.q.id).order('created_at',{ascending:false}).limit(30);
      if(!a.error)(a.data||[]).forEach(function(x){items.push({d:x.created_at,t:'Animal',b:x.common_name||'Animal',n:(x.scientific_name||'')+' '+(x.status||'')})});
      var p=await window.s.from('aquarium_photos').select('created_at,title,notes').eq('aquarium_id',window.q.id).order('created_at',{ascending:false}).limit(30);
      if(!p.error)(p.data||[]).forEach(function(x){items.push({d:x.created_at,t:'Foto',b:x.title||'Foto',n:x.notes||''})});
      items.sort(function(x,y){return new Date(y.d)-new Date(x.d)});
      var html=items.slice(0,80).map(function(x){return '<div class="item"><b>'+esc(x.t)+' · '+esc(x.b)+'</b><p class="small">'+esc(dateLabel(x.d))+'</p>'+(x.n?'<p>'+esc(x.n)+'</p>':'')+'</div>'}).join('')||msg('Todavía no hay historial para este acuario.');
      var el=document.getElementById('histList'); if(el)el.innerHTML=html;
    }catch(e){ var el=document.getElementById('histList'); if(el)el.innerHTML=msg(e.message,'error'); }
  };

  window.equipamientoAcuario=async function(){
    if(!requireAcuario()) return;
    shell(topAcuario()+'<section class="panel"><div class="panel-head"><h2>Equipamiento</h2><button onclick="formEquipoAcuario()">Añadir</button></div><div id="eqList">'+msg('Cargando equipamiento...')+'</div></section>','acuarios');
    try{
      var r=await window.s.from('equipment').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false});
      if(r.error) throw r.error;
      var html=(r.data||[]).map(function(e){return '<div class="item"><b>'+esc(e.name||e.title||'Equipo')+'</b><p class="small">'+esc(e.category||e.type||'')+'</p>'+(e.notes?'<p>'+esc(e.notes)+'</p>':'')+'</div>'}).join('')||msg('Sin equipamiento guardado.');
      var el=document.getElementById('eqList'); if(el)el.innerHTML=html;
    }catch(e){ var el=document.getElementById('eqList'); if(el)el.innerHTML=msg('No se pudo cargar equipamiento: '+e.message,'error'); }
  };

  window.formEquipoAcuario=function(){
    if(!requireAcuario()) return;
    shell(topAcuario()+'<section class="panel"><button onclick="equipamientoAcuario()">← Volver</button><h2>Añadir equipo</h2><label>Nombre</label><input id="eqName"><label>Tipo</label><input id="eqType" placeholder="Skimmer, bomba, luz..."><label>Notas</label><textarea id="eqNotes"></textarea><button class="primary" onclick="saveEquipoAcuario()">Guardar equipo</button><div id="x"></div></section>','acuarios');
  };

  window.saveEquipoAcuario=async function(){
    try{
      var name=(document.getElementById('eqName')?.value||'').trim();
      if(!name) throw new Error('Pon el nombre del equipo.');
      var row={user_id:window.u.id,aquarium_id:window.q.id,name:name,category:(document.getElementById('eqType')?.value||'').trim()||null,notes:(document.getElementById('eqNotes')?.value||'').trim()||null};
      var r=await window.s.from('equipment').insert(row);
      if(r.error) throw r.error;
      equipamientoAcuario();
    }catch(e){ var x=document.getElementById('x'); if(x)x.innerHTML=msg(e.message,'error'); }
  };

  window.mantenimientoAcuario=async function(){
    if(!requireAcuario()) return;
    shell(topAcuario()+'<section class="panel"><div class="panel-head"><h2>Mantenimiento</h2><button onclick="formMantenimientoAcuario()">Añadir</button></div><div id="mantList">'+msg('Cargando mantenimiento...')+'</div></section>','acuarios');
    try{
      var r=await window.s.from('maintenance_events').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false}).limit(50);
      if(r.error) throw r.error;
      var html=(r.data||[]).map(function(m){return '<div class="item"><b>'+esc(m.title||m.event_type||'Mantenimiento')+'</b><p class="small">'+esc(dateLabel(m.created_at))+(m.next_due_at?' · Próximo: '+esc(dateLabel(m.next_due_at)):'')+'</p>'+(m.notes?'<p>'+esc(m.notes)+'</p>':'')+'</div>'}).join('')||msg('Sin mantenimiento guardado.');
      var el=document.getElementById('mantList'); if(el)el.innerHTML=html;
    }catch(e){ var el=document.getElementById('mantList'); if(el)el.innerHTML=msg(e.message,'error'); }
  };

  window.formMantenimientoAcuario=function(){
    if(!requireAcuario()) return;
    shell(topAcuario()+'<section class="panel"><button onclick="mantenimientoAcuario()">← Volver</button><h2>Añadir mantenimiento</h2><label>Título</label><input id="mtTitle"><label>Tipo</label><input id="mtType" placeholder="Cambio de agua, limpieza, revisión..."><label>Próxima fecha</label><input id="mtNext" type="datetime-local"><label>Notas</label><textarea id="mtNotes"></textarea><button class="primary" onclick="saveMantenimientoAcuario()">Guardar mantenimiento</button><div id="x"></div></section>','acuarios');
  };

  window.saveMantenimientoAcuario=async function(){
    try{
      var title=(document.getElementById('mtTitle')?.value||'').trim();
      if(!title) throw new Error('Pon un título.');
      var next=(document.getElementById('mtNext')?.value||'').trim();
      var row={user_id:window.u.id,aquarium_id:window.q.id,title:title,event_type:(document.getElementById('mtType')?.value||'').trim()||'general',next_due_at:next?new Date(next).toISOString():null,notes:(document.getElementById('mtNotes')?.value||'').trim()||null};
      var r=await window.s.from('maintenance_events').insert(row);
      if(r.error) throw r.error;
      mantenimientoAcuario();
    }catch(e){ var x=document.getElementById('x'); if(x)x.innerHTML=msg(e.message,'error'); }
  };

  window.biblioteca=async function(){
    shell('<section class="panel"><h2>Biblioteca</h2><label>Buscar ficha</label><input id="bibQ" placeholder="Ej. gramma, ocellaris, euphyllia"><button class="primary" onclick="buscarBibliotecaGeneral()">Buscar</button><div id="bibRes"></div></section>','biblioteca');
  };
  window.buscarBibliotecaGeneral=async function(){
    var q=(document.getElementById('bibQ')?.value||'').trim();
    var box=document.getElementById('bibRes');
    if(!q){ if(box)box.innerHTML=msg('Escribe algo para buscar.','error'); return; }
    if(box)box.innerHTML=msg('Buscando...');
    try{
      var out=[];
      var r=await window.s.from('library_entries').select('*').or('title.ilike.%'+q+'%,scientific_name.ilike.%'+q+'%').limit(30);
      if(!r.error && r.data) out=out.concat(r.data);
      if(!out.length){ var r2=await window.s.from('biblioteca_fichas').select('*').ilike('nombre','%'+q+'%').limit(30); if(!r2.error && r2.data) out=out.concat(r2.data); }
      var html=out.map(function(x){var name=x.title||x.nombre||x.nombre_comun||x.common_name||x.nombre_cientifico||'Ficha';var sci=x.scientific_name||x.nombre_cientifico||'';var photo=x.photo_url||x.foto_url||x.foto||x.imagen||x.image_url||'';return '<div class="item">'+(photo?'<img src="'+esc(photo)+'" style="width:100%;max-height:180px;object-fit:cover;border-radius:14px;margin-bottom:8px">':'')+'<b>'+esc(name)+'</b><p class="small">'+esc(sci)+'</p>'+(x.descripcion||x.description?'<p>'+esc(x.descripcion||x.description)+'</p>':'')+'</div>'}).join('')||msg('No encontré fichas.');
      if(box)box.innerHTML=html;
    }catch(e){ if(box)box.innerHTML=msg(e.message,'error'); }
  };

  window.microfauna=async function(){
    shell('<section class="panel"><div class="panel-head"><h2>Microfauna</h2><button onclick="formMicrofauna()">Añadir</button></div><div id="microList">'+msg('Cargando cultivos...')+'</div></section>','microfauna');
    try{
      var r=await window.s.from('microfauna_cultures').select('*').eq('user_id',window.u.id).order('created_at',{ascending:false});
      if(r.error) throw r.error;
      var html=(r.data||[]).map(function(c){return '<div class="item"><b>'+esc(c.name||c.culture_type||'Cultivo')+'</b><p class="small">'+esc(c.culture_type||'')+' · '+esc(c.status||'activo')+'</p>'+(c.next_action_at?'<p>Próxima acción: '+esc(dateLabel(c.next_action_at))+'</p>':'')+(c.notes?'<p>'+esc(c.notes)+'</p>':'')+'</div>'}).join('')||msg('Sin cultivos de microfauna.');
      var el=document.getElementById('microList'); if(el)el.innerHTML=html;
    }catch(e){ var el=document.getElementById('microList'); if(el)el.innerHTML=msg(e.message,'error'); }
  };

  window.formMicrofauna=function(){
    shell('<section class="panel"><button onclick="microfauna()">← Volver</button><h2>Nuevo cultivo</h2><label>Nombre</label><input id="miName"><label>Tipo</label><select id="miType"><option>Fitoplancton</option><option>Copépodos</option><option>Rotíferos</option><option>Artemia</option><option>Infusorios</option><option>Paramecios</option><option>Otro</option></select><label>Próxima acción</label><input id="miNext" type="datetime-local"><label>Notas</label><textarea id="miNotes"></textarea><button class="primary" onclick="saveMicrofauna()">Guardar cultivo</button><div id="x"></div></section>','microfauna');
  };

  window.saveMicrofauna=async function(){
    try{
      var name=(document.getElementById('miName')?.value||'').trim();
      if(!name) throw new Error('Pon un nombre al cultivo.');
      var next=(document.getElementById('miNext')?.value||'').trim();
      var row={user_id:window.u.id,name:name,culture_type:(document.getElementById('miType')?.value||'Otro').trim(),status:'active',next_action_at:next?new Date(next).toISOString():null,notes:(document.getElementById('miNotes')?.value||'').trim()||null};
      var r=await window.s.from('microfauna_cultures').insert(row);
      if(r.error) throw r.error;
      microfauna();
    }catch(e){ var x=document.getElementById('x'); if(x)x.innerHTML=msg(e.message,'error'); }
  };

  window.inventario=window.equipamientoAcuario;
  window.graficosAcuario=function(){ if(window.pars) return window.pars(); };
  window.icpAcuario=function(){ if(window.startSingleMeasurement) return window.startSingleMeasurement('icp'); if(window.pars)return window.pars(); };
  window.hosp=function(){ activePanel('Hospital','<p>Usa un acuario de tipo Hospital/Cuarentena para registrar animales y tareas asociados.</p>','acuarios') };
})();
