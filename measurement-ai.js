/* AcuarioNexo · Measurement AI básico */
(function(){
 function detectAquariumType(aq){
  const t=String(aq?.aquarium_type||'reef').toLowerCase();
  return ['freshwater','planted','breeding'].includes(t)?'freshwater':'marine';
 }
 function advice(m,aq){
  const mode=detectAquariumType(aq);
  const v=Number(m.normalized_value);
  let status='ok',color='green',risk_level='low';
  let ai_title='Valor registrado';
  let ai_summary='Medición guardada correctamente.';
  let ai_recommendation='Continuar seguimiento.';
  if(m.parameter_key==='phosphate_po4' && Number.isFinite(v)){
   if(v>0.20){status='critical';color='red';risk_level='high';ai_title='PO4 alto';}
   else if(v>0.10){status='review';color='yellow';risk_level='medium';}
  }
  if(m.parameter_key==='nitrate_no3' && mode==='marine' && Number.isFinite(v)){
   if(v>50){status='critical';color='red';risk_level='high';}
   else if(v>25){status='review';color='yellow';risk_level='medium';}
  }
  return {status,color,risk_level,ai_title,ai_summary,ai_recommendation,ai_next_action:'Registrar próxima medición',ai_reasoning:'Evaluación básica temporal'};
 }
 window.AcuarioNexoMeasurementAI={detectAquariumType,advice};
})();