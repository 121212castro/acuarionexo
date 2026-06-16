/* AcuarioNexo Inicio Dashboard */
(function(){
const originalDashboard=window.dashboard;
function hasUser(){return Boolean(window.state&&window.state.user)}
function makeCard(title,value){return '<article class="tank-card"><div class="tank-info"><h3>'+value+'</h3><p>'+title+'</p></div></article>'}
async function readAquariums(){if(!hasUser()||!window.s)return[];const r=await window.s.from('aquariums').select('*').eq('user_id',window.state.user.id);if(r.error)throw r.error;return r.data||[];}
async function openAquariums(){if(originalDashboard) await originalDashboard();setTimeout(function(){var buttons=document.querySelectorAll('.bottom-nav button');buttons.forEach(function(b){var l=b.querySelector('small');if(!l)return;b.classList.toggle('active',l.textContent.trim()==='Acuarios');});},0);}
async function openHome(){const app=document.getElementById('app');const rows=await readAquariums();const litros=rows.reduce(function(a,b){return a+(Number(b.real_liters||b.liters)||0)},0);app.innerHTML='<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Resumen general</p></div></section><section class="panel"><h2>Estado general</h2><div class="tank-list">'+makeCard('Acuarios activos',rows.length)+makeCard('Litros gestionados',litros)+makeCard('Biblioteca','📚')+makeCard('Avisos','🔔')+'</div></section><section class="panel"><h2>Accesos rápidos</h2><div class="tank-list">'+makeCard('Acuarios','🐠')+makeCard('Biblioteca','📚')+makeCard('Inventario','📦')+'</div></section><div style="height:140px"></div>';}
window.dashboard=openHome;
window.acuarios=openAquariums;
document.addEventListener('click',function(e){var b=e.target.closest('.bottom-nav button');if(!b)return;var l=b.querySelector('small');if(l&&l.textContent.trim()==='Acuarios'){e.preventDefault();openAquariums();}},true);
})();