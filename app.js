/* AcuarioNexo · App publicada · dashboard móvil reformado */
const c=window.ACUARIONEXO_CONFIG;
const s=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_KEY);
const A=document.getElementById('app');
window.c=c;window.s=s;window.A=A;
document.getElementById('version').textContent=(c.APP_VERSION||'AcuarioNexo')+' · app-reformada';
let q=null;
const $=i=>document.getElementById(i);
const v=i=>$(i)?.value?.trim()||'';
const N=i=>v(i)===''?null:Number(v(i));
const E=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const M=(t,k='notice')=>`<div class="${k}">${E(t)}</div>`;
const S=h=>{A.innerHTML=h;scrollTo(0,0)};
window.S=S;window.E=E;window.M=M;
document.getElementById('refreshAppBtn')?.addEventListener('click',()=>location.replace(location.pathname+'?v='+Date.now()));

function bottomNav(active='inicio'){
  const item=(id,fn,ico,txt)=>`<button class="${active===id?'active':''}" onclick="${fn}"><span>${ico}</span><small>${txt}</small></button>`;
  return `<nav class="bottom-nav app-bottom-nav">${item('inicio','dashboard()','⌂','Inicio')}${item('acuarios','dashboard()','▣','Acuarios')}${item('biblioteca','biblioteca()','□','Biblioteca')}${item('avisos','tareas()','♢','Avisos')}${item('microfauna','microfauna()','∞','Microfauna')}</nav>`;
}
function withShell(html,active='inicio'){S(html+bottomNav(active))}

function login(){S(`<section class="card"><h2>Entrar</h2><label>Email</label><input id="em" type="email" autocomplete="email"><label>Contraseña</label><input id="pw" type="password" autocomplete="current-password"><button class="primary" onclick="iniciar()">Entrar</button><button onclick="crear()">Crear cuenta</button><div id="x"></div></section>`)}
window.login=login;
async function iniciar(){try{let{error}=await s.auth.signInWithPassword({email:v('em'),password:v('pw')});if(error)throw error;location.replace(location.pathname+'?v='+Date.now())}catch(e){$('x').innerHTML=M(e.message,'error')}}
window.iniciar=iniciar;
async function crear(){let{error}=await s.auth.signUp({email:v('em'),password:v('pw')});$('x').innerHTML=error?M(error.message,'error'):M('Cuenta creada.','success')}
window.crear=crear;
window.home=function(){dashboard()};
window.menu=function(){return''};
function L(a,b,c){a=+a;b=+b;c=+c;return a&&b&&c?Math.round(a*b*c/10)/100:null}
window.calc=function(){let r=L(v('l'),v('w'),v('h')),su=L(v('sl'),v('sw'),v('sh')),t=Math.round(((r||0)+(su||0))*100)/100;if($('cal'))$('cal').innerHTML=M(`Urna ${r??'-'} L · sump ${su??'-'} L · total ${t||'-'} L`)};

function aquariumIcon(a){return a.aquarium_type==='freshwater'?'🌿':(a.aquarium_type==='hospital'?'🏥':'🐠')}
function aquariumCard(a){return `<article class="aqua-card app-aqua-card" onclick="openA('${a.id}')"><div class="aqua-photo">${aquariumIcon(a)}</div><div class="aqua-body"><h3>${E(a.name)}</h3><p>${E(a.aquarium_type||'Acuario')}</p><span>${E(a.real_liters??a.liters??'-')} L</span></div></article>`}
async function dashboard(){
  if(!window.u)return login();
  let {data,error}=await s.from('aquariums').select('*').eq('user_id',window.u.id).order('created_at',{ascending:false});
  if(error)return S(M(error.message,'error'));
  const list=data||[];
  withShell(`<section class="home-hero"><div><small>Resumen</small><h2>Mis acuarios</h2><p>${list.length} acuarios</p></div><button onclick="formA()">+</button></section><section class="home-section"><div class="home-section-head"><h2>Acuarios</h2><button onclick="formA()">Nuevo</button></div><div class="aquarium-row app-aquarium-row">${list.map(aquariumCard).join('')||'<p class="small">Sin acuarios todavía.</p>'}</div></section><section class="quick-panel"><h2>Navegación rápida</h2><div class="quick-actions"><button onclick="biblioteca()"><span>□</span>Biblioteca</button><button onclick="tareas()"><span>♢</span>Avisos</button><button onclick="microfauna()"><span>∞</span>Microfauna</button></div></section>`,'inicio')
}
window.dashboard=dashboard;
window.acs=dashboard;
window.formA=function(a={}){S(`<section class="card"><button onclick="dashboard()">← Volver</button><h2>${a.id?'Editar':'Nuevo'} acuario</h2><label>Nombre</label><input id="name" value="${E(a.name||'')}"><label>Tipo</label><select id="type"><option value="reef" ${a.aquarium_type==='reef'?'selected':''}>Reef</option><option value="marine" ${a.aquarium_type==='marine'?'selected':''}>Marino</option><option value="freshwater" ${a.aquarium_type==='freshwater'?'selected':''}>Dulce</option><option value="hospital" ${a.aquarium_type==='hospital'?'selected':''}>Hospital</option><option value="quarantine" ${a.aquarium_type==='quarantine'?'selected':''}>Cuarentena</option><option value="other" ${a.aquarium_type==='other'?'selected':''}>Otro</option></select><label>Subtipo</label><input id="sub" value="${E(a.subtype||'')}"><label>Descripción/problema</label><textarea id="des">${E(a.description||'')}</textarea><div class="grid4"><div><label>Largo</label><input id="l" type="number" value="${E(a.tank_length_cm||'')}" oninput="calc()"></div><div><label>Ancho</label><input id="w" type="number" value="${E(a.tank_width_cm||'')}" oninput="calc()"></div><div><label>Alto agua</label><input id="h" type="number" value="${E(a.display_water_height_cm||'')}" oninput="calc()"></div><div><label>Sump largo</label><input id="sl" type="number" value="${E(a.sump_length_cm||'')}" oninput="calc()"></div><div><label>Sump ancho</label><input id="sw" type="number" value="${E(a.sump_width_cm||'')}" oninput="calc()"></div><div><label>Sump alto agua</label><input id="sh" type="number" value="${E(a.sump_height_cm||'')}" oninput="calc()"></div></div><div id="cal">${M('Introduce medidas')}</div><button class="primary" onclick="saveA('${a.id||''}')">Guardar</button><div id="x"></div></section>`)};
window.editA=async function(id){let{data,error}=await s.from('aquariums').select('*').eq('id',id).single();if(error)return alert(error.message);formA(data)};
window.saveA=async function(id=''){try{let r=L(v('l'),v('w'),v('h')),su=L(v('sl'),v('sw'),v('sh')),tot=Math.round(((r||0)+(su||0))*100)/100,row={user_id:window.u.id,name:v('name'),aquarium_type:v('type'),subtype:v('sub'),status:'active',description:v('des'),tank_length_cm:N('l'),tank_width_cm:N('w'),display_water_height_cm:N('h'),sump_length_cm:N('sl'),sump_width_cm:N('sw'),sump_height_cm:N('sh'),real_liters:tot||r,liters:tot||r,ai_summary:'Pendiente IA'};let error;if(id){({error}=await s.from('aquariums').update(row).eq('id',id))}else{({error}=await s.from('aquariums').insert(row))}if(error)throw error;dashboard()}catch(e){$('x').innerHTML=M(e.message,'error')}};
window.deleteA=async function(id){if(!confirm('¿Borrar este acuario?'))return;let{error}=await s.from('aquariums').delete().eq('id',id);if(error)return alert(error.message);dashboard()};
window.openA=async function(id){let{data,error}=await s.from('aquariums').select('*').eq('id',id).single();if(error)return S(M(error.message,'error'));q=data;window.q=q;panel()};
window.am=function(){if(!window.q)return'';let litros=window.q.real_liters??window.q.liters??'-';let tipo=window.q.aquarium_type||window.q.subtype||'Acuario';return`<section class="aquarium-head"><button onclick="dashboard()">←</button><div><h2>${E(window.q.name)}</h2><p>${E(litros)} L · ${E(tipo)}</p></div></section><nav class="tank-tabs"><button onclick="panel()">Resumen</button><button onclick="pars&&pars()">Parámetros</button><button onclick="anis&&anis()">Animales</button><button onclick="fotos&&fotos()">Fotos</button><button onclick="historialAcuario()">Historial</button></nav>`};
window.panel=function(){withShell(am()+`<section class="home-section"><h2>Ficha actual</h2><p>Todo lo que se guarde desde aquí queda dentro de <b>${E(window.q?.name||'este acuario')}</b>.</p><div class="quick-actions"><button onclick="pars&&pars()"><span>🧪</span>Parámetros</button><button onclick="anis&&anis()"><span>🐟</span>Animales</button><button onclick="fotos&&fotos()"><span>📷</span>Fotos</button></div>${window.q?.description?`<p>${E(window.q.description)}</p>`:''}</section>`,'acuarios')};
window.anis=async function(){let{data}=await s.from('animals').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false});withShell(am()+`<section class="home-section"><h2>Animales · ${E(window.q.name)}</h2>${(data||[]).map(a=>`<div class="item"><b>${E(a.common_name)}</b></div>`).join('')||M('Sin animales en este acuario')}</section>`,'acuarios')};
window.fotos=function(){withShell(am()+`<section class="home-section"><h2>Fotos · ${E(window.q.name)}</h2><p>Fotos propias de este acuario.</p></section>`,'acuarios')};
window.graficosAcuario=function(){withShell(am()+`<section class="home-section"><h2>Gráficos · ${E(window.q.name)}</h2><p>Los gráficos deben salir de las mediciones de este acuario.</p></section>`,'acuarios')};
window.icpAcuario=function(){withShell(am()+`<section class="home-section"><h2>ICP · ${E(window.q.name)}</h2></section>`,'acuarios')};
window.historialAcuario=function(){withShell(am()+`<section class="home-section"><h2>Historial · ${E(window.q.name)}</h2></section>`,'acuarios')};
window.hosp=function(){withShell(am()+`<section class="home-section"><h2>Hospital · ${E(window.q.name)}</h2></section>`,'acuarios')};
window.biblioteca=function(){withShell(`<section class="home-section"><h2>Biblioteca</h2><p>Fichas generales.</p></section>`,'biblioteca')};
window.tareas=function(){withShell(`<section class="home-section"><h2>Avisos</h2><p>Tareas y recordatorios.</p></section>`,'avisos')};
window.microfauna=function(){withShell(`<section class="home-section"><h2>Microfauna</h2><p>Cultivos y seguimiento.</p></section>`,'microfauna')};
window.inventario=function(){withShell(`<section class="home-section"><h2>Inventario</h2></section>`,'inicio')};
async function boot(){try{let r=await s.auth.getSession();window.u=r.data.session?.user||null;document.getElementById('logoutBtn')?.classList.toggle('hidden',!window.u);document.getElementById('logoutBtn').onclick=async()=>{await s.auth.signOut();location.replace(location.pathname+'?v='+Date.now())};window.u?dashboard():login()}catch(e){S(M(e.message,'error'))}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();