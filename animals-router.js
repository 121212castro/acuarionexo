/* AcuarioNexo · Animales por acuario */
(function() {
  const BUILD = 'animals-router-v1-aquarium-sections';

  const SECTIONS = [
    { key: 'all', label: 'Todos', icon: '□', desc: 'Todos los animales de este acuario.' },
    { key: 'fish', label: 'Peces', icon: '🐠', desc: 'Peces vivos o registrados en este acuario.' },
    { key: 'coral', label: 'Corales', icon: '🪸', desc: 'Corales y esquejes de este acuario.' },
    { key: 'invertebrate', label: 'Invertebrados', icon: '🦐', desc: 'Gambas, caracoles, cangrejos y otros.' },
    { key: 'plant', label: 'Plantas y algas', icon: '🌿', desc: 'Plantas, macroalgas y similares.' },
    { key: 'quarantine', label: 'Cuarentena', icon: '!', desc: 'Animales en cuarentena u hospital.' },
    { key: 'deceased', label: 'Bajas', icon: '×', desc: 'Bajas, archivados o registros cerrados.' },
    { key: 'other', label: 'Otros', icon: '◇', desc: 'Animales sin clase clara.' }
  ];

  function esc(x) {
    return (window.E ? window.E(x) : String(x ?? '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    }));
  }

  function msg(t, k) {
    return window.M ? window.M(t, k) : '<div class="' + (k || 'notice') + '">' + esc(t) + '</div>';
  }

  function clean(x) {
    return String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function catEs(c) {
    return ({
      fish: 'Pez', fish_marine: 'Pez marino', fish_freshwater: 'Pez de agua dulce',
      coral: 'Coral', invertebrate: 'Invertebrado', crustacean: 'Crustaceo',
      mollusk: 'Molusco', plant: 'Planta', algae: 'Alga', microfauna: 'Microfauna', other: 'Otro'
    }[c] || c || 'Sin tipo');
  }

  function sectionLabel(key) {
    return (SECTIONS.find(s => s.key === key) || SECTIONS[0]).label;
  }

  function animalClass(a) {
    const text = clean([a.category, a.common_name, a.scientific_name, a.notes, a.ai_notes].filter(Boolean).join(' '));
    if (/coral|sps|lps|euphyllia|zoanthus|acropora|montipora/.test(text)) return 'coral';
    if (/invert|gamba|camaron|shrimp|caracol|snail|cangrejo|crab|erizo|estrella|crustace|molus/.test(text)) return 'invertebrate';
    if (/plant|planta|alga|macroalga|chaeto/.test(text)) return 'plant';
    if (/fish|pez|peces|marino|fresh|dulce/.test(text)) return 'fish';
    return 'other';
  }

  function inSection(a, key) {
    const status = clean(a.status);
    if (key === 'all') return true;
    if (key === 'quarantine') return status === 'quarantine' || status === 'hospital';
    if (key === 'deceased') return status === 'deceased' || status === 'archived' || !!a.death_date;
    return animalClass(a) === key;
  }

  function counts(items) {
    return Object.fromEntries(SECTIONS.map(s => [s.key, items.filter(a => inSection(a, s.key)).length]));
  }

  function sectionsHtml(items, active) {
    const n = counts(items);
    return '<div class="library-modules animal-classes">' + SECTIONS
      .filter(s => s.key === 'all' || n[s.key] > 0)
      .map(s => '<button class="' + (active === s.key ? 'active' : '') + '" onclick="filtrarAnimalesClase(\'' + esc(s.key) + '\')"><b>' + esc(s.icon) + ' ' + n[s.key] + '</b><span>' + esc(s.label) + '</span><small>' + esc(s.desc) + '</small></button>')
      .join('') + '</div>';
  }

  function animalCard(a) {
    const buy = [
      a.acquired_at || [a.acquisition_year, a.acquisition_month, a.acquisition_day].filter(Boolean).join('-'),
      a.purchase_place || a.origin,
      a.purchase_price ? a.purchase_price + ' EUR' : ''
    ].filter(Boolean).join(' · ');

    const details = [
      ['Alimentacion', a.feeding],
      ['Compatibilidad', a.compatibility],
      ['Zona', a.aquarium_zone],
      ['Salud', a.health_status],
      ['Observacion', a.observation_schedule],
      ['Notas IA', a.ai_notes],
      ['Notas', a.notes]
    ].filter(([, v]) => String(v || '').trim());

    return '<div class="item animal-item animal-' + esc(animalClass(a)) + '">' +
      (a.photo_url ? '<img src="' + esc(a.photo_url) + '" style="width:100%;max-height:170px;object-fit:cover;border-radius:14px;margin-bottom:8px" alt="' + esc(a.common_name || 'Animal') + '">' : '') +
      '<p class="small">' + esc(sectionLabel(animalClass(a))) + ' · ' + esc(catEs(a.category)) + ' · ' + esc(a.status || 'active') + '</p>' +
      '<h3>' + esc(a.common_name || 'Animal sin nombre') + '</h3>' +
      (a.scientific_name ? '<p class="scientific">' + esc(a.scientific_name) + '</p>' : '') +
      '<p class="small">Cantidad ' + esc(a.quantity || 1) + '</p>' +
      (buy ? '<p class="small">Alta/compra: ' + esc(buy) + '</p>' : '') +
      (a.death_date ? '<p class="error">Baja: ' + esc(a.death_date) + (a.loss_reason ? ' · ' + esc(a.loss_reason) : '') + '</p>' : '') +
      details.map(([title, body], idx) => '<details class="library-detail-section" ' + (idx === 0 ? 'open' : '') + '><summary>' + esc(title) + '</summary><p>' + esc(body).replaceAll('\n', '<br>') + '</p></details>').join('') +
      '<div class="quick-actions"><button onclick="editAnimal(\'' + esc(a.id) + '\')">Editar</button><button onclick="deleteAnimal(\'' + esc(a.id) + '\')">Eliminar</button></div>' +
    '</div>';
  }

  window.filtrarAnimalesClase = function(key) {
    const items = window.__animalesAcuarioActual || [];
    const filtered = items.filter(a => inSection(a, key));
    const target = document.getElementById('animalesResultados');
    if (!target) return;
    target.innerHTML = sectionsHtml(items, key) +
      '<div class="library-section-title"><h3>' + esc(sectionLabel(key)) + '</h3><p class="small">' + filtered.length + ' registros en ' + esc(window.q?.name || 'este acuario') + '.</p></div>' +
      (filtered.length ? filtered.map(animalCard).join('') : msg('No hay registros en este apartado.'));
  };

  window.anis = async function() {
    try {
      if (!window.u) throw new Error('Debes iniciar sesion.');
      if (!window.q?.id) throw new Error('Abre un acuario primero. Los animales siempre pertenecen a un acuario concreto.');
      if (window.setAqSection) window.setAqSection('animales');
      const head = window.am ? window.am('animales') : '';
      const r = await window.s.from('animals').select('*').eq('aquarium_id', window.q.id).order('created_at', { ascending: false }).limit(300);
      if (r.error) throw r.error;
      window.__animalesAcuarioActual = r.data || [];
      const html = head + '<section class="panel animal-panel"><div class="panel-head"><div><h2>Animales</h2><p class="small">Solo animales de ' + esc(window.q.name || 'este acuario') + '. No van al inventario.</p></div><button onclick="animalMenu()">Añadir</button></div><div id="animalesResultados">' + msg('Cargando animales...') + '</div></section>';
      if (window.S) window.S(html + '<div style="height:140px"></div>' + nav('acuarios'));
      window.filtrarAnimalesClase('all');
    } catch (e) {
      const html = '<section class="panel"><h2>Animales</h2>' + msg(e.message, 'error') + '<button onclick="dashboard()">Ir a acuarios</button></section>';
      if (window.S) window.S(html);
    }
  };

  function nav(active) {
    const item = (id, label, icon, fn) => '<button class="' + (active === id ? 'active' : '') + '" onclick="' + fn + '"><span>' + icon + '</span><small>' + label + '</small></button>';
    return '<nav class="bottom-nav">' +
      item('inicio', 'Inicio', '⌂', 'dashboard()') +
      item('acuarios', 'Acuarios', '▣', 'dashboard()') +
      item('biblioteca', 'Biblioteca', '□', 'biblioteca()') +
      item('avisos', 'Avisos', '♢', 'tareas()') +
      item('microfauna', 'Microfauna', '∞', 'microfauna()') +
    '</nav>';
  }

  window.__ACUARIONEXO_ANIMALS_ROUTER__ = BUILD;
})();
