/* AcuarioNexo · aquariums core */
(function () {
  const { supabase, state, esc, aquariumIcon, photoUrl } = window.ANX;

  function aquariumTypeLabel(value) {
    const key = String(value || '').toLowerCase();
    const labels = {
      reef: 'Marino arrecife',
      marine: 'Marino',
      saltwater: 'Marino',
      freshwater: 'Agua dulce',
      hospital: 'Hospital',
      quarantine: 'Cuarentena',
      other: 'Otro'
    };
    return labels[key] || value || 'Acuario';
  }

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
        list.forEach(function (aq) { aq.__cover_url = aq.cover_photo_url || aq.cover_url || aq.photo_url || aq.image_url || coverByAq[aq.id] || ''; });
      }
    } catch (_) {}
    state.aquariums = list;
    return list;
  }

  function aquariumCard(aq) {
    const photo = aq.__cover_url || aq.cover_photo_url || aq.cover_url || aq.photo_url || aq.image_url || '';
    const liters = aq.manual_real_liters ?? aq.system_net_liters ?? aq.real_liters ?? aq.liters ?? '-';
    const type = aquariumTypeLabel(aq.aquarium_type || aq.type || 'Acuario');
    return `<article class="tank-card" onclick="openA('${esc(aq.id)}')">
      <div class="tank-art">${photo ? `<img src="${esc(photo)}" alt="${esc(aq.name)}" loading="lazy">` : aquariumIcon(aq)}</div>
      <div class="tank-info"><h3>${esc(aq.name || 'Acuario')}</h3><p>${esc(type)} · ${esc(liters)} L</p></div>
      <b>›</b>
    </article>`;
  }

  function dashboardStat(label, value) {
    return `<article class="summary-card"><div><small>${esc(label)}</small><h2>${esc(value)}</h2></div></article>`;
  }

  function calcStat(label, id) {
    return `<article class="summary-card"><div><small>${esc(label)}</small><h2 id="${esc(id)}">0.0 L</h2></div></article>`;
  }

  function emptyLine(text) {
    return `<p class="small">${esc(text || 'Sin datos todavía')}</p>`;
  }

  function loadDashboardStats(_list) {
    return { animals: 'Próximamente', photos: 'No calculado', measurements: 'No calculado', tasks: null };
  }

  async function refreshAdminForDashboard() {
    try { if (window.refreshAdminAccess) await window.refreshAdminAccess(); } catch (_) {}
  }

  window.ANX.loadAquariums = loadAquariums;
  window.ANX.AquariumsCore = {
    aquariumTypeLabel,
    loadAquariums,
    aquariumCard,
    dashboardStat,
    calcStat,
    emptyLine,
    loadDashboardStats,
    refreshAdminForDashboard
  };
})();
