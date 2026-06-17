/* AcuarioNexo · aquariums */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, currentAquarium, render, aqHeader, aquariumIcon, photoUrl } = window.ANX;

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

function dashboardStat(label, value) {
  return `<article class="summary-card"><div><small>${esc(label)}</small><h2>${esc(value)}</h2></div></article>`;
}

function emptyLine(text) {
  return `<p class="small">${esc(text || 'Sin datos todavía')}</p>`;
}

async function countRows(table, buildQuery) {
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true });
    if (buildQuery) query = buildQuery(query);
    const { count, error } = await query;
    if (error) throw error;
    return Number(count) || 0;
  } catch (_) {
    return 0;
  }
}

async function loadDashboardStats(list) {
  const aquariumIds = list.map(aq => aq.id).filter(Boolean);
  const [animals, userFichas, creatorFichas, photos, measurements, tasks] = await Promise.all([
    countRows('animals', q => q.eq('user_id', state.user.id)),
    countRows('library_entries', q => q.eq('user_id', state.user.id)),
    countRows('fichas_creator'),
    aquariumIds.length ? countRows('aquarium_photos', q => q.eq('user_id', state.user.id).in('aquarium_id', aquariumIds)) : 0,
    aquariumIds.length ? countRows('aquarium_measurements', q => q.in('aquarium_id', aquariumIds)) : 0,
    countRows('tasks', q => q.eq('user_id', state.user.id).neq('status', 'done'))
  ]);
  return {
    animals,
    fichas: userFichas + creatorFichas,
    photos,
    measurements,
    tasks
  };
}

window.dashboard = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Cargando resumen...</p></div></section>`, 'inicio');
  try {
    const list = await loadAquariums();
    const stats = await loadDashboardStats(list);
    if (!isCurrent(t)) return;
    const liters = list.reduce(function (total, aq) { return total + (Number(aq.real_liters ?? aq.liters) || 0); }, 0);
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Resumen general de la app</p></div></section>
      <section class="panel"><div class="panel-head"><h2>Estado general</h2></div>
        <div class="quick-actions">
          ${dashboardStat('Acuarios activos', String(list.length))}
          ${dashboardStat('Litros gestionados', liters ? `${liters} L` : 'Sin datos')}
          ${dashboardStat('Animales registrados', String(stats.animals))}
          ${dashboardStat('Fichas visibles', String(stats.fichas))}
        </div>
      </section>
      <section class="panel"><div class="panel-head"><h2>Avisos importantes</h2></div>
        ${emptyLine(stats.tasks ? `${stats.tasks} avisos pendientes.` : 'Sin avisos pendientes.')}
      </section>
      <section class="panel"><div class="panel-head"><h2>Actividad reciente</h2></div>
        ${emptyLine(`${stats.measurements} mediciones registradas.`)}
        ${emptyLine(`${stats.animals} animales registrados.`)}
        ${emptyLine(`${stats.photos} fotos guardadas.`)}
        ${emptyLine(`${stats.tasks} tareas o avisos pendientes.`)}
      </section>`, 'inicio');
  } catch (e) {
    if (isCurrent(t)) render(msg(e.message, 'error'), 'inicio');
  }
};

window.acuariosHome = async function () {
  if (!state.user) return login();
  const t = token();
  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>Cargando sistemas...</p></div><button onclick="formA()">+</button></section>`, 'acuarios');
  try {
    const list = await loadAquariums();
    if (!isCurrent(t)) return;
    render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>${list.length} sistemas activos</p></div><button onclick="formA()">+</button></section>
      <section class="panel"><div class="panel-head"><h2>Acuarios</h2><button onclick="formA()">Nuevo</button></div>
      <div class="tank-list">${list.map(aquariumCard).join('') || '<p class="small">Sin acuarios todavía.</p>'}</div></section>`, 'acuarios');
  } catch (e) {
    if (isCurrent(t)) render(msg(e.message, 'error'), 'acuarios');
  }
};

window.formA = function (aq = {}) {
  const editing = !!aq.id;
  render(`<section class="panel">
    <button onclick="acuariosHome()">← Volver</button>
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
    id && currentAquarium()?.id === id ? panelAcuario() : acuariosHome();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

window.editA = async function () {
  const aq = currentAquarium();
  if (!aq) return acuariosHome();
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
  if (!aq) return acuariosHome();
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

window.openQuickAqSection = function (section) {
  const aq = currentAquarium() || (state.aquariums || [])[0];
  if (!aq) return acuariosHome();
  if (!currentAquarium() || currentAquarium().id !== aq.id) return openA(aq.id).then(function () { setTimeout(function () { openAqSection(section); }, 0); });
  return openAqSection(section);
};

window.openAqSection = function (section) {
  if (!currentAquarium()) return acuariosHome();
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
