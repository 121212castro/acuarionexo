/* AcuarioNexo · motor limpio de mediciones · alineado con aquarium_measurements */
(function(){
  function parseValue(raw){
    if(raw===null||raw===undefined) return null;
    const cleaned = String(raw).replace(',','.').replace(/[^0-9.\-]/g,'').trim();
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeComparator(c){
    if(['<','<=','>','>=','='].includes(c)) return c;
    return '=';
  }

  function formatValue(value, decimals){
    if(!Number.isFinite(Number(value))) return '-';
    return Number(value).toFixed(Number(decimals ?? 2));
  }

  function methodKey(method){
    return String(method || 'manual')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_|_$/g,'') || 'manual';
  }

  function salinityInputType(value){
    if(!Number.isFinite(Number(value))) return 'unknown';
    const v = Number(value);
    if(v >= 1000 && v <= 1035) return 'sg_x1000';
    if(v >= 1.000 && v <= 1.035) return 'sg';
    if(v >= 20 && v <= 45) return 'ppt';
    return 'unknown';
  }

  function sgFromSalinityInput(value){
    const type = salinityInputType(value);
    const v = Number(value);
    if(type === 'sg_x1000') return v / 1000;
    if(type === 'sg') return v;
    return null;
  }

  function pptFromSg(sg){
    if(!Number.isFinite(Number(sg))) return null;
    return (Number(sg) - 1) * 1000 * 1.31;
  }

  function rawUnitFor(parameterKey, method, schema, rawValue){
    const m = String(method || '').toLowerCase();
    if(parameterKey === 'phosphate_po4' && m.includes('ppb p')) return 'ppb P';
    if(parameterKey === 'salinity_ppt'){
      const t = salinityInputType(rawValue);
      if(t === 'sg_x1000' || t === 'sg') return 'densidad';
      if(t === 'ppt') return 'ppt';
    }
    if(parameterKey === 'specific_gravity') return 'densidad';
    return schema.unit || '';
  }

  function normalizeByMethod(parameterKey, method, value){
    if(!Number.isFinite(Number(value))) return null;

    if(parameterKey === 'phosphate_po4' && method && method.toLowerCase().includes('ppb p')){
      return Number(value) * 3.066 / 1000;
    }

    if(parameterKey === 'salinity_ppt'){
      const t = salinityInputType(value);
      if(t === 'ppt') return Number(value);
      const sg = sgFromSalinityInput(value);
      if(sg) return pptFromSg(sg);
    }

    if(parameterKey === 'specific_gravity'){
      const t = salinityInputType(value);
      if(t === 'sg_x1000') return Number(value) / 1000;
      if(t === 'sg') return Number(value);
    }

    return Number(value);
  }

  function displayFor(parameterKey, comparator, rawText, rawValue, normalized, schema, rawUnit, normalizedUnit){
    if(parameterKey === 'salinity_ppt'){
      const t = salinityInputType(rawValue);
      if(t === 'sg_x1000' || t === 'sg'){
        const sg = sgFromSalinityInput(rawValue);
        const ppt = pptFromSg(sg);
        return {
          displayOriginal:`${comparator} ${rawText} densidad`.trim(),
          displayValue:`${comparator} ${formatValue(sg,3)} densidad`.trim(),
          payloadExtra:{input_kind:'density',specific_gravity:sg,estimated_ppt:ppt}
        };
      }
    }
    if(parameterKey === 'specific_gravity'){
      const sg = normalizeByMethod(parameterKey, '', rawValue);
      return {
        displayOriginal:`${comparator} ${rawText} densidad`.trim(),
        displayValue:Number.isFinite(sg)?`${comparator} ${formatValue(sg,3)} densidad`.trim():'-',
        payloadExtra:{input_kind:'density',specific_gravity:sg}
      };
    }
    return {
      displayOriginal:`${comparator} ${rawText} ${rawUnit}`.trim(),
      displayValue:Number.isFinite(normalized)?`${comparator} ${formatValue(normalized, schema.decimals ?? 2)} ${normalizedUnit}`.trim():'-',
      payloadExtra:{}
    };
  }

  function fallbackAquariumType(aquarium){
    const raw = String(aquarium?.aquarium_type || aquarium?.subtype || '').toLowerCase();
    if(raw.includes('reef')) return 'reef';
    if(raw.includes('marine') || raw.includes('marino')) return 'marine';
    if(raw.includes('planted') || raw.includes('plantado')) return 'planted';
    if(raw.includes('betta')) return 'betta';
    if(raw.includes('angelfish') || raw.includes('escalar')) return 'angelfish';
    if(raw.includes('breeding') || raw.includes('cría') || raw.includes('cria')) return 'breeding';
    if(raw.includes('hospital')) return 'hospital';
    if(raw.includes('quarantine') || raw.includes('cuarentena')) return 'quarantine';
    if(raw.includes('freshwater') || raw.includes('dulce')) return 'freshwater';
    return 'reef';
  }

  function fallbackAdvice(measurement, aquarium){
    const schema = window.MeasurementSchema?.parameters?.[measurement.parameter_key] || {};
    const type = fallbackAquariumType(aquarium);
    const range = schema.ranges?.[type] || schema.ranges?.reef || schema.ranges?.marine || schema.ranges?.freshwater;
    const value = Number(measurement.normalized_value);
    if(!range || !Number.isFinite(value)){
      return {
        status:'unknown',
        color:'gray',
        risk_level:'low',
        ai_title:'Lectura guardada',
        ai_summary:`${measurement.parameter_label}: lectura registrada.`,
        ai_recommendation:'Revisar el resultado con el historial del acuario.',
        ai_next_action:'Comparar con la medición anterior.',
        ai_reasoning:'No hay rango automático suficiente para esta lectura.'
      };
    }
    const okMin = Number(range[0]);
    const okMax = Number(range[1]);
    const warnMin = Number(range[2]);
    const warnMax = Number(range[3]);
    let status = 'ok';
    let color = 'green';
    let risk = 'low';
    let title = 'Dentro de rango';
    if(value < warnMin || value > warnMax){
      status = 'critical';
      color = 'red';
      risk = 'critical';
      title = 'Fuera de rango seguro';
    }else if(value < okMin || value > okMax){
      status = 'review';
      color = 'yellow';
      risk = 'medium';
      title = 'Revisar tendencia';
    }
    return {
      status,
      color,
      risk_level:risk,
      ai_title:title,
      ai_summary:`${measurement.parameter_label}: ${measurement.display_value || value}.`,
      ai_recommendation:status === 'ok' ? 'Mantener rutina y registrar evolución.' : 'Confirmar la medición antes de corregir.',
      ai_next_action:status === 'critical' ? 'Repetir test y revisar causas antes de actuar.' : 'Registrar próxima medición para comparar.',
      ai_reasoning:`Rango usado: óptimo ${okMin}-${okMax}; vigilancia ${warnMin}-${warnMax}.`
    };
  }

  function measurementAI(){
    return window.AcuarioNexoMeasurementAI || {
      detectAquariumType:fallbackAquariumType,
      advice:fallbackAdvice
    };
  }

  function buildMeasurement(input, aquarium){
    let parameterKey = input.parameter_key;
    let schema = window.MeasurementSchema?.parameters?.[parameterKey] || {};
    const comparator = normalizeComparator(input.comparator);
    const rawText = String(input.raw_text || '').trim();
    const rawValue = parseValue(rawText);

    if(parameterKey === 'salinity_ppt'){
      const t = salinityInputType(rawValue);
      if(t === 'sg_x1000' || t === 'sg'){
        parameterKey = 'specific_gravity';
        schema = window.MeasurementSchema?.parameters?.specific_gravity || schema;
      }
    }

    const normalized = normalizeByMethod(parameterKey, input.test_method_label, rawValue);
    const rawUnit = rawUnitFor(parameterKey, input.test_method_label, schema, rawValue);
    const normalizedUnit = schema.unit || rawUnit || '';
    const shown = displayFor(parameterKey, comparator, rawText, rawValue, normalized, schema, rawUnit, normalizedUnit);

    const base = {
      user_id:input.user_id,
      aquarium_id:input.aquarium_id,
      measured_at:input.measured_at || new Date().toISOString(),
      parameter_key:parameterKey,
      parameter_label:schema.label || parameterKey,
      category:schema.category || 'general',
      test_method_key:methodKey(input.test_method_label),
      test_method_label:input.test_method_label || 'Manual/Otro',
      comparator,
      raw_value:rawValue,
      raw_text:rawText,
      raw_unit:rawUnit,
      normalized_value:normalized,
      normalized_unit:normalizedUnit,
      display_original:shown.displayOriginal,
      display_value:shown.displayValue,
      aquarium_type:measurementAI().detectAquariumType(aquarium),
      aquarium_liters:aquarium?.real_liters || aquarium?.liters || null,
      notes:input.notes || '',
      source:'acuarionexo-github-pages',
      payload:{
        aquarium_name:aquarium?.name || '',
        raw_input:rawText,
        app_version:'github-pages',
        ...shown.payloadExtra
      }
    };

    const ai = measurementAI().advice(base, aquarium);

    return {
      ...base,
      status:ai.status,
      color:ai.color,
      risk_level:ai.risk_level,
      ai_title:ai.ai_title,
      ai_summary:ai.ai_summary,
      ai_recommendation:ai.ai_recommendation,
      ai_next_action:ai.ai_next_action,
      ai_reasoning:ai.ai_reasoning
    };
  }

  window.AcuarioNexoMeasurementEngine = {
    parseValue,
    normalizeComparator,
    normalizeByMethod,
    buildMeasurement
  };
})();
