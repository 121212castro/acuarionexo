/* AcuarioNexo · core coordinator */
(function () {
  const config = window.ACUARIONEXO_CONFIG || {};
  const app = document.getElementById('app');
  const supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
  const state = {
    user: null,
    aquariums: [],
    aquarium: null,
    section: 'inicio',
    passwordRecovery: false,
    viewToken: 0,
    libraryRows: [],
    libraryView: [],
    libraryModule: null
  };

  window.s = supabase;
  window.state = state;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  function byId(id) { return document.getElementById(id); }
  function val(id) { return (byId(id)?.value || '').trim(); }
  function num(id) { const n = Number(val(id)); return Number.isFinite(n) ? n : null; }
  function msg(text, kind = 'notice') { return `<div class="${kind}">${esc(text)}</div>`; }
  function token() { state.viewToken += 1; return state.viewToken; }
  function isCurrent(t) { return t === state.viewToken; }

  function dateText(value) {
    if (!value) return 'Sin fecha';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Sin fecha';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function currentAquarium() { return state.aquarium || window.q || null; }

  function authRedirectUrl() {
    return `${location.origin}${location.pathname}`;
  }

  function isPasswordRecoveryUrl() {
    return /type=recovery/i.test(location.hash || '') || /type=recovery/i.test(location.search || '');
  }

  function bottomNav(active) {
    const item = (id, label, icon, fn) => `<button class="${active === id ? 'active' : ''}" onclick="${fn}"><span>${icon}</span><small>${label}</small></button>`;
    return `<nav class="bottom-nav">
      ${item('inicio', 'Inicio', '⌂', 'dashboard()')}
      ${item('acuarios', 'Acuarios', '▣', 'dashboard()')}
      ${item('biblioteca', 'Biblioteca', '□', 'biblioteca()')}
      ${item('avisos', 'Avisos', '♢', 'tareas()')}
      ${item('inventario', 'Inventario', '▤', 'inventario()')}
    </nav>`;
  }

  function render(html, active = 'inicio', showNav = true) {
    document.querySelector('.bottom-nav')?.remove();
    app.innerHTML = html + (showNav ? '<div style="height:140px"></div>' : '');
    if (showNav) document.body.insertAdjacentHTML('beforeend', bottomNav(active));
    window.scrollTo(0, 0);
    requestAnimationFrame(function () {
      const el = document.querySelector('.tank-tabs .active');
      if (el) el.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
  }

  function panel(title, body, active = 'inicio') {
    render(`<section class="panel"><h2>${esc(title)}</h2>${body}</section>`, active);
  }

  function tabButton(id, label) {
    return `<button class="${state.section === id ? 'active' : ''}" onclick="openAqSection('${id}')">${esc(label)}</button>`;
  }

  function aqHeader(section) {
    if (section) state.section = section;
    const aq = currentAquarium();
    if (!aq) return '';
    const liters = aq.real_liters ?? aq.liters ?? '-';
    const type = aq.aquarium_type || aq.type || 'Acuario';
    return `<section class="tank-head">
      <button onclick="dashboard()">←</button>
      <div><h2>${esc(aq.name || 'Acuario')}</h2><p>${esc(liters)} L · ${esc(type)}</p></div>
    </section>
    <nav class="tank-tabs">
      ${tabButton('resumen', 'Resumen')}
      ${tabButton('fichas', 'Fichas')}
      ${tabButton('animales', 'Animales')}
      ${tabButton('mapa', 'Mapa IA')}
      ${tabButton('fotos', 'Fotos')}
      ${tabButton('inventario', 'Inventario')}
      ${tabButton('parametros', 'Parámetros')}
      ${tabButton('tareas', 'Tareas')}
    </nav>`;
  }

  function aquariumIcon(aq) {
    if (aq?.aquarium_type === 'freshwater') return '🌿';
    if (aq?.aquarium_type === 'hospital' || aq?.aquarium_type === 'quarantine') return '🏥';
    return '🐠';
  }

  function photoUrl(row) {
    return row?.image_url || row?.photo_url || row?.public_url || row?.url || row?.cover_url || '';
  }

  async function uploadAquariumImage(file, folder) {
    const aq = currentAquarium();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${folder}/${state.user.id}/${aq.id}/${Date.now()}.${ext}`;
    for (const bucket of ['aquarium-photos', 'photos', 'animal-photos']) {
      const upload = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (!upload.error) return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
    throw new Error('No se pudo subir la foto. Revisa Storage.');
  }

  window.ANX = {
    config,
    app,
    supabase,
    state,
    esc,
    byId,
    val,
    num,
    msg,
    token,
    isCurrent,
    dateText,
    currentAquarium,
    authRedirectUrl,
    isPasswordRecoveryUrl,
    render,
    panel,
    aqHeader,
    aquariumIcon,
    photoUrl,
    uploadAquariumImage
  };
})();
