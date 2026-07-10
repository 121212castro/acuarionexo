/* AcuarioNexo · Biblioteca · política Admin */
(function () {
  const ANX = window.ANX || {};
  const { state, msg, render } = ANX;
  if (!state) return;

  function isAdmin() {
    return !!state.isAdmin;
  }

  function denyAdminOnly() {
    render(`<section class="panel">${msg('La creación y edición de fichas está restringida al panel Admin.', 'error')}<button onclick="biblioteca()">Volver a Biblioteca</button></section>`, 'biblioteca');
  }

  function adminOnly(fn) {
    return function () {
      if (!isAdmin()) return denyAdminOnly();
      return fn.apply(window, arguments);
    };
  }

  const original = {
    nuevaFichaV3: window.nuevaFichaV3,
    formFicha: window.formFicha,
    guardarFicha: window.guardarFicha,
    auditarFicha: window.auditarFicha,
    publicarFicha: window.publicarFicha,
    borrarFicha: window.borrarFicha,
    copiarApartadosFicha: window.copiarApartadosFicha
  };

  if (typeof original.nuevaFichaV3 === 'function') window.nuevaFichaV3 = adminOnly(original.nuevaFichaV3);
  if (typeof original.formFicha === 'function') window.formFicha = adminOnly(original.formFicha);
  if (typeof original.guardarFicha === 'function') window.guardarFicha = adminOnly(original.guardarFicha);
  if (typeof original.auditarFicha === 'function') window.auditarFicha = adminOnly(original.auditarFicha);
  if (typeof original.publicarFicha === 'function') window.publicarFicha = adminOnly(original.publicarFicha);
  if (typeof original.borrarFicha === 'function') window.borrarFicha = adminOnly(original.borrarFicha);
  if (typeof original.copiarApartadosFicha === 'function') window.copiarApartadosFicha = adminOnly(original.copiarApartadosFicha);

  ANX.LibraryAdminPolicy = { isAdmin, denyAdminOnly };
})();
