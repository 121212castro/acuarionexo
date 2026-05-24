/* AcuarioNexo · Motor base con arranque seguro */
const c=window.ACUARIONEXO_CONFIG;
const s=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_KEY);
const A=document.getElementById('app');
window.c=c;window.s=s;window.A=A;
document.getElementById('version').textContent=c.APP_VERSION+' · clean';
let q=null;
const $=i=>document.getElementById(i);
const v=i=>$(i)?.value?.trim()||'';
const N=i=>v(i)===''?null:Number(v(i));
const E=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const M=(t,k='notice')=>`<div class="${k}">${E(t)}</div>`;
const S=h=>{A.innerHTML=h;scrollTo(0,0)};
window.S=S;window.E=E;window.M=M;
document.getElementById('refreshAppBtn')?.addEventListener('click',()=>location.replace(location.pathname+'?v='+Date.now()));
function login(){S(`<section class="card"><h2>Entrar</h2><label>Email</label><input id="em" type="email" autocomplete="email"><label>Contraseña</label><input id="pw" type="password" autocomplete="current-password"><button class="primary" onclick="iniciar()">Entrar</button><button onclick="crear()">Crear cuenta</button><div id="x"></div></section>`)}
window.login=login;
async function iniciar(){try{let{error}=await s.auth.signInWithPassword({email:v('em'),password:v('pw')});if(error)throw error;location.replace(location.pathname+'?v='+Date.now())}catch(e){$('x').innerHTML=M(e.message,'error')}}
window.iniciar=iniciar;
async function crear(){let{error}=await s.auth.signUp({email:v('em'),password:v('pw')});$('x').innerHTML=error?M(error.message,'error'):M('Cuenta creada.','success')}
window.crear=crear;
async function boot(){let r=await s.auth.getSession();window.u=r.data.session?.user||null;let out=$('logoutBtn');if(out){out.classList.toggle('hidden',!window.u);out.onclick=async()=>{await s.auth.signOut();location.replace(location.pathname+'?v='+Date.now())}}if(!window.u){login();return}setTimeout(function(){if(window.AcuarioNexoNavigation&&window.AcuarioNexoNavigation.safeGo){window.AcuarioNexoNavigation.safeGo('Dashboard')}else{S('<section class="card"><h2>AcuarioNexo</h2><p>Sesión iniciada.</p><button class="primary" onclick="location.reload()">Cargar app</button></section>')}},500)}
window.home=function(){if(window.AcuarioNexoNavigation?.safeGo)return window.AcuarioNexoNavigation.safeGo('Dashboard')};
window.dashboard=window.home;
window.menu=function(){return''};
window.acs=function(){if(window.AcuarioNexoNavigation?.safeGo)return window.AcuarioNexoNavigation.safeGo('Acuarios')};
function L(a,b,c){a=+a;b=+b;c=+c;return a&&b&&c?Math.round(a*b*c/10)/100:null}
window.calc=function(){let r=L(v('l'),v('w'),v('h')),su=L(v('sl'),v('sw'),v('sh')),t=Math.round(((r||0)+(su||0))*100)/100;if($('cal'))$('cal').innerHTML=M(`Urna ${r??'-'} L · sump ${su??'-'} L · total ${t||'-'} L`)};
window.formA=function(a={}){S(`<section class="card"><button onclick="acs()">← Volver</button><h2>${a.id?'Editar':'Nuevo'} acuario</h2><label>Nombre</label><input id="name" value="${E(a.name||'')}"><label>Tipo</label><select id="type"><option value="reef" ${a.aquarium_type==='reef'?'selected':''}>Reef</option><option value="marine" ${a.aquarium_type==='marine'?'selected':''}>Marino</option><option value="freshwater" ${a.aquarium_type==='freshwater'?'selected':''}>Dulce</option><option value="hospital" ${a.aquarium_type==='hospital'?'selected':''}>Hospital</option><option value="quarantine" ${a.aquarium_type==='quarantine'?'selected':''}>Cuarentena</option><option value="other" ${a.aquarium_type==='other'?'selected':''}>Otro</option></select><label>Subtipo</label><input id="sub" value="${E(a.subtype||'')}"><label>Descripción/problema</label><textarea id="des">${E(a.description||'')}</textarea><div class="grid4"><div><label>Largo</label><input id="l" type="number" value="${E(a.tank_length_cm||'')}" oninput="calc()"></div><div><label>Ancho</label><input id="w" type="number" value="${E(a.tank_width_cm||'')}" oninput="calc()"></div><div><label>Alto agua</label><input id="h" type="number" value="${E(a.display_water_height_cm||'')}" oninput="calc()"></div><div><label>Sump largo</label><input id="sl" type="number" value="${E(a.sump_length_cm||'')}" oninput="calc()"></div><div><label>Sump ancho</label><input id="sw" type="number" value="${E(a.sump_width_cm||'')}" oninput="calc()"></div><div><label>Sump alto agua</label><input id="sh" type="number" value="${E(a.sump_height_cm||'')}" oninput="calc()"></div></div><div id="cal">${M('Introduce medidas')}</div><button class="primary" onclick="saveA('${a.id||''}')">Guardar</button><div id="x"></div></section>`)};
window.editA=async function(id){let{data,error}=await s.from('aquariums').select('*').eq('id',id).single();if(error)return alert(error.message);formA(data)};
window.saveA=async function(id=''){try{let r=L(v('l'),v('w'),v('h')),su=L(v('sl'),v('sw'),v('sh')),tot=Math.round(((r||0)+(su||0))*100)/100,row={user_id:window.u.id,name:v('name'),aquarium_type:v('type'),subtype:v('sub'),status:'active',description:v('des'),tank_length_cm:N('l'),tank_width_cm:N('w'),display_water_height_cm:N('h'),sump_length_cm:N('sl'),sump_width_cm:N('sw'),sump_height_cm:N('sh'),real_liters:tot||r,liters:tot||r,ai_summary:'Pendiente IA'};let error;if(id){({error}=await s.from('aquariums').update(row).eq('id',id))}else{({error}=await s.from('aquariums').insert(row))}if(error)throw error;acs()}catch(e){$('x').innerHTML=M(e.message,'error')}};
window.deleteA=async function(id){if(!confirm('¿Borrar este acuario?'))return;let{error}=await s.from('aquariums').delete().eq('id',id);if(error)return alert(error.message);acs()};
window.openA=async function(id){let{data,error}=await s.from('aquariums').select('*').eq('id',id).single();if(error)return S(M(error.message,'error'));q=data;window.q=q;panel()};
window.am=function(){if(!window.q)return'';return`<section class="card"><button onclick="acs()">← Acuarios</button><h2>${E(window.q.name)}</h2><p>${E(window.q.real_liters??window.q.liters??'-')} L</p><div class="grid"><button onclick="pars&&pars()">Parámetros</button><button onclick="anis&&anis()">Animales</button><button onclick="fotos&&fotos()">Fotos</button><button onclick="hosp&&hosp()">Hospital</button></div></section>`};
window.panel=function(){S(am()+`<section class="card"><h2>Ficha</h2><p>${E(window.q.description||'')}</p></section>`)};
window.anis=async function(){let{data}=await s.from('animals').select('*').eq('aquarium_id',window.q.id).order('created_at',{ascending:false});S(am()+`<section class="card"><h2>Animales</h2>${(data||[]).map(a=>`<div class="item"><b>${E(a.common_name)}</b></div>`).join('')||M('Sin animales')}</section>`)};
window.fotos=function(){S(am()+`<section class="card"><h2>Fotos</h2></section>`)};
window.hosp=function(){S(am()+`<section class="card"><h2>Hospital</h2></section>`)};
boot();