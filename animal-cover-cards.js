/* AcuarioNexo · Portadas limpias en animales del acuario */
(function() {
  const BUILD = 'animal-cover-cards-v1';
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

  const SECTION_LABELS = {
    summary: 'Resumen rapido', identity: 'Identificacion', habitat: 'Habitat natural', aquarium: 'Acuario recomendado',
    parameters: 'Parametros', behavior: 'Comportamiento', feeding: 'Alimentacion', compatibility: 'Compatibilidad',
    reef_safe: 'Reef safe', health: 'Salud y enfermedades', purchase: 'Antes de comprar', mistakes: 'Errores frecuentes',
    curiosities: 'Curiosidades', sources: 'Fuentes'
  };
  const SECTION_ORDER = ['summary', 'identity', 'habitat', 'aquarium', 'parameters', 'behavior', 'feeding', 'compatibility', 'reef_safe', 'health', 'purchase', 'mistakes', 'curiosities', 'sources'];

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

  function textValue(v) {
    if (v == null || v === '') return '';
    if (Array.isArray(v)) return v.map(textValue).filter(Boolean).join('\n');
    if (typeof v === 'object') return textValue(v.text || v.texto || v.value || v.valor || v.description || v.descripcion || JSON.stringify(v));
    return String(v).trim();
  }

  function ficha(a) {
    return a?.ficha_json || {};
  }

  function innerFicha(a) {
    const f = ficha(a);
    return f.ficha_json || f;
  }

  function coverPhoto(a) {
    const f = ficha(a);
    const inner = innerFicha(a);
    return f.cover_photo_url || inner.cover_photo_url || inner.cover_image || f.cover_image || f.coverPhoto || a.cover_photo_url || a.photo_url || '';
  }

  function speciesPhoto(a) {
    const f = ficha(a);
    const inner = innerFicha(a);
    return a.photo_url || f.species_photo_url || inner.species_photo_url || inner.species_photo || f.photo_url || '';
  }

  function aquariumKind() {
    const t = clean([window.q?.aquarium_type, window.q?.subtype, window.q?.description].filter(Boolean).join(' '));
    if (/fresh|dulce/.test(t)) return 'freshwater';
    if (/reef|arrecife|marine|marino|salado|salt/.test(t)) return 'marine';
    return 'mixed';
  }

  function allowedSection(key) {
    const kind = aquariumKind();
    if (['all', 'quarantine', 'deceased', 'other'].includes(key)) return true;
    if (kind === 'freshwater') return ['fish', 'invertebrate', 'plant'].includes(key);
    return ['fish', 'coral', 'invertebrate', 'plant'].includes(key);
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
    if (key === 'deceased') return status === 'deceased' || status === 'dead' || status === 'archived' || !!a.death_date;
    return animalClass(a) === key;
  }

  function sectionLabel(key) {
    return (SECTIONS.find(s => s.key === key) || SECTIONS[0]).label;
  }

  function counts(items) {
    return Object.fromEntries(SECTIONS.map(s => [s.key, allowedSection(s.key) ? items.filter(a => inSection(a, s.key)).length : 0]));
  }

  function sectionsHtml(items, active) {
    const n = counts(items);
    return '<div class="library-modules animal-classes">' + SECTIONS
      .filter(s => allowedSection(s.key) && (s.key === 'all' || n[s.key] > 0 || ['fish', 'coral', 'invertebrate', 'plant'].includes(s.key)))
      .map(s => '<button class="' + (active === s.key ? 'active' : '') + '" onclick="filtrarAnimalesClase(\'' + esc(s.key) + '\')"><b>' + esc(s.icon) + ' ' + n[s.key] + '</b><span>' + esc(s.label) + '</span><small>' + esc(s.desc) + '</small></button>')
      .join('') + '</div>';
  }

  function installStyles() {
    if (document.getElementById('animalCoverCardsStyles')) return;
    const style = document.createElement('style');
    style.id = 'animalCoverCardsStyles';
    style.textContent = '' +
      '.animal-cover-grid{display:grid;grid-template-columns:1fr;gap:18px}' +
      '.animal-cover-card{padding:0;overflow:hidden;border-radius:22px;background:rgba(5,20,34,.55);border:1px solid rgba(137,190,215,.25)}' +
      '.animal-cover-card img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;object-position:center;border-radius:22px}' +
      '.animal-cover-card .animal-no-cover{min-height:220px;display:grid;place-items:center;font-size:48px}' +
      '.animal-cover-card .animal-cover-title{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}';
    document.head.appendChild(style);
  }

  function card(a, i) {
    const photo = coverPhoto(a);
    return '<article class="animal-cover-card" onclick="verAnimalAcuario(' + i + ')" aria-label="Abrir ' + esc(a.common_name || 'animal') + '">' +
      (photo ? '<img src="' + esc(photo) + '" alt="' + esc(a.common_name || 'Animal') + '" loading="lazy">' : '<div class="animal-no-cover">' + esc(SECTIONS.find(s => s.key === animalClass(a))?.icon || '□') + '</div>') +
      '<span class="animal-cover-title">' + esc(a.common_name || 'Animal') + '</span>' +
      '</article>';
  }

  function sectionBody(a) {
    const inner = innerFicha(a);
    const sections = inner.sections || {};
    const keys = SECTION_ORDER.concat(Object.keys(sections).filter(k => !SECTION_ORDER.includes(k)));
    const rows = keys.filter(k => textValue(sections[k])).map(k => [SECTION_LABELS[k] || k, textValue(sections[k])]);
    const fallback = [
      ['Alimentacion', a.feeding], ['Compatibilidad', a.compatibility], ['Zona', a.aquarium_zone],
      ['Salud', a.health_status], ['Observacion', a.observation_schedule], ['Notas', a.notes]
    ].filter(([, v]) => textValue(v));
    return (rows.length ? rows : fallback).map(([title, body], idx) =>
      '<details class="library-detail-section" ' + (idx === 0 ? 'open' : '') + '><summary>' + esc(title) + '</summary><p>' + esc(body).replaceAll('\n', '<br>') + '</p></details>'
    ).join('');
  }

  window.filtrarAnimalesClase = function(key) {
    installStyles();
    if (!allowedSection(key)) key = 'all';
    window.__animalesClaseActual = key;
    const items = window.__animalesAcuarioActual || [];
    const filtered = items.filter(a => inSection(a, key));
    const target = document.getElementById('animalesResultados');
    if (!target) return;
    window.__animalesVistaActual = filtered;
    target.innerHTML = sectionsHtml(items, key) +
      '<div class="library-section-title"><h3>' + esc(sectionLabel(key)) + '</h3><p class="small">' + filtered.length + ' registros en ' + esc(window.q?.name || 'este acuario') + '.</p></div>' +
      (filtered.length ? '<div class="animal-cover-grid">' + filtered.map(card).join('') + '</div>' : msg('No hay registros en este apartado.'));
  };

  window.verAnimalAcuario = function(index) {
    const a = (window.__animalesVistaActual || [])[index];
    if (!a) return;
    const photo = speciesPhoto(a);
    const buy = [
      a.acquired_at || [a.acquisition_year, a.acquisition_month, a.acquisition_day].filter(Boolean).join('-'),
      a.purchase_place || a.origin,
      a.purchase_price ? a.purchase_price + ' EUR' : ''
    ].filter(Boolean).join(' · ');
    const head = window.am ? window.am('animales') : '';
    const html = head + '<section class="panel library-detail animal-detail"><button onclick="filtrarAnimalesClase(\'' + esc(window.__animalesClaseActual || 'all') + '\')">← Volver</button>' +
      (photo ? '<img class="library-detail-photo" src="' + esc(photo) + '" alt="' + esc(a.common_name || 'Animal') + '">' : '') +
      '<p class="small">' + esc(sectionLabel(animalClass(a))) + ' · ' + esc(a.status || 'active') + '</p>' +
      '<h2>' + esc(a.common_name || 'Animal sin nombre') + '</h2>' +
      (a.scientific_name ? '<p class="scientific">' + esc(a.scientific_name) + '</p>' : '') +
      '<p class="small">Cantidad ' + esc(a.quantity || 1) + (buy ? ' · Alta/compra: ' + esc(buy) : '') + '</p>' +
      (a.death_date ? '<p class="error">Baja: ' + esc(a.death_date) + (a.loss_reason ? ' · ' + esc(a.loss_reason) : '') + '</p>' : '') +
      sectionBody(a) +
      '<div class="quick-actions"><button onclick="editAnimal(\'' + esc(a.id) + '\')">Editar</button><button onclick="deleteAnimal(\'' + esc(a.id) + '\')">Eliminar</button></div>' +
      '</section>';
    if (window.S) window.S(html + '<div style="height:140px"></div>' + nav('acuarios'));
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

  window.__ACUARIONEXO_ANIMAL_COVER_CARDS__ = BUILD;
})();
