/* AcuarioNexo · plantillas oficiales de fichas */
(function () {
  const { byId, val, msg, esc } = window.ANX;
  const { S, typeName, biologicalTypes } = window.ANX.LibraryV3Core;
  const TOP_LEVEL = new Set(['title', 'scientific_name', 'summary', 'sources']);

  function jsonPath(field) {
    return TOP_LEVEL.has(field.id) ? field.id : `data.${field.id}`;
  }

  function fieldRuleText(field) {
    const rules = [`clave JSON: ${jsonPath(field)}`];
    if (field.type === 'number') rules.push('debe incluir un valor numérico concreto');
    else if (field.id === 'scientific_name') rules.push('debe contener exactamente un binomio científico válido');
    else if (field.id === 'sources') rules.push('mínimo 2 fuentes reales con URL completa y dato justificado');
    else rules.push(`mínimo ${field.minLength || 20} caracteres`);
    if (field.allowed?.length) rules.push(`valores permitidos exactos: ${field.allowed.join(' | ')}`);
    if (field.validator === 'scientificName') rules.push('especie concreta, no sp., spp., cf. ni aff.');
    if (field.id !== 'sources') rules.push('sin URLs dentro del texto');
    return rules.join('; ');
  }

  function fieldLabel(field, type) {
    if (field.id === 'title') return biologicalTypes.has(type) ? 'Nombre común' : 'Nombre del producto, modelo o elemento';
    return field.label;
  }

  function jsonSkeleton(type, template, subject, scientificName) {
    const data = {};
    template.forEach(section => section.fields.forEach(field => {
      if (TOP_LEVEL.has(field.id)) return;
      data[field.id] = field.type === 'number' ? 0 : '';
    }));
    return JSON.stringify({
      entry_type: type,
      title: subject || '',
      scientific_name: biologicalTypes.has(type) ? scientificName || '' : '',
      summary: '',
      tags: [],
      data,
      sections: { summary: '' },
      sources: [
        { name: '', url: 'https://...', used_for: '' },
        { name: '', url: 'https://...', used_for: '' }
      ]
    }, null, 2);
  }

  function templateText(type, subject, scientificName) {
    const concreteSubject = String(subject || '').trim();
    const concreteScientificName = String(scientificName || '').trim();
    if (!type || type === 'all' || !S?.CONTRACTS?.[type]) throw new Error('Selecciona un tipo de ficha concreto.');
    if (!concreteSubject) throw new Error('Escribe el nombre común, comercial o modelo concreto.');
    if (biologicalTypes.has(type) && !S.isConcreteScientificName(concreteScientificName)) throw new Error('Escribe un nombre científico binomial válido.');

    const template = S.templateFor(type);
    const fields = template.flatMap(section => section.fields);
    const lines = [
      biologicalTypes.has(type)
        ? `Crea una ficha completa de ${typeName(type)} sobre «${concreteSubject}» (${concreteScientificName}) para AcuarioNexo.`
        : `Crea una ficha completa de ${typeName(type)} sobre «${concreteSubject}» para AcuarioNexo.`,
      '',
      'CONTRATO OBLIGATORIO:',
      `- entry_type debe ser exactamente "${type}".`,
      `- title debe corresponder exactamente a «${concreteSubject}».`,
      ...(biologicalTypes.has(type) ? [`- scientific_name debe ser exactamente "${concreteScientificName}".`] : []),
      '- summary es obligatorio y debe tener al menos 20 caracteres.',
      '- Debes entregar TODOS los campos enumerados. Ninguno puede quedar vacío, null, undefined ni omitido.',
      '- No inventes datos. Contrasta cada dato importante con fuentes fiables.',
      '- No uses: bajo, medio, alto, moderado, suele, normalmente ni aproximadamente.',
      '- Los campos numéricos deben contener números reales; no sustituyas números por descripciones vagas.',
      '- Reef safe debe usar exactamente: Sí, Sí con precaución o No.',
      '- No incluyas URLs en campos de texto. Las URLs van únicamente en sources[].',
      '- sources[] debe contener al menos 2 fuentes reales, cada una con name, url y used_for.',
      '- Antes de responder, comprueba que el JSON pasa el mismo contrato que la ficha visible.',
      '',
      'SALIDA OBLIGATORIA:',
      '1. Ficha visible para una persona, con apartados claros y Fuentes al final.',
      '2. Bloque JSON válido entre estos marcadores exactos:',
      'ACUARIONEXO_JSON_START',
      '{ JSON válido aquí }',
      'ACUARIONEXO_JSON_END',
      '',
      'CAMPOS OBLIGATORIOS:'
    ];

    lines.push('- Resumen (clave JSON: summary; mínimo 20 caracteres; mismo contenido en sections.summary).');
    template.forEach(section => {
      lines.push('', section.label);
      section.fields.forEach(field => lines.push(`- ${fieldLabel(field, type)} (${fieldRuleText(field)})`));
    });

    lines.push(
      '',
      'COMPROBACIÓN FINAL:',
      `- Deben existir ${S.CONTRACTS[type].length} campos contractuales, además de summary.`,
      '- No debe existir ninguna clave contractual dentro de data si su ruta indicada es superior.',
      '- El texto visible y el JSON deben coincidir.',
      '- No entregues la ficha si falta un campo o una fuente.',
      '',
      'ESQUELETO JSON:',
      'ACUARIONEXO_JSON_START',
      jsonSkeleton(type, template, concreteSubject, concreteScientificName),
      'ACUARIONEXO_JSON_END'
    );
    return lines.join('\n');
  }

  window.actualizarCamposPlantillaChat = function () {
    const type = val('templateCopyType');
    const field = byId('templateScientificField');
    if (field) field.hidden = !biologicalTypes.has(type);
  };

  window.copiarApartadosFicha = async function (type) {
    const selected = String(type || (window.ANX.state.libraryFilter !== 'all' ? window.ANX.state.libraryFilter : val('templateCopyType')) || '').trim();
    const subject = val('templateCopySubject');
    const scientificName = val('templateCopyScientificName');
    const box = byId('templateCopyStatus');
    try {
      const text = templateText(selected, subject, scientificName);
      await navigator.clipboard.writeText(text);
      if (box) box.innerHTML = msg(`Plantilla de ${typeName(selected)} para «${subject}» copiada.`, 'success');
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo generar o copiar la plantilla.', 'error');
    }
  };

  window.ANX.LibraryV3Template = { templateText, fieldRuleText, jsonSkeleton, jsonPath };
})();
