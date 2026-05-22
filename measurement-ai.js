/* AcuarioNexo · IA local de mediciones · GitHub Pages + Supabase */
(function(){
  function detectAquariumMode(aquarium){
    const t = String([aquarium?.aquarium_type,aquarium?.subtype,aquarium?.name].join(' ')).toLowerCase();
    if(t.includes('dulce')||t.includes('fresh')||t.includes('plant')||t.includes('betta')||t.includes('beta')||t.includes('escala')) return 'freshwater';
    return 'marine';
  }

  function detectAquariumType(aquarium){
    const t = String([aquarium?.aquarium_type,aquarium?.subtype,aquarium?.name].join(' ')).toLowerCase();
    if(t.includes('plant')) return 'planted';
    if(t.includes('betta')||t.includes('beta')) return 'betta';
    if(t.includes('escala')) return 'angelfish';
    if(t.includes('cria')||t.includes('cría')) return 'breeding';
    if(t.includes('hospital')) return 'hospital';
    if(t.includes('cuarentena')||t.includes('quarantine')) return 'quarantine';
    if(t.includes('dulce')||t.includes('fresh')) return 'freshwater';
    if(t.includes('marino')||t.includes('marine')) return 'marine';
    return 'reef';
  }

  function rangeFor(parameterKey, aquarium){
    const p = window.MeasurementSchema?.parameters?.[parameterKey];
    const type = detectAquariumType(aquarium);
    return p?.ranges?.[type] || p?.ranges?.reef || p?.ranges?.marine || p?.ranges?.freshwater || null;
  }

  function baseState(parameterKey, value, comparator, aquarium){
    const range = rangeFor(parameterKey, aquarium);
    if(!range || !Number.isFinite(Number(value))) return {status:'unknown',color:'gray',risk_level:'low'};
    let v = Number(value);
    if(comparator === '<' || comparator === '<=') v = v * 0.5;
    if(comparator === '>' || comparator === '>=') v = v * 1.1;
    const [idealMin, idealMax, safeMin, safeMax] = range;
    if(v >= idealMin && v <= idealMax) return {status:'ideal',color:'green',risk_level:'low'};
    if(v >= safeMin && v <= safeMax) return {status:'good',color:'blue',risk_level:'low'};
    if(v < safeMin) return {status:'low',color:'orange',risk_level:'medium'};
    if(v > safeMax) return {status:'high',color:'orange',risk_level:'medium'};
    return {status:'watch',color:'yellow',risk_level:'medium'};
  }

  function advice(measurement, aquarium){
    const key = measurement.parameter_key;
    const value = Number(measurement.normalized_value);
    const label = measurement.parameter_label;
    const liters = aquarium?.real_liters || aquarium?.liters || null;
    let state = baseState(key, value, measurement.comparator, aquarium);
    let title = 'Lectura registrada';
    let summary = `${label}: ${measurement.display_value}.`;
    let recommendation = 'Guardar seguimiento y comparar con próximas mediciones.';
    let next = 'Repetir según rutina normal.';

    if(state.status === 'ideal'){
      title = 'Valor ideal';
      recommendation = 'Mantener rutina actual. No hacer correcciones.';
      next = 'Repetir en la siguiente medición programada.';
    }else if(state.status === 'good'){
      title = 'Valor correcto';
      recommendation = 'Correcto, pero conviene vigilar tendencia.';
      next = 'Comparar con los últimos registros.';
    }else if(state.status === 'low'){
      title = 'Valor bajo';
      recommendation = 'Confirmar test. Si hay que corregir, hacerlo lentamente.';
      next = 'Repetir antes de dosificar.';
    }else if(state.status === 'high'){
      title = 'Valor alto';
      recommendation = 'Confirmar test, revisar alimentación, mantenimiento, filtración y cambios recientes.';
      next = 'Repetir medición antes de corregir.';
    }

    if(key === 'ammonia_nh3' && value > 0){
      state = {status:'critical',color:'purple',risk_level:'critical'};
      title = 'Amonio/Amoniaco detectable';
      recommendation = 'No añadir animales. Revisar restos, alimentación, filtración biológica y aireación. Preparar cambio de agua si se confirma.';
      next = 'Repetir NH3/NH4 y NO2. Observar respiración y comportamiento.';
    }
    if(key === 'nitrite_no2' && value > 0.02){
      state = {status:'danger',color:'red',risk_level:'high'};
      title = 'Nitrito detectable';
      recommendation = 'Sistema biológico inestable. No añadir animales. Revisar alimentación, filtro y maduración.';
      next = 'Repetir NO2 y NH3/NH4.';
    }
    if(key === 'phosphate_po4' && detectAquariumMode(aquarium)==='marine' && value > 0.12){
      state = {status:'danger',color:'red',risk_level:'high'};
      title = 'PO4 alto para reef';
      recommendation = 'Revisar comida, roca/sustrato, resinas, refugio, skimmer y cambios recientes. Bajar despacio para no estresar corales.';
      next = 'Repetir PO4 y medir NO3 para ver equilibrio nutrientes.';
    }
    if(key === 'kh_dkh' && detectAquariumMode(aquarium)==='marine' && (value < 7 || value > 9.5)){
      state = {status:'danger',color:'red',risk_level:'high'};
      title = 'KH fuera de zona estable';
      recommendation = 'No corregir más de 0,5–1 dKH al día. Revisar consumo, salinidad, dosificación y test.';
      next = 'Repetir KH antes de aditar.';
    }
    if(key === 'copper_cu' && value > 0 && detectAquariumMode(aquarium)==='marine'){
      state = {status:'critical',color:'purple',risk_level:'critical'};
      title = 'Cobre detectable';
      recommendation = 'Peligroso para invertebrados y corales. Confirmar ICP/test, revisar metales/equipos y no añadir invertebrados.';
      next = 'Usar carbón/resinas específicas si se confirma y buscar origen.';
    }
    if(liters && state.risk_level !== 'low') summary += ` Volumen de referencia: ${liters} L.`;

    return {
      ...state,
      ai_title:title,
      ai_summary:summary,
      ai_recommendation:recommendation,
      ai_next_action:next,
      ai_reasoning:{parameter:key,value,unit:measurement.normalized_unit,aquarium_type:detectAquariumType(aquarium),liters,status:state.status}
    };
  }

  function overall(rows){
    if(!rows || !rows.length) return {label:'SIN DATOS',color:'gray',text:'Aún no hay mediciones limpias.'};
    if(rows.some(r=>r.risk_level==='critical')) return {label:'CRÍTICO',color:'purple',text:'Hay una alerta crítica. Revisar ahora.'};
    if(rows.some(r=>r.risk_level==='high')) return {label:'ALERTA',color:'red',text:'Hay parámetros en riesgo alto.'};
    if(rows.some(r=>r.risk_level==='medium')) return {label:'VIGILAR',color:'orange',text:'Hay parámetros para revisar tendencia.'};
    return {label:'ESTABLE',color:'green',text:'No hay alertas importantes en los últimos registros.'};
  }

  window.AcuarioNexoMeasurementAI = {detectAquariumMode,detectAquariumType,rangeFor,baseState,advice,overall};
})();