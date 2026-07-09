/* AcuarioNexo · Biblioteca · limpieza de imagenes */
(function () {
  const ANX = window.ANX;
  const Images = ANX.LibraryV3Images;
  if (!ANX || !Images) return;

  function esc(value) {
    return ANX.esc ? ANX.esc(value) : String(value ?? '');
  }

  function notice(text) {
    return ANX.msg ? ANX.msg(text, 'notice') : '<div class="notice">' + esc(text) + '</div>';
  }

  function preview(url, alt, emptyText) {
    return url ? '<img src="' + esc(url) + '" alt="' + esc(alt) + '">' : notice(emptyText);
  }

  Images.imageBox = function (x) {
    const sameImage = !!x.cover_url && !!x.photo_url && x.cover_url === x.photo_url;
    const coverPreview = preview(x.cover_url, 'Portada', 'Sin portada');
    const photoPreview = sameImage ? notice('Pendiente: sube una foto distinta para abrir la ficha.') : preview(x.photo_url, 'Foto ficha', 'Sin foto principal');
    return '<section class="panel library-image-panel"><h3>Imagenes de la ficha</h3><div class="library-image-grid"><div><label>Foto portada</label><div id="coverPreview">' + coverPreview + '</div><input id="coverFile" type="file" accept="image/*" onchange="previewLibraryImage(\'coverFile\',\'coverPreview\')"><button onclick="guardarImagenFicha(\'' + esc(x.id) + '\',\'cover_url\',\'coverFile\')">Guardar portada</button></div><div><label>Foto al abrir ficha</label><div id="photoPreview">' + photoPreview + '</div><input id="photoFile" type="file" accept="image/*" onchange="previewLibraryImage(\'photoFile\',\'photoPreview\')"><button onclick="guardarImagenFicha(\'' + esc(x.id) + '\',\'photo_url\',\'photoFile\')">Guardar foto ficha</button></div></div><div id="imageStatus"></div></section>';
  };
})();
