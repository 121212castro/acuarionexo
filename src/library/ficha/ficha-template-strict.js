/* AcuarioNexo · plantilla estricta para fichas */
(function () {
  const labels = {
    pez_marino: 'Pez marino',
    pez_dulce: 'Pez de agua dulce',
    coral: 'Coral',
    invertebrado: 'Invertebrado',
    planta: 'Planta',
    microfauna: 'Microfauna',
    producto: 'Producto',
    medicamento: 'Medicamento',
    sal: 'Sal',
    aditivo: 'Aditivo',
    alimento: 'Alimento',
    test: 'Test',
    equipamiento: 'Equipamiento'
  };

  function byId(id) { return document.getElementById(id); }
  function typeName(type) { return labels[type] || type || 'Ficha'; }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  function selectedType(type) {
    if (type) return type;
    if (window.state && window.state.libraryFilter && window.state.libraryFilter !== 'all') return window.state.libraryFilter;
    return byId('templateCopyType')?.value || 'pez_marino';
  }

  function strictTemplate(type) {
    const schema = window.ANX && window.ANX.LibrarySchema;
    const template = schema && typeof schema.templateFor === 'function' ? schema.templateFor(type) : [];
    const lines = [
      'Crea una ficha completa de ' + typeName(type) + ' para AcuarioNexo.',
      '',
      'REGLAS OBLIGATORIAS',
      '- No inventes datos.',
      '- Contrasta la ficha con varias fuentes fiables antes de responder.',
      '- Usa minimo 3 fuentes reales cuando existan: taxonomica/oficial, tecnica/cientifica y acuariofilia reconocida.',
      '- Si es producto, usa fabricante, manual o ficha tecnica oficial como fuente principal.',
      '- Usa valores concretos con unidades cuando existan.',
      '- No uses: bajo, medio, alto, moderado, suele, normalmente ni aproximadamente.',
      '- No dejes apartados vacios.',
      '- Si un dato no aparece en fuentes fiables, escribe: No encontrado en fuentes verificables.',
      '- Cada apartado debe ser util para el usuario y para la IA de AcuarioNexo.',
      '- No incluyas JSON ni nombres de campos internos.',
      '- No pongas URLs dentro de los apartados de texto.',
      '- Las URLs van solo al final en Fuentes.',
      '',
      'FORMATO OBLIGATORIO',
      '- Respeta todos los titulos y todos los puntos.',
      '- Escribe cada titulo en una linea independiente.',
      '- Debajo de cada punto escribe un valor claro, concreto y verificable.',
      '- No respondas con explicaciones fuera de la ficha.',
      '',
      'CONTROL ANTES DE ENTREGAR',
      '- Comprueba que todos los apartados tienen contenido.',
      '- Comprueba que los parametros tienen unidades.',
      '- Comprueba que la compatibilidad sirve para decidir si encaja en el acuario.',
      '- Comprueba que riesgos y errores frecuentes son accionables.',
      '- Comprueba que Fuentes incluye URLs reales completas.',
      '',
      'APARTADOS OBLIGATORIOS'
    ];

    template.forEach(function (section) {
      lines.push('', section.label);
      (section.fields || []).forEach(function (field) {
        if (field.id === 'sources') return;
        lines.push(field.label + ':');
        lines.push('[Rellenar con dato concreto. Si no existe dato verificable: No encontrado en fuentes verificables.]');
      });
    });

    lines.push('', 'Fuentes:');
    lines.push('- Nombre de fuente | https://... | dato concreto que justifica');
    lines.push('- Nombre de fuente | https://... | dato concreto que justifica');
    lines.push('- Nombre de fuente | https://... | dato concreto que justifica');
    return lines.join('\n');
  }

  window.copiarApartadosFicha = async function (type) {
    const typeId = selectedType(type);
    const text = strictTemplate(typeId);
    const box = byId('templateCopyStatus');
    try {
      await navigator.clipboard.writeText(text);
      if (box) box.innerHTML = '<div class="success">Plantilla completa de ' + escapeHtml(typeName(typeId)) + ' copiada. Incluye todos los apartados, varias fuentes y control de calidad.</div>';
    } catch (e) {
      if (box) box.innerHTML = '<div class="notice"><b>No se pudo copiar automaticamente.</b><br>Selecciona y copia este texto:<textarea readonly>' + escapeHtml(text) + '</textarea></div>';
    }
  };
})();
