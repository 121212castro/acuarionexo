/* AcuarioNexo · IA local de mediciones */
(function(){
function aquariumType(aq){
  const raw=String(aq?.aquarium_type||aq?.subtype||'').toLowerCase();
  if(['freshwater','dulce','planted','plantado','betta','angelfish','escalar','breeding','cria','cría'].some(x=>raw.includes(x)))return'freshwater';
  return'marine';
}
function detectAquariumMode(aq){return aquariumType(aq)==='freshwater'?'freshwater':'marine'}
function detectAquariumType(aq){
  const raw=String(aq?.aquarium_type||aq?.subtype||'').toLowerCase();
  if(raw.includes('reef'))return'reef';
  if(raw.includes('marine')||raw.includes('marino'))return'marine';
  if(raw.includes('planted')||raw.includes('plantado'))return'planted';
  if(raw.includes('betta'))return'betta';
  if(raw.includes('angelfish')||raw.includes('escalar'))return'angelfish';
  if(raw.includes('breeding')||raw.includes('cría')||raw.includes('cria'))return'breeding';
  if(raw.includes('hospital'))return'hospital';
  if(raw.includes('quarantine')||raw.includes('cuarentena'))return'quarantine';
  if(raw.includes('freshwater')||raw.includes('dulce'))return'freshwater';
  return aquariumType(aq)==='freshwater'?'freshwater':'reef';
}
function rangeFor(m,aq){
  const key=m.parameter_key;
  const schema=window.MeasurementSchema?.parameters?.[key]||window.MEASUREMENT_SCHEMA?.parameters?.[key]||{};
  const type=detectAquariumType(aq);
  const mode=detectAquariumMode(aq);
  return schema.ranges?.[type]||schema.ranges?.[mode]||schema.ranges?.reef||schema.ranges?.marine||schema.ranges?.freshwater||null;
}
function advice(m,aq){
  const r=rangeFor(m,aq);
  const value=Number(m.normalized_value);
  const label=m.parameter_label||m.parameter_key||'Parámetro';
  if(!r||!Number.isFinite(value)){
    return {
      status:'unknown',color:'gray',risk_level:'low',
      ai_title:'Lectura guardada',
      ai_summary:`${label}: lectura registrada sin rango automático suficiente.`,
      ai_recommendation:'Revisar el resultado dentro del contexto del acuario.',
      ai_next_action:'Comparar con mediciones anteriores.',
      ai_reasoning:'No hay valor numérico o rango aplicable suficiente para clasificar con seguridad.'
    };
  }
  const okMin=Number(r[0]),okMax=Number(r[1]),warnMin=Number(r[2]),warnMax=Number(r[3]);
  let status='ok',color='green',risk='low',title='Dentro de rango';
  if(value<warnMin||value>warnMax){status='critical';color='red';risk='critical';title='Fuera de rango seguro'}
  else if(value<okMin||value>okMax){status='review';color='yellow';risk='medium';title='Revisar tendencia'}
  return {
    status,color,risk_level:risk,
    ai_title:title,
    ai_summary:`${label}: ${m.display_value||value}.`,
    ai_recommendation:status==='ok'?'Mantener rutina y registrar evolución.':'No corregir a ciegas; confirmar medición y revisar tendencia.',
    ai_next_action:status==='critical'?'Repetir test y revisar causas antes de actuar.':'Registrar próxima medición para comparar.',
    ai_reasoning:`Rango usado: óptimo ${okMin}-${okMax}; vigilancia ${warnMin}-${warnMax}.`
  };
}
function measuredTime(r){
  const d=new Date(r?.measured_at||r?.created_at||0);
  return isNaN(d)?0:d.getTime();
}
function rowKey(r){return r?.parameter_key||r?.parameter||''}
function latestRows(rows){
  const out={};
  (rows||[]).slice().sort((a,b)=>measuredTime(b)-measuredTime(a)).forEach(r=>{const k=rowKey(r);if(k&&!out[k])out[k]=r});
  return out;
}
function valueOf(r){
  const v=Number(r?.normalized_value??r?.raw_value??r?.value);
  return Number.isFinite(v)?v:null;
}
function rowStatus(r){
  const c=String(r?.color||'').toLowerCase(),risk=String(r?.risk_level||'').toLowerCase(),st=String(r?.status||'').toLowerCase();
  if(['red','purple'].includes(c)||['critical','high'].includes(risk)||st==='critical')return'critical';
  if(['yellow','orange'].includes(c)||risk==='medium'||['review','warning','warn'].includes(st))return'warning';
  return'ok';
}
function waterChangePlan(aq,rows){
  const latest=latestRows(rows);
  const no2=latest.nitrite_no2||latest.no2;
  const nh3=latest.ammonia_nh3||latest.nh3||latest.nh4;
  const no3=latest.nitrate_no3||latest.no3;
  const po4=latest.phosphate_po4||latest.po4;
  const critical=[nh3,no2].filter(r=>r&&rowStatus(r)==='critical');
  if(critical.length){
    return {
      level:'urgent',
      title:'Cambio de agua urgente',
      percent:'30-50%',
      when:'Hoy',
      reason:'Amonio/amoniaco o nitrito fuera de rango seguro.',
      action:'Confirmar test, preparar agua igualada en temperatura/salinidad y revisar filtración/causa.'
    };
  }
  const nutrients=[no3,po4].filter(r=>r&&rowStatus(r)==='critical');
  if(nutrients.length){
    return {
      level:'high',
      title:'Cambio de agua recomendado',
      percent:'15-25%',
      when:'En 24-48 h',
      reason:'Nutrientes por encima del rango de vigilancia.',
      action:'Revisar alimentación, exportación y repetir medición tras el cambio.'
    };
  }
  const warnings=[no3,po4,latest.kh_dkh,latest.ph,latest.salinity_ppt,latest.specific_gravity].filter(r=>r&&rowStatus(r)==='warning');
  if(warnings.length){
    return {
      level:'watch',
      title:'Mantener y vigilar',
      percent:'10-15%',
      when:'En la próxima rutina',
      reason:'Hay valores en zona de revisión, pero sin señal crítica.',
      action:'No corregir de golpe; confirmar tendencia con nueva medición.'
    };
  }
  if(!(rows||[]).length){
    return {
      level:'unknown',
      title:'Sin datos suficientes',
      percent:'-',
      when:'Tras primera rutina',
      reason:'Aún faltan mediciones para recomendar cambios con criterio.',
      action:'Registrar una rutina completa de parámetros.'
    };
  }
  return {
    level:'ok',
    title:'Rutina estable',
    percent:detectAquariumMode(aq)==='freshwater'?'15-25%':'10%',
    when:'Semanal o según rutina',
    reason:'No hay alertas críticas en los últimos valores principales.',
    action:'Mantener rutina y observar tendencia.'
  };
}
function parameterAlerts(aq,rows){
  const latest=latestRows(rows);
  const alerts=[];
  Object.keys(latest).forEach(k=>{
    const r=latest[k],st=rowStatus(r);
    if(st==='ok')return;
    const label=r.parameter_label||k;
    const value=r.display_value||r.normalized_value||r.value||'';
    alerts.push({
      title:(st==='critical'?'Revisar urgente ':'Revisar ')+label,
      source:'IA parámetros',
      aquarium:aq?.name||'Acuario',
      aquarium_id:aq?.id||r.aquarium_id||null,
      date:new Date().toISOString(),
      priority:st==='critical'?'alta':'normal',
      notes:[value,r.ai_recommendation||'',r.ai_next_action||'Repetir medición y comparar tendencia.'].filter(Boolean).join(' · '),
      aiGenerated:true
    });
  });
  const plan=waterChangePlan(aq,rows);
  if(['urgent','high'].includes(plan.level)){
    alerts.unshift({
      title:plan.title,
      source:'IA cambios de agua',
      aquarium:aq?.name||'Acuario',
      aquarium_id:aq?.id||null,
      date:new Date().toISOString(),
      priority:'alta',
      notes:`${plan.percent} · ${plan.when}. ${plan.reason} ${plan.action}`,
      aiGenerated:true
    });
  }
  return alerts.slice(0,8);
}
function evaluateAquarium(aq,rows){
  return {mode:detectAquariumMode(aq),type:detectAquariumType(aq),water_change:waterChangePlan(aq,rows),alerts:parameterAlerts(aq,rows)};
}
window.AcuarioNexoMeasurementAI={detectAquariumMode,detectAquariumType,advice,rangeFor,latestRows,waterChangePlan,parameterAlerts,evaluateAquarium};
})();
