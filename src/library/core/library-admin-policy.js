/* AcuarioNexo · Biblioteca · política Admin */
(function () {
  const ANX = window.ANX || {};
  const { state, msg, render } = ANX;
  const Core = ANX.LibraryV3Core || {};
  if (!state) return;

  function isAdmin() {
    return !!state.isAdmin;
  }

  function ownsEntry(id) {
    const entry = typeof Core.row === 'function' ? Core.row(id) : null;
    return !!entry && !!state.user?.id && String(entry.user_id || '') === String(state.user.id);
  }

  function canManageEntry(id) {
    return isAdmin() || ownsEntry(id);
  }

  function denyManage() {
    render(`<section class="panel">${msg('No tienes permiso para modificar esta ficha.', 'error')}<button onclick="biblioteca()">Volver a Biblioteca</button></section>`, 'biblioteca');
  }

  function manageOwnOrAdmin(fn) {
    return function (id) {
      if (!canManageEntry(id)) return denyManage();
      return fn.apply(window, arguments);
    };
  }

  function adminOnly(fn) {
    return function () {
      if (!isAdmin()) {
        render(`<section class="panel">${msg('Esta acción está restringida al panel Admin.', 'error')}<button onclick="biblioteca()">Volver a Biblioteca</button></section>`, 'biblioteca');
        return;
      }
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
  if (typeof original.formFicha === 'function') window.formFicha = manageOwnOrAdmin(original.formFicha);
  if (typeof original.guardarFicha === 'function') window.guardarFicha = manageOwnOrAdmin(original.guardarFicha);
  if (typeof original.auditarFicha === 'function') window.auditarFicha = manageOwnOrAdmin(original.auditarFicha);
  if (typeof original.publicarFicha === 'function') window.publicarFicha = adminOnly(original.publicarFicha);
  if (typeof original.borrarFicha === 'function') window.borrarFicha = manageOwnOrAdmin(original.borrarFicha);
  if (typeof original.copiarApartadosFicha === 'function') window.copiarApartadosFicha = adminOnly(original.copiarApartadosFicha);

  ANX.LibraryAdminPolicy = { isAdmin, ownsEntry, canManageEntry };
})();
