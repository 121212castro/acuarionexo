/* AcuarioNexo · motor limpio de mediciones */
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

  function normalizeByMethod(parameterKey, method, value){
    if(!Number.isFinite(Number(value))) return null;

    // Hanna fósforo ppb P → PO4
    if(parameterKey === 'phosphate_po4' && method && method.toLowerCase().includes('ppb p')){
      return Number(value) * 3.066 / 1000;
    }

    // Densidad → ppt aproximado
    if(parameterKey === 'salinity_ppt' && Number(value) < 2){
      return (Number(value) - 1) * 1000 * 1.31;
    }

    return Number(value);
  }

  function buildMeasurement(input, aquarium){
    const schema = window.MeasurementSchema?.parameters?.[input.parameter_key] || {};

    const comparator = normalizeComparator(input.comparator);
    const rawText = String(input.raw_text || '').trim();
    const parsed = parseValue(rawText);

    const normalized = normalizeByMethod(
      input.parameter_key,
      input.test_method_label,
      parsed
    );

    const decimals = schema.decimals ?? 2;
    const unit = schema.unit || '';

    const displayOriginal = `${comparator} ${rawText}`.trim();
    const displayNormalized = Number.isFinite(normalized)
      ? `${formatValue(normalized, decimals)} ${unit}`.trim()
      : '-';

    const base = {
      user_id:input.user_id,
      aquarium_id:input.aquarium_id,
      parameter_key:input.parameter_key,
      parameter_label:schema.label || input.parameter_key,
      parameter_category:schema.category || null,
      measured_at:input.measured_at || new Date().toISOString(),
      comparator,
      raw_text:rawText,
      original_value:parsed,
      normalized_value:normalized,
      normalized_unit:unit,
      decimals,
      test_method_key:input.test_method_label,
      test_method_label:input.test_method_label,
      display_original:displayOriginal,
      display_value:displayNormalized,
      notes:input.notes || ''
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