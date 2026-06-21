/* AcuarioNexo · tasks */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;

async function tareasAcuario() {
  const aq = currentAquarium();
  const t = token();
  render(aqHeader('tareas') + `<section class="panel"><div class="panel-head"><h2>Tareas</h2><button class="primary" onclick="formTareaAcuario()">Añadir</button></div>${msg('Cargando tareas...')}</section>`, 'acuarios');
  try {
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', state.user.id).eq('aquarium_id', aq.id).order('due_at', { ascending: true, nullsFirst: false }).limit(80);
    if (error) throw error;
    if (!isCurrent(t)) return;
    const html = (data || []).map(tareaCard).join('');
    render(aqHeader('tareas') + `<section class="panel"><div class="panel-head"><h2>Tareas</h2><button class="primary" onclick="formTareaAcuario()">Añadir</button></div>${html || msg('Sin tareas pendientes.')}</section>`, 'acuarios');
  } catch (e) {
    if (isCurrent(t)) render(aqHeader('tareas') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
  }
}
window.tareasAcuario = tareasAcuario;

function tareaCard(task) {
  return `<div class="${task.status === 'done' ? 'success' : 'item'}"><b>${esc(task.title || 'Tarea')}</b><p class="small">${dateText(task.due_at)} · ${esc(task.priority || 'normal')} · ${esc(task.status || 'open')}</p>${task.notes ? `<p>${esc(task.notes)}</p>` : ''}</div>`;
}

window.formTareaAcuario = function () {
  render(aqHeader('tareas') + `<section class="panel">
    <button onclick="openAqSection('tareas')">← Volver</button>
    <h2>Nueva tarea</h2>
    <label>Título</label><input id="taskTitle">
    <label>Fecha</label><input id="taskDue" type="datetime-local">
    <label>Notas</label><textarea id="taskNotes"></textarea>
    <button class="primary" onclick="saveTareaAcuario()">Guardar</button>
    <div id="x"></div>
  </section>`, 'acuarios');
};

window.saveTareaAcuario = async function () {
  try {
    const aq = currentAquarium();
    if (!val('taskTitle')) throw new Error('Pon un título.');
    const row = { user_id: state.user.id, aquarium_id: aq.id, title: val('taskTitle'), task_type: 'task', due_at: val('taskDue') ? new Date(val('taskDue')).toISOString() : null, priority: 'normal', status: 'open', notes: val('taskNotes') || null };
    const { error } = await supabase.from('tasks').insert(row);
    if (error) throw error;
    tareasAcuario();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.tareas = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="panel"><h2>Avisos</h2>${msg('Cargando tareas...')}</section>`, 'avisos');
  try {
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', state.user.id).neq('status', 'done').order('due_at', { ascending: true, nullsFirst: false }).limit(120);
    if (error) throw error;
    if (!isCurrent(t)) return;
    render(`<section class="panel"><div class="panel-head"><div><h2>Avisos</h2><p class="small">Tareas y avisos pendientes.</p></div><button class="primary" style="color:#fff!important;opacity:1!important;min-width:128px" onclick="iaAcuarioNexo()">Revisar IA</button></div>${(data || []).map(tareaCard).join('') || msg('No hay avisos pendientes.', 'success')}</section>`, 'avisos');
  } catch (e) {
    if (isCurrent(t)) render(`<section class="panel">${msg(e.message, 'error')}</section>`, 'avisos');
  }
};

})();