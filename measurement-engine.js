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

  function rawUnitFor(parameterKey, method, schema){
    const m = String(method || '').toLowerCase();
    if(parameterKey === 'phosphate_po4' && m.includes('ppb p')) return 'ppb P';
    return schema.unit || '';
  }

  function normalizeByMethod(parameterKey, method, value){
    if(!Number.isFinite(Number(value))) return null;

    if(parameterKey === 'phosphate_po4' && method && method.toLowerCase().includes('ppb p')){
      return Number(value) * 3.066 / 1000;
    }

    if(parameterKey === 'salinity_ppt' && Number(value) < 2){
      return (Number(value) - 1) * 1000 * 1.31;
    }

    return Number(value);
  }

  function methodKey(method){
    return String(method || 'manual')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_|_$/g,'') || 'manual';
  }

  function buildMeasurement(input, aquarium){
    const schema = window.MeasurementSchema?.parameters?.[input.parameter_key] || {};

    const comparator = normalizeComparator(input.comparator);
    const rawText = String(input.raw_text || '').trim();
    const rawValue = parseValue(rawText);

    const normalized = normalizeByMethod(
      input.parameter_key,
      input.test_method_label,
      rawValue
    );

    const decimals = schema.decimals ?? 2;
    const rawUnit = rawUnitFor(input.parameter_key, input.test_method_label, schema);
    const normalizedUnit = schema.unit || rawUnit || '';

    const displayOriginal = `${comparator} ${rawText} ${rawUnit}`.trim();
    const displayValue = Number.isFinite(normalized)
      ? `${comparator} ${formatValue(normalized, decimals)} ${normalizedUnit}`.trim()
      : '-';

    const base = {
      user_id:input.user_id,
      aquarium_id:input.aquarium_id,
      measured_at:input.measured_at || new Date().toISOString(),
      parameter_key:input.parameter_key,
      parameter_label:schema.label || input.parameter_key,
      category:schema.category || 'general',
      test_method_key:methodKey(input.test_method_label),
      test_method_label:input.test_method_label || 'Manual/Otro',
      comparator,
      raw_value:rawValue,
      raw_text:rawText,
      raw_unit:rawUnit,
      normalized_value:normalized,
      normalized_unit:normalizedUnit,
      display_original:displayOriginal,
      display_value:displayValue,
      aquarium_type:window.AcuarioNexoMeasurementAI.detectAquariumType(aquarium),
      aquarium_liters:aquarium?.real_liters || aquarium?.liters || null,
      notes:input.notes || '',
      source:'acuarionexo-github-pages',
      payload:{
        aquarium_name:aquarium?.name || '',
        raw_input:rawText,
        app_version:'github-pages'
      }
    };

    const ai = window.AcuarioNexoMeasurementAI.advice(base, aquarium);

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