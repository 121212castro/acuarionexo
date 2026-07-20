/* AcuarioNexo · tasks */
(function () {
  const { supabase, state, esc, byId, val, msg, token, isCurrent, dateText, currentAquarium, render, aqHeader } = window.ANX;
  const { cleanParamText, cleanStatus, taskMeta, taskNotes, taskNotesPayload, taskRoute, openTaskTarget, repeatControls, repeatSelection, renderTaskSections, refreshAfterTaskDone } = window.ANX;

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

window.formTareaAcuario = function () {
  render(aqHeader('tareas') + `<section class="panel">
    <button onclick="openAqSection('tareas')">← Volver</button>
    <h2>Nueva tarea</h2>
    <label>Título</label><input id="taskTitle" oninput="if(document.getElementById('taskRepeat')?.value==='ai') taskRepeatChanged('task')">
    <label>Fecha</label><input id="taskDue" type="datetime-local">
    <label>Repetición</label>${repeatControls('task')}
    <label>Notas</label><textarea id="taskNotes"></textarea>
    <button class="primary" onclick="saveTareaAcuario()">Guardar</button>
    <div id="x"></div>
  </section>`, 'acuarios');
};

window.saveTareaAcuario = async function () {
  try {
    const aq = currentAquarium();
    if (!val('taskTitle')) throw new Error('Pon un título.');
    const repeat = repeatSelection('task');
    const row = {
      user_id: state.user.id,
      aquarium_id: aq.id,
      title: val('taskTitle'),
      task_type: 'task',
      due_at: val('taskDue') ? new Date(val('taskDue')).toISOString() : null,
      priority: 'normal',
      status: 'open',
      notes: taskNotesPayload(val('taskNotes'), {
        repeat_days: repeat.days,
        repeat_mode: repeat.mode,
        repeat_reason: repeat.reason,
        route: 'tareas'
      })
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
    const repeatMode = meta.repeat_mode === 'ai' ? 'ai' : (meta.repeat_days ? 'custom' : '');
    render(head + `<section class="panel task-detail">
      <button onclick="${active === 'acuarios' ? "openAqSection('tareas')" : 'tareas()'}">← Volver</button>
      <small>${esc(task.task_type || task.type || 'aviso')} · ${esc(cleanStatus(task.priority || 'normal'))} · ${dateText(task.due_at)}</small>
      <h2 id="taskTitleEdit">${esc(cleanParamText(task.title || 'Aviso'))}</h2>
      ${done && task.completed_at ? `<p class="small">Realizado: ${dateText(task.completed_at)}</p>` : ''}
      ${taskNotes(task) ? `<p>${esc(taskNotes(task))}</p>` : ''}
      <div class="quick-actions">
        <button onclick="irAAviso('${esc(task.id)}')"><span>↪</span>Ir</button>
        ${done ? '' : `<button class="primary" onclick="completarAviso('${esc(task.id)}')"><span>✓</span>Hecho</button>`}
      </div>
      <label>Repetir este aviso</label>
      ${repeatControls('taskEdit', repeatMode, meta.repeat_days || '')}
      ${meta.repeat_reason ? `<p class="small">${esc(meta.repeat_reason)}</p>` : ''}
      <button onclick="guardarRepeticionAviso('${esc(task.id)}')">Guardar repetición</button>
      <div id="x"></div>
    </section>`, active);
    if (repeatMode === 'ai') taskRepeatChanged('taskEdit');
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
    const repeat = repeatSelection('taskEdit');
    const meta = {
      ...taskMeta(task),
      repeat_days: repeat.days,
      repeat_mode: repeat.mode,
      repeat_reason: repeat.reason,
      route: taskRoute(task)
    };
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