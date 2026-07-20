/* AcuarioNexo · Tasks form */
(function () {
  function formTareaAcuario() {
    const { render, aqHeader, repeatControls } = window.ANX;
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
  }

  window.formTareaAcuario = formTareaAcuario;
  window.ANX = window.ANX || {};
  window.ANX.TasksForm = Object.assign(window.ANX.TasksForm || {}, { formTareaAcuario });
})();