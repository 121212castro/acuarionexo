/* AcuarioNexo · Tasks core */
(function () {
  function A() { return window.ANX || {}; }

  const PARAM_LABELS = {
    temperature_c: 'Temperatura', salinity_ppt: 'Salinidad', salinity_sg: 'Salinidad', ph: 'pH', kh_dkh: 'KH',
    nitrate_no3: 'NO3', phosphate_po4: 'PO4', calcium_ca: 'Calcio', magnesium_mg: 'Magnesio', potassium_k: 'Potasio',
    iodine_i: 'Yodo', strontium_sr: 'Estroncio', ammonia_nh3: 'Amoniaco', nitrite_no2: 'NO2', gh: 'GH', tds: 'TDS'
  };

  function cleanParamText(text) {
    let out = String(text || '');
    Object.entries(PARAM_LABELS).forEach(function ([key, label]) {
      out = out.replace(new RegExp(key, 'gi'), label);
    });
    return out.replace(/_/g, ' ');
  }

  function cleanStatus(status) {
    const map = { open: 'Pendiente', done: 'Hecho', normal: 'Normal', medium: 'Media', high: 'Alta', low: 'Baja', critical: 'Crítica' };
    return map[String(status || '').toLowerCase()] || status || '';
  }

  function taskMeta(task) {
    const text = String(task?.notes || '');
    const match = text.match(/^AcuarioNexoTaskMeta:(\{[^\n]*\})/i) || text.match(/\nAcuarioNexoTaskMeta:(\{[^\n]*\})/i);
    if (!match) return {};
    try { return JSON.parse(match[1]); } catch (_) { return {}; }
  }

  function taskNotes(task) {
    return cleanParamText(String(task?.notes || '').replace(/^AcuarioNexoTaskMeta:\{[^\n]*\}\n?/i, '').trim());
  }

  function taskNotesPayload(notes, meta = {}) {
    const cleanMeta = Object.fromEntries(Object.entries(meta).filter(([, value]) => value !== null && value !== undefined && value !== ''));
    return `${Object.keys(cleanMeta).length ? `AcuarioNexoTaskMeta:${JSON.stringify(cleanMeta)}\n` : ''}${notes || ''}`.trim() || null;
  }

  function taskRoute(task) {
    const meta = taskMeta(task);
    const text = [meta.route, task.task_type, task.type, task.category, task.title, task.notes].join(' ').toLowerCase();
    if (/param|medic|kh|no3|po4|salinidad|temperatura|ph|calcio|magnesio|icp/.test(text)) return 'parametros';
    if (/invent|stock|comprar|caduc|reponer|test|sal|aditivo|alimento|medicamento/.test(text)) return 'inventario';
    if (/microfauna|rotif|copepod|artemia|fitoplancton|infusorio|cultivo|eclosion|recolect/.test(text)) return 'microfauna';
    if (/agua|cambio|mantenimiento|tarea/.test(text)) return 'tareas';
    return meta.route || 'tareas';
  }

  async function openTaskTarget(task) {
    const { currentAquarium } = A();
    const route = taskRoute(task);
    if (task.aquarium_id && (!currentAquarium() || currentAquarium().id !== task.aquarium_id)) {
      if (typeof openA === 'function') {
        await openA(task.aquarium_id);
        setTimeout(() => openTaskRoute(route), 0);
        return;
      }
    }
    openTaskRoute(route);
  }

  function openTaskRoute(route) {
    const { currentAquarium } = A();
    if (route === 'parametros') return openAqSection('parametros');
    if (route === 'inventario') return currentAquarium() ? inventario('aquarium') : inventario('general');
    if (route === 'microfauna' && typeof microfauna === 'function') return microfauna();
    if (route === 'tareas') return currentAquarium() ? openAqSection('tareas') : tareas();
    return tareas();
  }

  function volverAvisos() {
    const { currentAquarium } = A();
    const aq = currentAquarium();
    if (aq && typeof openAqSection === 'function') return openAqSection('resumen');
    if (typeof dashboard === 'function') return dashboard();
    window.history.back();
  }

  function repeatOptions(selected = '') {
    const options = [['', 'No repetir'], ['1', 'Cada día'], ['7', 'Cada semana'], ['14', 'Cada 2 semanas'], ['30', 'Cada mes'], ['90', 'Cada 3 meses']];
    return options.map(([value, label]) => `<option value="${value}" ${String(selected) === value ? 'selected' : ''}>${label}</option>`).join('');
  }

  function isAiAlertTask(task) {
    const meta = taskMeta(task);
    const text = [meta.source, task.task_type, task.type, task.category, task.title, task.notes].join(' ').toLowerCase();
    return /parameter_alert|param|actualizar|temperatura|salinidad|ph|kh|no3|po4|calcio|magnesio|alerta ia|análisis ia|analisis ia|riesgo|alerta/.test(text);
  }

  function tareaCard(task) {
    const { esc, dateText } = A();
    const meta = taskMeta(task);
    const repeat = meta.repeat_days ? ` · repetir ${meta.repeat_days} días` : '';
    const priority = cleanStatus(task.priority || 'normal');
    const status = cleanStatus(task.status || 'open');
    const title = cleanParamText(task.title || 'Tarea');
    const finished = task.status === 'done' && task.completed_at ? ` · realizado ${dateText(task.completed_at)}` : '';
    return `<button class="${task.status === 'done' ? 'success' : 'item'} task-card" onclick="verAviso('${esc(task.id)}')">
      <b>${esc(title)}</b>
      <p class="small">${dateText(task.due_at)} · ${esc(priority)} · ${esc(status)}${esc(repeat)}${esc(finished)}</p>
      ${taskNotes(task) ? `<p>${esc(taskNotes(task))}</p>` : ''}
    </button>`;
  }

  function renderTaskGroup(title, tasks, openByDefault = false) {
    const { esc } = A();
    if (!tasks.length) return '';
    const openAttr = openByDefault ? ' open' : '';
    return `<details class="task-group"${openAttr}><summary><b>${esc(title)}</b> <span class="small">${tasks.length}</span></summary><div class="task-group-body">${tasks.map(tareaCard).join('')}</div></details>`;
  }

  function renderTaskSections(openTasks, doneTasks) {
    const { msg } = A();
    const open = openTasks || [];
    const done = doneTasks || [];
    const manual = open.filter((task) => !isAiAlertTask(task));
    const alerts = open.filter(isAiAlertTask);
    const openHtml = [
      renderTaskGroup('Tareas manuales', manual, manual.length > 0 && manual.length <= 3),
      renderTaskGroup('Alertas IA / parámetros', alerts, false)
    ].join('');
    return `${openHtml || msg('Sin tareas pendientes.', 'success')}${renderTaskGroup('Historial realizado', done, false)}`;
  }

  async function refreshAfterTaskDone(task) {
    const { currentAquarium } = A();
    const aq = currentAquarium();
    if (task?.aquarium_id && aq?.id === task.aquarium_id && typeof openAqSection === 'function') {
      return openAqSection('tareas');
    }
    return tareas();
  }

  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { cleanParamText, cleanStatus, taskMeta, taskNotes, taskNotesPayload, taskRoute, openTaskTarget, openTaskRoute, volverAvisos, repeatOptions, isAiAlertTask, tareaCard, renderTaskGroup, renderTaskSections, refreshAfterTaskDone });
  window.volverAvisos = volverAvisos;
  window.ANX.TasksCore = { cleanParamText, cleanStatus, taskMeta, taskNotes, taskNotesPayload, taskRoute, openTaskTarget, openTaskRoute, volverAvisos, repeatOptions, isAiAlertTask, tareaCard, renderTaskGroup, renderTaskSections, refreshAfterTaskDone };
})();