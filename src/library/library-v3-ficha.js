/* AcuarioNexo · Biblioteca V3 fichas */
(function () {
  const { supabase, state, esc, byId, val, msg, render } = window.ANX;
  const { S, biologicalTypes, row, load, typeName, libraryInfoNotice } = window.ANX.LibraryV3Core;
  const { imageBox } = window.ANX.LibraryV3Images;
  const { call } = window.ANX.LibraryV3AI;

  function numberFrom(text) {
    const m = String(text || '').replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : '';
  }

  function sourceText(value) {
    const list = Array.isArray(value) ? value : [];
    return list.map(x => {
      if (typeof x === 'string') return x;
      return [x.name || x.title || '', x.url || '', x.used_for || ''].join(' | ');
    }).join('\n');
  }

  function parseSourcesRaw(text) {
    return String(text || '').split('\n').map(line => line.trim()).filter(Boolean).map((line, i) => {
      const parts = line.split('|').map(s => s.trim());
      const url = parts.find(p => /^https?:\/\//i.test(p)) || '';
      const name = parts.find(p => p && !/^https?:\/\//i.test(p)) || `Fuente ${i + 1}`;
      return { url, name, used_for: parts[2] || '' };
    }).filter(x => x.url);
  }

  function externalLinkFromEntry(x) {
    const raw = x?.data?.external_link || x?.data?.commercial_link || x?.external_link || x?.commercial_link || {};
    return {
      enabled: raw.enabled === true,
      provider: String(raw.provider || raw.name || '').trim(),
      url: String(raw.url || raw.product_url || '').trim(),
      button_label: String(raw.button_label || raw.button_text || 'Ver producto').trim() || 'Ver producto',
      link_type: String(raw.link_type || 'commercial').trim() || 'commercial',
      disclaimer: String(raw.disclaimer || '').trim(),
      sponsored: raw.sponsored === true,
      affiliate: raw.affiliate === true
    };
  }

  function readExternalLink() {
    const enabled = !!byId('libExternalEnabled')?.checked;
    const link = {
      enabled,
      provider: val('libExternalProvider').trim(),
      url: val('libExternalUrl').trim(),
      button_label: val('libExternalLabel').trim() || 'Ver producto',
      link_type: val('libExternalType').trim() || 'commercial',
      disclaimer: val('libExternalDisclaimer').trim(),
      sponsored: !!byId('libExternalSponsored')?.checked,
      affiliate: !!byId('libExternalAffiliate')?.checked
    };
    validateExternalLink(link);
    return link;
  }

  function validateExternalLink(link) {
    if (!link || link.enabled !== true) return true;
    if (!link.url) throw new Error('Enlace externo: activa el botón solo cuando exista una URL.');
    try {
      const parsed = new URL(link.url);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) throw new Error('invalid');
    } catch (_) {
      throw new Error('Enlace externo: la URL debe ser una dirección http o https válida.');
    }
    if (!String(link.button_label || '').trim()) throw new Error('Enlace externo: indica el texto del botón.');
    return true;
  }

  function read(x) {
    const d = { ...(x.data || {}) };
    S.templateFor(x.entry_type).forEach(sec => sec.fields.forEach(f => {
      if (f.id === 'sources') return;
      const el = byId(`libData_${f.id}`);
      if (el) d[f.id] = el.type === 'checkbox' ? el.checked : (f.type === 'number' ? numberFrom(el.value) : el.value.trim());
    }));
    d.external_link = readExternalLink();
    delete d.commercial_link;
    const tags = val('libTags').split(',').map(s => s.trim()).filter(Boolean);
    const sourcesRaw = parseSourcesRaw(val('libSourcesRaw'));
    return {
      title: val('libTitle'),
      scientific_name: biologicalTypes.has(x.entry_type) ? (val('libScientific') || null) : null,
      summary: val('libSummary'),
      data: d,
      sections: { ...(x.sections || {}), summary: val('libSummary') },
      tags,
      sources: sourcesRaw.length ? S.normalizeSources(sourcesRaw) : x.sources,
      updated_at: new Date().toISOString()
    };
  }

  function auditHtml(audit, limit = 8) {
    const errors = audit.errors || [];
    if (!errors.length) return msg('Ficha completa. No quedan campos obligatorios vacíos.', 'success');
    return `${msg(`Ficha bloqueada: quedan ${errors.length} campos obligatorios o reglas sin cumplir.`, 'error')}<ul class="small">${errors.slice(0, limit).map(error => `<li>${esc(error)}</li>`).join('')}</ul>${errors.length > limit ? `<p class="small">Y ${errors.length - limit} incidencias más.</p>` : ''}`;
  }

  function assertComplete(entry, actionLabel) {
    validateExternalLink(externalLinkFromEntry(entry));
    const audit = S.audit(entry);
    if (!audit.approved) {
      const error = new Error(`${actionLabel}: la ficha tiene campos obligatorios vacíos o inválidos.`);
      error.audit = audit;
      throw error;
    }
    return audit;
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[*#`_\[\](){}]/g, '').replace(/[:：]+$/, '').replace(/\s+/g, ' ').trim();
  }

  function fieldAliasMap(x) {
    const map = new Map();
    const add = (a, k) => { const n = norm(a); if (n && !map.has(n)) map.set(n, k); };
    [
      ['Nombre común','title'],['Nombre comun','title'],['Nombre','title'],['Producto','title'],['Modelo','title'],['Referencia','title'],
      ['Nombre científico','scientific_name'],['Nombre cientifico','scientific_name'],['Resumen','summary'],['Descripción','summary'],['Descripcion','summary'],
      ['Etiquetas','tags'],['Tags','tags'],['Fuentes','sources'],['Fuente','sources'],['Bibliografía','sources'],['Bibliografia','sources'],
      ['Temperatura','temperature'],['pH','ph'],['GH','gh'],['KH','kh'],['Salinidad','salinity'],['Nitrato','nitrate'],['Nitratos','nitrate'],
      ['Fosfato','phosphate'],['Fosfatos','phosphate'],['Calcio','calcium'],['Magnesio','magnesium'],
      ['Acuario mínimo','minimum_tank_liters'],['Acuario minimo','minimum_tank_liters'],['Litros mínimos','minimum_tank_liters'],['Litros minimos','minimum_tank_liters'],
      ['Acuario recomendado','recommended_tank_liters'],['Litros recomendados','recommended_tank_liters'],['Tamaño adulto','adult_size_cm'],['Tamano adulto','adult_size_cm'],
      ['Hábitat natural','habitat'],['Habitat natural','habitat'],['Hábitat','habitat'],['Habitat','habitat'],['Entorno natural','natural_environment'],['Distribución','distribution'],['Distribucion','distribution'],['Profundidad','depth_range'],
      ['Alimentación','diet'],['Alimentacion','diet'],['Dieta','diet'],['Comportamiento','behavior'],['Compatibilidad','compatibility'],['Compatibilidad con peces','fish_compatibility'],['Compatibilidad con corales','coral_compatibility'],['Compatibilidad con invertebrados','invertebrate_compatibility'],
      ['Reef safe','reef_safe'],['Salud','health_notes'],['Enfermedades','common_diseases'],['Problemas frecuentes','common_problems'],['Errores frecuentes','common_mistakes'],['Antes de comprar','purchase_recommendations'],['Curiosidades','curiosities'],['Notas para IA','ai_notes'],['Notas para la IA','ai_notes'],['Resumen para usuario','user_summary'],['Agresividad','aggressiveness'],['Territorialidad','territoriality'],['Reproducción','reproduction'],['Reproduccion','reproduction'],['Etiqueta de fuente','source_label'],['Manual / fuente técnica','source_manual']
    ].forEach(([a, b]) => add(a, b));
    try { S.templateFor(x.entry_type).forEach(sec => sec.fields.forEach(f => { add(f.id, f.id); add(f.label, f.id); })); } catch (_) {}
    return map;
  }

  function setText(id, text) {
    const el = byId(id);
    if (el) { el.value = text; return true; }
    return false;
  }

  function rangeValues(text) {
    return String(text || '').replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/g) || [];
  }

  function setDataField(key, text) {
    const value = String(text || '').trim();
    if (!value) return false;
    let done = false;
    const set = (k, v) => { const el = byId(`libData_${k}`); if (!el) return false; el.value = v; done = true; return true; };
    if (['temperature','ph','gh','kh','salinity','calcium','magnesium'].includes(key)) {
      const nums = rangeValues(value);
      set(`${key}_min`, nums[0] || value);
      set(`${key}_max`, nums[1] || nums[0] || value);
      return done;
    }
    if (key === 'nitrate' || key === 'phosphate') {
      const nums = rangeValues(value);
      set(`${key}_max`, nums[nums.length - 1] || value);
      return done;
    }
    if (/(_cm|_liters|_years|_days|_watts|grams_per_liter|reading_time|sample_volume)$/.test(key)) return set(key, numberFrom(value) || value);
    const el = byId(`libData_${key}`);
    if (el) {
      if (el.tagName === 'SELECT') {
        const opt = [...el.options].find(o => norm(o.value) === norm(value) || norm(o.textContent) === norm(value));
        el.value = opt ? opt.value : value;
      } else el.value = value;
      return true;
    }
    return false;
  }

  function extractStructuredJson(text) {
    const raw = String(text || '');
    const marked = raw.match(/ACUARIONEXO_JSON_START\s*([\s\S]*?)\s*ACUARIONEXO_JSON_END/i);
    const jsonText = marked ? marked[1] : (raw.trim().startsWith('{') ? raw.trim() : '');
    if (!jsonText) return null;
    try {
      const parsed = JSON.parse(jsonText);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function structuredPayload(parsed, fallback) {
    const entryType = String(parsed.entry_type || fallback.entry_type || '').trim();
    if (!entryType || !S.CONTRACTS[entryType]) throw new Error(`Tipo de ficha no permitido: ${entryType || 'vacío'}.`);
    const sources = S.normalizeSources(parsed.sources || []);
    const parsedData = parsed.data && typeof parsed.data === 'object' ? { ...parsed.data } : {};
    const importedExternalLink = parsed.external_link || parsed.commercial_link || parsedData.external_link || parsedData.commercial_link;
    if (importedExternalLink && typeof importedExternalLink === 'object') {
      parsedData.external_link = externalLinkFromEntry({ data: { external_link: importedExternalLink } });
      validateExternalLink(parsedData.external_link);
    }
    delete parsedData.commercial_link;
    const payload = {
      entry_type: entryType,
      title: String(parsed.title || fallback.title || '').trim(),
      scientific_name: biologicalTypes.has(entryType) ? (parsed.scientific_name || null) : null,
      summary: String(parsed.summary || parsed.sections?.summary || '').trim(),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(tag => String(tag).trim()).filter(Boolean) : [],
      data: parsedData,
      sections: parsed.sections && typeof parsed.sections === 'object' ? parsed.sections : {},
      sources,
      identity_confirmed: true,
      status: fallback.status || 'review',
      updated_at: new Date().toISOString()
    };
    if (!payload.sections.summary && payload.summary) payload.sections.summary = payload.summary;
    return payload;
  }

  async function applyStructuredJson(id, parsed, x, box) {
    const payload = structuredPayload(parsed, x);
    const merged = { ...x, ...payload };
    const { error } = await supabase.from('library_entries').update(payload).eq('id', id).eq('user_id', state.user.id);
    if (error) throw error;
    Object.assign(x, payload);
    await load();
    formFicha(id);
    const refreshed = row(id) || merged;
    const audit = S.audit(refreshed);
    const statusBox = byId('x') || box;
    if (statusBox) statusBox.innerHTML = audit.approved
      ? msg(`JSON importado como ${typeName(payload.entry_type)}. Ficha completa.`, 'success')
      : `${msg(`JSON importado como ${typeName(payload.entry_type)}, pero quedan campos pendientes.`, 'error')}${auditHtml(audit, 10)}`;
  }

  function splitPastedFicha(text, x) {
    const aliases = fieldAliasMap(x), blocks = {}, urls = [];
    let current = '';
    String(text || '').split('\n').forEach(raw => {
      const line = raw.trim();
      const found = line.match(/https?:\/\/\S+/gi);
      if (found) found.forEach(u => urls.push(u.replace(/[.,;]+$/, '')));
      if (!line || line.startsWith('```')) return;
      const clean = line.replace(/^[-*•]\s*/, '').trim();
      const parts = clean.split(/[:：]/);
      let head = '', body = '';
      if (parts.length > 1) { head = norm(parts.shift()); body = parts.join(':').trim(); }
      else head = norm(clean);
      const key = aliases.get(head);
      if (key) {
        current = key;
        if (body) blocks[current] = [blocks[current], body].filter(Boolean).join('\n');
        return;
      }
      if (current) blocks[current] = [blocks[current], clean].filter(Boolean).join('\n');
    });
    return { blocks, urls };
  }

  window.mostrarPegadoFichaChat = function (id) {
    const target = byId('chatPasteBox');
    if (!target) return;
    target.innerHTML = `<section class="panel"><h3>Pegar ficha creada por ChatGPT</h3><p class="small">Pega la ficha completa con el bloque JSON de AcuarioNexo. Si el JSON trae entry_type, se actualizará el tipo de ficha.</p><textarea id="chatPasteText" placeholder="Pega aquí la ficha completa"></textarea><button class="primary" onclick="aplicarFichaChat('${esc(id)}')">Importar ficha</button><button onclick="document.getElementById('chatPasteBox').innerHTML=''">Cerrar</button><div id="chatPasteStatus"></div></section>`;
  };

  window.aplicarFichaChat = async function (id) {
    const x = row(id), box = byId('chatPasteStatus');
    try {
      if (!x) throw new Error('Ficha no encontrada.');
      const pasted = val('chatPasteText');
      const parsed = extractStructuredJson(pasted);
      if (parsed) {
        if (box) box.innerHTML = msg('Importando JSON estructurado...');
        await applyStructuredJson(id, parsed, x, box);
        return;
      }
      const { blocks, urls } = splitPastedFicha(pasted, x);
      let count = 0;
      Object.entries(blocks).forEach(([key, value]) => {
        if (key === 'title' && setText('libTitle', value)) count++;
        else if (key === 'scientific_name' && biologicalTypes.has(x.entry_type) && setText('libScientific', value)) count++;
        else if (key === 'summary' && setText('libSummary', value)) count++;
        else if (key === 'tags' && setText('libTags', String(value).split(/[,;\n]/).map(s => s.trim()).filter(Boolean).join(', '))) count++;
        else if (key === 'sources') { const existing = val('libSourcesRaw'); setText('libSourcesRaw', [existing, value].filter(Boolean).join('\n')); count++; }
        else if (setDataField(key, value)) count++;
      });
      if (urls.length) {
        const existing = val('libSourcesRaw');
        const extra = urls.map((u, i) => `Fuente ${i + 1} | ${u} | Ficha pegada desde Chat`).join('\n');
        setText('libSourcesRaw', [existing, extra].filter(Boolean).join('\n'));
        count++;
      }
      if (!count) throw new Error('No pude reconocer apartados. Pega el bloque ACUARIONEXO_JSON_START completo o usa títulos como Nombre común:, Producto:, Temperatura:, Fuentes:.');
      if (box) box.innerHTML = msg(`Ficha repartida: ${count} campos rellenados. Revisa, guarda y audita.`, 'success');
    } catch (e) {
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  function emptyHint() { return '<p class="small field-empty-warning">Pendiente de completar.</p>'; }

  function formFields(x) {
    return S.templateFor(x.entry_type).map(sec => `<fieldset><legend>${esc(sec.label)}</legend>${sec.fields.map(f => {
      if (f.id === 'sources') return '';
      const raw = x.data?.[f.id] ?? x[f.id] ?? '';
      const value = f.type === 'number' ? (numberFrom(raw) || '') : raw;
      const common = `id="libData_${esc(f.id)}"`;
      if (f.type === 'number') return `<label>${esc(f.label)}</label><input ${common} type="number" step="any" value="${esc(value)}">${value === '' || value == null ? emptyHint() : ''}`;
      return `<label>${esc(f.label)}</label><textarea ${common} placeholder="Pendiente de completar">${esc(value)}</textarea>${value === '' || value == null ? emptyHint() : ''}`;
    }).join('')}</fieldset>`).join('');
  }

  function externalLinkFields(x) {
    const link = externalLinkFromEntry(x);
    return `<fieldset><legend>Enlace externo opcional</legend>
      <p class="small">El botón permanece oculto mientras no esté activado. No guarda precios ni implica patrocinio.</p>
      <label><input id="libExternalEnabled" type="checkbox" ${link.enabled ? 'checked' : ''}> Mostrar botón externo</label>
      <label>Proveedor o destino</label><input id="libExternalProvider" value="${esc(link.provider)}" placeholder="Power Aquaculture">
      <label>URL directa</label><input id="libExternalUrl" type="url" value="${esc(link.url)}" placeholder="https://...">
      <label>Texto del botón</label><input id="libExternalLabel" value="${esc(link.button_label)}" placeholder="Ver producto">
      <label>Tipo de enlace</label><select id="libExternalType"><option value="commercial" ${link.link_type === 'commercial' ? 'selected' : ''}>Comercial</option><option value="reference" ${link.link_type === 'reference' ? 'selected' : ''}>Referencia</option><option value="partner" ${link.link_type === 'partner' ? 'selected' : ''}>Colaborador</option></select>
      <label>Aviso visible</label><textarea id="libExternalDisclaimer" placeholder="Consulta precio y disponibilidad en la web de destino.">${esc(link.disclaimer)}</textarea>
      <label><input id="libExternalSponsored" type="checkbox" ${link.sponsored ? 'checked' : ''}> Contenido patrocinado</label>
      <label><input id="libExternalAffiliate" type="checkbox" ${link.affiliate ? 'checked' : ''}> Enlace de afiliación</label>
    </fieldset>`;
  }

  function scientificField(x) {
    return biologicalTypes.has(x.entry_type) ? `<label>Nombre científico</label><input id="libScientific" value="${esc(x.scientific_name || '')}">` : '';
  }

  function returnToLibrarySource() {
    if (state.libraryAdminReturn && state.isAdmin) return adminPanel();
    return biblioteca();
  }

  function backButton() {
    return state.libraryAdminReturn && state.isAdmin
      ? '<button onclick="ANX.LibraryV3Ficha.returnToLibrarySource()">← Panel de administración</button>'
      : '<button onclick="ANX.LibraryV3Ficha.returnToLibrarySource()">← Biblioteca</button>';
  }

  window.formFicha = function (id) {
    const x = row(id);
    if (!x) return returnToLibrarySource();
    const audit = S.audit(x);
    render(`<section class="panel">${libraryInfoNotice()}${backButton()}<h2>Editar ficha</h2>${audit.approved ? '' : auditHtml(audit, 6)}<button class="primary" onclick="mostrarPegadoFichaChat('${esc(id)}')">Pegar ficha del Chat</button> <button onclick="copiarApartadosFicha('${esc(x.entry_type)}')">Copiar apartados</button><div id="chatPasteBox"></div>${imageBox(x)}<label>Nombre</label><input id="libTitle" value="${esc(x.title || '')}">${scientificField(x)}<label>Resumen</label><textarea id="libSummary" placeholder="Pendiente de completar">${esc(x.summary || '')}</textarea>${!x.summary ? emptyHint() : ''}<label>Etiquetas</label><input id="libTags" value="${esc((x.tags || []).join(', '))}"><label>Fuentes editables</label><textarea id="libSourcesRaw" placeholder="Nombre | URL | dato que justifica">${esc(sourceText(x.sources))}</textarea>${S.normalizeSources(x.sources).length < 2 ? emptyHint() : ''}${externalLinkFields(x)}${formFields(x)}<button class="primary" onclick="guardarFicha('${esc(id)}')">Guardar ficha completa</button><button onclick="auditarFicha('${esc(id)}')">Auditar ficha</button><div id="x"></div></section>`, 'biblioteca');
  };

  window.guardarFicha = async function (id) {
    const x = row(id), box = byId('x');
    try {
      const payload = read(x);
      const merged = { ...x, ...payload };
      assertComplete(merged, 'No se puede guardar');
      const { error } = await supabase.from('library_entries').update(payload).eq('id', id).eq('user_id', state.user.id);
      if (error) throw error;
      Object.assign(x, payload);
      box.innerHTML = msg('Ficha guardada completa.', 'success');
    } catch (e) {
      box.innerHTML = e.audit ? auditHtml(e.audit) : msg(e.message, 'error');
    }
  };

  window.auditarFicha = async function (id) {
    const x = row(id), box = byId('x') || byId('aiBox');
    try {
      if (!x) throw new Error('Ficha no encontrada.');
      assertComplete(x, 'No se puede auditar');
      box.innerHTML = msg('Auditando ficha...');
      const data = await call('library-audit-card', { entry_id: id });
      box.innerHTML = `${data.result?.approved ? msg('Ficha aprobada.', 'success') : msg('Ficha requiere revisión.', 'error')}<pre>${esc(JSON.stringify(data.result, null, 2))}</pre>`;
      await load();
    } catch (e) {
      box.innerHTML = e.audit ? auditHtml(e.audit) : msg(e.message, 'error');
    }
  };

  window.publicarFicha = async function (id) {
    const x = row(id), box = byId('x') || byId('aiBox');
    try {
      if (!x) throw new Error('Ficha no encontrada.');
      assertComplete(x, 'No se puede publicar');
      await call('library-publish', { entry_id: id });
      await returnToLibrarySource();
    } catch (e) {
      if (box) box.innerHTML = e.audit ? auditHtml(e.audit) : msg(e.message, 'error');
    }
  };

  window.borrarFicha = async function (id) {
    if (!confirm('¿Borrar ficha?')) return;
    const { error } = await supabase.from('library_entries').delete().eq('id', id).eq('user_id', state.user.id);
    if (error) return alert(error.message);
    await returnToLibrarySource();
  };

  window.ANX.LibraryV3Ficha = {
    auditHtml,
    assertComplete,
    numberFrom,
    sourceText,
    externalLinkFromEntry,
    validateExternalLink,
    returnToLibrarySource
  };
})();
