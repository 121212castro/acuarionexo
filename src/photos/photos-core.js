/* AcuarioNexo · photos core */
(function () {
  const { esc, photoUrl } = window.ANX;

  function photoCard(p) {
    const url = photoUrl(p);
    const title = p.title || p.caption || 'Foto';
    return `<div class="item gallery-card">
      ${url ? `<img src="${esc(url)}" alt="${esc(title)}" loading="lazy">` : ''}
      <b>${esc(title)}</b>
      <button class="ghost danger" onclick="borrarFotoAcuario('${esc(p.id)}','${esc(title)}')">Borrar</button>
    </div>`;
  }

  window.ANX.PhotosCore = {
    photoCard
  };
})();
