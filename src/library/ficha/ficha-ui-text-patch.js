/* AcuarioNexo · parche global textos biblioteca */
(function () {
  function patchText() {
    document.querySelectorAll('button').forEach(function (button) {
      var text = (button.textContent || '').trim();
      if (text === 'Añadir a mi inventario') button.textContent = 'Añadir al acuario';
      var title = button.getAttribute('title') || '';
      if (title.includes('añadir a inventario')) {
        button.setAttribute('title', title.replace('añadir a inventario', 'añadir al acuario'));
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchText);
  else patchText();

  setInterval(patchText, 300);
})();
