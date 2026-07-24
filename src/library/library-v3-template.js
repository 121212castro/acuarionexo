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
    if (field.id === 'sources') {
      rules.push('mínimo 2 fuentes reales con URL completa, name y used_for');
    } else if (field.allowed?.length) {
      rules.push(`usa exactamente uno de estos valores: ${field.allowed.join(' | ')}`);
      rules.push('no desarrolles ni amplíes este valor dentro del mismo campo');
    } else if (field.type === 'number') {
      rules.push('debe incluir un valor numérico o rango concreto');
    } else if (field.id === 'scientific_name' || field.validator === 'scientificName') {
      rules.push('debe contener exactamente un binomio científico válido; no sp., spp., cf. ni aff.');
    } else {
      rules.push(`mínimo ${field.minLength || 1} caracteres`);
    }
    if (field.id !== 'sources') rules.push('sin URLs dentro del texto');
    return rules.join('; ');
  }

  function fieldLabel(field, type) {
    if (field.id === 'title') return biologicalTypes.has(type) ? 'Nombre común' : 'Nombre del producto, modelo o elemento';
    return field.label;
  }

  function initialValue(field) {
    if (field.allowed?.length) return field.allowed[0];
    if (field.type === 'number') return 0;
    return '';
  }

  function jsonSkeleton(type, template, subject, scientificName) {
    const data = {};
    template.forEach(section => section.fields.forEach(field => {
      if (TOP_LEVEL.has(field.id)) return;
      data[field.id] = initialValue(field);
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
      '- Evita expresiones imprecisas como bajo, medio, alto, moderado, suele, normalmente o aproximadamente cuando puedan sustituirse por datos concretos; su presencia contextual no invalida por sí sola la ficha.',
      '- Respeta la regla individual escrita junto a cada campo; esa misma regla será utilizada por creación, auditoría y publicación.',
      '- Los campos con valores permitidos deben contener solo uno de esos valores exactos. La explicación debe ir en su campo descriptivo correspondiente.',
      '- Los campos numéricos deben contener números reales o rangos concretos.',
      '- Los identificadores, marcas, modelos, unidades y códigos no necesitan texto de relleno.',
      '- Los campos descriptivos deben alcanzar la longitud indicada y aportar información útil.',
      '- No incluyas URLs en campos de texto. Las URLs van únicamente en sources[].',
      '- sources[] debe contener al menos 2 fuentes reales, cada una con name, url y used_for.',
      '- Antes de responder, comprueba que el JSON pasa exactamente estas mismas reglas.',
      '',
      'SALIDA OBLIGATORIA:',
      '1. Ficha visible para una persona, con apartados claros y Fuentes al final.',
      '2. Bloque JSON válido entre estos marcadores exactos:',
      'ACUARIONEXO_JSON_START',
      '{ JSON válido aquí }',
      'ACUARIONEXO_JSON_END',
      '',
      'CAMPOS OBLIGATORIOS:',
      '- Resumen (clave JSON: summary; mínimo 20 caracteres; mismo contenido en sections.summary).'
    ];

    template.forEach(section => {
      lines.push('', section.label);
      section.fields.forEach(field => lines.push(`- ${fieldLabel(field, type)} (${fieldRuleText(field)})`));
    });

    lines.push(
      '',
      'COMPROBACIÓN FINAL:',
      `- Deben existir ${S.CONTRACTS[type].length} campos contractuales, además de summary.`,
      '- Cada campo debe estar en la ruta JSON indicada junto a su nombre.',
      '- title, scientific_name, summary y sources son claves superiores; los demás campos pertenecen a data.',
      '- El texto visible y el JSON deben coincidir.',
      '- No entregues la ficha si falta un campo, una fuente o un valor no respeta su regla individual.',
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