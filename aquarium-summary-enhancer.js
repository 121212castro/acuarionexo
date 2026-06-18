(function(){
function renderExtra(){
 const aq=(window.ANX&&window.ANX.currentAquarium)?window.ANX.currentAquarium():null;
 if(!aq) return;
 const panel=document.querySelector('.aq-cover');
 if(!panel||document.getElementById('aqSummaryExtra')) return;
 const html=`<div id="aqSummaryExtra" class="item">
 <p><b>Estado:</b> ${aq.status||'-'}</p>
 <p><b>Tipo:</b> ${aq.aquarium_type||'-'}</p>
 <p><b>Litros reales:</b> ${aq.manual_real_liters||aq.system_net_liters||aq.real_liters||'-'} L</p>
 <p><b>Sump:</b> ${aq.has_sump?'Sí':'No'}</p>
 <p><b>Refugio:</b> ${aq.has_refugium?'Sí':'No'}</p>
 <p><b>ATO:</b> ${aq.has_ato_reservoir?'Sí':'No'}</p>
 <p><b>Montaje:</b> ${aq.mounted_at||'-'}</p>
 <p><b>Llenado:</b> ${aq.filled_at||'-'}</p>
 <p><b>Inicio ciclado:</b> ${aq.cycling_start_date||'-'}</p>
 <p><b>Fin ciclado:</b> ${aq.cycling_end_date||'-'}</p>
 </div>`;
 panel.insertAdjacentHTML('beforeend',html);
}
const old=window.panel;
 window.panel=function(){ if(old) old(); setTimeout(renderExtra,50); };
 const oldOpen=window.openA;
 window.openA=async function(id){ const r=await oldOpen(id); setTimeout(renderExtra,100); return r; };
})();