/* AcuarioNexo · pegar imágenes del portapapeles en fichas */
(function () {
  const ANX = window.ANX = window.ANX || {};

  function imageFromClipboard(event) {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find(item => String(item.type || '').startsWith('image/'));
    return imageItem?.getAsFile?.() || null;
  }

  function chooseInput() {
    const preferred = window.__anxImagePasteTarget;
    if (preferred && document.getElementById(preferred)) return document.getElementById(preferred);
    return document.getElementById('photoFile') || document.getElementById('coverFile') || null;
  }

  function assignFile(input, file) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    const previewId = input.id === 'coverFile' ? 'coverPreview' : 'photoPreview';
    if (typeof window.previewLibraryImage === 'function') window.previewLibraryImage(input.id, previewId);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  document.addEventListener('click', function (event) {
    const cover = event.target.closest?.('#coverDrop,#coverPreview');
    const photo = event.target.closest?.('#photoDrop,#photoPreview');
    if (cover && document.getElementById('coverFile')) window.__anxImagePasteTarget = 'coverFile';
    else if (photo && document.getElementById('photoFile')) window.__anxImagePasteTarget = 'photoFile';
  }, true);

  document.addEventListener('paste', function (event) {
    const file = imageFromClipboard(event);
    if (!file) return;
    const input = chooseInput();
    if (!input) return;
    event.preventDefault();
    assignFile(input, file);
    const box = ANX.byId?.('imageStatus') || ANX.byId?.('x');
    if (box && ANX.msg) box.innerHTML = ANX.msg('Imagen pegada desde el portapapeles. Pulsa Guardar foto interior para subirla.');
  }, true);

  window.pegarImagenBiblioteca = async function (target = 'photoFile') {
    const input = document.getElementById(target) || chooseInput();
    const box = ANX.byId?.('imageStatus') || ANX.byId?.('x');
    if (!input) return;
    try {
      if (!navigator.clipboard?.read) throw new Error('Usa ⌘V después de copiar la imagen en el escritorio.');
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find(t => t.startsWith('image/'));
        if (!type) continue;
        const blob = await item.getType(type);
        const file = new File([blob], `portapapeles-${Date.now()}.${type.split('/')[1] || 'png'}`, { type });
        assignFile(input, file);
        if (box && ANX.msg) box.innerHTML = ANX.msg('Imagen pegada. Pulsa Guardar foto interior para subirla.');
        return;
      }
      throw new Error('El portapapeles no contiene una imagen.');
    } catch (error) {
      if (box && ANX.msg) box.innerHTML = ANX.msg(error.message || 'No se pudo leer el portapapeles.', 'error');
    }
  };
})();
