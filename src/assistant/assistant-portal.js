/* AcuarioNexo · Asistente IA · Fases 4-5 */
(function () {
  const ANX = window.ANX;
  const { supabase, state, esc, render, msg } = ANX;

  function style() {
    if (document.querySelector('link[data-assistant-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.assistantStyle = 'true';
    link.href = `src/assistant/assistant-portal.css?v=${encodeURIComponent(window.ANX_ASSET_VERSION || 'dev')}`;
    document.head.appendChild(link);
  }

  async function aquariums() {
    if (state.aquariums?.length) return state.aquariums;
    const { data, error } = await supabase.from('aquariums').select('*').eq('user_id', state.user.id).order('created_at');
    if (error) throw error;
    state.aquariums = data || [];
    return state.aquariums;
  }

  function aquariumMode() {
    return document.querySelector('input[name="assistantMode"]:checked')?.value === 'aquarium';
  }

  function toggleAquarium() {
    const row = document.getElementById('assistantAquariumRow');
    if (row) row.hidden = !aquariumMode();
  }

  function card(item, usedIds = new Set()) {
    const used = usedIds.has(String(item.id));
    return `<article class="assistant-result${used ? ' used' : ''}"><div><small>${esc(item.entry_type || item.entryType)}${item.score == null ? '' : ` · ${esc(item.score)} puntos`}</small><h4>${esc(item.title)}</h4>${item.scientific_name || item.scientificName ? `<p class="scientific">${esc(item.scientific_name || item.scientificName)}</p>` : ''}<p>${esc(item.summary || 'Sin resumen.')}</p></div><button type="button" data-entry="${esc(item.id)}">Ver ficha</button></article>`;
  }

  function listBlock(title, values, emptyText) {
    const list = Array.isArray(values) ? values.filter(Boolean) : [];
    return `<section class="panel"><h3>${esc(title)}</h3>${list.length ? `<ul>${list.map(value => `<li>${esc(value)}</li>`).join('')}</ul>` : `<p class="small">${esc(emptyText)}</p>`}</section>`;
  }

  function confidenceLabel(value) {
    return ({ confirmed_by_library: 'Confirmado por la biblioteca', compatible_with_available_data: 'Compatible según los datos disponibles', insufficient_information: 'Información insuficiente', human_review_required: 'Requiere revisión humana', source_conflict: 'Conflicto entre fuentes' })[value] || value;
  }

  async function openEntry(id) {
    await ANX.loadModuleGroup('biblioteca');
    await ANX.LibraryV3Core.load();
    window.verFicha(id);
  }

  function renderAnswer(data) {
    const usedIds = new Set((data.library_entries_used || []).map(String));
    const usedEntries = (data.library_entries || []).filter(item => usedIds.has(String(item.id)));
    return `<section class="panel assistant-answer"><small>${esc(confidenceLabel(data.confidence_state))}</small><h3>Respuesta</h3><p>${esc(data.answer)}</p>${data.aquarium_name ? `<p class="small">Acuario: ${esc(data.aquarium_name)}</p>` : ''}</section>
      ${listBlock('Contexto utilizado', data.aquarium_context_used, 'No se utilizó contexto de un acuario.')}
      ${listBlock('Información que falta', data.missing_information, 'No falta información esencial para esta respuesta.')}
      ${listBlock('Advertencias', data.warnings, 'Sin advertencias adicionales.')}
      <section class="panel"><h3>Fichas utilizadas</h3><div class="assistant-results">${usedEntries.length ? usedEntries.map(item => card(item, usedIds)).join('') : '<p class="small">La respuesta no se apoyó en una ficha concreta de la biblioteca.</p>'}</div></section>`;
  }

  async function ask(event) {
    event.preventDefault();
    const status = document.getElementById('assistantStatus');
    const output = document.getElementById('assistantOutput');
    const submit = document.getElementById('assistantSubmit');
    try {
      const question = String(document.getElementById('assistantQuestion').value || '').trim();
      if (question.length < 3) throw new Error('Escribe una consulta más concreta.');
      const mode = aquariumMode() ? 'aquarium' : 'general';
      const aquariumId = mode === 'aquarium' ? document.getElementById('assistantAquarium').value : null;
      if (mode === 'aquarium' && !aquariumId) throw new Error('Selecciona un acuario.');
      submit.disabled = true;
      status.innerHTML = msg('Consultando biblioteca y analizando la respuesta...');
      output.innerHTML = '';
      const response = await supabase.functions.invoke('assistant-answer', { body: { question, mode, aquarium_id: aquariumId } });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.message || response.data.error);
      const data = response.data?.data;
      if (!data) throw new Error('El asistente no devolvió una respuesta válida.');
      output.innerHTML = renderAnswer(data);
      status.innerHTML = msg('Respuesta generada con la biblioteca de AcuarioNexo.', 'success');
      document.querySelectorAll('[data-entry]').forEach(button => button.addEventListener('click', () => openEntry(button.dataset.entry)));
      ANX.AssistantPortal.lastAnswer = data;
    } catch (error) {
      status.innerHTML = msg(error.message || 'No se pudo generar la respuesta.', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  async function assistantPortal() {
    if (!state.user) return window.login();
    style();
    try {
      const list = await aquariums();
      const options = list.map(aq => `<option value="${esc(aq.id)}">${esc(aq.name || 'Acuario')}</option>`).join('');
      render(`<section class="summary-card assistant-hero"><div><small>AcuarioNexo IA</small><h2>Pregunta a tu acuario</h2><p>La respuesta utiliza la biblioteca publicada y, cuando lo elijas, los datos reales de tu sistema.</p></div></section><section class="panel assistant-panel"><form id="assistantForm"><fieldset class="assistant-mode"><label><input type="radio" name="assistantMode" value="general" checked> Consulta general</label><label><input type="radio" name="assistantMode" value="aquarium"> Consultar mi acuario</label></fieldset><div id="assistantAquariumRow" hidden><label for="assistantAquarium">Acuario</label><select id="assistantAquarium"><option value="">Selecciona un acuario</option>${options}</select></div><label for="assistantQuestion">¿Qué necesitas saber?</label><textarea id="assistantQuestion" rows="4" maxlength="1200" placeholder="¿Qué alimento sirve para mis escalares?"></textarea><div class="assistant-examples"><button type="button" data-example="¿Qué alimento sirve para mis escalares?">Alimentación</button><button type="button" data-example="¿Son compatibles los habitantes de este acuario?">Compatibilidad</button><button type="button" data-example="¿Qué información falta para evaluar este acuario?">Revisión</button></div><button id="assistantSubmit" class="primary" type="submit">Preguntar a AcuarioNexo IA</button></form><div id="assistantStatus"></div></section><div id="assistantOutput"></div>`, 'inicio');
      document.querySelectorAll('input[name="assistantMode"]').forEach(input => input.addEventListener('change', toggleAquarium));
      document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { document.getElementById('assistantQuestion').value = button.dataset.example; }));
      document.getElementById('assistantForm').addEventListener('submit', ask);
    } catch (error) {
      render(`<section class="panel">${msg(error.message || 'No se pudo abrir el asistente.', 'error')}</section>`, 'inicio');
    }
  }

  window.assistantPortal = assistantPortal;
  ANX.AssistantPortal = { assistantPortal, ask, lastAnswer: null };
})();
