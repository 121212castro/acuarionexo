/* AcuarioNexo · Ficha JSON estructurado */
(function () {
  const START = 'ACUARIONEXO_JSON_START';
  const END = 'ACUARIONEXO_JSON_END';

  function A() { return window.ANX || {}; }
  function S() { return A().LibrarySchema; }
  function esc(v) { return A().esc ? A().esc(v) : String(v ?? ''); }
  function byId(id) { return document.getElementById(id); }
  function val(id) { return byId(id)?.value || ''; }
  function msg(text, type) { return A().msg ? A().msg(text, type) : `<div class="${type || 'notice'}">${esc(text)}</div>`; }

  const TYPES = [
    ['pez_marino', 'Pez marino'], ['pez_dulce', 'Pez de agua dulce'], ['coral', 'Coral'],
    ['invertebrado', 'Invertebrado'], ['planta', 'Planta'], ['microfauna', 'Microfauna'],
    ['producto', 'Producto'], ['medicamento', 'Medicamento'], ['sal', 'Sal'], ['aditivo', 'Aditivo'],
    ['alimento', 'Alimento'], ['test', 'Test'], ['equipamiento', 'Equipamiento']
  ];
  const LABELS = Object.fromEntries(TYPES);
  function typeName(type) { return LABELS[type] || type || 'Ficha'; }

  function normalizeJsonText(text) {
    return String(text || '')
      .replace(/^\uFEFF/, '')
      .replace(/[\u201C\u201D\u2033]/g, '"')
      .replace(/[\u2018\u2019\u2032]/g, "'")
      .replace(/\u00A0/g, ' ')
      .replace(/,\s*([}\]])/g, '$1')
      .trim();
  }

  function parseStructuredJson(text) {
    const raw = String(text || '').trim();
    try { return JSON.parse(raw); }
    catch (firstError) {
      const repaired = normalizeJsonText(raw);
      try { return JSON.parse(repaired); }
      catch (secondError) {
        secondError.message = `${secondError.message}. Revisa que el bloque entre ${START} y ${END} use comillas dobles rectas y no texto visible dentro del JSON.`;
        throw secondError;
      }
    }
  }

  function extractJsonBlock(text) {
    const raw = String(text || '');
    const start = raw.indexOf(START);
    const end = raw.indexOf(END);
    if (start === -1 || end === -1 || end <= start) return null;
    return parseStructuredJson(raw.slice(start + START.length, end));
  }

  function normalizePayload(payload, selectedType) {
    const p = payload || {};
    const data = p.data && typeof p.data === 'object' ? p.data : {};
    const sections = p.sections && typeof p.sections === 'object' ? p.sections : {};
    const sources = Array.isArray(p.sources) ? p.sources : [];
    const tags = Array.isArray(p.tags) ? p.tags : String(p.tags || '').split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
    const summary = String(p.summary || sections.summary || data.user_summary || '').trim();
    return {
      title: String(p.title || data.title || '').trim(),
      scientific_name: String(p.scientific_name || data.scientific_name || '').trim() || null,
      entry_type: String(p.entry_type || selectedType || 'pez_marino').trim(),
      summary,
      data,
      sections: { ...sections, summary },
      tags,
      sources
    };
  }

  function jsonTemplate(type) {
    const fields = S().templateFor(type).flatMap(section => section.fields.map(field => field.id));
    const dataShape = {};
    fields.forEach(field => { if (!['title', 'scientific_name', 'sources'].includes(field)) dataShape[field] = ''; });
    return JSON.stringify({
      title: '',
      scientific_name: '',
      entry_type: type,
      summary: '',
      tags: [],
      data: dataShape,
      sections: { summary: '' },
      sources: [
        { name: '', url: 'https://...', used_for: '' },
        { name: '', url: 'https://...', used_for: '' },
        { name: '', url: 'https://...', used_for: '' }
      ]
    }, null, 2);
  }

  function templateText(type) {
    const lines = [
      `Crea una ficha completa de ${typeName(type)} para AcuarioNexo.`,
      '',
      'SALIDA OBLIGATORIA:',
      '1. Primero escribe la ficha visible para una persona, con apartados claros.',
      '2. Al final añade un bloque JSON estructurado entre estos marcadores exactos:',
      START,
      '{ JSON válido aquí }',
      END,
      '',
      'REGLAS OBLIGATORIAS:',
      '- No inventes datos.',
      '- No des por válido ningún dato, formato, compatibilidad, código, procedimiento, valor, nombre, versión o característica antes de comprobarlo en una fuente fiable aplicable al producto, organismo o equipo exacto.',
      '- No aceptes "No localizado" como respuesta rápida en productos consolidados. Antes de dejar un campo sin dato, amplía la búsqueda a fabricante, manuales actuales y antiguos, fichas técnicas, fichas de seguridad, distribuidores especializados, documentación archivada y fuentes técnicas independientes.',
      '- Cuando varias fuentes difieran, identifica la versión exacta del producto y usa los datos que correspondan a esa versión; no mezcles instrucciones, reactivos, escalas ni códigos de versiones distintas.',
      '- Contrasta cada dato importante con fuentes fiables.',
      '- Usa valores concretos cuando existan.',
      '- No uses: bajo, medio, alto, moderado, suele, normalmente ni aproximadamente.',
      '- No pongas URLs dentro de los apartados de texto visible.',
      '- El apartado Fuentes es obligatorio y debe ir al final de la ficha visible.',
      '- Fuentes debe tener mínimo 3 fuentes reales con URL completa: una oficial o primaria, una base especializada adecuada a la categoría y una tercera fuente fiable.',
      '- Formato visible obligatorio de cada fuente: Nombre de fuente | URL completa | dato que justifica.',
      '- El JSON estructurado debe repetir esas mismas fuentes en sources[].',
      '- Si no encuentras URL real para una fuente, no la uses.',
      '- Los campos técnicos no pueden limitarse a una palabra genérica cuando admitan una descripción completa.',
      '- El campo parameter debe explicar qué se mide, en qué medio y cómo se expresa cuando corresponda; no uses únicamente etiquetas como pH, calcio, nitrato, fosfato o temperatura.',
      '- Antes de entregar la ficha, comprueba que la ficha visible y el JSON contienen los mismos datos, que todos los campos obligatorios están desarrollados con información verificada y que el JSON es válido.',
      '',
      'APARTADOS VISIBLES OBLIGATORIOS:'
    ];
    S().templateFor(type).forEach(section => {
      lines.push('', section.label);
      section.fields.forEach(field => lines.push(`- ${field.label}`));
    });
    lines.push('', 'JSON ESTRUCTURADO OBLIGATORIO:', START, jsonTemplate(type), END);
    return lines.join('\n');
  }

  window.copiarApartadosFicha = async function (type) {
    const state = A().state || {};
    const selected = type || (state.libraryFilter && state.libraryFilter !== 'all' ? state.libraryFilter : val('templateCopyType') || 'pez_marino');
    const text = templateText(selected);
    const box = byId('templateCopyStatus');
    try {
      await navigator.clipboard.writeText(text);
      if (box) box.innerHTML = msg(`Plantilla con JSON estructurado de ${typeName(selected)} copiada. Pégala en el chat.`, 'success');
    } catch (_) {
      if (box) box.innerHTML = `<div class="notice"><b>No se pudo copiar automáticamente.</b><br>Selecciona y copia este texto:<textarea readonly>${esc(text)}</textarea></div>`;
    }
  };

  const fallbackCrearFichaDesdeChat = window.crearFichaDesdeChat;
  window.crearFichaDesdeChat = async function () {
    const box = byId('chatCreateStatus');
    let payload = null;
    try { payload = extractJsonBlock(val('chatCreateText')); }
    catch (e) { if (box) box.innerHTML = msg(`El JSON estructurado no es válido: ${e.message}`, 'error'); return; }
    if (!payload) return typeof fallbackCrearFichaDesdeChat === 'function' ? fallbackCrearFichaDesdeChat() : undefined;
    try {
      const state = A().state;
      const supabase = A().supabase;
      if (!state?.user?.id) throw new Error('Sesión no disponible.');
      const parsed = normalizePayload(payload, val('chatCreateType') || payload.entry_type || 'pez_marino');
      if (!parsed.title) throw new Error('El JSON estructurado no trae title.');
      const normalizedSources = S().normalizeSources(parsed.sources);
      if (normalizedSources.length < 3) throw new Error('El JSON estructurado debe traer mínimo 3 fuentes reales con URL en sources.');
      const row = {
        user_id: state.user.id,
        title: parsed.title,
        scientific_name: parsed.scientific_name,
        entry_type: parsed.entry_type,
        status: 'review',
        visibility: 'private',
        summary: parsed.summary || null,
        sections: parsed.sections,
        data: parsed.data,
        tags: parsed.tags,
        identity_confirmed: true,
        confidence: null,
        identify_result: { source: 'chat_structured_json', identity_confirmed: true, title: parsed.title, scientific_name: parsed.scientific_name, entry_type: parsed.entry_type },
        sources: normalizedSources,
        ai_model: 'chat-structured-json',
        ai_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (box) box.innerHTML = msg('Creando ficha desde JSON estructurado...', 'notice');
      const { data, error } = await supabase.from('library_entries').insert(row).select('*').single();
      if (error) throw error;
      if (window.biblioteca) await window.biblioteca();
      if (window.formFicha) setTimeout(() => window.formFicha(data.id), 300);
      if (box) box.innerHTML = msg('Ficha creada desde JSON estructurado. Revisa fotos y audita.', 'success');
    } catch (e) {
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  window.ANX = window.ANX || {};
  window.ANX.LibraryStructuredJson = { START, END, extractJsonBlock, templateText };
})();
