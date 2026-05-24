window.AcuarioNexoAdmin={version:'admin-no-top-button-24-05'};
(function(){
function E(v){return String(v||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]})}
function app(){return document.getElementById('app')}
function paint(h){if(app())app().innerHTML=h;scrollTo(0,0)}
function enabled(){try{return localStorage.getItem('acuarionexo_admin_enabled')==='1'}catch(e){return false}}
function setEnabled(){try{localStorage.setItem('acuarionexo_admin_enabled','1')}catch(e){}}
function clearEnabled(){try{localStorage.removeItem('acuarionexo_admin_enabled')}catch(e){}}
async function currentUser(){if(window.u&&window.u.id)return window.u;try{var r=await window.s.auth.getSession();window.u=(r.data.session&&r.data.session.user)||null;return window.u}catch(e){return null}}
function removeTopAdmin(){var b=document.getElementById('adminTopBtn');if(b)b.remove()}
function adminLogin(){paint('<section class="card"><h2>🛠️ Entrar como Admin</h2><label>Email</label><input id="em" value="12castro@hotmail.es"><label>Contraseña</label><input id="pw" type="password"><button class="primary" onclick="AcuarioNexoAdmin.login()">Entrar como Admin</button><button onclick="location.reload()">Volver</button><div id="x"></div></section>')}
window.adminPanel=async function(){removeTopAdmin();var u=await currentUser();if(!u)return adminLogin();if(!enabled())return paint('<section class="card"><h2>🛠️ Modo Admin</h2><p>Sesión detectada: '+E(u.email||'usuario')+'</p><button class="primary" onclick="AcuarioNexoAdmin.enable()">Entrar como admin</button><button onclick="AcuarioNexoNavigation.safeGo(\'Dashboard\')">Volver</button></section>');paint('<section class="card"><h2>🛠️ Panel Admin</h2><p><b>Sesión:</b> '+E(u.email||'usuario')+'</p><div class="grid"><button class="primary" onclick="adminUsers()">Usuarios / IA</button><button onclick="adminTesters()">Testers</button><button onclick="AcuarioNexoAdmin.disable()">Modo usuario</button></div></section>')};
window.adminUsers=async function(){paint('<section class="card"><button onclick="adminPanel()">← Admin</button><h2>Usuarios / IA</h2><div id="adminUsersBox">Cargando...</div></section>');try{var r=await window.s.from('user_ai_permissions').select('*').order('updated_at',{ascending:false}).limit(50);if(r.error)throw r.error;var rows=r.data||[];document.getElementById('adminUsersBox').innerHTML=rows.length?rows.map(function(x){return '<div class="item"><b>'+E(x.role)+'</b><p>'+E(x.user_id)+'</p><p>IA: '+(x.ai_enabled?'✅ Activada':'❌ Bloqueada')+'</p></div>'}).join(''):'<p class="notice">Sin usuarios registrados todavía.</p>'}catch(e){document.getElementById('adminUsersBox').innerHTML='<div class="error">'+E(e.message)+'</div>'}};
window.adminTesters=function(){paint('<section class="card"><button onclick="adminPanel()">← Admin</button><h2>Testers</h2><p class="notice">Aquí se verán testers, accesos, reportes y permisos.</p></section>')};
window.AcuarioNexoAdmin.login=function(){setEnabled();if(window.iniciar)return window.iniciar()};
window.AcuarioNexoAdmin.enable=function(){setEnabled();adminPanel()};
window.AcuarioNexoAdmin.disable=function(){clearEnabled();if(window.AcuarioNexoNavigation&&window.AcuarioNexoNavigation.safeGo)return window.AcuarioNexoNavigation.safeGo('Dashboard');adminPanel()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeTopAdmin);else removeTopAdmin();setTimeout(removeTopAdmin,500);setTimeout(removeTopAdmin,1500);setInterval(removeTopAdmin,2000);
})();