/* AcuarioNexo · tasks */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, aqHeader } = window.ANX;

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
  if (route === 'parametros') return openAqSection('parametros');
  if (route === 'inventario') return currentAquarium() ? inventario('aquarium') : inventario('general');
  if (route === 'microfauna' && typeof microfauna === 'function') return microfauna();
  if (route === 'tareas') return currentAquarium() ? openAqSection('tareas') : tareas();
  return tareas();
}

window.volverAvisos = function () {
  const aq = currentAquarium();
  if (aq && typeof openAqSection === 'function') return openAqSection('resumen');
  if (typeof dashboard === 'function') return dashboard();
  window.history.back();
};

function repeatOptions(selected = '') {
  const options = [
    ['', 'No repetir'],
    ['1', 'Cada día'],
    ['7', 'Cada semana'],
    ['14', 'Cada 2 semanas'],
    ['30', 'Cada mes'],
    ['90', 'Cada 3 meses']
  ];
  return options.map(([value, label]) => `<option value="${value}" ${String(selected) === value ? 'selected' : ''}>${label}</option>`).join('');
}

function isAiAlertTask(task) {
  const meta = taskMeta(task);
  const text = [meta.source, task.task_type, task.type, task.category, task.title, task.notes].join(' ').toLowerCase();
  return /parameter_alert|param|actualizar|temperatura|salinidad|ph|kh|no3|po4|calcio|magnesio|alerta ia|análisis ia|analisis ia|riesgo|alerta/.test(text);
}

function renderTaskGroup(title, tasks, openByDefault = false) {
  if (!tasks.length) return '';
  const openAttr = openByDefault ? ' open' : '';
  return `<details class="task-group"${openAttr}><summary><b>${esc(title)}</b> <span class="small">${tasks.length}</span></summary><div class="task-group-body">${tasks.map(tareaCard).join('')}</div></details>`;
}

function renderTaskSections(openTasks, doneTasks) {
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
  const aq = currentAquarium();
  if (task?.aquarium_id && aq?.id === task.aquarium_id && typeof openAqSection === 'function') {
    return openAqSection('tareas');
  }
  return tareas();
}

async function tareasAcuario() {
  const aq = currentAquarium();
  const t = token();
  render(aqHeader('tareas') + `<section class="panel"><div class="panel-head"><h2>Tareas</h2><button class="primary" onclick="formTareaAcuario()">Añadir</button></div>${msg('Cargando tareas...')}</section>`, 'acuarios');
  try {
    const openQuery = supabase.from('tasks').select('*').eq('user_id', state.user.id).eq('aquarium_id', aq.id).neq('status', 'done').order('due_at', { ascending: true, nullsFirst: false }).limit(80);
    const doneQuery = supabase.from('tasks').select('*').eq('user_id', state.user.id).eq('aquarium_id', aq.id).eq('status', 'done').order('completed_at', { ascending: false, nullsFirst: false }).limit(30);
    const [{ data, error }, { data: done, error: doneError }] = await Promise.all([openQuery, doneQuery]);
    if (error) throw error;
    if (doneError) throw doneError;
    if (!isCurrent(t)) return;
    const html = renderTaskSections(data || [], done || []);
    render(aqHeader('tareas') + `<section class="panel"><div class="panel-head"><h2>Tareas</h2><button class="primary" onclick="formTareaAcuario()">Añadir</button></div>${html}</section>`, 'acuarios');
  } catch (e) {
    if (isCurrent(t)) render(aqHeader('tareas') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
  }
}
window.tareasAcuario = tareasAcuario;

function tareaCard(task) {
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

window.formTareaAcuario = function () {
  render(aqHeader('tareas') + `<section class="panel">
    <button onclick="openAqSection('tareas')">← Volver</button>
    <h2>Nueva tarea</h2>
    <label>Título</label><input id="taskTitle">
    <label>Fecha</label><input id="taskDue" type="datetime-local">
    <label>Repetición</label><select id="taskRepeat">${repeatOptions()}</select>
    <label>Notas</label><textarea id="taskNotes"></textarea>
    <button class="primary" onclick="saveTareaAcuario()">Guardar</button>
    <div id="x"></div>
  </section>`, 'acuarios');
};

window.saveTareaAcuario = async function () {
  try {
    const aq = currentAquarium();
    if (!val('taskTitle')) throw new Error('Pon un título.');
    const repeatDays = num('taskRepeat');
    const row = {
      user_id: state.user.id,
      aquarium_id: aq.id,
      title: val('taskTitle'),
      task_type: 'task',
      due_at: val('taskDue') ? new Date(val('taskDue')).toISOString() : null,
      priority: 'normal',
      status: 'open',
      notes: taskNotesPayload(val('taskNotes'), { repeat_days: repeatDays || null, route: 'tareas' })
    };
    const { error } = await supabase.from('tasks').insert(row);
    if (error) throw error;
    tareasAcuario();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

async function loadTask(id) {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).eq('user_id', state.user.id).single();
  if (error) throw error;
  return data;
}

window.verAviso = async function (id) {
  const t = token();
  render(`<section class="panel">${msg('Abriendo aviso...')}</section>`, 'avisos');
  try {
    const task = await loadTask(id);
    if (!isCurrent(t)) return;
    const meta = taskMeta(task);
    const active = task.aquarium_id && currentAquarium()?.id === task.aquarium_id ? 'acuarios' : 'avisos';
    const head = active === 'acuarios' ? aqHeader('tareas') : '';
    const done = task.status === 'done';
    render(head + `<section class="panel task-detail">
      <button onclick="${active === 'acuarios' ? "openAqSection('tareas')" : 'tareas()'}">← Volver</button>
      <small>${esc(task.task_type || task.type || 'aviso')} · ${esc(cleanStatus(task.priority || 'normal'))} · ${dateText(task.due_at)}</small>
      <h2>${esc(cleanParamText(task.title || 'Aviso'))}</h2>
      ${done && task.completed_at ? `<p class="small">Realizado: ${dateText(task.completed_at)}</p>` : ''}
      ${taskNotes(task) ? `<p>${esc(taskNotes(task))}</p>` : ''}
      <div class="quick-actions">
        <button onclick="irAAviso('${esc(task.id)}')"><span>↪</span>Ir</button>
        ${done ? '' : `<button class="primary" onclick="completarAviso('${esc(task.id)}')"><span>✓</span>Hecho</button>`}
      </div>
      <label>Repetir este aviso</label>
      <select id="taskRepeatEdit">${repeatOptions(meta.repeat_days ? String(meta.repeat_days) : '')}</select>
      <button onclick="guardarRepeticionAviso('${esc(task.id)}')">Guardar repetición</button>
      <div id="x"></div>
    </section>`, active);
  } catch (e) {
    render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'avisos');
  }
};

window.irAAviso = async function (id) {
  try {
    const task = await loadTask(id);
    await openTaskTarget(task);
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.guardarRepeticionAviso = async function (id) {
  try {
    const task = await loadTask(id);
    const meta = { ...taskMeta(task), repeat_days: num('taskRepeatEdit') || null, route: taskRoute(task) };
    const { error } = await supabase.from('tasks').update({ notes: taskNotesPayload(taskNotes(task), meta), updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', state.user.id);
    if (error) throw error;
    if (byId('x')) byId('x').innerHTML = msg('Repetición guardada.', 'success');
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.completarAviso = async function (id) {
  try {
    const task = await loadTask(id);
    if (task.status === 'done') return refreshAfterTaskDone(task);
    const meta = taskMeta(task);
    const repeatDays = Number(meta.repeat_days || 0);
    const now = new Date();
    const updates = { status: 'done', completed_at: now.toISOString(), updated_at: now.toISOString() };
    const { error } = await supabase.from('tasks').update(updates).eq('id', id).eq('user_id', state.user.id);
    if (error) throw error;
    if (repeatDays > 0) {
      const base = task.due_at ? new Date(task.due_at) : now;
      const next = new Date(Math.max(base.getTime(), now.getTime()) + repeatDays * 86400000);
      const nextRow = {
        user_id: state.user.id,
        aquarium_id: task.aquarium_id || null,
        title: task.title,
        task_type: task.task_type || task.type || 'task',
        type: task.type || null,
        category: task.category || null,
        priority: task.priority || 'normal',
        status: 'open',
        due_at: next.toISOString(),
        notes: taskNotesPayload(taskNotes(task), meta)
      };
      const insert = await supabase.from('tasks').insert(nextRow);
      if (insert.error) throw insert.error;
    }
    refreshAfterTaskDone(task);
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.tareas = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="panel"><button onclick="volverAvisos()">← Volver</button><h2>Avisos</h2>${msg('Cargando tareas...')}</section>`, 'avisos');
  try {
    const openQuery = supabase.from('tasks').select('*').eq('user_id', state.user.id).neq('status', 'done').order('due_at', { ascending: true, nullsFirst: false }).limit(120);
    const doneQuery = supabase.from('tasks').select('*').eq('user_id', state.user.id).eq('status', 'done').order('completed_at', { ascending: false, nullsFirst: false }).limit(40);
    const [{ data, error }, { data: done, error: doneError }] = await Promise.all([openQuery, doneQuery]);
    if (error) throw error;
    if (doneError) throw doneError;
    if (!isCurrent(t)) return;
    const html = renderTaskSections(data || [], done || []);
    render(`<section class="panel"><button onclick="volverAvisos()">← Volver</button><div class="panel-head"><div><h2>Avisos</h2><p class="small">Toca un aviso para abrirlo, ir al módulo, marcarlo hecho o repetirlo.</p></div><button class="primary" style="color:#fff!important;opacity:1!important;min-width:128px" onclick="iaAcuarioNexo()">Revisar IA</button></div>${html}</section>`, 'avisos');
  } catch (e) {
    if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'avisos');
  }
};

})();