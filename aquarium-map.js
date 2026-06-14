/* AcuarioNexo · mapa del acuario para IA de colocacion */
(function(){
const PREFIX='AQUARIUM_MAP_V1:';
const LIGHT={low:'Baja',medium:'Media',high:'Alta'};
const FLOW={low:'Suave',medium:'Media',high:'Fuerte'};
const ZONE={rock:'Roca',sand:'Arena',glass:'Cristal',open:'Libre'};
const AGG={none:'Sin agresividad',low:'Baja',medium:'Media',high:'Alta'};
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]})}
function key(aq){return 'acuarionexo-map-'+(aq?.id||'local')}
function cellId(i){return 'm'+i}
function defaultCells(){
  const cells=[];
  for(let i=0;i<24;i++){
    const row=Math.floor(i/6),col=i%6;
    cells.push({id:cellId(i),light:row===0?'high':row===1?'medium':'low',flow:col<2?'medium':col>3?'high':'low',zone:row>=3?'sand':'rock',occupant:'',aggression:'none'});
  }
  return cells;
}
function defaultMap(){return{version:1,cols:6,rows:4,view:'front',updated_at:new Date().toISOString(),cells:defaultCells()}}
function normalizeMap(raw){
  const base=defaultMap();
  if(!raw||typeof raw!=='object')return base;
  const old=Array.isArray(raw.cells)?raw.cells:[];
  const byId={};old.forEach(c=>{if(c&&c.id)byId[c.id]=c});
  base.view=raw.view||base.view;
  base.updated_at=raw.updated_at||base.updated_at;
  base.cells=base.cells.map(c=>({...c,...byId[c.id]}));
  return base;
}
function decodeMap(aq){
  try{
    const local=localStorage.getItem(key(aq));
    if(local)return normalizeMap(JSON.parse(local));
  }catch(e){}
  try{
    const s=String(aq?.ai_summary||'');
    if(s.startsWith(PREFIX))return normalizeMap(JSON.parse(s.slice(PREFIX.length)));
  }catch(e){}
  return defaultMap();
}
function encodeMap(map){return PREFIX+JSON.stringify(map)}
function setMap(map){
  window.__aq_map=normalizeMap(map);
  try{localStorage.setItem(key(window.q),JSON.stringify(window.__aq_map))}catch(e){}
}
function selectedId(){return window.__aq_map_selected||'m0'}
function selectedCell(){return (window.__aq_map?.cells||[]).find(c=>c.id===selectedId())||window.__aq_map.cells[0]}
function scoreCell(cell,profile){
  let score=0,why=[];
  if(profile.light===cell.light){score+=3;why.push('luz adecuada')}else if(profile.light==='medium'||cell.light==='medium'){score+=1;why.push('luz aceptable')}
  if(profile.flow===cell.flow){score+=3;why.push('flujo adecuado')}else if(profile.flow==='medium'||cell.flow==='medium'){score+=1;why.push('flujo aceptable')}
  if(profile.zone===cell.zone){score+=2;why.push('zona correcta')}
  if(cell.occupant){score-=3;why.push('ocupada')}
  if(cell.aggression==='high'){score-=3;why.push('vecino agresivo')}
  if(cell.aggression==='medium'){score-=1;why.push('revisar distancia')}
  return{cell,score,why};
}
function coralProfile(kind){
  const k=String(kind||'lps').toLowerCase();
  if(k==='sps')return{label:'SPS',light:'high',flow:'high',zone:'rock',distance:'8-12 cm'};
  if(k==='blando')return{label:'Blando',light:'medium',flow:'medium',zone:'rock',distance:'5-8 cm'};
  if(k==='zoa')return{label:'Zoanthus',light:'medium',flow:'medium',zone:'rock',distance:'3-5 cm'};
  if(k==='euphyllia')return{label:'Euphyllia',light:'medium',flow:'medium',zone:'rock',distance:'12-18 cm'};
  if(k==='discosoma')return{label:'Discosoma/Ricordea',light:'low',flow:'low',zone:'rock',distance:'5-8 cm'};
  return{label:'LPS',light:'medium',flow:'medium',zone:'rock',distance:'8-12 cm'};
}
function recommend(kind){
  const map=window.__aq_map||defaultMap(),profile=coralProfile(kind);
  const ranked=map.cells.map(c=>scoreCell(c,profile)).sort((a,b)=>b.score-a.score);
  const best=ranked[0];
  return{profile,best,ranked:ranked.slice(0,3)};
}
function optionMap(obj,value){return Object.keys(obj).map(k=>'<option value="'+k+'" '+(k===value?'selected':'')+'>'+esc(obj[k])+'</option>').join('')}
function cellHtml(c){
  const sel=c.id===selectedId()?' selected':'',tags=[LIGHT[c.light],FLOW[c.flow],ZONE[c.zone]].join(' · ');
  return '<button class="map-cell'+sel+' light-'+esc(c.light)+' flow-'+esc(c.flow)+'" onclick="selectMapCell(\''+esc(c.id)+'\')"><b>'+esc(c.id.toUpperCase())+'</b><span>'+esc(tags)+'</span>'+(c.occupant?'<small>'+esc(c.occupant)+'</small>':'')+'</button>';
}
function gridHtml(){return '<div class="map-grid">'+window.__aq_map.cells.map(cellHtml).join('')+'</div>'}
function editorHtml(){
  const c=selectedCell();
  return '<section class="panel map-editor"><h3>Celda '+esc(c.id.toUpperCase())+'</h3><label>Luz</label><select id="mapLight">'+optionMap(LIGHT,c.light)+'</select><label>Flujo</label><select id="mapFlow">'+optionMap(FLOW,c.flow)+'</select><label>Zona</label><select id="mapZone">'+optionMap(ZONE,c.zone)+'</select><label>Ocupante</label><input id="mapOccupant" value="'+esc(c.occupant||'')+'" placeholder="Ej. Euphyllia, roca libre..."><label>Agresividad cercana</label><select id="mapAgg">'+optionMap(AGG,c.aggression||'none')+'</select><button class="primary" onclick="saveMapCell()">Actualizar celda</button></section>';
}
function recommendationHtml(){
  const kind=window.__aq_coral_kind||'lps',rec=recommend(kind),b=rec.best;
  return '<section class="panel"><h3>IA colocacion coral</h3><label>Tipo</label><select id="coralKind" onchange="setCoralKind(this.value)"><option value="lps" '+(kind==='lps'?'selected':'')+'>LPS</option><option value="euphyllia" '+(kind==='euphyllia'?'selected':'')+'>Euphyllia</option><option value="sps" '+(kind==='sps'?'selected':'')+'>SPS</option><option value="blando" '+(kind==='blando'?'selected':'')+'>Blando</option><option value="zoa" '+(kind==='zoa'?'selected':'')+'>Zoanthus</option><option value="discosoma" '+(kind==='discosoma'?'selected':'')+'>Discosoma/Ricordea</option></select><div class="notice"><b>Mejor zona: '+esc(b.cell.id.toUpperCase())+'</b><p>'+esc(LIGHT[b.cell.light])+' luz · '+esc(FLOW[b.cell.flow])+' flujo · '+esc(ZONE[b.cell.zone])+'</p><p class="small">Separacion sugerida: '+esc(rec.profile.distance)+'. Motivo: '+esc(b.why.join(', ')||'mejor puntuacion del mapa')+'.</p></div><div class="map-ranked">'+rec.ranked.map(x=>'<div class="item"><b>'+esc(x.cell.id.toUpperCase())+'</b><p class="small">Puntuacion '+esc(x.score)+' · '+esc(x.why.join(', '))+'</p></div>').join('')+'</div></section>';
}
function renderMap(){
  window.S(window.am('mapa')+'<section class="panel"><div class="panel-head"><div><h2>Mapa</h2><p class="small">Lectura espacial para IA: luz, flujo, roca, arena y vecinos.</p></div><button onclick="saveAquariumMap()">Guardar</button></div>'+gridHtml()+'</section>'+editorHtml()+recommendationHtml());
}
window.mapaAcuario=function(){if(!window.q)return window.dashboard();window.__aq_map=decodeMap(window.q);window.__aq_map_selected=selectedId();renderMap()};
window.selectMapCell=function(id){window.__aq_map_selected=id;renderMap()};
window.saveMapCell=function(){
  const c=selectedCell();
  Object.assign(c,{light:document.getElementById('mapLight').value,flow:document.getElementById('mapFlow').value,zone:document.getElementById('mapZone').value,occupant:document.getElementById('mapOccupant').value.trim(),aggression:document.getElementById('mapAgg').value});
  window.__aq_map.updated_at=new Date().toISOString();
  setMap(window.__aq_map);
  renderMap();
};
window.setCoralKind=function(kind){window.__aq_coral_kind=kind;renderMap()};
window.saveAquariumMap=async function(){
  try{
    setMap(window.__aq_map);
    const payload=encodeMap(window.__aq_map);
    const r=await window.s.from('aquariums').update({ai_summary:payload}).eq('id',window.q.id);
    if(r.error)throw r.error;
    window.q.ai_summary=payload;
    window.S(window.am('mapa')+'<section class="panel"><h2>Mapa guardado</h2><div class="success">Mapa guardado para que la IA pueda leer colocaciones.</div><button class="primary" onclick="mapaAcuario()">Volver al mapa</button></section>');
  }catch(e){
    window.S(window.am('mapa')+'<section class="panel"><h2>Mapa guardado localmente</h2><div class="notice">Se guardo en este dispositivo. Supabase no acepto el guardado remoto: '+esc(e.message)+'</div><button class="primary" onclick="mapaAcuario()">Volver al mapa</button></section>');
  }
};
window.AcuarioNexoMapAI={decodeMap,recommend,coralProfile};
})();
