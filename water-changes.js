/* AcuarioNexo · módulo cambios de agua */
(function(){
function pct(v,p){return Math.round((v*(p/100))*10)/10}
function saltKg(l){return Math.round((l*35)/10)/100}
function waterData(aq,p){
 const total=Number(aq?.real_liters||aq?.liters||0);
 const liters=pct(total,p);
 const marine=['reef','marine'].includes(aq?.aquarium_type);
 return {total,liters,salt:marine?saltKg(liters):0,marine}
}
window.openWaterChanges=function(){
 const aq=window.q;
 if(!aq)return;
 const cards=[
  {id:'weekly',label:'Semanal 10%',pct:10,desc:'Mantenimiento habitual'},
  {id:'monthly',label:'Mensual 25%',pct:25,desc:'Reinicio parcial'},
  {id:'problem',label:'Problema 30%',pct:30,desc:'Emergencia o desequilibrio'}
 ];
 const html=cards.map(c=>{
  const d=waterData(aq,c.pct);
  return `<div class="item"><b>💧 ${c.label}</b><p>${c.desc}</p><p><b>${d.liters} L</b> de ${d.total} L</p>${d.marine?`<p>🧂 Sal aprox: <b>${d.salt} kg</b></p>`:''}<button onclick="customWaterChange(${c.pct})">Usar este cálculo</button></div>`
 }).join('');
 window.S(window.am('resumen')+`<section class="panel"><div class="panel-head"><h2>Cambios de agua</h2><button onclick="panel()">Volver</button></div><p class="small">Cálculo automático según litros reales del acuario.</p>${html}<div class="item"><b>⚙️ Personalizado</b><label>Porcentaje</label><input id="wcCustom" type="number" min="1" max="100" value="15"><button class="primary" onclick="customWaterChange()">Calcular personalizado</button><div id="wcResult"></div></div></section>`,'acuarios')
}
window.customWaterChange=function(forcePct){
 const aq=window.q;
 const pctValue=Number(forcePct||document.getElementById('wcCustom')?.value||0);
 const d=waterData(aq,pctValue);
 const box=document.getElementById('wcResult');
 if(!box)return;
 box.innerHTML=`<div class="success"><b>${pctValue}%</b> → cambiar <b>${d.liters} L</b>${d.marine?`<br>🧂 Sal aproximada: <b>${d.salt} kg</b>`:''}<br><small>Preparado para registrar en historial/tareas.</small></div>`
 }
 const oldPanel=window.panel;
 window.panel=async function(){
  await oldPanel();
  const target=[...document.querySelectorAll('.quick-actions')][0];
  if(!target||target.dataset.waterReady)return;
  target.dataset.waterReady='1';
  target.insertAdjacentHTML('beforeend',`<button class="item" onclick="openWaterChanges()"><b>💧 Cambios de agua</b><p class="small">Cálculo automático y sal</p></button>`)
 }
})();