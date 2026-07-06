/* AcuarioNexo · fix importador ficha Chat: JSON + etiqueta de fuente */
(function () {
  function A() { return window.ANX || {}; }
  function C() { return A().LibraryV3Core || {}; }
  function S() { return A().LibrarySchema || {}; }
  function F() { return A().LibraryV3Ficha || {}; }
  function byId(id) { return document.getElementById(id); }
  function val(id) { return (byId(id)?.value || '').trim(); }
  function esc(v) { return A().esc ? A().esc(v) : String(v ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
  function msg(text, type) { return A().msg ? A().msg(text, type) : `<div class="${type || 'notice'}">${esc(text)}</div>`; }
  function norm(s) { return F().norm ? F().norm(s) : String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[*#`_\[\](){}]/g, '').replace(/[:：]+$/, '').replace(/\s+/g, ' ').trim(); }
  function numberFrom(text) { return F().numberFrom ? F().numberFrom(text) : ((String(text || '').replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/) || [])[0] || ''); }
  function rangeValues(text) { return String(text || '').replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/g) || []; }
  function cleanText(value) { return String(value ?? '').trim(); }

  function extractChatJson(text) {
    const m = String(text || '').match(/ACUARIONEXO_JSON_START\s*([\s\S]*?)\s*ACUARIONEXO_JSON_END/i);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch (e) { throw new Error('El bloque ACUARIONEXO_JSON no es JSON válido: ' + e.message); }
  }

  function normalizeDataKey(key) {
    const n = String(key || '').trim();
    const aliases = {
      sourceLabel: 'source_label', etiqueta_fuente: 'source_label', etiquetaFuente: 'source_label',
      reagentLot: 'save_reagent_lot', reagentExpiry: 'save_reagent_expiry'
    };
    return aliases[n] || n;
  }

  function sourceRowsToText(raw) {
    const normalized = S().normalizeSources ? S().normalizeSources(raw || []) : (Array.isArray(raw) ? raw : []);
    return normalized.map(x => [x.name || x.title || '', x.url || '', x.used_for || ''].join(' | ')).join('\n');
  }

  function firstSourceLabelFrom(raw) {
    const normalized = S().normalizeSources ? S().normalizeSources(raw || []) : (Array.isArray(raw) ? raw : []);
    const first = normalized[0];
    if (!first) return '';
    return cleanText(first.name || first.title || 'Fuente 1');
  }

  function firstSourceLabelFromText(text) {
    const parsed = F().parseSourcesRaw ? F().parseSourcesRaw(text) : [];
    return firstSourceLabelFrom(parsed);
  }

  function setText(id, text) {
    const el = byId(id);
    if (!el) return false;
    el.value = cleanText(text);
    return true;
  }

  function setDataField(key, text) {
    key = normalizeDataKey(key);
    const value = cleanText(text);
    if (!value) return false;
    let done = false;
    const set = (k, v) => {
      const el = byId(`libData_${k}`);
      if (!el) return false;
      el.value = cleanText(v);
      done = true;
      return true;
    };
    if (['temperature', 'ph', 'gh', 'kh', 'salinity', 'calcium', 'magnesium'].includes(key)) {
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
    if (!el) return false;
    if (el.tagName === 'SELECT') {
      const opt = [...el.options].find(o => norm(o.value) === norm(value) || norm(o.textContent) === norm(value));
      el.value = opt ? opt.value : value;
    } else {
      el.value = value;
    }
    return true;
  }

  function ensureSourceLabelFromSources(preferredLabel) {
    const current = cleanText(byId('libData_source_label')?.value || '');
    if (current) return false;
    const label = cleanText(preferredLabel) || firstSourceLabelFromText(val('libSourcesRaw'));
    if (!label) return false;
    return setDataField('source_label', label);
  }

  function applyJsonToForm(parsed, x) {
    let count = 0;
    if (parsed.title && setText('libTitle', parsed.title)) count++;
    if (parsed.scientific_name && C().biologicalTypes?.has(x.entry_type) && setText('libScientific', parsed.scientific_name)) count++;
    if (parsed.summary && setText('libSummary', parsed.summary)) count++;
    if (Array.isArray(parsed.tags) && setText('libTags', parsed.tags.join(', '))) count++;

    const normalizedSources = S().normalizeSources ? S().normalizeSources(parsed.sources || []) : (parsed.sources || []);
    if (normalizedSources.length) {
      setText('libSourcesRaw', sourceRowsToText(normalizedSources));
      count++;
    }

    const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
    Object.entries(data).forEach(([key, value]) => {
      if (setDataField(key, Array.isArray(value) ? value.join(', ') : value)) count++;
    });

    const label = cleanText(data.source_label || data.sourceLabel || data.etiqueta_fuente || data.etiquetaFuente) || firstSourceLabelFrom(normalizedSources);
    if (ensureSourceLabelFromSources(label)) count++;
    return count;
  }

  function applyVisibleTextToForm(text, x) {
    const split = F().splitPastedFicha ? F().splitPastedFicha(text, x) : { blocks: {}, urls: [] };
    const blocks = split.blocks || {}, urls = split.urls || [];
    let count = 0;
    Object.entries(blocks).forEach(([key, value]) => {
      if (key === 'title' && setText('libTitle', value)) count++;
      else if (key === 'scientific_name' && C().biologicalTypes?.has(x.entry_type) && setText('libScientific', value)) count++;
      else if (key === 'summary' && setText('libSummary', value)) count++;
      else if (key === 'tags' && setText('libTags', String(value).split(/[,;\n]/).map(s => s.trim()).filter(Boolean).join(', '))) count++;
      else if (key === 'sources') { setText('libSourcesRaw', value); count++; }
      else if (setDataField(key, value)) count++;
    });
    if (urls.length && !val('libSourcesRaw')) {
      const extra = urls.map((u, i) => `Fuente ${i + 1} | ${u} | Ficha pegada desde Chat`).join('\n');
      setText('libSourcesRaw', extra);
      count++;
    }
    if (ensureSourceLabelFromSources()) count++;
    return count;
  }

  window.aplicarFichaChat = function (id) {
    const x = C().row ? C().row(id) : null;
    const box = byId('chatPasteStatus');
    try {
      if (!x) throw new Error('Ficha no encontrada.');
      const text = val('chatPasteText');
      if (!text) throw new Error('Pega primero la ficha completa.');
      const parsed = extractChatJson(text);
      const count = parsed ? applyJsonToForm(parsed, x) : applyVisibleTextToForm(text, x);
      if (!count) throw new Error('No pude reconocer apartados ni JSON válido. Pega el bloque completo ACUARIONEXO_JSON o apartados con títulos.');
      if (box) box.innerHTML = msg(`Ficha repartida: ${count} campos rellenados. Guarda la ficha completa.`, 'success');
    } catch (e) {
      if (box) box.innerHTML = msg(e.message, 'error');
    }
  };

  window.guardarFicha = async function (id) {
    const x = C().row ? C().row(id) : null;
    const box = byId('x');
    try {
      if (!x) throw new Error('Ficha no encontrada.');
      const payload = F().read(x);
      payload.data = payload.data || {};
      payload.sources = (F().parseSourcesRaw && val('libSourcesRaw')) ? S().normalizeSources(F().parseSourcesRaw(val('libSourcesRaw'))) : (payload.sources || []);
      if (!cleanText(payload.data.source_label)) payload.data.source_label = firstSourceLabelFrom(payload.sources);
      const merged = { ...x, ...payload };
      F().assertComplete(merged, 'No se puede guardar');
      const { error } = await A().supabase.from('library_entries').update(payload).eq('id', id).eq('user_id', A().state.user.id);
      if (error) throw error;
      Object.assign(x, payload);
      if (box) box.innerHTML = msg('Ficha guardada completa.', 'success');
    } catch (e) {
      if (box) box.innerHTML = e.audit ? F().auditHtml(e.audit) : msg(e.message, 'error');
    }
  };
})();
