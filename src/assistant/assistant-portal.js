/* AcuarioNexo · Asistente IA · Fase 4 */
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

  function card(item) {
    return `<article class="assistant-result"><div><small>${esc(item.entryType)} · ${esc(item.score)} puntos</small><h4>${esc(item.title)}</h4>${item.scientificName ? `<p class="scientific">${esc(item.scientificName)}</p>` : ''}<p>${esc(item.summary || 'Sin resumen.')}</p></div><button type="button" data-entry="${esc(item.id)}">Ver ficha</button></article>`;
  }

  function context(summary) {
    if (!summary) return '';
    return `<section class="panel assistant-context"><h3>Contexto utilizado</h3><div class="assistant-facts"><span><b>${esc(summary.aquarium_name)}</b>Acuario</span><span><b>${summary.system_net_liters == null ? 'Sin dato' : `${esc(summary.system_net_liters)} L`}</b>Volumen neto</span><span><b>${esc(summary.animal_count)}</b>Habitantes</span><span><b>${esc(summary.measurement_count)}</b>Mediciones recientes</span><span><b>${esc(summary.inventory_count)}</b>Inventario</span><span><b>${esc(summary.open_task_count)}</b>Tareas abiertas</span></div></section>`;
  }

  async function openEntry(id) {
    await ANX.loadModuleGroup('biblioteca');
    await ANX.LibraryV3Core.load();
    window.verFicha(id);
  }

  async function prepare(event) {
    event.preventDefault();
    const status = document.getElementById('assistantStatus');
    const output = document.getElementById('assistantOutput');
    try {
      const question = String(document.getElementById('assistantQuestion').value || '').trim();
      if (question.length < 3) throw new Error('Escribe una consulta más concreta.');
      status.innerHTML = msg('Preparando biblioteca y contexto...');
      output.innerHTML = '';
      let aquariumContext = null;
      let summary = null;
      if (aquariumMode()) {
        const id = document.getElementById('assistantAquarium').value;
        if (!id) throw new Error('Selecciona un acuario.');
        aquariumContext = await ANX.AssistantAquariumContext.load(id);
        summary = ANX.AssistantAquariumContext.summary(aquariumContext);
      }
      const library = await ANX.AssistantLibrarySearch.search({ query: question, limit: 12 });
      const results = library.results.length ? library.results.map(card).join('') : msg('No hay fichas publicadas relacionadas.', 'notice');
      output.innerHTML = `${context(summary)}<section class="panel"><h3>Fichas seleccionadas</h3><p class="small">Estas fichas y este contexto se enviarán al modelo en la Fase 5.</p><div class="assistant-results">${results}</div></section><section class="panel">${msg('Preparación completada. La respuesta conversacional se conectará en la Fase 5.', 'success')}</section>`;
      status.innerHTML = msg(`${library.total} fichas preparadas.`, 'success');
      document.querySelectorAll('[data-entry]').forEach(button => button.addEventListener('click', () => openEntry(button.dataset.entry)));
      ANX.AssistantPortal.lastPrepared = { question, mode: aquariumMode() ? 'aquarium' : 'general', aquariumContext, summary, library };
    } catch (error) {
      status.innerHTML = msg(error.message || 'No se pudo preparar la consulta.', 'error');
    }
  }

  async function assistantPortal() {
    if (!state.user) return window.login();
    style();
    try {
      const list = await aquariums();
      const options = list.map(aq => `<option value="${esc(aq.id)}">${esc(aq.name || 'Acuario')}</option>`).join('');
      render(`<section class="summary-card assistant-hero"><div><small>AcuarioNexo IA</small><h2>Pregunta a tu acuario</h2><p>Consulta la biblioteca o analiza uno de tus sistemas.</p></div></section><section class="panel assistant-panel"><form id="assistantForm"><fieldset class="assistant-mode"><label><input type="radio" name="assistantMode" value="general" checked> Consulta general</label><label><input type="radio" name="assistantMode" value="aquarium"> Consultar mi acuario</label></fieldset><div id="assistantAquariumRow" hidden><label for="assistantAquarium">Acuario</label><select id="assistantAquarium"><option value="">Selecciona un acuario</option>${options}</select></div><label for="assistantQuestion">¿Qué necesitas saber?</label><textarea id="assistantQuestion" rows="4" maxlength="1200" placeholder="¿Qué alimento sirve para mis escalares?"></textarea><div class="assistant-examples"><button type="button" data-example="¿Qué alimento sirve para mis escalares?">Alimentación</button><button type="button" data-example="¿Son compatibles los habitantes de este acuario?">Compatibilidad</button><button type="button" data-example="¿Qué información falta para evaluar este acuario?">Revisión</button></div><button class="primary" type="submit">Preparar consulta</button></form><div id="assistantStatus"></div></section><div id="assistantOutput"></div>`, 'inicio');
      document.querySelectorAll('input[name="assistantMode"]').forEach(input => input.addEventListener('change', toggleAquarium));
      document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { document.getElementById('assistantQuestion').value = button.dataset.example; }));
      document.getElementById('assistantForm').addEventListener('submit', prepare);
    } catch (error) {
      render(`<section class="panel">${msg(error.message || 'No se pudo abrir el asistente.', 'error')}</section>`, 'inicio');
    }
  }

  window.assistantPortal = assistantPortal;
  ANX.AssistantPortal = { assistantPortal, prepare, lastPrepared: null };
})();