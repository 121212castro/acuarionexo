/* AcuarioNexo · photos form */
(function () {
  const { byId, render, aqHeader } = window.ANX;

  window.formFoto = function () {
    render(aqHeader('fotos') + `<section class="panel">
      <button onclick="openAqSection('fotos')">← Volver</button>
      <h2>Subir foto</h2>
      <label>Título</label><input id="photoTitle" placeholder="Vista general, evolución, coral nuevo...">
      <label>Imagen</label><input id="photoFile" type="file" accept="image/*" onchange="previewPhoto()">
      <div id="photoPreview"></div>
      <button class="primary" onclick="saveFoto()">Guardar foto</button>
      <div id="x"></div>
    </section>`, 'acuarios');
  };

  window.previewPhoto = function () {
    const file = byId('photoFile')?.files?.[0];
    if (!file || !byId('photoPreview')) return;
    const url = URL.createObjectURL(file);
    byId('photoPreview').innerHTML = `<div class="photo-preview"><img src="${url}" alt="Previsualización"></div>`;
  };
})();
