/* AcuarioNexo · fix navegación Inicio/Acuarios */
(function () {
  let coreDashboard = null;

  function appNode() {
    return document.getElementById('app');
  }

  function hasUser() {
    return !!(window.state && window.state.user);
  }

  function nav(active) {
    const item = function (id, label, icon, fn) {
      return `<button class="${active === id ? 'active' : ''}" onclick="${fn}"><span>${icon}</span><small>${label}</small></button>`;
    };
    return `<nav class="bottom-nav">
      ${item('inicio', 'Inicio', '⌂', 'dashboard()')}
      ${item('acuarios', 'Acuarios', '▣', 'acuarios()')}
      ${item('biblioteca', 'Biblioteca', '□', 'biblioteca()')}
      ${item('avisos', 'Avisos', '♢', 'tareas()')}
      ${item('inventario', 'Inventario', '▤', 'inventario()')}
    </nav>`;
  }

  function renderStandalone(html, active) {
    document.querySelector('.bottom-nav')?.remove();
    const app = appNode();
    if (!app) return;
    app.innerHTML = html + '<div style="height:140px"></div>';
    document.body.insertAdjacentHTML('beforeend', nav(active));
    window.scrollTo(0, 0);
  }

  async function openAquariums() {
    if (!coreDashboard && typeof window.dashboard === 'function') coreDashboard = window.dashboard;
    if (!hasUser()) return coreDashboard ? coreDashboard() : undefined;
    if (coreDashboard) await coreDashboard();
    document.querySelectorAll('.bottom-nav button').forEach(function (btn) {
      const label = btn.querySelector('small')?.textContent?.trim();
      btn.classList.toggle('active', label === 'Acuarios');
      if (label === 'Acuarios') btn.setAttribute('onclick', 'acuarios()');
    });
  }

  function openHome() {
    if (!coreDashboard && typeof window.dashboard === 'function') coreDashboard = window.dashboard;
    if (!hasUser()) return coreDashboard ? coreDashboard() : undefined;
    const total = Array.isArray(window.state?.aquariums) ? window.state.aquariums.length : '-';
    renderStandalone(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Panel separado de Acuarios</p></div><button onclick="acuarios()">▣</button></section>
      <section class="panel"><div class="panel-head"><h2>Resumen</h2><button onclick="acuarios()">Ver acuarios</button></div>
      <p class="small">Acuarios activos: ${total}</p><p class="small">La lista completa está ahora en la pestaña Acuarios.</p></section>`, 'inicio');
  }

  function install() {
    if (typeof window.dashboard === 'function' && !coreDashboard) coreDashboard = window.dashboard;
    window.acuarios = openAquariums;
    window.dashboard = openHome;
    document.addEventListener('click', function (event) {
      const btn = event.target.closest && event.target.closest('.bottom-nav button');
      if (!btn) return;
      const label = btn.querySelector('small')?.textContent?.trim();
      if (label === 'Acuarios') {
        event.preventDefault();
        event.stopImmediatePropagation();
        openAquariums();
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
