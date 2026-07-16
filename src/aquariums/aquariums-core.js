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

  function taskDateText(value) {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function dashboardAlertCard(task) {
    const priority = String(task.priority || 'normal').toLowerCase();
    const label = priority === 'high' ? 'Urgente' : 'Pendiente';
    return `<button class="item dashboard-task" onclick="verAviso('${esc(task.id)}')">
      <b>${esc(task.title || 'Aviso')}</b>
      <span class="small">${esc(label)} · ${esc(taskDateText(task.due_at))}</span>
    </button>`;
  }

  function dashboardActivityCard(task) {
    return `<button class="item dashboard-task" onclick="verAviso('${esc(task.id)}')">
      <b>${esc(task.title || 'Aviso realizado')}</b>
      <span class="small">Realizado · ${esc(taskDateText(task.completed_at || task.updated_at))}</span>
    </button>`;
  }

  async function loadDashboardStats(list) {
    const aquariumIds = (list || []).map(function (aq) { return aq.id; }).filter(Boolean);

    const openTasksQuery = supabase.from('tasks')
      .select('id,title,priority,due_at,status,task_type,aquarium_id')
      .eq('user_id', state.user.id)
      .neq('status', 'done')
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(8);

    const recentTasksQuery = supabase.from('tasks')
      .select('id,title,completed_at,updated_at,status,task_type,aquarium_id')
      .eq('user_id', state.user.id)
      .eq('status', 'done')
      .order('completed_at', { ascending: false, nullsFirst: false })
      .limit(8);

    const [openTasks, recentTasks] = await Promise.all([openTasksQuery, recentTasksQuery]);
    if (openTasks.error) throw openTasks.error;
    if (recentTasks.error) throw recentTasks.error;

    let animals = 0;
    if (aquariumIds.length) {
      if (window.ANX.loadModuleGroup) await window.ANX.loadModuleGroup('animales');
      const animalsCore = window.ANX.AnimalsCore;
      if (!animalsCore) throw new Error('No se pudo cargar el contador de animales.');

      const { data, error } = await supabase.from('inventory_items')
        .select('category,quantity,notes,aquarium_id')
        .eq('user_id', state.user.id)
        .in('aquarium_id', aquariumIds)
        .limit(2000);
      if (error) throw error;

      animals = (data || []).reduce(function (total, item) {
        if (!animalsCore.liveCategories.has(item.category || '') || !animalsCore.isAlive(item)) return total;
        const quantity = Number(item.quantity ?? 1);
        return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
      }, 0);
    }

    const alerts = (openTasks.data || []).sort(function (a, b) {
      const ap = String(a.priority || '').toLowerCase() === 'high' ? 0 : 1;
      const bp = String(b.priority || '').toLowerCase() === 'high' ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const ad = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    }).slice(0, 5);

    return {
      animals,
      photos: 'No calculado',
      measurements: 'No calculado',
      tasks: alerts.length,
      alerts,
      recentActivity: (recentTasks.data || []).slice(0, 5)
    };
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
    dashboardAlertCard,
    dashboardActivityCard,
    loadDashboardStats,
    refreshAdminForDashboard
  };
})();