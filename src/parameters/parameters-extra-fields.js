/* AcuarioNexo · parámetros extra */
(function () {
  const EXTRA = ['nitrite_no2', 'copper_cu', 'silicon_si'];
  const UNITS = { nitrite_no2: 'mg/L', copper_cu: 'µg/L', silicon_si: 'µg/L' };
  const LABELS = { nitrite_no2: 'NO2', copper_cu: 'Cobre', silicon_si: 'Silicato' };

  function ANX() { return window.ANX || {}; }
  function byId(id) { return document.getElementById(id); }
  function val(id) { return byId(id)?.value || ''; }
  function esc(value) { return ANX().esc ? ANX().esc(value) : String(value ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])); }
  function normalize(key) { return ANX().normalizeMeasurementKey ? ANX().normalizeMeasurementKey({ parameter_key: key }) : key; }
  function numberFrom(id) { const m = String(val(id)).replace(',', '.').match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; }
  function uuid() { return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); }

  function ensurePlan() {
    const A = ANX();
    A.aiParameterLabels = A.aiParameterLabels || {};
    A.aiMeasurementPlans = A.aiMeasurementPlans || {};
    A.aiMeasurementPlans.marine = A.aiMeasurementPlans.marine || {};
    Object.assign(A.aiParameterLabels, LABELS);
    if (!A.aiMeasurementPlans.marine.nitrite_no2) A.aiMeasurementPlans.marine.nitrite_no2 = 7;
    if (!A.aiMeasurementPlans.marine.copper_cu) A.aiMeasurementPlans.marine.copper_cu = 30;
    if (!A.aiMeasurementPlans.marine.silicon_si) A.aiMeasurementPlans.marine.silicon_si = 30;
  }

  function addMonthlyInputs() {
    const profile = val('measureProfile') || 'weekly';
    const grid = document.querySelector('.measurement-grid');
    if (!grid || profile !== 'monthly') return;
    EXTRA.forEach(key => {
      if (byId('m_' + key)) return;
      grid.insertAdjacentHTML('beforeend', `<div class="measurement-row parameter-extra-row">
        <label>${esc(LABELS[key])}</label>
        <div class="measurement-row-inputs">
          <input id="m_${key}" inputmode="decimal" placeholder="Valor">
          <input id="u_${key}" value="${esc(UNITS[key])}" placeholder="Unidad">
        </div>
      </div>`);
    });
  }

  function hasCoreValues() {
    return Array.from(document.querySelectorAll('.measurement-grid input[id^="m_"]')).some(input => !EXTRA.includes(input.id.slice(2)) && input.value.trim());
  }

  function extraRows(aq, profile, measuredAt, method, notes, batch) {
    return EXTRA.map(key => {
      const display = val('m_' + key);
      const numeric = numberFrom('m_' + key);
      const unit = val('u_' + key) || UNITS[key];
      if (!display && !Number.isFinite(numeric)) return null;
      return {
        user_id: ANX().state.user.id,
        aquarium_id: aq.id,
        parameter_key: normalize(key),
        parameter_label: LABELS[key],
        parameter: normalize(key),
        display_value: display ? `${display}${unit ? ` ${unit}` : ''}` : String(numeric),
        raw_text: display || String(numeric),
        raw_value: numeric,
        value: numeric,
        normalized_value: numeric,
        unit,
        method,
        source: profile,
        notes,
        batch_id: batch,
        measured_at: measuredAt,
        updated_at: new Date().toISOString()
      };
    }).filter(Boolean);
  }

  function patchForms() {
    if (window.__anxParametersExtraFieldsPatch) return;
    const originalForm = window.formMedicionCompleta;
    const originalSave = window.saveMedicionCompleta;
    if (typeof originalForm !== 'function' || typeof originalSave !== 'function') return;
    window.__anxParametersExtraFieldsPatch = true;

    window.formMedicionCompleta = function () {
      ensurePlan();
      originalForm.apply(this, arguments);
      setTimeout(addMonthlyInputs, 0);
    };

    window.saveMedicionCompleta = async function () {
      const A = ANX();
      const aq = A.currentAquarium ? A.currentAquarium() : null;
      const profile = val('measureProfile') || 'weekly';
      const extras = profile === 'monthly' && aq ? extraRows(aq, profile, val('measureDate') ? new Date(val('measureDate')).toISOString() : new Date().toISOString(), val('measureMethod') || 'Mensual', val('measureNotes') || null, uuid()) : [];
      if (extras.length) {
        const result = await A.supabase.from('aquarium_measurements').insert(extras);
        if (result.error) {
          const box = byId('x');
          if (box) box.innerHTML = A.msg ? A.msg(result.error.message, 'error') : result.error.message;
          return;
        }
      }
      if (!extras.length || hasCoreValues()) return originalSave.apply(this, arguments);
      if (typeof window.parametros === 'function') window.parametros();
    };
  }

  function start() {
    ensurePlan();
    patchForms();
    addMonthlyInputs();
  }

  document.addEventListener('click', () => setTimeout(start, 100), true);
  new MutationObserver(start).observe(document.body, { childList: true, subtree: true });
  setTimeout(start, 300);
  window.ANX = window.ANX || {};
  window.ANX.ParametersExtraFields = { ensurePlan, addMonthlyInputs, patchForms };
})();
