/* AcuarioNexo · Biblioteca V3 plantillas */
(function () {
  const { byId, val, msg, esc } = window.ANX;
  const { S, typeName } = window.ANX.LibraryV3Core;

  function templateText(type) {
    const template = S.templateFor(type);
    const lines = [
      `Crea una ficha completa de ${typeName(type)} para AcuarioNexo.`,
      '',
      'Reglas obligatorias:',
      '- No inventes datos.',
      '- Contrasta cada dato importante con fuentes fiables.',
      '- Usa valores concretos cuando existan.',
      '- No uses: bajo, medio, alto, moderado, suele, normalmente ni aproximadamente.',
      '- No incluyas JSON ni nombres de campos internos.',
      '- No pongas URLs dentro de los apartados de texto.',
      '- El apartado Fuentes es obligatorio y debe ir al final.',
      '- Fuentes debe tener minimo 2 fuentes reales con URL completa.',
      '- Formato obligatorio de cada fuente: Nombre de fuente | URL completa | dato que justifica.',
      '- Si no encuentras URL real para una fuente, no la uses.',
      '',
      'Formato obligatorio del apartado final:',
      'Fuentes:',
      '- Nombre de fuente | https://... | dato concreto que justifica',
      '- Nombre de fuente | https://... | dato concreto que justifica',
      '',
      'Apartados obligatorios:'
    ];
    template.forEach(section => {
      lines.push('', section.label);
      section.fields.forEach(field => lines.push(`- ${field.label}`));
    });
    return lines.join('\n');
  }

  window.copiarApartadosFicha = async function (type) {
    const selected = type || (window.ANX.state.libraryFilter && window.ANX.state.libraryFilter !== 'all' ? window.ANX.state.libraryFilter : val('templateCopyType') || 'pez_marino');
    const text = templateText(selected);
    const box = byId('templateCopyStatus');
    try {
      await navigator.clipboard.writeText(text);
      if (box) box.innerHTML = msg(`Apartados de ${typeName(selected)} copiados. Pégalos en el chat.`, 'success');
    } catch (e) {
      if (box) box.innerHTML = `<div class="notice"><b>No se pudo copiar automáticamente.</b><br>Selecciona y copia este texto:<textarea readonly>${esc(text)}</textarea></div>`;
    }
  };

  window.ANX.LibraryV3Template = {
    templateText
  };
})();
