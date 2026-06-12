/* AcuarioNexo · Borrado admin de fichas de biblioteca */
(function() {
  const BUILD = 'library-admin-delete-v2-detail-only-admin-mode';
  const ADMIN_EMAILS = ['12castro@hotmail.es'];
  let adminLibraryMode = false;
  let openingFromAdmin = false;

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

  function buildDeleteBlock(index) {
    const item = entryAt(index);
    if (!item.id) return null;
    const wrap = document.createElement('div');
    wrap.className = 'library-admin-delete-block';
    wrap.dataset.adminDeleteLibrary = String(index);
    wrap.innerHTML = '<p class="small">Accion de administrador</p>';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'danger';
    button.innerHTML = '<span>⌫</span>Borrar ficha';
    button.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      window.borrarFichaBiblioteca(index);
    });
    wrap.appendChild(button);
    return wrap;
  }

  function injectDetailButton(index) {
    if (!adminLibraryMode) return;
    const panel = document.querySelector('.library-detail');
    if (!panel || panel.querySelector('[data-admin-delete-library]')) return;
    const block = buildDeleteBlock(index);
    if (block) panel.appendChild(block);
  }

  function installStyles() {
    if (document.getElementById('libraryAdminDeleteStyles')) return;
    const style = document.createElement('style');
    style.id = 'libraryAdminDeleteStyles';
    style.textContent = '' +
      '.library-admin-delete-block{margin-top:22px;padding-top:18px;border-top:1px solid rgba(137,190,215,.22)}' +
      '.library-admin-delete-block .danger{width:100%;margin-top:8px;background:rgba(74,38,54,.92)}';
    document.head.appendChild(style);
  }

  function patchAdminPanelLinks() {
    document.querySelectorAll('button').forEach(function(button) {
      const attr = button.getAttribute('onclick') || '';
      if (attr.trim() === 'biblioteca()' && /Biblioteca/i.test(button.textContent || '')) {
        button.setAttribute('onclick', 'adminBiblioteca()');
      }
    });
  }

  window.adminBiblioteca = async function() {
    try {
      await requireLibraryAdmin();
      adminLibraryMode = true;
      openingFromAdmin = true;
      const result = window.biblioteca ? window.biblioteca() : undefined;
      setTimeout(function() { openingFromAdmin = false; }, 0);
      return result;
    } catch (error) {
      alert(error.message || String(error));
    }
  };

  window.borrarFichaBiblioteca = async function(index) {
    try {
      if (!adminLibraryMode) throw new Error('Abre la Biblioteca desde el panel Admin para borrar fichas.');
      await requireLibraryAdmin();
      const item = entryAt(index);
      if (!item.id) throw new Error('No encuentro el ID de esta ficha para poder borrarla.');
      if (!confirm('¿Borrar definitivamente "' + item.name + '" de la Biblioteca?')) return;
      const result = await window.s.from('library_entries').delete().eq('id', item.id);
      if (result.error) throw result.error;
      alert('Ficha borrada de Biblioteca.');
      if (window.adminBiblioteca) await window.adminBiblioteca();
    } catch (error) {
      alert(error.message || String(error));
    }
  };

  const previousBiblioteca = window.biblioteca;
  if (previousBiblioteca) {
    window.biblioteca = function() {
      if (!openingFromAdmin) adminLibraryMode = false;
      return previousBiblioteca.apply(this, arguments);
    };
  }

  const previousAdminPanel = window.adminPanel;
  if (previousAdminPanel) {
    window.adminPanel = async function() {
      adminLibraryMode = false;
      const result = await previousAdminPanel.apply(this, arguments);
      setTimeout(patchAdminPanelLinks, 0);
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

  installStyles();
  window.__ACUARIONEXO_LIBRARY_ADMIN_DELETE__ = BUILD;
})();
