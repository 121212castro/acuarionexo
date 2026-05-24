/* AcuarioNexo · app.js limpio: motor heredado sin pantalla vieja */
const c=window.ACUARIONEXO_CONFIG;
const s=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_KEY);
const A=document.getElementById('app');
window.c=c;window.s=s;window.A=A;
document.getElementById('version').textContent=c.APP_VERSION+' · real';
let u=null,q=null;
const $=i=>document.getElementById(i);
const v=i=>$(i)?.value?.trim()||'';
const N=i=>v(i)===''?null:Number(v(i));
const E=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const M=(t,k='notice')=>`<div class="${k}">${E(t)}</div>`;
const S=h=>{A.innerHTML=h;scrollTo(0,0)};
window.S=S;window.E=E;window.M=M;
document.getElementById('refreshAppBtn')?.addEventListener('click',()=>location.replace(location.pathname+'?v='+Date.now()));
async function init(){
  let r=await s.auth.getSession();
  u=r.data.session?.user||null;window.u=u;
  const out=$('logoutBtn');
  if(out){out.classList.toggle('hidden',!u);out.onclick=async()=>{await s.auth.signOut();location.replace(location.pathname+'?v='+Date.now())}}
  if(!u)login();
  /* Si hay sesión, no pintamos nada aquí: manda navigation-engine.js */
}
function login(){S(`<section class="card"><h2>Entrar</h2><label>Email</label><input id="em" type="email" autocomplete="email"><label>Contraseña</label><input id="pw" type="password" autocomplete="current-password"><button class="primary" onclick="iniciar()">Entrar</button><button onclick="crear()">Crear cuenta</button><div id="x"></div></section>`)}
async function iniciar(){try{let{error}=await s.auth.signInWithPassword({email:v('em'),password:v('pw')});if(error)throw error;location.replace(location.pathname+'?v='+Date.now())}catch(e){$('x').innerHTML=M(e.message,'error')}}
async function crear(){let{error}=await s.auth.signUp({email:v('em'),password:v('pw')});$('x').innerHTML=error?M(error.message,'error'):M('Cuenta creada.','success')}
function L(a,b,c){a=+a;b=+b;c=+c;return a&&b&&c?Math.round(a*b*c/10)/100:null}
function calc(){let r=L(v('l'),v('w'),v('h')),su=L(v('sl'),v('sw'),v('sh')),t=Math.round(((r||0)+(su||0))*100)/100;if($('cal'))$('cal').innerHTML=M(`Urna ${r??'-'} L · sump ${su??'-'} L · total ${t||'-'} L`)}
async function acs(){if(window.AcuarioNexoNavigation?.safeGo)return window.AcuarioNexoNavigation.safeGo('Acuarios')}
function home(){if(window.AcuarioNexoNavigation?.safeGo)return window.AcuarioNexoNavigation.safeGo('Dashboard')}
function dashboard(){return home()}
function menu(){return''}
function formA(a={}){S(`<section class="card"><button onclick="acs()">← Volver</button><h2>${a.id?'Editar':'Nuevo'} acuario</h2><label>Nombre</label><input id="name" value="${E(a.name||'')}"><label>Tipo</label><select id="type"><option value="reef" ${a.aquarium_type==='reef'?'selected':''}>Reef</option><option value="marine" ${a.aquarium_type==='marine'?'selected':''}>Marino</option><option value="freshwater" ${a.aquarium_type==='freshwater'?'selected':''}>Dulce</option><option value="hospital" ${a.aquarium_type==='hospital'?'selected':''}>Hospital</option><option value="quarantine" ${a.aquarium_type==='quarantine'?'selected':''}>Cuarentena</option><option value="other" ${a.aquarium_type==='other'?'selected':''}>Otro</option></select><label>Subtipo</label><input id="sub" value="${E(a.subtype||'')}"><label>Descripción/problema</label><textarea id="des">${E(a.description||'')}</textarea><div class="grid4"><div><label>Largo</label><input id="l" type="number" value="${E(a.tank_length_cm||'')}" oninput="calc()"></div><div><label>Ancho</label><input id="w" type="number" value="${E(a.tank_width_cm||'')}" oninput="calc()"></div><div><label>Alto agua</label><input id="h" type="number" value="${E(a.display_water_height_cm||'')}" oninput="calc()"></div><div><label>Sump largo</label><input id="sl" type="number" value="${E(a.sump_length_cm||'')}" oninput="calc()"></div><div><label>Sump ancho</label><input id="sw" type="number" value="${E(a.sump_width_cm||'')}" oninput="calc()"></div><div><label>Sump alto agua</label><input id="sh" type="number" value="${E(a.sump_height_cm||'')}" oninput="calc()"></div></div><div id="cal">${M('Introduce medidas')}</div><button class="primary" onclick="saveA('${a.id||''}')">Guardar</button><div id="x"></div></section>`)}
async function editA(id){let{data,error}=await s.from('aquariums').select('*').eq('id',id).single();if(error)return alert(error.message);formA(data)}
async function saveA(id=''){try{let r=L(v('l'),v('w'),v('h')),su=L(v('sl'),v('sw'),v('sh')),tot=Math.round(((r||0)+(su||0))*100)/100,row={user_id:window.u.id,name:v('name'),aquarium_type:v('type'),subtype:v('sub'),status:'active',description:v('des'),tank_length_cm:N('l'),tank_width_cm:N('w'),display_water_height_cm:N('h'),sump_length_cm:N('sl'),sump_width_cm:N('sw'),sump_height_cm:N('sh'),real_liters:tot||r,liters:tot||r,ai_summary:'Pendiente IA'};let error;if(id){({error}=await s.from('aquariums').update(row).eq('id',id))}else{({error}=await s.from('aquariums').insert(row))}if(error)throw error;acs()}catch(e){$('x').innerHTML=M(e.message,'error')}}
async function deleteA(id){if(!confirm('¿Borrar este acuario?'))return;let{error}=await s.from('aquariums').delete().eq('id',id);if(error)return alert(error.message);acs()}
async function openA(id){let{data,error}=await s.from('aquariums').select('*').eq('id',id).single();if(error)return S(M(error.message,'error'));q=data;window.q=q;panel()}
function am(){if(!window.q)return'';return`<section class="card"><button onclick="acs()">← Acuarios</button><h2>${E(window.q.name)}</h2><p>${E(window.q.real_liters??window.q.liters??'-')} L</p><div class="grid"><button onclick="pars&&pars()">Parámetros</button><button onclick="anis&&anis()">Animales</button><button onclick="fotos&&fotos()">Fotos</button><button onclick="hosp&&hosp()">Hospital</button><button onclick="moduleBase('Equipamiento','equipment')">Equipamiento</button><button onclick="moduleBase('Mantenimiento','maintenance_logs')">Mantenimiento</button><button onclick="moduleBase('Historial','aquarium_events')">Historial</button></div></section>`}
window.am=am;
function panel(){S(am()+`<section class="card"><h2>Ficha</h2><p>${E(window.q.description||'')}</p><p class="notice">${E(window.q.ai_summary||'Sin IA')}</p></section>`)}
function moduleBase(title,table){S(am()+`<section class="card"><h2>${E(title)}</h2><p class="notice">Módulo preparado.</p></section>`)}
async function anis(){let{data}=await s.from('animals').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false});S(am()+`<section class="card"><h2>Animales</h2>${window.AcuarioNexoPhotoAI?window.AcuarioNexoPhotoAI.photoBox('animals'):''}<label>Nombre</label><input id="cn"><label>Estado</label><select id="st"><option value="active">Activo</option><option value="hospital">Hospital</option><option value="dead">Muerto</option></select><label>Notas</label><textarea id="no"></textarea><button class="primary" onclick="saveAn()">Guardar</button><div id="x"></div>${(data||[]).map(a=>`<div class="item"><b>${E(a.common_name)}</b><p>${E(a.status)} · ${E(a.notes||'')}</p></div>`).join('')||M('Sin animales')}</section>`)}
async function saveAn(){try{let{error}=await s.from('animals').insert({user_id:window.u.id,aquarium_id:window.q.id,common_name:v('cn'),category:'fish',quantity:1,status:v('st'),notes:v('no')});if(error)throw error;anis()}catch(e){$('x').innerHTML=M(e.message,'error')}}
function fotos(){S(am()+`<section class="card"><h2>Fotos</h2>${window.AcuarioNexoPhotoAI?window.AcuarioNexoPhotoAI.photoBox('photos'):M('Motor fotos pendiente')}</section>`)}
function hosp(){S(am()+`<section class="card"><h2>Hospital</h2>${window.AcuarioNexoPhotoAI?window.AcuarioNexoPhotoAI.photoBox('hospital'):''}</section>`)}
function tareas(){S(`<section class="card"><h2>Avisos/Tareas</h2><p>Módulo en preparación.</p></section>`)}
function biblioteca(){S(`<section class="card"><h2>Biblioteca</h2><p>Módulo en preparación.</p></section>`)}
function microfauna(){S(`<section class="card"><h2>Microfauna</h2><p>Módulo en preparación.</p></section>`)}
function inventario(){S(`<section class="card"><h2>Inventario</h2><p>Módulo en preparación.</p></section>`)}
init();