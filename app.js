/* AcuarioNexo · núcleo limpio real */
const c = window.ACUARIONEXO_CONFIG;
const s = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_KEY);
const A = document.getElementById('app');
const state = { user:null, aquarium:null, aquariums:[], section:'resumen', histFilter:'todo' };

window.c = c; window.s = s; window.A = A; window.q = null; window.u = null; window.currentAqSection = 'resumen';
document.getElementById('version').textContent = (c.APP_VERSION || 'AcuarioNexo') + ' · núcleo limpio';

function $(id){ return document.getElementById(id); }
function val(id){ return ($(id)?.value || '').trim(); }
function num(id){ return val(id)==='' ? null : Number(val(id)); }
function esc(x){ return String(x ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function msg(t,k='notice'){ return `<div class="${k}">${esc(t)}</div>`; }
function fecha(x){ if(!x) return 'Sin fecha'; const d=new Date(x); return isNaN(d)?'Sin fecha':d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function fechaDia(x){ if(!x) return 'Sin fecha'; const d=new Date(x); return isNaN(d)?'Sin fecha':d.toLocaleDateString('es-ES',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}); }
function render(html){ A.innerHTML = html; scrollTo(0,0); requestAnimationFrame(()=>{ const a=document.querySelector('.tank-tabs .active'); if(a) a.scrollIntoView({block:'nearest',inline:'center'}); }); }
window.S = render; window.E = esc; window.M = msg;

document.getElementById('refreshAppBtn')?.addEventListener('click', () => location.reload());

function bottomNav(active='inicio'){
  const item=(id,label,icon,fn)=>`<button class="${active===id?'active':''}" onclick="${fn}"><span>${icon}</span><small>${label}</small></button>`;
  return `<nav class="bottom-nav">${item('inicio','Inicio','⌂','dashboard()')}${item('acuarios','Acuarios','▣','dashboard()')}${item('biblioteca','Biblioteca','□','biblioteca()')}${item('avisos','Avisos','♢','tareas()')}${item('microfauna','Microfauna','∞','microfauna()')}</nav>`;
}
function shell(body,active='inicio'){ render(body + '<div style="height:140px"></div>' + bottomNav(active)); }
function page(title,body,active='inicio'){ shell(`<section class="panel"><h2>${esc(title)}</h2>${body}</section>`, active); }

function setAqSection(section){ state.section = section; window.currentAqSection = section; }
function aqChip(id,label){ return `<button class="${state.section===id?'active':''}" onclick="openAqSection('${id}')">${label}</button>`; }
window.am = function(section){
  if(section) setAqSection(section);
  const aq = state.aquarium || window.q;
  if(!aq) return '';
  const liters = aq.real_liters ?? aq.liters ?? '-';
  const type = aq.aquarium_type || aq.subtype || 'Acuario';
  return `<section class="tank-head"><button onclick="dashboard()">←</button><div><h2>${esc(aq.name)}</h2><p>${esc(liters)} L · ${esc(type)}</p></div></section><nav class="tank-tabs">${aqChip('resumen','Resumen')}${aqChip('parametros','Parámetros')}${aqChip('animales','Animales')}${aqChip('fotos','Fotos')}${aqChip('historial','Historial')}</nav>`;
};
window.openAqSection = function(section){
  setAqSection(section);
  if(section==='resumen') return panel();
  if(section==='parametros') return window.pars ? window.pars() : panel();
  if(section==='animales') return anis();
  if(section==='fotos') return fotos();
  if(section==='historial') return historialAcuario();
  return panel();
};

function calcLiters(l,w,h){ l=+l; w=+w; h=+h; return l&&w&&h ? Math.round(l*w*h/10)/100 : null; }
window.calc=function(){
  const tank=calcLiters(val('l'),val('w'),val('h'));
  const sump=calcLiters(val('sl'),val('sw'),val('sh'));
  const total=Math.round(((tank||0)+(sump||0))*100)/100;
  if($('cal')) $('cal').innerHTML=msg(`Urna ${tank??'-'} L · sump ${sump??'-'} L · total ${total||'-'} L`);
};

function login(){ render(`<section class="auth-card"><h2>Entrar</h2><label>Email</label><input id="em" type="email"><label>Contraseña</label><input id="pw" type="password"><button class="primary" onclick="iniciar()">Entrar</button><button onclick="crear()">Crear cuenta</button><div id="x"></div></section>`); }
window.login=login;
window.iniciar=async function(){ try{ const {error}=await s.auth.signInWithPassword({email:val('em'),password:val('pw')}); if(error) throw error; boot(); }catch(e){ $('x').innerHTML=msg(e.message,'error'); } };
window.crear=async function(){ const {error}=await s.auth.signUp({email:val('em'),password:val('pw')}); $('x').innerHTML = error ? msg(error.message,'error') : msg('Cuenta creada.','success'); };

async function loadAquariums(){ const {data,error}=await s.from('aquariums').select('*').eq('user_id',state.user.id).order('created_at',{ascending:false}); if(error) throw error; state.aquariums=data||[]; return state.aquariums; }
function aqName(id){ return state.aquariums.find(a=>a.id===id)?.name || 'General'; }
function aquariumIcon(a){ return a.aquarium_type==='freshwater' ? '🌿' : (a.aquarium_type==='hospital'||a.aquarium_type==='quarantine' ? '🏥' : '🐠'); }
function aquariumCard(a){ const liters=a.real_liters??a.liters??'-'; return `<article class="tank-card" onclick="openA('${a.id}')"><div class="tank-art">${aquariumIcon(a)}</div><div class="tank-info"><h3>${esc(a.name)}</h3><p>${esc(a.aquarium_type||'Acuario')}${a.subtype?' · '+esc(a.subtype):''}</p><span>${esc(liters)} L</span></div><b>›</b></article>`; }
window.dashboard=async function(){
  if(!state.user) return login();
  try{ const list=await loadAquariums(); shell(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>${list.length} acuarios</p></div><button onclick="formA()">+</button></section><section class="panel"><div class="panel-head"><h2>Acuarios</h2><button onclick="formA()">Nuevo</button></div><div class="tank-list">${list.map(aquariumCard).join('') || '<p class="small">Sin acuarios todavía.</p>'}</div></section>`,'inicio'); }
  catch(e){ render(msg(e.message,'error')); }
};
window.acs=window.dashboard; window.home=window.dashboard; window.menu=()=>'';

window.formA=function(a={}){ render(`<section class="panel"><button onclick="dashboard()">← Volver</button><h2>${a.id?'Editar':'Nuevo'} acuario</h2><label>Nombre</label><input id="name" value="${esc(a.name||'')}"><label>Tipo</label><select id="type"><option value="reef" ${a.aquarium_type==='reef'?'selected':''}>Reef</option><option value="marine" ${a.aquarium_type==='marine'?'selected':''}>Marino</option><option value="freshwater" ${a.aquarium_type==='freshwater'?'selected':''}>Dulce</option><option value="hospital" ${a.aquarium_type==='hospital'?'selected':''}>Hospital</option><option value="quarantine" ${a.aquarium_type==='quarantine'?'selected':''}>Cuarentena</option><option value="other" ${a.aquarium_type==='other'?'selected':''}>Otro</option></select><label>Subtipo</label><input id="sub" value="${esc(a.subtype||'')}"><label>Descripción</label><textarea id="des">${esc(a.description||'')}</textarea><div class="form-grid"><div><label>Largo</label><input id="l" type="number" value="${esc(a.tank_length_cm||'')}" oninput="calc()"></div><div><label>Ancho</label><input id="w" type="number" value="${esc(a.tank_width_cm||'')}" oninput="calc()"></div><div><label>Alto agua</label><input id="h" type="number" value="${esc(a.display_water_height_cm||'')}" oninput="calc()"></div><div><label>Sump largo</label><input id="sl" type="number" value="${esc(a.sump_length_cm||'')}" oninput="calc()"></div><div><label>Sump ancho</label><input id="sw" type="number" value="${esc(a.sump_width_cm||'')}" oninput="calc()"></div><div><label>Sump alto</label><input id="sh" type="number" value="${esc(a.sump_height_cm||'')}" oninput="calc()"></div></div><div id="cal">${msg('Introduce medidas')}</div><button class="primary" onclick="saveA('${a.id||''}')">Guardar</button><div id="x"></div></section>`); };
window.saveA=async function(id=''){
  try{ const tank=calcLiters(val('l'),val('w'),val('h')); const sump=calcLiters(val('sl'),val('sw'),val('sh')); const total=Math.round(((tank||0)+(sump||0))*100)/100; const row={user_id:state.user.id,name:val('name'),aquarium_type:val('type'),subtype:val('sub'),status:'active',description:val('des'),tank_length_cm:num('l'),tank_width_cm:num('w'),display_water_height_cm:num('h'),sump_length_cm:num('sl'),sump_width_cm:num('sw'),sump_height_cm:num('sh'),real_liters:total||tank,liters:total||tank,ai_summary:'Pendiente IA'}; const r=id?await s.from('aquariums').update(row).eq('id',id):await s.from('aquariums').insert(row); if(r.error) throw r.error; dashboard(); }
  catch(e){ $('x').innerHTML=msg(e.message,'error'); }
};
window.editA=async function(id){ const {data,error}=await s.from('aquariums').select('*').eq('id',id).single(); if(error) return alert(error.message); formA(data); };
window.deleteA=async function(id){ if(!confirm('¿Borrar este acuario?')) return; const {error}=await s.from('aquariums').delete().eq('id',id); if(error) return alert(error.message); dashboard(); };
window.openA=async function(id){ const {data,error}=await s.from('aquariums').select('*').eq('id',id).single(); if(error) return render(msg(error.message,'error')); state.aquarium=data; window.q=data; panel(); };
window.panel=function(){ setAqSection('resumen'); shell(am('resumen')+`<section class="panel"><h2>Ficha actual</h2><p>Todo lo que guardes aquí pertenece a <b>${esc(window.q?.name||'este acuario')}</b>.</p><div class="quick-actions"><button onclick="openAqSection('parametros')"><span>🧪</span>Parámetros</button><button onclick="openAqSection('animales')"><span>🐟</span>Animales</button><button onclick="openAqSection('fotos')"><span>📷</span>Fotos</button></div>${window.q?.description?`<p>${esc(window.q.description)}</p>`:''}</section>`,'acuarios'); };

function catEs(c){ return ({fish:'Pez',coral:'Coral',invertebrate:'Invertebrado',crustacean:'Crustáceo',mollusk:'Molusco',plant:'Planta',algae:'Alga',other:'Otro'}[c] || c || 'Sin tipo'); }
function normLib(x){ return { title:x.title||x.nombre||x.nombre_comun||x.common_name||x.nombre_cientifico||'', scientific_name:x.scientific_name||x.nombre_cientifico||'', category:x.category||x.tipo||x.tipo_ficha||'other', photo_url:x.photo_url||x.foto_url||x.foto||x.imagen||x.image_url||'', description:x.description||x.descripcion||x.descripcion_detallada||'' }; }
function animalCard(a){ return `<div class="item">${a.photo_url?`<img src="${esc(a.photo_url)}" style="width:100%;max-height:170px;object-fit:cover;border-radius:14px;margin-bottom:8px">`:''}<b>${esc(a.common_name)}</b><p>${esc(a.scientific_name||'')}</p><p class="small">${esc(catEs(a.category))} · ${esc(a.status||'active')} · Cantidad ${esc(a.quantity||1)}</p>${a.notes?`<p>${esc(a.notes)}</p>`:''}<div class="quick-actions"><button onclick="editAnimal('${a.id}')">Editar</button><button onclick="deleteAnimal('${a.id}')">Eliminar</button></div></div>`; }
window.anis=async function(){ setAqSection('animales'); try{ const {data,error}=await s.from('animals').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false}); if(error) throw error; shell(am('animales')+`<section class="panel"><div class="panel-head"><h2>Animales</h2><button onclick="animalMenu()">Añadir</button></div>${(data||[]).map(animalCard).join('') || msg('Sin animales en este acuario')}</section>`,'acuarios'); }catch(e){ shell(am('animales')+`<section class="panel"><h2>Animales</h2>${msg(e.message,'error')}</section>`,'acuarios'); } };
window.animalMenu=function(){ setAqSection('animales'); shell(am('animales')+`<section class="panel"><button onclick="anis()">← Volver</button><h2>Añadir animal</h2><div class="quick-actions"><button onclick="buscarAnimalBiblioteca()"><span>📚</span>Desde biblioteca</button><button onclick="formAnimalManual()"><span>✍️</span>Manual</button></div></section>`,'acuarios'); };
function animalFields(a={}){ return `<label>Nombre común</label><input id="anName" value="${esc(a.common_name||a.title||'')}"><label>Nombre científico</label><input id="anSci" value="${esc(a.scientific_name||'')}"><label>Tipo</label><select id="anCat"><option value="fish" ${a.category==='fish'?'selected':''}>Pez</option><option value="coral" ${a.category==='coral'?'selected':''}>Coral</option><option value="invertebrate" ${a.category==='invertebrate'?'selected':''}>Invertebrado</option><option value="crustacean" ${a.category==='crustacean'?'selected':''}>Crustáceo</option><option value="mollusk" ${a.category==='mollusk'?'selected':''}>Molusco</option><option value="plant" ${a.category==='plant'?'selected':''}>Planta</option><option value="other" ${!a.category||a.category==='other'?'selected':''}>Otro</option></select><label>Cantidad</label><input id="anQty" type="number" min="1" value="${esc(a.quantity||1)}"><label>Estado</label><select id="anStatus"><option value="active" ${a.status==='active'?'selected':''}>Activo</option><option value="quarantine" ${a.status==='quarantine'?'selected':''}>Cuarentena</option><option value="hospital" ${a.status==='hospital'?'selected':''}>Hospital</option><option value="archived" ${a.status==='archived'?'selected':''}>Archivado</option></select><label>Foto desde cámara</label><input id="anCam" type="file" accept="image/*" capture="environment"><label>Foto desde galería</label><input id="anGal" type="file" accept="image/*"><label>Notas</label><textarea id="anNotes">${esc(a.notes||a.description||'')}</textarea><input id="anPhotoUrl" type="hidden" value="${esc(a.photo_url||'')}">`; }
window.formAnimalManual=function(){ setAqSection('animales'); shell(am('animales')+`<section class="panel"><button onclick="animalMenu()">← Volver</button><h2>Animal manual</h2>${animalFields()}<button class="primary" onclick="saveAnimal()">Guardar animal</button><div id="x"></div></section>`,'acuarios'); };
window.buscarAnimalBiblioteca=function(){ setAqSection('animales'); shell(am('animales')+`<section class="panel"><button onclick="animalMenu()">← Volver</button><h2>Desde biblioteca</h2><label>Buscar ficha</label><input id="libQ" placeholder="Ej. gramma, ocellaris, euphyllia"><button class="primary" onclick="buscarAnimalBibliotecaResultados()">Buscar</button><div id="libRes"></div></section>`,'acuarios'); };
async function searchLibrary(qv){ let out=[]; try{ const r=await s.from('library_entries').select('*').or(`title.ilike.%${qv}%,scientific_name.ilike.%${qv}%`).limit(20); if(!r.error&&r.data) out=out.concat(r.data.map(normLib)); }catch(e){} if(out.length) return out; try{ const r2=await s.from('biblioteca_fichas').select('*').ilike('nombre','%'+qv+'%').limit(20); if(!r2.error&&r2.data) out=out.concat(r2.data.map(normLib)); }catch(e){} return out; }
window.buscarAnimalBibliotecaResultados=async function(){ try{ const qv=val('libQ'); if(!qv) throw new Error('Escribe algo para buscar.'); const data=await searchLibrary(qv); $('libRes').innerHTML=data.map((x,i)=>`<div class="item"><b>${esc(x.title)}</b><p>${esc(x.scientific_name)}</p><p class="small">${esc(catEs(x.category))}</p><button onclick='importarAnimalBiblioteca(${JSON.stringify(x).replace(/'/g,"&#039;")})'>Usar esta ficha</button></div>`).join('') || msg('No encontré fichas. Puedes añadirlo manualmente.'); }catch(e){ $('libRes').innerHTML=msg(e.message,'error'); } };
window.importarAnimalBiblioteca=function(x){ const a=normLib(x); setAqSection('animales'); shell(am('animales')+`<section class="panel"><button onclick="buscarAnimalBiblioteca()">← Volver</button><h2>Importar ficha</h2>${animalFields({common_name:a.title,scientific_name:a.scientific_name,category:a.category,photo_url:a.photo_url,notes:a.description})}<button class="primary" onclick="saveAnimal()">Guardar en ${esc(window.q.name)}</button><div id="x"></div></section>`,'acuarios'); };
async function uploadAnimalPhoto(){ const f=($('anCam')?.files?.[0])||($('anGal')?.files?.[0]); if(!f) return val('anPhotoUrl')||null; const ext=(f.name.split('.').pop()||'jpg').toLowerCase(); const path=`animals/${state.user.id}/${window.q.id}/${Date.now()}.${ext}`; for(const b of ['aquarium-photos','photos','animal-photos']){ const up=await s.storage.from(b).upload(path,f,{upsert:true,contentType:f.type||'image/jpeg'}); if(!up.error) return s.storage.from(b).getPublicUrl(path).data.publicUrl; } throw new Error('No se pudo subir la foto.'); }
window.saveAnimal=async function(id=''){ try{ const name=val('anName'); if(!name) throw new Error('Pon el nombre del animal.'); const row={user_id:state.user.id,aquarium_id:window.q.id,common_name:name,scientific_name:val('anSci')||null,category:val('anCat')||'other',quantity:Number(val('anQty')||1),status:val('anStatus')||'active',photo_url:await uploadAnimalPhoto(),notes:val('anNotes')||null}; const r=id?await s.from('animals').update(row).eq('id',id):await s.from('animals').insert(row); if(r.error) throw r.error; anis(); }catch(e){ $('x').innerHTML=msg(e.message,'error'); } };
window.editAnimal=async function(id){ setAqSection('animales'); const {data,error}=await s.from('animals').select('*').eq('id',id).single(); if(error) return alert(error.message); shell(am('animales')+`<section class="panel"><button onclick="anis()">← Volver</button><h2>Editar animal</h2>${animalFields(data)}<button class="primary" onclick="saveAnimal('${id}')">Guardar cambios</button><div id="x"></div></section>`,'acuarios'); };
window.deleteAnimal=async function(id){ if(!confirm('¿Eliminar este animal?')) return; const {error}=await s.from('animals').delete().eq('id',id); if(error) return alert(error.message); anis(); };

window.fotos=function(){ setAqSection('fotos'); shell(am('fotos')+`<section class="panel"><h2>Fotos</h2><p>Fotos propias de este acuario.</p></section>`,'acuarios'); };
function histBtn(id,label,count){ return `<button class="${state.histFilter===id?'active':''}" onclick="historialAcuario('${id}')">${label}${count!=null?' '+count:''}</button>`; }
function histCard(i){ return `<div class="item"><b>${esc(i.label)} · ${esc(i.title)}</b><p class="small">${esc(fecha(i.date))}</p>${i.text?`<p>${esc(i.text)}</p>`:''}</div>`; }
function histSections(items){
  const filtered=state.histFilter==='todo'?items:items.filter(i=>i.kind===state.histFilter);
  if(!filtered.length) return msg('No hay entradas en esta sección.');
  const groups={};
  filtered.forEach(i=>{ const k=fechaDia(i.date); (groups[k]=groups[k]||[]).push(i); });
  return Object.keys(groups).map(k=>`<section class="panel"><h3>${esc(k)}</h3>${groups[k].map(histCard).join('')}</section>`).join('');
}
window.historialAcuario=async function(filter){
  if(filter) state.histFilter=filter;
  setAqSection('historial');
  shell(am('historial')+`<section class="panel"><h2>Historial</h2>${msg('Cargando historial...')}</section>`,'acuarios');
  const items=[];
  try{
    const animals=await s.from('animals').select('created_at,updated_at,common_name,scientific_name,category,status,notes').eq('aquarium_id',window.q.id).order('created_at',{ascending:false}).limit(80);
    if(!animals.error) (animals.data||[]).forEach(a=>items.push({kind:'animales',label:'Animal',date:a.updated_at||a.created_at,title:a.common_name||'Animal',text:[catEs(a.category),a.scientific_name,a.status,a.notes].filter(Boolean).join(' · ')}));
    const measures=await s.from('aquarium_measurements').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false}).limit(120);
    if(!measures.error) (measures.data||[]).forEach(m=>items.push({kind:'mediciones',label:'Medición',date:m.measured_at||m.created_at,title:m.parameter_label||m.parameter||'Parámetro',text:[m.display_value,m.value,m.test_method_label,m.notes].filter(Boolean).join(' · ')}));
    const photos=await s.from('aquarium_photos').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false}).limit(60);
    if(!photos.error) (photos.data||[]).forEach(p=>items.push({kind:'fotos',label:'Foto',date:p.created_at||p.taken_at,title:p.title||p.caption||'Foto',text:p.notes||''}));
    const tasks=await s.from('tasks').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false}).limit(60);
    if(!tasks.error) (tasks.data||[]).forEach(t=>items.push({kind:'tareas',label:'Tarea/Aviso',date:t.completed_at||t.due_at||t.created_at,title:t.title||'Tarea',text:[t.status,t.priority,t.notes].filter(Boolean).join(' · ')}));
    const maintenance=await s.from('maintenance_events').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false}).limit(60);
    if(!maintenance.error) (maintenance.data||[]).forEach(m=>items.push({kind:'mantenimiento',label:'Mantenimiento',date:m.performed_at||m.created_at,title:m.title||m.event_type||'Mantenimiento',text:[m.event_type,m.notes].filter(Boolean).join(' · ')}));
    items.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
    const counts={todo:items.length,mediciones:items.filter(i=>i.kind==='mediciones').length,animales:items.filter(i=>i.kind==='animales').length,fotos:items.filter(i=>i.kind==='fotos').length,tareas:items.filter(i=>i.kind==='tareas').length,mantenimiento:items.filter(i=>i.kind==='mantenimiento').length};
    const tabs=`<nav class="tank-tabs">${histBtn('todo','Todo',counts.todo)}${histBtn('mediciones','Mediciones',counts.mediciones)}${histBtn('animales','Animales',counts.animales)}${histBtn('fotos','Fotos',counts.fotos)}${histBtn('tareas','Tareas',counts.tareas)}${histBtn('mantenimiento','Mantenimiento',counts.mantenimiento)}</nav>`;
    shell(am('historial')+`<section class="panel"><h2>Historial</h2><p class="small">Filtra por tipo y revisa por fechas.</p>${tabs}</section>${histSections(items)}`,'acuarios');
  }catch(e){ shell(am('historial')+`<section class="panel"><h2>Historial</h2>${msg(e.message,'error')}</section>`,'acuarios'); }
};
window.graficosAcuario=function(){ setAqSection('parametros'); shell(am('parametros')+`<section class="panel"><h2>Gráficos</h2><p>Gráficos desde mediciones.</p></section>`,'acuarios'); };
window.icpAcuario=function(){ setAqSection('parametros'); shell(am('parametros')+`<section class="panel"><h2>ICP</h2><p>Analíticas ICP.</p></section>`,'acuarios'); };
window.biblioteca=function(){ page('Biblioteca','<p>Fichas generales.</p>','biblioteca'); };
window.tareas=function(){ page('Avisos','<p>Tareas y recordatorios.</p>','avisos'); };
window.microfauna=function(){ page('Microfauna','<p>Cultivos y seguimiento.</p>','microfauna'); };
window.inventario=function(){ page('Inventario','<p>Equipamiento y stock.</p>','inicio'); };

async function boot(){ try{ const r=await s.auth.getSession(); state.user=r.data.session?.user||null; window.u=state.user; document.getElementById('logoutBtn')?.classList.toggle('hidden',!state.user); document.getElementById('logoutBtn').onclick=async()=>{ await s.auth.signOut(); location.reload(); }; state.user ? dashboard() : login(); }catch(e){ render(msg(e.message,'error')); } }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
