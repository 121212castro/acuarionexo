/* AcuarioNexo · aquariums */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;

async function loadAquariums() {
  const { data, error } = await supabase.from('aquariums').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false });
  if (error) throw error;
  const list = data || [];
  try {
    const ids = list.map(function (aq) { return aq.id; }).filter(Boolean);
    const photos = ids.length ? await supabase.from('aquarium_photos')
      .select('aquarium_id,image_url,photo_url,created_at')
      .eq('user_id', state.user.id)
      .in('aquarium_id', ids)
      .order('created_at', { ascending: false })
      .limit(120) : { data: [] };
    if (!photos.error) {
      const coverByAq = {};
      (photos.data || []).forEach(function (p) {
        const url = photoUrl(p);
        if (url && p.aquarium_id && !coverByAq[p.aquarium_id]) coverByAq[p.aquarium_id] = url;
      });
      list.forEach(function (aq) { aq.__cover_url = aq.cover_url || aq.photo_url || aq.image_url || coverByAq[aq.id] || ''; });
    }
  } catch (_) {}
  state.aquariums = list;
  return list;
}

function aquariumCard(aq) {
  const photo = aq.__cover_url || aq.cover_url || aq.photo_url || aq.image_url || '';
  const liters = aq.real_liters ?? aq.liters ?? '-';
  return `<article class="tank-card" onclick="openA('${esc(aq.id)}')">
    <div class="tank-art">${photo ? `<img src="${esc(photo)}" alt="${esc(aq.name)}" loading="lazy">` : aquariumIcon(aq)}</div>
    <div class="tank-info"><h3>${esc(aq.name || 'Acuario')}</h3><p>${esc(aq.aquarium_type || 'Acuario')}</p><span>${esc(liters)} L</span></div>
    <b>›</b>
  </article>`;
}

window.dashboard = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>Cargando sistemas...</p></div><button onclick="formA()">+</button></section>`, 'inicio');
  try {
    const list = await loadAquariums();
    if (!isCurrent(t)) return;
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>${list.length} sistemas activos</p></div><button onclick="formA()">+</button></section>
      <section class="panel"><div class="panel-head"><h2>Acuarios</h2><button onclick="formA()">Nuevo</button></div>
      <div class="tank-list">${list.map(aquariumCard).join('') || '<p class="small">Sin acuarios todavía.</p>'}</div></section>`, 'inicio');
  } catch (e) {
    if (isCurrent(t)) render(msg(e.message, 'error'), 'inicio');
  }
};

window.formA = function (aq = {}) {
  const editing = !!aq.id;
  render(`<section class="panel">
    <button onclick="dashboard()">← Volver</button>
    <h2>${editing ? 'Editar acuario' : 'Nuevo acuario'}</h2>
    <label>Nombre</label><input id="aqName" value="${esc(aq.name || '')}">
    <label>Tipo</label><select id="aqType">
      <option value="reef" ${aq.aquarium_type === 'reef' ? 'selected' : ''}>Reef</option>
      <option value="marine" ${aq.aquarium_type === 'marine' ? 'selected' : ''}>Marino</option>
      <option value="freshwater" ${aq.aquarium_type === 'freshwater' ? 'selected' : ''}>Dulce</option>
      <option value="hospital" ${aq.aquarium_type === 'hospital' ? 'selected' : ''}>Hospital</option>
      <option value="quarantine" ${aq.aquarium_type === 'quarantine' ? 'selected' : ''}>Cuarentena</option>
      <option value="other" ${aq.aquarium_type === 'other' ? 'selected' : ''}>Otro</option>
    </select>
    <label>Litros reales</label><input id="aqLiters" type="number" step="0.1" value="${esc(aq.real_liters ?? aq.liters ?? '')}">
    <label>Descripción</label><textarea id="aqDescription">${esc(aq.description || '')}</textarea>
    <button class="primary" onclick="saveA('${esc(aq.id || '')}')">Guardar</button>
    <div id="x"></div>
  </section>`, 'acuarios');
};

window.saveA = async function (id = '') {
  try {
    if (!val('aqName')) throw new Error('Pon un nombre al acuario.');
    const row = {
      user_id: state.user.id,
      name: val('aqName'),
      aquarium_type: val('aqType') || 'reef',
      status: 'active',
      real_liters: num('aqLiters'),
      liters: num('aqLiters'),
      description: val('aqDescription') || null
    };
    const result = id ? await supabase.from('aquariums').update(row).eq('id', id) : await supabase.from('aquariums').insert(row);
    if (result.error) throw result.error;
    if (id && currentAquarium()?.id === id) state.aquarium = { ...state.aquarium, ...row, id };
    id && currentAquarium()?.id === id ? panelAcuario() : dashboard();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.editA = async function () {
  const aq = currentAquarium();
  if (!aq) return dashboard();
  window.formA(aq);
};

window.openA = async function (id) {
  const t = token();
  render(`<section class="panel">${msg('Abriendo acuario...')}</section>`, 'acuarios');
  try {
    const { data, error } = await supabase.from('aquariums').select('*').eq('id', id).single();
    if (error) throw error;
    if (!isCurrent(t)) return;
    const cached = state.aquariums.find(a => a.id === id) || {};
    state.aquarium = { ...cached, ...data, __cover_url: data.cover_url || data.photo_url || data.image_url || cached.__cover_url || '' };
    window.q = state.aquarium;
    panelAcuario();
  } catch (e) {
    if (isCurrent(t)) render(msg(e.message, 'error'), 'acuarios');
  }
};

function panelAcuario() {
  const aq = currentAquarium();
  if (!aq) return dashboard();
  state.section = 'resumen';
  const photo = aq.__cover_url || aq.cover_url || aq.photo_url || aq.image_url || '';
  render(aqHeader('resumen') + `<section class="panel aq-cover">
    ${photo ? `<img class="aq-cover-photo" src="${esc(photo)}" alt="${esc(aq.name)}">` : ''}
    <div class="panel-head"><h2>Resumen</h2><button onclick="editA()">Editar</button></div>
    <h3>${esc(aq.name || 'Acuario')}</h3>
    <p>${esc(aq.description || 'Sistema sin descripción.')}</p>
    <div class="quick-actions">
      <button onclick="openAqSection('fichas')"><span>□</span>Fichas</button>
      <button onclick="openAqSection('animales')"><span>🐟</span>Animales</button>
      <button onclick="openAqSection('mapa')"><span>⌖</span>Mapa IA</button>
      <button onclick="openAqSection('fotos')"><span>📷</span>Fotos</button>
      <button onclick="openAqSection('inventario')"><span>▤</span>Inventario</button>
      <button onclick="openAqSection('parametros')"><span>🧪</span>Parámetros</button>
      <button onclick="openAqSection('tareas')"><span>♢</span>Tareas</button>
    </div>
  </section>`, 'acuarios');
}
window.panel = panelAcuario;

window.openAqSection = function (section) {
  if (!currentAquarium()) return dashboard();
  state.section = section;
  if (section === 'resumen') return panelAcuario();
  if (section === 'fichas') return fichasAcuario();
  if (section === 'animales') return animales();
  if (section === 'mapa') return mapaIA();
  if (section === 'fotos') return fotos();
  if (section === 'inventario') return inventario('aquarium');
  if (section === 'parametros') return parametros();
  if (section === 'tareas') return tareasAcuario();
  return panelAcuario();
};

  window.ANX.loadAquariums = loadAquariums;
  window.ANX.panelAcuario = panelAcuario;
})();
