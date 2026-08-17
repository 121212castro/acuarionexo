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
    isAdmin: false
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

  window.ANX = { config, app, supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, authRedirectUrl, isPasswordRecoveryUrl, render, panel, aqHeader, aquariumIcon, photoUrl, storageAsset, storageReference, signedPhotoUrl, hydratePrivatePhoto, uploadAquariumImage };
})();
