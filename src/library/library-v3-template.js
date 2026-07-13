/* AcuarioNexo · Biblioteca V3 plantillas */
(function () {
  const { byId, val, msg, esc } = window.ANX;
  const { S, typeName, biologicalTypes } = window.ANX.LibraryV3Core;

  function fieldRuleText(field) {
    const rules = [];
    rules.push(`clave JSON: data.${field.id}`);
    if (field.type === 'number') rules.push('debe incluir valor numérico concreto');
    else if (field.id === 'scientific_name') rules.push('debe contener exactamente un binomio científico válido');
    else rules.push(`mínimo ${field.minLength || 20} caracteres`);
    if (field.allowed && field.allowed.length) rules.push(`valores permitidos exactos: ${field.allowed.join(' | ')}`);
    if (field.validator === 'scientificName') rules.push('debe ser especie concreta, no sp., spp., cf. ni aff.');
    rules.push('sin URLs dentro del texto');
    return rules.join('; ');
  }

  function fieldLabel(field, type) {
    if (field.id === 'title') return biologicalTypes.has(type) ? 'Nombre común' : 'Nombre del producto, modelo o elemento';
    return field.label;
  }

  function jsonSkeleton(type, template, subject, scientificName) {
    const data = {};
    template.forEach(section => section.fields.forEach(field => {
      if (field.id === 'sources') return;
      if (['title', 'scientific_name'].includes(field.id)) return;
      data[field.id] = field.type === 'number' ? null : '';
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
    if (!type || type === 'all' || !S()?.CONTRACTS?.[type]) {
      throw new Error('Selecciona un tipo de ficha concreto antes de copiar la plantilla.');
    }
    if (!concreteSubject) {
      throw new Error('Escribe el nombre común, comercial o modelo concreto de la ficha.');
    }
    if (biologicalTypes.has(type) && !S.isConcreteSpecies(concreteScientificName)) {
      throw new Error('Escribe un nombre científico binomial válido para la especie biológica.');
    }

    const template = S.templateFor(type);
    const identityRules = biologicalTypes.has(type) ? [
      '',
      'IDENTIDAD TAXONÓMICA CERRADA:',
      `- Nombre común solicitado: ${concreteSubject}.`,
      `- Nombre científico obligatorio: ${concreteScientificName}.`,
      `- La clave superior scientific_name debe ser exactamente "${concreteScientificName}".`,
      `- El apartado visible Nombre científico debe ser exactamente "${concreteScientificName}".`,
      '- No sustituyas esa especie por otra, no omitas el nombre científico y no redactes sobre un tema relacionado.',
      '- No generes una ficha genérica de un grupo, género, familia, acuario, parámetro, técnica ni producto.',
      '- title debe identificar esta misma especie mediante su nombre común.',
      ''
    ] : [
      '',
      'OBJETO CONCRETO OBLIGATORIO:',
      `- La ficha debe corresponder únicamente a: ${concreteSubject}.`,
      '- No cambies el producto, equipo, test, alimento, aditivo o medicamento solicitado.',
      '- No redactes una ficha genérica sobre su categoría, uso o parámetro asociado.',
      ''
    ];

    const lines = [
      biologicalTypes.has(type)
        ? `Crea una ficha completa de ${typeName(type)} sobre «${concreteSubject}» (${concreteScientificName}) para AcuarioNexo.`
        : `Crea una ficha completa de ${typeName(type)} sobre «${concreteSubject}» para AcuarioNexo.`,
      ...identityRules,
      'CONDICIÓN DE ENTREGA OBLIGATORIA:',
      `- Antes de responder, comprueba que toda la ficha trata exclusivamente de «${concreteSubject}».`,
      '- No entregues la respuesta hasta comprobar internamente que TODOS los campos obligatorios cumplen exactamente las reglas indicadas.',
      '- Si un campo incumple longitud, formato, valor permitido o tipo numérico, corrígelo antes de responder.',
      '- La respuesta se importará y auditará automáticamente. Un solo campo inválido hará que AcuarioNexo rechace toda la ficha.',
      '- No sustituyas un valor permitido por sinónimos. Usa literalmente uno de los valores autorizados.',
      '',
      'SALIDA OBLIGATORIA:',
      '1. Primero escribe la ficha visible para una persona, con apartados claros.',
      '2. Al final añade un bloque JSON estructurado entre estos marcadores exactos:',
      'ACUARIONEXO_JSON_START',
      '{ JSON válido aquí }',
      'ACUARIONEXO_JSON_END',
      '',
      'REGLAS OBLIGATORIAS:',
      '- No inventes datos.',
      '- Contrasta cada dato importante con fuentes fiables.',
      '- Usa valores concretos cuando existan.',
      '- No uses: bajo, medio, alto, moderado, suele, normalmente ni aproximadamente.',
      '- No pongas URLs dentro de los apartados de texto visible.',
      '- El apartado Fuentes es obligatorio y debe ir al final de la ficha visible.',
      '- Fuentes debe tener mínimo 2 fuentes reales con URL completa.',
      '- Formato visible obligatorio de cada fuente: Nombre de fuente | URL completa | dato que justifica.',
      '- El JSON estructurado debe repetir esas mismas fuentes en sources[].',
      '- Si no encuentras URL real para una fuente, no la uses.',
      '- No elimines campos obligatorios.',
      '- No añadas claves internas fuera del JSON.',
      '- Cada campo de texto debe cumplir su mínimo de caracteres.',
      '- Cada campo numérico debe incluir un número o rango concreto.',
      '- Si un campo tiene valores permitidos, usa exactamente uno de esos valores.',
      '',
      'VALIDACIÓN QUE NO DEBE BLOQUEAR:',
      '- Comportamiento / behavior: mínimo 20 caracteres, texto concreto.',
      '- Alimentación / diet o feeding: mínimo 20 caracteres, texto concreto.',
      '- Reef safe / reef_safe: usar exactamente Sí, Sí con precaución o No. No usar "Con precaución".',
      '- Fuentes / sources: mínimo 2 URLs reales.',
      '',
      'COMPROBACIÓN FINAL OBLIGATORIA ANTES DE RESPONDER:',
      `- Verifica que title, summary y todos los apartados corresponden a «${concreteSubject}».`,
      ...(biologicalTypes.has(type) ? [`- Verifica que scientific_name sea exactamente "${concreteScientificName}" en el texto visible y en el JSON.`] : []),
      '- Verifica que behavior tenga 20 caracteres o más.',
      '- Verifica que diet o feeding tenga 20 caracteres o más.',
      '- Verifica que reef_safe coincida literalmente con un valor permitido.',
      '- Verifica que todas las claves numéricas tengan números reales.',
      '- Verifica que sources[] contenga como mínimo 2 URLs completas reales.',
      '- Verifica que no quede ningún null ni cadena vacía en campos obligatorios.',
      '',
      'FORMATO OBLIGATORIO DEL APARTADO FINAL VISIBLE:',
      'Fuentes:',
      '- Nombre de fuente | https://... | dato concreto que justifica',
      '- Nombre de fuente | https://... | dato concreto que justifica',
      '',
      'APARTADOS Y CAMPOS OBLIGATORIOS CON REGLAS:'
    ];
    template.forEach(section => {
      lines.push('', section.label);
      section.fields.forEach(field => lines.push(`- ${fieldLabel(field, type)} (${fieldRuleText(field)})`));
    });
    lines.push(
      '',
      'JSON OBLIGATORIO:',
      '- Debe ser JSON válido.',
      '- Debe ir solo entre ACUARIONEXO_JSON_START y ACUARIONEXO_JSON_END.',
      '- Debe usar entry_type exactamente como se indica.',
      '- Debe rellenar data con todas las claves indicadas.',
      ...(biologicalTypes.has(type) ? [`- scientific_name debe ser exactamente "${concreteScientificName}".`] : []),
      '- No dejes null ni cadenas vacías en campos obligatorios.',
      '- Si una fuente fiable no ofrece un dato opcional, escribe una explicación concreta admitida por el contrato; nunca inventes.',
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
    const rawSelected = type || (window.ANX.state.libraryFilter && window.ANX.state.libraryFilter !== 'all' ? window.ANX.state.libraryFilter : val('templateCopyType'));
    const selected = String(rawSelected || '').trim();
    const subject = val('templateCopySubject');
    const scientificName = val('templateCopyScientificName');
    const box = byId('templateCopyStatus');

    if (!selected || selected === 'all' || !S()?.CONTRACTS?.[selected]) {
      if (box) box.innerHTML = msg('Selecciona un tipo de ficha concreto. «Todo» no puede generar una ficha válida.', 'error');
      return;
    }
    if (!subject) {
      if (box) box.innerHTML = msg('Escribe el nombre común, comercial o modelo antes de copiar.', 'error');
      byId('templateCopySubject')?.focus();
      return;
    }
    if (biologicalTypes.has(selected) && !S.isConcreteSpecies(scientificName)) {
      if (box) box.innerHTML = msg('Escribe el nombre científico exacto con dos palabras, por ejemplo Centropyge acanthops.', 'error');
      byId('templateCopyScientificName')?.focus();
      return;
    }

    let text;
    try {
      text = templateText(selected, subject, scientificName);
    } catch (e) {
      if (box) box.innerHTML = msg(e.message || 'No se pudo generar la plantilla.', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      if (box) box.innerHTML = msg(`Plantilla de ${typeName(selected)} para «${subject}» copiada.`, 'success');
    } catch (e) {
      if (box) box.innerHTML = `<div class="notice"><b>No se pudo copiar automáticamente.</b><br>Selecciona y copia este texto:<textarea readonly>${esc(text)}</textarea></div>`;
    }
  };

  window.ANX.LibraryV3Template = {
    templateText,
    fieldRuleText,
    jsonSkeleton
  };
})();