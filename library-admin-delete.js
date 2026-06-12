/* AcuarioNexo · Borrado admin de fichas de biblioteca */
(function() {
  const BUILD = 'library-admin-delete-v1';
  const ADMIN_EMAILS = ['12castro@hotmail.es'];

  function esc(x) {
    return (window.E ? window.E(x) : String(x ?? '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    }));
  }

  function adminButtonVisible() {
    const btn = document.getElementById('adminBtn');
    return !!btn && !btn.classList.contains('hidden');
  }

  async function requireLibraryAdmin() {
    const userResult = await window.s.auth.getUser();
    const user = userResult?.data?.user;
    if (!user) throw new Error('Debes iniciar sesion.');

    const email = String(user.email || '').trim().toLowerCase();
    if (ADMIN_EMAILS.includes(email)) return user;

    const profile = await window.s.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile.error) throw profile.error;
    if (String(profile.data?.role || '').trim().toLowerCase() !== 'admin') {
      throw new Error('Acceso reservado a administradores.');
    }
    return user;
  }

  function entryAt(index) {
    const row = (window.__bibliotecaVistaActual || [])[index];
    const raw = row?.raw || row || {};
    const id = raw.id || row?.id;
    const name = row?.nombre || raw.title || raw.nombre || raw.scientific_name || 'esta ficha';
    return { row, raw, id, name };
  }

  function ensureButton(index, root) {
    if (!adminButtonVisible()) return;
    const item = entryAt(index);
    if (!item.id || root.querySelector('[data-admin-delete-library]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.adminDeleteLibrary = String(index);
    button.className = 'danger';
    button.innerHTML = '<span>⌫</span>Borrar ficha';
    button.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      window.borrarFichaBiblioteca(index);
    });
    root.appendChild(button);
  }

  function injectListButtons() {
    if (!adminButtonVisible()) return;
    document.querySelectorAll('.library-card').forEach(function(card, index) {
      const body = card.querySelector('.library-card-body') || card;
      ensureButton(index, body);
    });
  }

  function injectDetailButton(index) {
    if (!adminButtonVisible()) return;
    const panel = document.querySelector('.library-detail');
    if (!panel) return;
    const target = panel.querySelector('.quick-actions') || panel;
    ensureButton(index, target);
  }

  window.borrarFichaBiblioteca = async function(index) {
    try {
      await requireLibraryAdmin();
      const item = entryAt(index);
      if (!item.id) throw new Error('No encuentro el ID de esta ficha para poder borrarla.');
      if (!confirm('¿Borrar definitivamente "' + item.name + '" de la Biblioteca?')) return;
      const result = await window.s.from('library_entries').delete().eq('id', item.id);
      if (result.error) throw result.error;
      alert('Ficha borrada de Biblioteca.');
      if (window.biblioteca) await window.biblioteca();
    } catch (error) {
      alert(error.message || String(error));
    }
  };

  const previousRenderList = window.renderBibliotecaLista;
  if (previousRenderList) {
    window.renderBibliotecaLista = function(list, modulo) {
      const result = previousRenderList(list, modulo);
      setTimeout(injectListButtons, 0);
      return result;
    };
  }

  const previousVer = window.verFichaBiblioteca;
  if (previousVer) {
    window.verFichaBiblioteca = function(index) {
      const result = previousVer(index);
      setTimeout(function() { injectDetailButton(index); }, 0);
      return result;
    };
  }

  window.__ACUARIONEXO_LIBRARY_ADMIN_DELETE__ = BUILD;
})();
