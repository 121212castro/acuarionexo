/* AcuarioNexo · estados de revisión por campo */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const wrapped = new WeakSet();

  const clean = value => String(value ?? '').trim();
  const array = value => Array.isArray(value) ? value : [];
  const norm = value => clean(value).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_]+/g, ' ').trim().replace(/\s+/g, ' ');

  function validation(entry) {
    const result = entry?.validation_result && typeof entry.validation_result === 'object' ? entry.validation_result : {};
    return {
      errors: array(result.errors),
      missing: array(result.missing_fields),
      invalid: array(result.invalid_fields),
      warnings: array(result.review_flags),
      poor: array(result.poor_fields)
    };
  }

  function fieldAliases(entry) {
    const map = new Map();
    const add = (label, id) => { const key = norm(label); if (key && !map.has(key)) map.set(key, id); };
    [
      ['title','title'],['nombre','title'],['nombre comun','title'],['nombre comercial','title'],
      ['scientific_name','scientific_name'],['nombre cientifico','scientific_name'],
      ['summary','summary'],['resumen','summary'],['descripcion','summary'],
      ['sources','sources'],['fuentes','sources'],['bibliografia','sources'],
      ['tags','tags'],['etiquetas','tags']
    ].forEach(([label,id]) => add(label,id));
    try {
      ANX.LibraryV3Core?.S?.templateFor(entry.entry_type).forEach(section => section.fields.forEach(field => {
        add(field.id, field.id); add(field.label, field.id);
      }));
    } catch (_) {}
    return map;
  }

  function controlFor(fieldId) {
    const direct = { title:'libTitle', scientific_name:'libScientific', summary:'libSummary', sources:'libSourcesRaw', tags:'libTags' }[fieldId];
    return document.getElementById(direct || `libData_${fieldId}`);
  }

  function fieldFromMessage(message, aliases) {
    const text = clean(message);
    if (!text) return '';
    const candidates = [...text.split('·'), ...text.split(':'), text].map(clean).filter(Boolean);
    for (const candidate of candidates) {
      const normalized = norm(candidate);
      if (aliases.has(normalized)) return aliases.get(normalized);
      for (const [label,id] of aliases.entries()) {
        if (normalized === label || normalized.includes(label) || label.includes(normalized)) return id;
      }
    }
    return '';
  }

  function collectStates(entry) {
    const v = validation(entry);
    const aliases = fieldAliases(entry);
    const states = new Map();
    const unlocated = [];
    const add = (fieldId, level, reason) => {
      if (!fieldId) { if (reason) unlocated.push(reason); return; }
      const current = states.get(fieldId) || { level:'valid', reasons:[] };
      const rank = { valid:0, warning:1, error:2 };
      if (rank[level] > rank[current.level]) current.level = level;
      if (reason && !current.reasons.includes(reason)) current.reasons.push(reason);
      states.set(fieldId, current);
    };
    v.missing.forEach(field => add(clean(field), 'error', 'Campo obligatorio sin información confirmada.'));
    v.invalid.forEach(field => add(clean(field), 'error', 'Dato inválido o incompatible con el contrato de la ficha.'));
    v.errors.forEach(message => add(fieldFromMessage(message, aliases), 'error', clean(message)));
    v.poor.forEach(field => add(clean(field), 'warning', 'Hay contenido, pero necesita más precisión o respaldo documental.'));
    v.warnings.forEach(message => add(fieldFromMessage(message, aliases), 'warning', clean(message)));
    return { states, unlocated };
  }

  function clearMarks() {
    document.querySelectorAll('.library-review-problem,.library-review-warning,.library-review-valid,.library-review-edited').forEach(node =>
      node.classList.remove('library-review-problem','library-review-warning','library-review-valid','library-review-edited'));
    document.querySelectorAll('.library-review-control,.library-review-control-warning,.library-review-control-valid').forEach(node =>
      node.classList.remove('library-review-control','library-review-control-warning','library-review-control-valid'));
    document.querySelectorAll('.library-review-reason,.library-review-summary').forEach(node => node.remove());
  }

  function hostFor(control) {
    if (!control) return null;
    const parent = control.parentElement;
    if (parent && parent.querySelectorAll('input,textarea,select').length === 1) return parent;
    return control.closest('[data-field-id],.library-form-field,.library-field,.field,.form-grid > div,.item') || parent;
  }

  function hasUsableValue(control) {
    if (!control || control.disabled || ['file','button','submit','hidden'].includes(control.type)) return false;
    if (control.type === 'checkbox' || control.type === 'radio') return control.checked;
    const value = clean(control.value);
    return value !== '' && !/^(n\/?d|no localizado|sin datos|pendiente)$/i.test(value);
  }

  function applyState(fieldId, state) {
    const control = controlFor(fieldId);
    if (!control) return false;
    const host = hostFor(control);
    if (!host) return false;
    const isError = state.level === 'error';
    host.classList.add(isError ? 'library-review-problem' : 'library-review-warning');
    control.classList.add(isError ? 'library-review-control' : 'library-review-control-warning');
    const reason = document.createElement('p');
    reason.className = 'library-review-reason';
    reason.textContent = state.reasons.join(' ');
    host.appendChild(reason);
    const onEdit = () => {
      host.classList.add('library-review-edited');
      reason.textContent = 'Modificado manualmente. Guarda la ficha para volver a comprobar este apartado.';
    };
    control.addEventListener('input', onEdit, { once:true });
    control.addEventListener('change', onEdit, { once:true });
    return true;
  }

  function markValidFields(root) {
    root.querySelectorAll('input[id^="lib"],textarea[id^="lib"],select[id^="lib"]').forEach(control => {
      if (!hasUsableValue(control)) return;
      if (control.classList.contains('library-review-control') || control.classList.contains('library-review-control-warning')) return;
      const host = hostFor(control);
      if (!host || host.classList.contains('library-review-problem') || host.classList.contains('library-review-warning')) return;
      control.classList.add('library-review-control-valid');
      host.classList.add('library-review-valid');
    });
  }

  function addSummary(root, counts, unlocated) {
    const box = document.createElement('div');
    box.className = 'library-review-summary';
    box.innerHTML = `<strong>Revisión por campo: ${counts.error} error(es), ${counts.warning} advertencia(s)</strong><span>Verde: cumplimentado sin incidencia. Amarillo: contenido presente que requiere precisión o fuente. Rojo: vacío obligatorio o error confirmado. Gris: opcional sin evaluar.${unlocated ? ` Hay ${unlocated} incidencia(s) generales sin campo asociado.` : ''}</span>`;
    root.insertBefore(box, root.firstChild);
  }

  function markEntry(entry) {
    clearMarks();
    if (!entry || entry.status !== 'review') return;
    const root = document.getElementById('libTitle')?.closest('form,.panel,section') || document;
    const result = collectStates(entry);
    const counts = { error:0, warning:0 };
    result.states.forEach((state, fieldId) => {
      if (applyState(fieldId, state)) counts[state.level] += 1;
    });
    markValidFields(root);
    addSummary(root, counts, result.unlocated.length);
  }

  function wrapFormFicha() {
    const original = window.formFicha;
    if (typeof original !== 'function' || wrapped.has(original)) return false;
    const wrapper = function (id) {
      const result = original.apply(this, arguments);
      const apply = () => { try { markEntry(ANX.LibraryV3Core?.row?.(id)); } catch (_) {} };
      if (result && typeof result.then === 'function') result.finally(() => setTimeout(apply,0));
      else setTimeout(apply,0);
      return result;
    };
    wrapped.add(original); wrapped.add(wrapper); window.formFicha = wrapper; return true;
  }

  const timer = setInterval(() => { if (wrapFormFicha()) clearInterval(timer); }, 250);
  setTimeout(() => clearInterval(timer), 30000);
  new MutationObserver(() => { if (typeof window.formFicha === 'function') wrapFormFicha(); })
    .observe(document.documentElement, { childList:true, subtree:true });

  ANX.LibraryReviewHighlights = { markEntry, collectStates };
})();