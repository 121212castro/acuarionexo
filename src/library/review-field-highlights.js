/* AcuarioNexo · resaltado de campos pendientes en fichas a revisar */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const wrapped = new WeakSet();

  function clean(value) {
    return String(value ?? '').trim();
  }

  function norm(value) {
    return clean(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function validation(entry) {
    const result = entry?.validation_result && typeof entry.validation_result === 'object'
      ? entry.validation_result
      : {};
    return {
      flags: array(result.review_flags).concat(array(result.errors)),
      missing: array(result.missing_fields),
      invalid: array(result.invalid_fields).concat(array(result.poor_fields))
    };
  }

  function fieldAliases(entry) {
    const map = new Map();
    const add = (label, id) => {
      const key = norm(label);
      if (key && !map.has(key)) map.set(key, id);
    };
    [
      ['title', 'title'], ['nombre', 'title'], ['nombre comun', 'title'], ['nombre comercial', 'title'],
      ['scientific_name', 'scientific_name'], ['nombre cientifico', 'scientific_name'],
      ['summary', 'summary'], ['resumen', 'summary'], ['descripcion', 'summary'],
      ['sources', 'sources'], ['fuentes', 'sources'], ['bibliografia', 'sources'],
      ['tags', 'tags'], ['etiquetas', 'tags']
    ].forEach(([label, id]) => add(label, id));
    try {
      ANX.LibraryV3Core?.S?.templateFor(entry.entry_type).forEach(section => {
        section.fields.forEach(field => {
          add(field.id, field.id);
          add(field.label, field.id);
        });
      });
    } catch (_) {}
    return map;
  }

  function controlFor(fieldId) {
    const direct = {
      title: 'libTitle',
      scientific_name: 'libScientific',
      summary: 'libSummary',
      sources: 'libSourcesRaw',
      tags: 'libTags'
    }[fieldId];
    return document.getElementById(direct || `libData_${fieldId}`);
  }

  function fieldFromMessage(message, aliases) {
    const text = clean(message);
    if (!text) return '';
    const candidates = [];
    candidates.push(...text.split('·').map(part => clean(part)).filter(Boolean));
    candidates.push(...text.split(':').map(part => clean(part)).filter(Boolean));
    candidates.push(text);
    for (const candidate of candidates) {
      const normalized = norm(candidate);
      if (aliases.has(normalized)) return aliases.get(normalized);
      for (const [label, id] of aliases.entries()) {
        if (normalized === label || normalized.includes(label) || label.includes(normalized)) return id;
      }
    }
    return '';
  }

  function collectProblems(entry) {
    const current = validation(entry);
    const aliases = fieldAliases(entry);
    const problems = new Map();
    const add = (fieldId, reason) => {
      if (!fieldId) return;
      const list = problems.get(fieldId) || [];
      if (reason && !list.includes(reason)) list.push(reason);
      problems.set(fieldId, list);
    };
    current.missing.forEach(field => add(clean(field), 'Campo obligatorio sin información confirmada.'));
    current.invalid.forEach(field => add(clean(field), 'El contenido necesita corrección o comprobación manual.'));
    current.flags.forEach(flag => add(fieldFromMessage(flag, aliases), clean(flag)));
    return problems;
  }

  function clearMarks() {
    document.querySelectorAll('.library-review-problem,.library-review-valid,.library-review-edited').forEach(node => {
      node.classList.remove('library-review-problem', 'library-review-valid', 'library-review-edited');
    });
    document.querySelectorAll('.library-review-control,.library-review-control-valid').forEach(node => {
      node.classList.remove('library-review-control', 'library-review-control-valid');
    });
    document.querySelectorAll('.library-review-reason,.library-review-summary').forEach(node => node.remove());
  }

  function hostFor(control) {
    return control.closest('.form-grid > div, .library-field, .field, .library-form-field, .item') || control.parentElement;
  }

  function markField(fieldId, reasons) {
    const control = controlFor(fieldId);
    if (!control) return false;
    control.classList.remove('library-review-control-valid');
    control.classList.add('library-review-control');
    const host = hostFor(control);
    if (!host) return false;
    host.classList.remove('library-review-valid');
    host.classList.add('library-review-problem');
    const reason = document.createElement('p');
    reason.className = 'library-review-reason';
    reason.textContent = reasons.filter(Boolean).join(' ');
    host.appendChild(reason);
    const onEdit = () => {
      host.classList.add('library-review-edited');
      reason.textContent = 'Modificado manualmente. Guarda la ficha para volver a comprobar este apartado.';
    };
    control.addEventListener('input', onEdit, { once: true });
    control.addEventListener('change', onEdit, { once: true });
    return true;
  }

  function hasUsableValue(control) {
    if (!control || control.disabled) return false;
    if (control.type === 'file' || control.type === 'button' || control.type === 'submit' || control.type === 'hidden') return false;
    if (control.type === 'checkbox' || control.type === 'radio') return control.checked;
    const value = clean(control.value);
    return value !== '' && !/^(n\/?d|no localizado|sin datos|pendiente)$/i.test(value);
  }

  function markValidFields() {
    const root = document.getElementById('libTitle')?.closest('form, .panel, section') || document;
    root.querySelectorAll('input[id^="lib"], textarea[id^="lib"], select[id^="lib"]').forEach(control => {
      if (control.classList.contains('library-review-control') || !hasUsableValue(control)) return;
      const host = hostFor(control);
      if (!host || host.classList.contains('library-review-problem')) return;
      control.classList.add('library-review-control-valid');
      host.classList.add('library-review-valid');
    });
  }

  function addSummary(entry, total, unlocated) {
    if (!total) return;
    const anchor = document.getElementById('libTitle')?.closest('form, .panel, section') || document.getElementById('libTitle')?.parentElement;
    if (!anchor) return;
    const box = document.createElement('div');
    box.className = 'library-review-summary';
    box.innerHTML = `<strong>Campos pendientes de revisión: ${total}</strong><span>Verde: dato cumplimentado sin incidencia asociada. Rojo: dato ausente o incorrecto. Amarillo: campo modificado y pendiente de guardar.${unlocated ? ` Hay ${unlocated} incidencia(s) general(es) sin campo único asociado.` : ''}</span>`;
    anchor.insertBefore(box, anchor.firstChild);
  }

  function markEntry(entry) {
    clearMarks();
    if (!entry || entry.status !== 'review') return;
    const problems = collectProblems(entry);
    let marked = 0;
    problems.forEach((reasons, fieldId) => {
      if (markField(fieldId, reasons)) marked += 1;
    });
    markValidFields();
    const totalFlags = validation(entry).flags.length + validation(entry).missing.length + validation(entry).invalid.length;
    addSummary(entry, problems.size || totalFlags, Math.max(0, totalFlags - marked));
  }

  function wrapFormFicha() {
    const original = window.formFicha;
    if (typeof original !== 'function' || wrapped.has(original)) return false;
    const wrapper = function (id) {
      const result = original.apply(this, arguments);
      const apply = () => {
        try {
          const entry = ANX.LibraryV3Core?.row?.(id);
          markEntry(entry);
        } catch (_) {}
      };
      if (result && typeof result.then === 'function') result.finally(() => setTimeout(apply, 0));
      else setTimeout(apply, 0);
      return result;
    };
    wrapped.add(original);
    wrapped.add(wrapper);
    window.formFicha = wrapper;
    return true;
  }

  const timer = setInterval(() => {
    if (wrapFormFicha()) clearInterval(timer);
  }, 250);
  setTimeout(() => clearInterval(timer), 30000);

  new MutationObserver(() => {
    if (typeof window.formFicha === 'function') wrapFormFicha();
  }).observe(document.documentElement, { childList: true, subtree: true });

  ANX.LibraryReviewHighlights = { markEntry, collectProblems };
})();
