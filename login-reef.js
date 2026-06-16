/* AcuarioNexo · Inicio resumen */
(function(){
let coreDashboard=null;
function hasUser(){return !!(window.state&&window.state.user)}
async function openAquariums(){if(!coreDashboard&&window.dashboard)coreDashboard=window.dashboard;if(coreDashboard)await coreDashboard();document.querySelectorAll('.bottom-nav button').forEach(b=>{const t=b.querySelector('small')?.textContent?.trim();b.classList.toggle('active',t==='Acuarios');});}
function openHome(){
const totalAq=(window.state?.aquariums||[]).length;
const html=`<section class='summary-card'><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Resumen general de la aplicación</p></div></section>
<section class='panel'><h2>Resumen rápido</h2>
<div class='tank-list'>
<article class='tank-card'><div class='tank-info'><h3>${totalAq}</h3><p>Acuarios activos</p></div></article>
<article class='tank-card'><div class='tank-info'><h3>Biblioteca</h3><p>Acceso rápido al catálogo</p></div></article>
<article class='tank-card'><div class='tank-info'><h3>Avisos</h3><p>Revisar tareas y alertas</p></div></article>
</div></section>
<section class='panel'><div class='panel-head'><h2>Accesos rápidos</h2></div><button class='primary' onclick='acuarios()'>Abrir acuarios</button></section>`;
const app=document.getElementById('app'); if(app) app.innerHTML=html+'<div style="height:140px"></div>';
}
function install(){if(window.dashboard&&!coreDashboard)coreDashboard=window.dashboard;window.acuarios=openAquariums;window.dashboard=openHome;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();