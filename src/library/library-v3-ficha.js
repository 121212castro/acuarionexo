/* AcuarioNexo · Biblioteca V3 fichas */
(function () {
  const { supabase, state, esc, byId, val, msg, render } = window.ANX;
  const { S, biologicalTypes, row, load, sources, typeName, statusName, libraryInfoNotice } = window.ANX.LibraryV3Core;
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

  function read(x) {
    const d = { ...(x.data || {}) };
    S.templateFor(x.entry_type).forEach(sec => sec.fields.forEach(f => {
      if (f.id === 'sources') return;
      const el = byId(`libData_${f.id}`);
      if (el) d[f.id] = el.type === 'checkbox' ? el.checked : (f.type === 'number' ? numberFrom(el.value) : el.value.trim());
    }));
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
      ['Reef safe','reef_safe'],['Salud','health_notes'],['Enfermedades','common_diseases'],['Problemas frecuentes','common_problems'],['Errores frecuentes','common_mistakes'],['Antes de comprar','purchase_recommendations'],['Curiosidades','curiosities'],['Notas para IA','ai_notes'],['Notas para la IA','ai_notes'],['Resumen para usuario','user_summary'],['Agresividad','aggressiveness'],['Territorialidad','territoriality'],['Reproducción','reproduction'],['Reproduccion','reproduction']
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
    target.innerHTML = `<section class="panel"><h3>Pegar ficha creada por ChatGPT</h3><p class="small">Pega la ficha completa con los apartados copiados. Se intentará repartir cada dato en su campo.</p><textarea id="chatPasteText" placeholder="Pega aquí la ficha completa"></textarea><button class="primary" onclick="aplicarFichaChat('${esc(id)}')">Repartir en campos</button><button onclick="document.getElementById('chatPasteBox').innerHTML=''">Cerrar</button><div id="chatPasteStatus"></div></section>`;
  };

  window.aplicarFichaChat = function (id) {
    const x = row(id), box = byId('chatPasteStatus');
    try {
      if (!x) throw new Error('Ficha no encontrada.');
      const { blocks, urls } = splitPastedFicha(val('chatPasteText'), x);
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
      if (!count) throw new Error('No pude reconocer apartados. Usa títulos como Nombre común:, Producto:, Temperatura:, Fuentes:.');
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

  function scientificField(x) {
    return biologicalTypes.has(x.entry_type) ? `<label>Nombre científico</label><input id="libScientific" value="${esc(x.scientific_name || '')}">` : '';
  }

  window.formFicha = function (id) {
    const x = row(id);
    if (!x) return biblioteca();
    render(`<section class="panel">${libraryInfoNotice()}<button onclick="biblioteca()">← Biblioteca</button><h2>Editar ficha</h2><button class="primary" onclick="mostrarPegadoFichaChat('${esc(id)}')">Pegar ficha del Chat</button> <button onclick="copiarApartadosFicha('${esc(x.entry_type)}')">Copiar apartados</button><div id="chatPasteBox"></div>${imageBox(x)}<label>Nombre</label><input id="libTitle" value="${esc(x.title || '')}">${scientificField(x)}<label>Resumen</label><textarea id="libSummary" placeholder="Pendiente de completar">${esc(x.summary || '')}</textarea>${!x.summary ? emptyHint() : ''}<label>Etiquetas</label><input id="libTags" value="${esc((x.tags || []).join(', '))}"><label>Fuentes editables</label><textarea id="libSourcesRaw" placeholder="Nombre | URL | dato que justifica">${esc(sourceText(x.sources))}</textarea>${!S.normalizeSources(x.sources).length ? emptyHint() : ''}${formFields(x)}<button class="primary" onclick="guardarFicha('${esc(id)}')">Guardar</button><button onclick="auditarFicha('${esc(id)}')">Auditar ficha</button><div id="x"></div></section>`, 'biblioteca');
  };

  window.guardarFicha = async function (id) {
    const x = row(id), box = byId('x');
    try {
      const payload = read(x);
      const { error } = await supabase.from('library_entries').update(payload).eq('id', id).eq('user_id', state.user.id);
      if (error) throw error;
      Object.assign(x, payload);
      box.innerHTML = msg('Ficha guardada.', 'success');
    } catch (e) {
      box.innerHTML = msg(e.message, 'error');
    }
  };

  window.auditarFicha = async function (id) {
    const box = byId('x') || byId('aiBox');
    try {
      box.innerHTML = msg('Auditando ficha...');
      const data = await call('library-audit-card', { entry_id: id });
      box.innerHTML = `${data.result?.approved ? msg('Ficha aprobada.', 'success') : msg('Ficha requiere revisión.', 'error')}<pre>${esc(JSON.stringify(data.result, null, 2))}</pre>`;
      await load();
    } catch (e) {
      box.innerHTML = msg(e.message, 'error');
    }
  };

  window.verFicha = function (id) {
    const x = row(id);
    if (!x) return biblioteca();
    const audit = S.audit(x);
    render(`<section class="library-detail">${libraryInfoNotice()}<button onclick="biblioteca()">← Biblioteca</button><small>${esc(typeName(x.entry_type))} · ${esc(statusName(x.status))}</small><h2>${esc(x.title || 'Ficha')}</h2>${x.scientific_name ? `<p class="scientific">${esc(x.scientific_name)}</p>` : ''}${x.cover_url ? `<img class="library-detail-photo" src="${esc(x.cover_url)}" alt="${esc(x.title || 'Portada')}">` : ''}${x.photo_url ? `<img class="library-detail-photo" src="${esc(x.photo_url)}" alt="${esc(x.title || 'Foto')}">` : ''}<p>${esc(x.summary || '')}</p>${imageBox(x)}${audit.approved ? msg('Ficha completa y lista para publicar.', 'success') : msg('Ficha pendiente: ' + audit.errors.slice(0,3).join(' · '), 'error')}<div class="image-actions"><button onclick="formFicha('${esc(id)}')">Editar</button><button onclick="pasarFichaAInventario('${esc(id)}')">Añadir a mi inventario</button><button onclick="publicarFicha('${esc(id)}')">Publicar</button><button onclick="borrarFicha('${esc(id)}')">Borrar</button></div><h3>Fuentes</h3>${sources(x.sources)}</section>`, 'biblioteca');
  };

  window.publicarFicha = async function (id) {
    const box = byId('x') || byId('aiBox');
    try { await call('library-publish', { entry_id: id }); await biblioteca(); }
    catch (e) { if (box) box.innerHTML = msg(e.message, 'error'); }
  };

  window.borrarFicha = async function (id) {
    if (!confirm('¿Borrar ficha?')) return;
    const { error } = await supabase.from('library_entries').delete().eq('id', id).eq('user_id', state.user.id);
    if (error) return alert(error.message);
    await biblioteca();
  };

  const legacyPass = window.pasarFichaAInventario, legacyForm = window.formImportarFichaInventario, legacySave = window.guardarImportacionFichaInventario;
  if (typeof legacyPass === 'function') window.pasarFichaAInventario = legacyPass;
  if (typeof legacyForm === 'function') window.formImportarFichaInventario = legacyForm;
  if (typeof legacySave === 'function') window.guardarImportacionFichaInventario = legacySave;

  window.ANX.LibraryV3Ficha = {
    numberFrom,
    sourceText,
    parseSourcesRaw,
    read,
    norm,
    fieldAliasMap,
    splitPastedFicha,
    formFields
  };
})();
