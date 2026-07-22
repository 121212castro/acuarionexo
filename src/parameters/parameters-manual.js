/* AcuarioNexo · Parameters manual */
(function () {
  function A() { return window.ANX || {}; }

  function parametrosAdmin() {
    formParametro('__manual');
  }

  async function formParametro(preset = '') {
    const { esc, msg, render, aqHeader, loadParameterTests, allParameterTestOptions } = A();
    if (!preset) return window.formMedicionCompleta('weekly');
    const manualPreset = preset === '__manual' ? '' : preset;
    render(aqHeader('parametros') + `<section class="panel">${msg('Cargando catálogo de tests...')}</section>`, 'acuarios');
    try {
      const tests = typeof loadParameterTests === 'function' ? await loadParameterTests() : [];
      const options = typeof allParameterTestOptions === 'function'
        ? allParameterTestOptions(tests)
        : '<option value="__manual__">Otro test o método</option>';
      render(aqHeader('parametros') + `<section class="panel">
        <button onclick="openAqSection('parametros')">← Volver</button>
        <h2>Registro manual</h2>
        <div class="param-actions param-profile-actions">
          <button type="button" onclick="formMedicionCompleta('weekly')">Semanal</button>
          <button type="button" onclick="formMedicionCompleta('monthly')">Mensual</button>
          <button type="button" onclick="formMedicionCompleta('icp')">ICP</button>
        </div>
        ${msg('Usa este formulario solo para una medición puntual fuera de los ciclos.', 'notice')}
        <label>Parámetro</label><input id="parName" value="${esc(manualPreset)}" placeholder="KH, NO3, PO4, pH...">
        <label>Valor</label><input id="parValue" placeholder="Ej. 8.2">
        <label>Test utilizado</label><select id="parTest" onchange="document.getElementById('parTestManual').classList.toggle('hidden',this.value!=='__manual__')">${options}</select>
        <input id="parTestManual" class="hidden" placeholder="Marca, modelo o método utilizado">
        <label>Fecha</label><input id="parDate" type="datetime-local" value="${new Date().toISOString().slice(0, 16)}">
        <label>Notas</label><textarea id="parNotes"></textarea>
        <button class="primary" onclick="saveParametro()">Guardar</button>
        <div id="x"></div>
      </section>`, 'acuarios');
    } catch (e) {
      render(aqHeader('parametros') + `<section class="panel"><button onclick="openAqSection('parametros')">← Volver</button>${msg(e.message || 'No se pudo cargar el catálogo de tests.', 'error')}</section>`, 'acuarios');
    }
  }

  async function saveParametro() {
    const { supabase, state, byId, val, msg, currentAquarium, normalizeMeasurementKey, measurementNumber, aiParameterLabels } = A();
    try {
      const aq = currentAquarium();
      if (!val('parName')) throw new Error('Indica el parámetro.');
      const key = normalizeMeasurementKey({ parameter_key: val('parName') });
      const rawValue = measurementNumber({ raw_text: val('parValue') });
      const selectedTest = val('parTest');
      const method = selectedTest === '__manual__' ? val('parTestManual') : selectedTest;
      const row = {
        user_id: state.user.id,
        aquarium_id: aq.id,
        parameter_key: key,
        parameter_label: aiParameterLabels[key] || val('parName'),
        display_value: val('parValue'),
        raw_text: val('parValue'),
        raw_value: rawValue,
        normalized_value: rawValue,
        method: method || 'Manual',
        measured_at: val('parDate') ? new Date(val('parDate')).toISOString() : new Date().toISOString(),
        notes: val('parNotes') || null
      };
      const { error } = await supabase.from('aquarium_measurements').insert(row);
      if (error) throw error;
      window.parametros();
    } catch (e) {
      if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
    }
  }

  window.parametrosAdmin = parametrosAdmin;
  window.formParametro = formParametro;
  window.saveParametro = saveParametro;
  window.ANX = window.ANX || {};
  window.ANX.ParametersManual = { parametrosAdmin, formParametro, saveParametro };
})();