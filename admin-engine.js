window.AcuarioNexoAdmin={version:'admin-panel-23-05-studio-gemini-clean-no-float'};
(function(){
function E(v){return String(v||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]})}
function app(){return document.getElementById('app')}
function uid(){return window.u&&window.u.id?window.u.id:null}
function top(){return window.menu?window.menu():''}
function bottom(){return '<nav class="bottom-nav"><button onclick="goSection(\'Dashboard\')">🏠<small>Inicio</small></button><button onclick="goSection(\'Acuarios\')">🐠<small>Acuarios</small></button><button onclick="goSection(\'Inventario\')">📦<small>Inventario</small></button><button onclick="adminPanel()">🛠️<small>Admin</small></button></nav>'}
function paint(h){var b=document.getElementById('adminFloatBtn');if(b)b.remove();if(app())app().innerHTML=top()+h+bottom();scrollTo(0,0)}
function adminEnabled(){try{return localStorage.getItem('acuarionexo_admin_enabled')==='1'}catch(e){return false}}
function enableAdmin(){try{localStorage.setItem('acuarionexo_admin_enabled','1')}catch(e){} adminPanel()}
function disableAdmin(){try{localStorage.removeItem('acuarionexo_admin_enabled')}catch(e){} goSection('Dashboard')}
window.adminPanel=function(){
 if(!uid())return paint('<section class="premium-block"><h2>🛠️ Admin</h2><p>Inicia sesión para usar el panel admin.</p></section>');
 if(!adminEnabled())return paint('<section class="premium-block"><h2>🛠️ Activar Panel Admin</h2><p>Panel privado para preparar fichas IA, revisar borradores y publicar contenido.</p><button class="primary" onclick="AcuarioNexoAdmin.enable()">Activar admin en este dispositivo</button></section>');
 paint('<section class="premium-block"><div class="block-head"><h2>🛠️ Panel Admin</h2><button onclick="AcuarioNexoAdmin.disable()">Ocultar</button></div><p>Centro privado de AcuarioNexo para crear fichas por bloques con Gemini, revisar y publicar.</p><div class="dashboard-grid"><article><h3>✨ Studio Gemini</h3><p>Foto original → prompt → imagen final → ficha estructurada por bloques.</p><button class="primary" onclick="adminStudioFotos()">Abrir Studio</button></article><article><h3>📋 Fichas</h3><p>Borradores, revisión y publicadas.</p><button onclick="adminFichas()">Ver fichas</button></article><article><h3>🐞 Testers</h3><p>Reportes, fallos y seguimiento.</p><button onclick="adminTesters()">Ver testers</button></article></div></section>')
};
window.adminGemini=function(){return adminStudioFotos()};
window.adminImportGemini=function(){return adminStudioFotos()};
window.adminFichas=async function(){paint('<section class="premium-block"><button onclick="adminPanel()">← Admin</button><h2>📋 Fichas</h2><div id="adminList">Cargando...</div></section>');try{var r=await window.s.from('nexoadmin_fichas').select('*').order('created_at',{ascending:false}).limit(30);if(r.error)throw r.error;var html=(r.data||[]).map(function(x){return '<article class="item"><h3>'+E((x.marca||'')+' '+(x.nombre||''))+'</h3><p><b>Estado:</b> '+E(x.estado)+' · <b>Publicado:</b> '+(x.publicado_en_app?'Sí':'No')+'</p><p>'+E((x.resumen_corto||x.ficha_tecnica||'').slice(0,180))+'</p><div class="grid2"><button onclick="adminPublish(\''+x.id+'\')">Publicar</button><button onclick="adminUnpublish(\''+x.id+'\')">Ocultar</button></div></article>'}).join('')||'<p class="notice">Sin fichas.</p>';document.getElementById('adminList').innerHTML=html}catch(e){document.getElementById('adminList').innerHTML='<div class="error">'+E(e.message)+'</div>'}};
window.adminPublish=async function(id){await window.s.from('nexoadmin_fichas').update({estado:'publicada',publicado_en_app:true,tester_visible:true,updated_at:new Date().toISOString()}).eq('id',id);adminFichas()};
window.adminUnpublish=async function(id){await window.s.from('nexoadmin_fichas').update({estado:'borrador',publicado_en_app:false,tester_visible:false,updated_at:new Date().toISOString()}).eq('id',id);adminFichas()};
window.adminTesters=function(){paint('<section class="premium-block"><button onclick="adminPanel()">← Admin</button><h2>🐞 Testers</h2><p class="notice">Preparado para reportes y seguimiento. Siguiente fase: tabla de fallos y actividad.</p></section>')};
window.AcuarioNexoAdmin.enable=enableAdmin;window.AcuarioNexoAdmin.disable=disableAdmin;
var old=window.goSection;window.goSection=function(n){var b=document.getElementById('adminFloatBtn');if(b)b.remove();if(n==='Admin')return adminPanel();return old?old(n):null};
})();
