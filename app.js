/* AcuarioNexo · core coordinator */
(function () {
  const config = window.ACUARIONEXO_CONFIG || {};
  const app = document.getElementById('app');
  const supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'acuarionexo-auth-v2'
    }
  });
  const state = {
    user: null,
    aquariums: [],
    aquarium: null,
    section: 'inicio',
    passwordRecovery: false,
    viewToken: 0,
    libraryRows: [],
    libraryFilter: 'all',
    adminRole: null,
    isAdmin: false,
    demoMode: false
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

  const PRIVATE_MEDIA_BUCKETS = new Set(['aquarium-photos', 'photos', 'animal-photos']);
  const signedPhotoCache = new Map();

  function storageAsset(value) {
    const text = String(value || '').trim();
    if (!text) return null;
    const storageRef = text.match(/^storage:\/\/([^/]+)\/(.+)$/i);
    if (storageRef) return { bucket: storageRef[1], path: storageRef[2] };
    const storageUrl = text.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?]+)\/([^?]+)/i);
    if (!storageUrl) return null;
    try {
      return { bucket: decodeURIComponent(storageUrl[1]), path: decodeURIComponent(storageUrl[2]) };
    } catch (_) {
      return { bucket: storageUrl[1], path: storageUrl[2] };
    }
  }

  function storageReference(bucket, path) {
    return `storage://${bucket}/${path}`;
  }

  async function signedPhotoUrl(value, expiresIn = 3600) {
    const text = String(value || '').trim();
    const asset = storageAsset(text);
    if (!asset || !PRIVATE_MEDIA_BUCKETS.has(asset.bucket)) return text;
    const cacheKey = `${asset.bucket}/${asset.path}`;
    const cached = signedPhotoCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.url;
    const { data, error } = await supabase.storage.from(asset.bucket).createSignedUrl(asset.path, expiresIn);
    if (error) throw error;
    const url = data?.signedUrl || '';
    if (!url) throw new Error('No se pudo autorizar la lectura de la imagen privada.');
    signedPhotoCache.set(cacheKey, { url, expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000 });
    return url;
  }

  async function hydratePrivatePhoto(row) {
    if (!row || typeof row !== 'object') return row;
    const source = row.image_url || row.photo_url || row.public_url || row.url || row.cover_url || '';
    row.__signed_photo_url = source ? await signedPhotoUrl(source) : '';
    return row;
  }

  function authRedirectUrl() {
    return `${location.origin}${location.pathname}`;
  }

  function isPasswordRecoveryUrl() {
    return /type=recovery/i.test(location.hash || '') || /type=recovery/i.test(location.search || '');
  }

  function bottomNav(active) {
    const item = (id, label, icon, fn) => `<button class="${active === id ? 'active' : ''}" onclick="${fn}"><span>${icon}</span><small>${label}</small></button>`;
    if (state.demoMode) {
      return `<nav class="bottom-nav" aria-label="Navegación de demostración">
        ${item('inicio', 'Inicio', '⌂', 'demoDashboard()')}
        ${item('acuarios', 'Acuarios', '▣', 'demoAquariums()')}
        ${item('biblioteca', 'Biblioteca', '□', 'biblioteca()')}
        ${item('parametros', 'Parámetros', '◫', 'demoParameters()')}
        ${item('avisos', 'Avisos', '♢', 'demoTasks()')}
      </nav>`;
    }
    return `<nav class="bottom-nav" aria-label="Navegación principal">
      ${item('inicio', 'Inicio', '⌂', 'dashboard()')}
      ${item('acuarios', 'Acuarios', '▣', 'acuariosHome()')}
      ${item('biblioteca', 'Biblioteca', '□', 'biblioteca()')}
      ${item('microfauna', 'Microfauna', '◌', 'microfauna()')}
      ${item('avisos', 'Avisos', '♢', 'tareas()')}
    </nav>`;
  }

  function render(html, active = 'inicio', showNav = true) {
    document.querySelector('.bottom-nav')?.remove();
    app.innerHTML = html;
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

  function demoNotice() {
    return '<div class="notice"><b>Modo demostración.</b><br>Contenido de muestra en solo lectura. No se guardan cambios ni se muestran datos privados.</div>';
  }

  function demoDashboard() {
    state.demoMode = true;
    render(`<section class="summary-card"><div><small>Modo demostración</small><h2>AcuarioNexo</h2><p>Recorrido funcional de la plataforma mientras el backend principal está temporalmente limitado.</p></div></section>
      <section class="panel">
        ${demoNotice()}
        <div class="library-grid">
          <button class="library-card" onclick="demoAquariums()"><strong>Acuarios</strong><span>Gestión y seguimiento</span></button>
          <button class="library-card" onclick="biblioteca()"><strong>Biblioteca</strong><span>1.049 fichas públicas</span></button>
          <button class="library-card" onclick="demoParameters()"><strong>Parámetros</strong><span>Lecturas y tendencias</span></button>
          <button class="library-card" onclick="demoTasks()"><strong>Avisos</strong><span>Tareas y recordatorios</span></button>
          <button class="library-card" onclick="demoInventory()"><strong>Inventario</strong><span>Equipos y consumibles</span></button>
          <button class="library-card" onclick="demoMap()"><strong>Mapa IA</strong><span>Distribución del acuario</span></button>
        </div>
        <button onclick="salirModoDemo()">Volver al acceso normal</button>
      </section>`, 'inicio', true);
  }

  function demoAquariums() {
    render(`<section class="summary-card"><div><small>Demostración</small><h2>Mis acuarios</h2><p>2 acuarios de muestra</p></div></section>
      <section class="panel">${demoNotice()}
        <div class="library-grid">
          <button class="library-card" onclick="demoAquariumDetail('Marino principal','320 L','Marino')"><strong>Marino principal</strong><span>320 L · Marino</span></button>
          <button class="library-card" onclick="demoAquariumDetail('Comunitario','180 L','Agua dulce')"><strong>Comunitario</strong><span>180 L · Agua dulce</span></button>
        </div>
      </section>`, 'acuarios', true);
  }

  function demoAquariumDetail(name, liters, type) {
    render(`<section class="tank-head"><button onclick="demoAquariums()">←</button><div><h2>${esc(name)}</h2><p>${esc(liters)} · ${esc(type)}</p></div></section>
      <section class="panel">${demoNotice()}
        <div class="library-grid">
          <button class="library-card" onclick="demoParameters()"><strong>Parámetros</strong><span>Ver últimas lecturas</span></button>
          <button class="library-card" onclick="demoInventory()"><strong>Inventario</strong><span>Equipos y consumibles</span></button>
          <button class="library-card" onclick="demoMap()"><strong>Mapa IA</strong><span>Distribución visual</span></button>
          <button class="library-card" onclick="demoTasks()"><strong>Tareas</strong><span>Mantenimiento pendiente</span></button>
        </div>
      </section>`, 'acuarios', true);
  }

  function demoParameters() {
    render(`<section class="summary-card"><div><small>Demostración</small><h2>Parámetros</h2><p>Últimas lecturas del acuario de muestra</p></div></section>
      <section class="panel">${demoNotice()}
        <div class="library-grid">
          <div class="library-card"><strong>Temperatura</strong><span>25,2 °C</span></div>
          <div class="library-card"><strong>pH</strong><span>8,10</span></div>
          <div class="library-card"><strong>Salinidad</strong><span>35 ppt</span></div>
          <div class="library-card"><strong>Nitrato</strong><span>8 mg/L</span></div>
          <div class="library-card"><strong>Fosfato</strong><span>0,06 mg/L</span></div>
          <div class="library-card"><strong>KH</strong><span>8,2 dKH</span></div>
        </div>
      </section>`, 'parametros', true);
  }

  function demoTasks() {
    render(`<section class="summary-card"><div><small>Demostración</small><h2>Avisos y tareas</h2><p>Plan de mantenimiento de muestra</p></div></section>
      <section class="panel">${demoNotice()}
        <div class="item"><b>Cambio de agua</b><br><small>Programado para esta semana</small></div>
        <div class="item"><b>Limpiar skimmer</b><br><small>Mantenimiento periódico</small></div>
        <div class="item"><b>Revisar KH y calcio</b><br><small>Control de estabilidad</small></div>
      </section>`, 'avisos', true);
  }

  function demoInventory() {
    render(`<section class="summary-card"><div><small>Demostración</small><h2>Inventario</h2><p>Equipos y consumibles de muestra</p></div></section>
      <section class="panel">${demoNotice()}
        <div class="item"><b>Skimmer</b><br><small>Activo</small></div>
        <div class="item"><b>UV</b><br><small>Activo</small></div>
        <div class="item"><b>Sal de arrecife</b><br><small>Stock disponible</small></div>
        <div class="item"><b>Tests</b><br><small>KH · Ca · Mg · NO3 · PO4</small></div>
      </section>`, 'acuarios', true);
  }

  function demoMap() {
    render(`<section class="summary-card"><div><small>Demostración</small><h2>Mapa IA</h2><p>Vista de distribución del acuario</p></div></section>
      <section class="panel">${demoNotice()}
        <div style="min-height:280px;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:20px;display:grid;place-items:center;text-align:center">
          <div><div style="font-size:64px">🪸 🐠 🪨</div><p class="small">Representación de muestra. El editor real permanece deshabilitado mientras Supabase está restringido.</p></div>
        </div>
      </section>`, 'acuarios', true);
  }

  window.demoDashboard = demoDashboard;
  window.demoAquariums = demoAquariums;
  window.demoAquariumDetail = demoAquariumDetail;
  window.demoParameters = demoParameters;
  window.demoTasks = demoTasks;
  window.demoInventory = demoInventory;
  window.demoMap = demoMap;
  window.salirModoDemo = function () {
    state.demoMode = false;
    state.user = null;
    window.u = null;
    window.login?.();
  };

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
      <button onclick="listaAcuarios()">←</button>
      <div><h2>${esc(aq.name || 'Acuario')}</h2><p>${esc(liters)} L · ${esc(type)}</p></div>
    </section>
    <nav class="tank-tabs">
      ${tabButton('resumen', 'Resumen')}
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
    return row?.__signed_photo_url || row?.image_url || row?.photo_url || row?.public_url || row?.url || row?.cover_url || '';
  }

  async function uploadAquariumImage(file, folder) {
    const aq = currentAquarium();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${folder}/${state.user.id}/${aq.id}/${Date.now()}.${ext}`;
    for (const bucket of ['aquarium-photos', 'photos', 'animal-photos']) {
      const upload = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (!upload.error) return storageReference(bucket, path);
    }
    throw new Error('No se pudo subir la foto. Revisa Storage.');
  }

  window.ANX = { config, app, supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, authRedirectUrl, isPasswordRecoveryUrl, render, panel, demoDashboard, aqHeader, aquariumIcon, photoUrl, storageAsset, storageReference, signedPhotoUrl, hydratePrivatePhoto, uploadAquariumImage };
})();
