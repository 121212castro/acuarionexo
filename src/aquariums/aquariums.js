/* AcuarioNexo · aquariums */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, currentAquarium, render, aqHeader, aquariumIcon, photoUrl } = window.ANX;

async function loadAquariums() {
  const { data, error } = await supabase.from('aquariums').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false });
  if (error) throw error;
  const list = data || [];
  try {
    const ids = list.map(function (aq) { return aq.id; }).filter(Boolean);
    const photos = ids.length ? await supabase.from('aquarium_photos').select('aquarium_id,image_url,photo_url,created_at').eq('user_id', state.user.id).in('aquarium_id', ids).order('created_at', { ascending: false }).limit(120) : { data: [] };
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
  return `<article class="tank-card" onclick="openA('${esc(aq.id)}')"><div class="tank-art">${photo ? `<img src="${esc(photo)}" alt="${esc(aq.name)}" loading="lazy">` : aquariumIcon(aq)}</div><div class="tank-info"><h3>${esc(aq.name || 'Acuario')}</h3><p>${esc(aq.aquarium_type || 'Acuario')}</p><span>${esc(liters)} L</span></div><b>›</b></article>`;
}

window.dashboard = async function () {
  if (!state.user) return login();
  const list = await loadAquariums();
  const liters = list.reduce((t,a)=>t+(Number(a.real_liters||a.liters)||0),0);
  const recent = list.slice(0,3);

  render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Inicio</h2><p>Resumen general de la app</p></div></section>

  <section class="panel"><div class="panel-head"><h2>Estado general</h2></div>
  <p>🟢 Acuarios activos: ${list.length}</p>
  <p>💧 Litros gestionados: ${liters}</p>
  <p>🐟 Animales registrados: Sin datos todavía</p>
  <p>📚 Fichas guardadas: Sin datos todavía</p></section>

  <section class="panel"><div class="panel-head"><h2>Avisos importantes</h2></div>
  <p>Sin datos todavía</p></section>

  <section class="panel"><div class="panel-head"><h2>Actividad reciente</h2></div>
  <p>Último parámetro: Sin datos todavía</p>
  <p>Último animal añadido: Sin datos todavía</p>
  <p>Última foto: Sin datos todavía</p>
  <p>Última tarea: Sin datos todavía</p></section>

  <section class="panel"><div class="panel-head"><h2>Mis acuarios</h2><button onclick="acuariosHome()">Ver todos</button></div>
  <div class="tank-list">${recent.map(aquariumCard).join('') || '<p>Sin acuarios todavía.</p>'}</div></section>

  <section class="panel"><div class="panel-head"><h2>Accesos rápidos</h2></div>
  <div class="quick-actions">
  <button onclick="acuariosHome()">Acuarios</button>
  <button>Añadir parámetro</button>
  <button>Añadir animal</button>
  <button>Añadir foto</button>
  <button>Crear tarea</button>
  </div></section>`, 'inicio');
};

window.acuariosHome = async function(){ const list = await loadAquariums(); render(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>${list.length} sistemas activos</p></div><button onclick="formA()">+</button></section><section class="panel"><div class="panel-head"><h2>Acuarios</h2><button onclick="formA()">Nuevo</button></div><div class="tank-list">${list.map(aquariumCard).join('') || '<p class="small">Sin acuarios todavía.</p>'}</div></section>`, 'acuarios'); };

window.formA = window.formA;
})();