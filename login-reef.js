/* AcuarioNexo Inicio Dashboard */
(function(){
let coreDashboard=null;
function hasUser(){return Boolean(window.state&&window.state.user)}
function makeCard(title,value){return '<article class="tank-card"><div class="tank-info"><h3>'+value+'</h3><p>'+title+'</p></div></article>'}
async function readAquariums(){
  if(!hasUser()||!window.s) return [];
  const result=await window.s.from('aquariums').select('*').eq('user_id',window.state.user.id).order('created_at',{ascending:false});
  if(result.error) throw result.error;
  window.state.aquariums=result.data||[];
  return window.state.aquariums;
}
async function openAquariums(){
  if(!coreDashboard&&window.dashboard) coreDashboard=window.dashboard;
  if(coreDashboard) await coreDashboard();
  document.querySelectorAll('.bottom-nav button').forEach(function(b){
    const label=b.querySelector('small')&&b.querySelector('small').textContent.trim();
    b.classList.toggle('active',label==='Acuarios');
  });
}
async function openHome(){
  if(!hasUser()) return coreDashboard?coreDashboard():undefined;
  const app=document.getElementById('app');
  if(app) app.innerHTML='<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Cargando resumen...</p></div></section><div style="height:140px"></div>';
  try{
    const rows=await readAquariums();
    const litros=rows.reduce(function(a,b){return a+(Number(b.real_liters||b.liters)||0)},0);
    const html='<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Resumen general</p></div></section>'+
    '<section class="panel"><h2>Estado general</h2><div class="tank-list">'+makeCard('Acuarios activos',rows.length)+makeCard('Litros gestionados',litros)+makeCard('Biblioteca','📚')+makeCard('Avisos','🔔')+'</div></section>'+
    '<section class="panel"><h2>Accesos rápidos</h2><div class="tank-list">'+makeCard('Acuarios','🐠')+makeCard('Biblioteca','📚')+makeCard('Inventario','📦')+'</div></section>'+
    '<section class="panel"><div class="panel-head"><h2>Próximamente</h2></div><p class="small">Avisos, tareas pendientes, últimos parámetros y últimos animales añadidos.</p></section>';
    if(app) app.innerHTML=html+'<div style="height:140px"></div>';
  }catch(e){
    if(app) app.innerHTML='<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Resumen general</p></div></section><section class="panel"><div class="error">'+String(e.message||e)+'</div></section><div style="height:140px"></div>';
  }
  document.querySelectorAll('.bottom-nav button').forEach(function(b){
    const label=b.querySelector('small')&&b.querySelector('small').textContent.trim();
    b.classList.toggle('active',label==='Inicio');
  });
}
function install(){
  if(window.dashboard&&!coreDashboard) coreDashboard=window.dashboard;
  window.acuarios=openAquariums;
  window.dashboard=openHome;
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();