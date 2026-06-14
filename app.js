/* ==========================================================================
   AcuarioNexo · NÚCLEO LIMPIO REAL · DASHBOARD MAESTRO
   ========================================================================== */

// --- BLOQUE 1: CONFIGURACIÓN E INICIALIZACIÓN DE ESTADO ---
const c = window.ACUARIONEXO_CONFIG;
const s = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_KEY);
const A = document.getElementById('app');
const state = { user: null, aquarium: null, aquariums: [], section: 'resumen', histFilter: 'todo' };

window.c = c; window.s = s; window.A = A; window.q = null; window.u = null; window.currentAqSection = 'resumen';
document.getElementById('version').textContent = (c.APP_VERSION || 'AcuarioNexo') + ' · núcleo limpio';

// --- BLOQUE 2: UTILIDADES GLOBALES (DOM, Formateo y Escapado) ---
function $(id) { return document.getElementById(id); }
function val(id) { return ($(id)?.value || '').trim(); }
function num(id) { return val(id) === '' ? null : Number(val(id)); }
function esc(x) { return String(x ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])); }
function msg(t, k = 'notice') { return `<div class="${k}">${esc(t)}</div>`; }
function fecha(x) { if (!x) return 'Sin fecha'; const d = new Date(x); return isNaN(d) ? 'Sin fecha' : d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function fechaDia(x) { if (!x) return 'Sin fecha'; const d = new Date(x); return isNaN(d) ? 'Sin fecha' : d.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }); }
function render(html) {
  const navStart = html.lastIndexOf('<nav class="bottom-nav">');
  const nav = navStart >= 0 ? html.slice(navStart) : '';
  if (navStart >= 0) html = html.slice(0, navStart);
  document.querySelector('.bottom-nav')?.remove();
  A.innerHTML = html;
  if (nav) document.body.insertAdjacentHTML('beforeend', nav);
  scrollTo(0, 0);
  requestAnimationFrame(() => { const a = document.querySelector('.tank-tabs .active'); if (a) a.scrollIntoView({ block: 'nearest', inline: 'center' }); });
}

window.S = render; window.E = esc; window.M = msg;
document.getElementById('refreshAppBtn')?.addEventListener('click', () => hardRefreshAcuarioNexo());

// --- BLOQUE 3: NAVEGACIÓN Y SHELL GENERAL ---
function bottomNav(active = 'inicio') {
  const item = (id, label, icon, fn) => `<button class="${active === id ? 'active' : ''}" onclick="${fn}"><span>${icon}</span><small>${label}</small></button>`;
  return `<nav class="bottom-nav">${item('inicio', 'Inicio', '⌂', 'dashboard()')}${item('acuarios', 'Acuarios', '▣', 'dashboard()')}${item('biblioteca', 'Biblioteca', '□', 'biblioteca()')}${item('avisos', 'Avisos', '♢', 'tareas()')}${item('microfauna', 'Microfauna', '∞', 'microfauna()')}</nav>`;
}
function shell(body, active = 'inicio') { render(body + '<div style="height:140px"></div>' + bottomNav(active)); }
function page(title, body, active = 'inicio') { shell(`<section class="panel"><h2>${esc(title)}</h2>${body}</section>`, active); }

// --- BLOQUE 4: CABECERA Y CONTROL DE SECCIONES DEL ACUARIO ---
function setAqSection(section) { state.section = section; window.currentAqSection = section; }
function aqChip(id, label) { return `<button class="${state.section === id ? 'active' : ''}" onclick="openAqSection('${id}')">${label}</button>`; }

window.am = function(section) {
  if (section) setAqSection(section);
  const aq = state.aquarium || window.q;
  if (!aq) return '';
  const liters = aq.real_liters ?? aq.liters ?? '-';
  const typeMap = { reef: 'Reef Arrecife', marine: 'Marino Solo Peces', freshwater: 'Agua Dulce', hospital: '🏥 Tanque Hospital', quarantine: '🛡️ Cuarentena' };
  const labelType = typeMap[aq.aquarium_type] || aq.aquarium_type || 'Acuario';
  return `<section class="tank-head"><button onclick="dashboard()">←</button><div><h2>${esc(aq.name)}</h2><p>${esc(liters)} L · ${esc(labelType)}</p></div></section><nav class="tank-tabs">${aqChip('resumen', 'Resumen')}${aqChip('mapa', 'Mapa')}${aqChip('parametros', 'Parámetros')}${aqChip('animales', 'Animales')}${aqChip('fichas', 'Fichas')}${aqChip('fotos', 'Fotos')}${aqChip('tareas', 'Tareas')}${aqChip('historial', 'Historial')}</nav>`;
};

window.openAqSection = function(section) {
  setAqSection(section);
  if (section === 'resumen') return window.panel();
  if (section === 'mapa') return window.mapaAcuario ? window.mapaAcuario() : window.panel();
  if (section === 'parametros') return window.pars ? window.pars() : window.panel();
  if (section === 'animales') return window.anis();
  if (section === 'fichas') return window.fichasAcuario();
  if (section === 'fotos') return window.fotos();
  if (section === 'tareas') return window.tareasAcuario();
  if (section === 'historial') return window.historialAcuario();
  return window.panel();
};

// --- BLOQUE 5: CÁLCULOS TÉCNICOS ---
function calcLiters(l, w, h) { l = +l; w = +w; h = +h; return l && w && h ? Math.round(l * w * h / 10) / 100 : null; }
window.calc = function() {
  const tank = calcLiters(val('l'), val('w'), val('h'));
  const sump = calcLiters(val('sl'), val('sw'), val('sh'));
  const total = Math.round(((tank || 0) + (sump || 0)) * 100) / 100;
  if ($('cal')) $('cal').innerHTML = msg(`Urna ${tank ?? '-'} L · sump ${sump ?? '-'} L · total ${total || '-'} L`);
};

// --- BLOQUE 6: AUTENTICACIÓN ---
function login() { render(`<section class="auth-card"><h2>Entrar</h2><label>Email</label><input id="em" type="email"><label>Contraseña</label><input id="pw" type="password"><button class="primary" onclick="iniciar()">Entrar</button><button onclick="crear()">Crear cuenta</button><div id="x"></div></section>`); }
window.login = login;
window.iniciar = async function() { try { const { error } = await s.auth.signInWithPassword({ email: val('em'), password: val('pw') }); if (error) throw error; boot(); } catch (e) { $('x').innerHTML = msg(e.message, 'error'); } };
window.crear = async function() { const { error } = await s.auth.signUp({ email: val('em'), password: val('pw') }); $('x').innerHTML = error ? msg(error.message, 'error') : msg('Cuenta creada.', 'success'); };

// --- BLOQUE 7: CRUD SISTEMAS (ACUARIOS) ---
async function loadAquariums() { const { data, error } = await s.from('aquariums').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }); if (error) throw error; const list = data || []; try { const photos = await s.from('aquarium_photos').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(160); if (!photos.error) { const byAq = {}; (photos.data || []).forEach(p => { const url = p.image_url || p.photo_url || p.public_url || p.url; if (url && p.aquarium_id && !byAq[p.aquarium_id]) byAq[p.aquarium_id] = url; }); list.forEach(a => { a.__cover_url = a.cover_url || a.photo_url || a.image_url || byAq[a.id] || ''; }); } } catch (e) { } state.aquariums = list; return state.aquariums; }
function aquariumIcon(a) { return a.aquarium_type === 'freshwater' ? '🌿' : (a.aquarium_type === 'hospital' || a.aquarium_type === 'quarantine' ? '🏥' : '🐠'); }
function aquariumPhoto(a) { return a.__cover_url || a.cover_url || a.photo_url || a.image_url || a.public_url || a.url || ''; }
function aquariumCard(a) { const liters = a.real_liters ?? a.liters ?? '-'; const photo = aquariumPhoto(a); return `<article class="tank-card" onclick="openA('${a.id}')"><div class="tank-art">${photo ? `<img src="${esc(photo)}" alt="${esc(a.name)}" loading="lazy">` : aquariumIcon(a)}</div><div class="tank-info"><h3>${esc(a.name)}</h3><p>${esc(a.aquarium_type || 'Acuario')}${a.subtype ? ' · ' + esc(a.subtype) : ''}</p><span>${esc(liters)} L</span></div><b>›</b></article>`; }

window.dashboard = async function() {
  if (!state.user) return login();
  try { const list = await loadAquariums(); shell(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>${list.length} sistemas activos bajo control</p></div><button onclick="formA()">+</button></section><section class="panel"><div class="panel-head"><h2>Acuarios</h2><button onclick="formA()">Nuevo</button></div><div class="tank-list">${list.map(aquariumCard).join('') || '<p class="small">Sin acuarios todavía.</p>'}</div></section>`, 'inicio'); }
  catch (e) { render(msg(e.message, 'error')); }
};
window.acs = window.dashboard; window.home = window.dashboard; window.menu = () => '';

window.formA = function(a = {}) { render(`<section class="panel"><button onclick="dashboard()">← Volver</button><h2>${a.id ? 'Editar' : 'Nuevo'} acuario</h2><label>Nombre</label><input id="name" value="${esc(a.name ||'')}"><label>Tipo</label><select id="type"><option value="reef" ${a.aquarium_type === 'reef' ? 'selected' : ''}>Reef</option><option value="marine" ${a.aquarium_type === 'marine' ? 'selected' : ''}>Marino</option><option value="freshwater" ${a.aquarium_type === 'freshwater' ? 'selected' : ''}>Dulce</option><option value="hospital" ${a.aquarium_type === 'hospital' ? 'selected' : ''}>Hospital</option><option value="quarantine" ${a.aquarium_type === 'quarantine' ? 'selected' : ''}>Cuarentena</option><option value="other" ${a.aquarium_type === 'other' ? 'selected' : ''}>Otro</option></select><label>Subtipo</label><input id="sub" value="${esc(a.subtype || '')}"><label>Descripción</label><textarea id="des">${esc(a.description || '')}</textarea><div class="form-grid"><div><label>Largo</label><input id="l" type="number" value="${esc(a.tank_length_cm || '')}" oninput="calc()"></div><div><label>Ancho</label><input id="w" type="number" value="${esc(a.tank_width_cm || '')}" oninput="calc()"></div><div><label>Alto agua</label><input id="h" type="number" value="${esc(a.display_water_height_cm || '')}" oninput="calc()"></div><div><label>Sump largo</label><input id="sl" type="number" value="${esc(a.sump_length_cm || '')}" oninput="calc()"></div><div><label>Sump ancho</label><input id="sw" type="number" value="${esc(a.sump_width_cm || '')}" oninput="calc()"></div><div><label>Sump alto</label><input id="sh" type="number" value="${esc(a.sump_height_cm || '')}" oninput="calc()"></div></div><div id="cal">${msg('Introduce medidas')}</div><button class="primary" onclick="saveA('${a.id || ''}')">Guardar</button><div id="x"></div></section>`); };
window.saveA = async function(id = '') {
  try { const tank = calcLiters(val('l'), val('w'), val('h')); const sump = calcLiters(val('sl'), val('sw'), val('sh')); const total = Math.round(((tank || 0) + (sump || 0)) * 100) / 100; const row = { user_id: state.user.id, name: val('name'), aquarium_type: val('type'), subtype: val('sub'), status: 'active', description: val('des'), tank_length_cm: num('l'), tank_width_cm: num('w'), display_water_height_cm: num('h'), sump_length_cm: num('sl'), sump_width_cm: num('sw'), sump_height_cm: num('sh'), real_liters: total || tank, liters: total || tank }; const r = id ? await s.from('aquariums').update(row).eq('id', id) : await s.from('aquariums').insert(row); if (r.error) throw r.error; if (id && window.q?.id === id) { state.aquarium = { ...window.q, ...row, id }; window.q = state.aquarium; return panel(); } dashboard(); }
  catch (e) { $('x').innerHTML = msg(e.message, 'error'); }
};
window.editA = async function(id) { const { data, error } = await s.from('aquariums').select('*').eq('id', id).single(); if (error) return alert(error.message); formA(data); };
window.deleteA = async function(id) { if (!confirm('¿Borrar este acuario?')) return; const { error } = await s.from('aquariums').delete().eq('id', id); if (error) return alert(error.message); dashboard(); };
window.openA = async function(id) { const { data, error } = await s.from('aquariums').select('*').eq('id', id).single(); if (error) return render(msg(error.message, 'error')); const cached = (state.aquariums || []).find(a => a.id === id) || {}; state.aquarium = { ...cached, ...data, __cover_url: data.cover_url || data.photo_url || data.image_url || cached.__cover_url || '' }; window.q = state.aquarium; window.panel(); };

window.panel = function() { const photo = aquariumPhoto(window.q || {}); setAqSection('resumen'); shell(am('resumen') + `<section class="panel aq-cover">${photo ? `<img class="aq-cover-photo" src="${esc(photo)}" alt="${esc(window.q?.name || 'Acuario')}">` : ''}<div class="panel-head"><h2>Portada principal</h2><button onclick="editA('${window.q?.id || ''}')">Editar</button></div><h3>${esc(window.q?.name || 'Acuario')}</h3><p>Todo lo que guardes aquí pertenece a <b>${esc(window.q?.name || 'este acuario')}</b>.</p><div class="quick-actions"><button onclick="editA('${window.q?.id || ''}')"><span>✎</span>Datos</button><button onclick="openAqSection('mapa')"><span>▦</span>Mapa</button><button onclick="formEquipoAcuario()"><span>⚙️</span>Equipo</button><button onclick="openAqSection('parametros')"><span>🧪</span>Parámetros</button><button onclick="openAqSection('animales')"><span>🐟</span>Animales</button><button onclick="openAqSection('fichas')"><span>□</span>Fichas</button><button onclick="openAqSection('fotos')"><span>📷</span>Fotos</button><button onclick="openAqSection('tareas')"><span>♢</span>Tareas</button><button onclick="inventario()"><span>▤</span>Inventario</button></div>${window.q?.description ? `<p>${esc(window.q.description)}</p>` : ''}</section>`, 'acuarios'); };
window.formEquipoAcuario = function() { shell(window.am('resumen') + `<section class="panel"><button onclick="panel()">← Volver</button><h2>Añadir equipo</h2><p class="small">Guarda aquí el equipo real de este acuario con datos útiles para garantía, mantenimiento y API.</p><label>Tipo</label><select id="eqType"><option>Skimmer</option><option>Luz</option><option>Bomba de subida</option><option>Bomba de movimiento</option><option>Calentador</option><option>Filtro</option><option>Reactor</option><option>Otro equipo</option></select><label>Nombre</label><input id="eqName" placeholder="Ej. Skimmer principal"><label>Marca</label><input id="eqBrand" placeholder="Ej. Bubble Magus"><label>Modelo</label><input id="eqModel" placeholder="Ej. Curve 5"><div class="form-grid"><div><label>Cantidad</label><input id="eqQty" type="number" step="1" value="1"></div><div><label>Estado</label><select id="eqStatus"><option value="en_uso">En uso</option><option value="repuesto">Repuesto</option><option value="retirado">Retirado</option></select></div><div><label>Compra</label><input id="eqPurchaseDate" type="date"></div><div><label>Garantía hasta</label><input id="eqWarranty" type="date"></div><div><label>Precio</label><input id="eqPrice" type="number" step="0.01"></div><div><label>Tienda</label><input id="eqPlace" placeholder="Tienda o web"></div></div><label>URL fabricante</label><input id="eqManufacturerUrl" placeholder="https://..."><label>Manual / PDF</label><input id="eqManualUrl" placeholder="https://..."><label>Notas</label><textarea id="eqNotes" placeholder="Potencia, litros recomendados, mantenimiento, repuestos..."></textarea><button class="primary" onclick="saveEquipoAcuario()">Guardar equipo</button><div id="x"></div></section>`, 'acuarios'); };
window.saveEquipoAcuario = async function() { try { if (!state.user) throw new Error('Debes iniciar sesión.'); if (!window.q) throw new Error('Abre un acuario primero.'); const name = val('eqName') || val('eqType'); const notes = [`Acuario: ${window.q.name}`, `Tipo: ${val('eqType')}`, val('eqNotes')].filter(Boolean).join('\\n'); const row = { user_id: state.user.id, aquarium_id: window.q.id, name, brand: val('eqBrand') || null, model: val('eqModel') || null, category: 'Equipo', quantity: Number(val('eqQty') || 1), unit: 'unidad', min_stock: 0, expiry_date: null, purchase_date: val('eqPurchaseDate') || null, purchase_place: val('eqPlace') || null, purchase_price: num('eqPrice'), warranty_until: val('eqWarranty') || null, manufacturer_url: val('eqManufacturerUrl') || null, manual_url: val('eqManualUrl') || null, item_status: val('eqStatus') || 'en_uso', notes, ai_review_status: 'manual' }; const r = await s.from('inventory_items').insert(row); if (r.error) throw r.error; $('x').innerHTML = `<div class="success">Equipo guardado en inventario.</div><button onclick="inventario()">Ver inventario</button>`; } catch (e) { $('x').innerHTML = msg(e.message, 'error'); } };

function tareaAcuarioCard(t) {
  const open = avisoAbierto(t);
  return `<div class="${open ? 'item' : 'success'}"><b>${esc(t.title || 'Tarea')}</b><p class="small">${esc(t.task_type || 'Tarea')} · ${esc(fecha(t.due_at))} · ${esc(t.priority || 'normal')} · ${esc(t.status || 'open')}</p>${t.notes ? `<p>${esc(t.notes)}</p>` : ''}${open ? `<button onclick="completeTaskAcuario('${esc(t.id)}')">Marcar hecho</button>` : ''}</div>`;
}
window.tareasAcuario = async function() {
  if (!state.user) return login();
  if (!window.q) return dashboard();
  setAqSection('tareas');
  shell(am('tareas') + `<section class="panel"><h2>Tareas</h2>${msg('Cargando tareas del acuario...')}</section>`, 'acuarios');
  try {
    const r = await s.from('tasks').select('id,title,task_type,due_at,priority,status,notes,created_at,completed_at').eq('user_id', state.user.id).eq('aquarium_id', window.q.id).order('due_at', { ascending: true, nullsFirst: false }).limit(120);
    if (r.error) throw r.error;
    const data = r.data || [];
    const abiertas = data.filter(avisoAbierto), cerradas = data.filter(t => !avisoAbierto(t));
    shell(am('tareas') + `<section class="panel"><div class="panel-head"><div><h2>Tareas</h2><p class="small">Las tareas abiertas de este acuario aparecen también en Avisos.</p></div><button class="primary" onclick="formTareaAcuario()">+ Tarea</button></div><div class="quick-actions"><button onclick="tareas()">Ver avisos globales</button></div></section><section class="panel"><h3>Pendientes</h3>${abiertas.map(tareaAcuarioCard).join('') || msg('No hay tareas pendientes para este acuario.', 'success')}</section><section class="panel"><h3>Hechas</h3>${cerradas.map(tareaAcuarioCard).join('') || msg('No hay tareas completadas todavía.')}</section>`, 'acuarios');
  } catch (e) {
    shell(am('tareas') + `<section class="panel"><h2>Tareas</h2>${msg(e.message, 'error')}<button class="primary" onclick="formTareaAcuario()">Crear tarea</button></section>`, 'acuarios');
  }
};
window.formTareaAcuario = function() {
  if (!window.q) return dashboard();
  setAqSection('tareas');
  shell(am('tareas') + `<section class="panel"><button onclick="tareasAcuario()">← Volver</button><h2>Nueva tarea</h2><p class="small">Se guardará en ${esc(window.q.name)} y saldrá en Avisos mientras esté pendiente.</p><label>Título</label><input id="aqTaskTitle" placeholder="Limpiar skimmer, cambiar perlón, medir NO3..."><label>Tipo</label><select id="aqTaskType"><option value="task">Tarea</option><option value="maintenance">Mantenimiento</option><option value="measurement">Medición</option><option value="shopping">Compra</option></select><label>Fecha y hora</label><input id="aqTaskDue" type="datetime-local"><label>Prioridad</label><select id="aqTaskPriority"><option value="normal">Normal</option><option value="alta">Alta</option><option value="baja">Baja</option></select><label>Notas</label><textarea id="aqTaskNotes" placeholder="Detalles, material necesario, frecuencia..."></textarea><button class="primary" onclick="saveTareaAcuario()">Guardar tarea</button><div id="x"></div></section>`, 'acuarios');
};
window.saveTareaAcuario = async function() {
  try {
    if (!state.user) throw new Error('Debes iniciar sesión.');
    if (!window.q) throw new Error('Abre un acuario primero.');
    if (!val('aqTaskTitle')) throw new Error('Pon un título para la tarea.');
    const row = { user_id: state.user.id, aquarium_id: window.q.id, title: val('aqTaskTitle'), task_type: val('aqTaskType') || 'task', due_at: val('aqTaskDue') ? new Date(val('aqTaskDue')).toISOString() : null, priority: val('aqTaskPriority') || 'normal', status: 'open', notes: val('aqTaskNotes') || null };
    const r = await s.from('tasks').insert(row);
    if (r.error) throw r.error;
    window.tareasAcuario();
  } catch (e) { if ($('x')) $('x').innerHTML = msg(e.message, 'error'); }
};
window.completeTaskAcuario = async function(id) {
  try {
    const r = await s.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id);
    if (r.error) throw r.error;
    window.tareasAcuario();
  } catch (e) { alert(e.message); }
};

// --- BLOQUE 8: GESTIÓN DE ANIMALES Y BIBLIOTECA ---
function catEs(c) { return ({ fish: 'Pez', coral: 'Coral', invertebrate: 'Invertebrado', crustacean: 'Crustáceo', mollusk: 'Molusco', plant: 'Planta', algae: 'Alga', other: 'Otro' }[c] || c || 'Sin tipo'); }
function normLib(x) { return { title: x.title || x.nombre || x.nombre_comun || x.common_name || x.nombre_cientifico || '', scientific_name: x.scientific_name || x.nombre_cientifico || '', category: x.category || x.tipo || x.tipo_ficha || 'other', photo_url: x.photo_url || x.foto_url || x.foto || x.imagen || x.image_url || '', description: x.description || x.descripcion || x.descripcion_detallada || '' }; }
function textOk(x) { return String(x || '').trim().length > 0; }
function animalCompleto(a) { return textOk(a.common_name) && textOk(a.scientific_name) && textOk(a.notes); }
function fichaBibliotecaCompleta(a) { return textOk(a.title) && textOk(a.scientific_name) && textOk(a.description); }
function animalIncompleteCard(a) { return `<div class="item error"><b>Registro incompleto</b><p class="small">Tiene foto o datos parciales, pero falta nombre, nombre científico o notas. No se muestra como animal válido.</p><div class="quick-actions"><button onclick="editAnimal('${a.id}')">Completar</button><button onclick="deleteAnimal('${a.id}')">Eliminar</button></div></div>`; }
function animalCard(a) { const buy = [a.acquired_at || [a.acquisition_year, a.acquisition_month, a.acquisition_day].filter(Boolean).join('-'), a.purchase_place || a.origin, a.purchase_price ? `${a.purchase_price} €` : ''].filter(Boolean).join(' · '); return `<div class="item">${a.photo_url ? `<img src="${esc(a.photo_url)}" style="width:100%;max-height:170px;object-fit:cover;border-radius:14px;margin-bottom:8px">` : ''}<b>${esc(a.common_name)}</b><p>${esc(a.scientific_name || '')}</p><p class="small">${esc(catEs(a.category))} · ${esc(a.status || 'active')} · Cantidad ${esc(a.quantity || 1)}</p>${buy ? `<p class="small">Alta/compra: ${esc(buy)}</p>` : ''}${a.death_date ? `<p class="error">Baja: ${esc(a.death_date)}${a.loss_reason ? ' · ' + esc(a.loss_reason) : ''}</p>` : ''}${a.notes ? `<p>${esc(a.notes)}</p>` : ''}<div class="quick-actions"><button onclick="editAnimal('${a.id}')">Editar</button><button onclick="deleteAnimal('${a.id}')">Eliminar</button></div></div>`; }

window.anis = async function() { setAqSection('animales'); try { const { data, error } = await s.from('animals').select('*').eq('aquarium_id', window.q.id).order('created_at', { ascending: false }); if (error) throw error; const rows = data || []; const completos = rows.filter(animalCompleto); const incompletos = rows.filter(a => !animalCompleto(a)); const alerta = incompletos.length ? msg(`${incompletos.length} registro(s) incompleto(s). Complétalos o elimínalos antes de contarlos como animales.`, 'error') : ''; const cards = completos.map(animalCard).join('') || msg('Sin animales completos en este acuario'); const badCards = incompletos.map(animalIncompleteCard).join(''); shell(am('animales') + `<section class="panel"><div class="panel-head"><h2>Animales</h2><button onclick="animalMenu()">Añadir</button></div>${alerta}${cards}${badCards}</section>`, 'acuarios'); } catch (e) { shell(am('animales') + `<section class="panel"><h2>Animales</h2>${msg(e.message, 'error')}</section>`, 'acuarios'); } };
window.animalMenu = function() { setAqSection('animales'); shell(am('animales') + `<section class="panel"><button onclick="anis()">← Volver</button><h2>Añadir animal</h2><div class="quick-actions"><button onclick="buscarAnimalBiblioteca()"><span>📚</span>Desde biblioteca</button><button onclick="formAnimalManual()"><span>✍️</span>Manual</button></div></section>`, 'acuarios'); };
function animalFields(a = {}) { const acquired = a.acquired_at || (a.acquisition_year ? `${a.acquisition_year}-${String(a.acquisition_month || 1).padStart(2, '0')}-${String(a.acquisition_day || 1).padStart(2, '0')}` : ''); return `<label>Nombre común</label><input id="anName" value="${esc(a.common_name || a.title || '')}"><label>Nombre científico</label><input id="anSci" value="${esc(a.scientific_name || '')}"><label>Tipo</label><select id="anCat"><option value="fish" ${a.category === 'fish' ? 'selected' : ''}>Pez</option><option value="coral" ${a.category === 'coral' ? 'selected' : ''}>Coral</option><option value="invertebrate" ${a.category === 'invertebrate' ? 'selected' : ''}>Invertebrado</option><option value="crustacean" ${a.category === 'crustacean' ? 'selected' : ''}>Crustáceo</option><option value="mollusk" ${a.category === 'mollusk' ? 'selected' : ''}>Molusco</option><option value="plant" ${a.category === 'plant' ? 'selected' : ''}>Planta</option><option value="other" ${!a.category || a.category === 'other' ? 'selected' : ''}>Otro</option></select><div class="form-grid"><div><label>Cantidad</label><input id="anQty" type="number" min="1" value="${esc(a.quantity || 1)}"></div><div><label>Estado</label><select id="anStatus"><option value="active" ${a.status === 'active' ? 'selected' : ''}>Vivo / activo</option><option value="quarantine" ${a.status === 'quarantine' ? 'selected' : ''}>Cuarentena</option><option value="hospital" ${a.status === 'hospital' ? 'selected' : ''}>Hospital</option><option value="deceased" ${a.status === 'deceased' ? 'selected' : ''}>Baja</option><option value="archived" ${a.status === 'archived' ? 'selected' : ''}>Archivado</option></select></div><div><label>Alta / compra</label><input id="anAcquired" type="date" value="${esc(acquired)}"></div><div><label>Tienda / origen</label><input id="anPlace" value="${esc(a.purchase_place || a.origin || '')}" placeholder="Tienda, particular, esqueje..."></div><div><label>Precio</label><input id="anPrice" type="number" step="0.01" value="${esc(a.purchase_price || '')}"></div><div><label>Fecha baja</label><input id="anDeathDate" type="date" value="${esc(a.death_date || '')}"></div></div><label>Motivo de baja</label><input id="anLossReason" value="${esc(a.loss_reason || '')}" placeholder="Salto, enfermedad, agresión, traslado..."><label>Foto desde cámara</label><input id="anCam" type="file" accept="image/*" capture="environment"><label>Foto desde galería</label><input id="anGal" type="file" accept="image/*"><label>Notas</label><textarea id="anNotes">${esc(a.notes || a.description || '')}</textarea><input id="anPhotoUrl" type="hidden" value="${esc(a.photo_url || '')}">`; }
window.formAnimalManual = function() { setAqSection('animales'); shell(am('animales') + `<section class="panel"><button onclick="animalMenu()">← Volver</button><h2>Animal manual</h2>${animalFields()}<button class="primary" onclick="saveAnimal()">Guardar animal</button><div id="x"></div></section>`, 'acuarios'); };
window.buscarAnimalBiblioteca = function() { setAqSection('animales'); shell(am('animales') + `<section class="panel"><button onclick="animalMenu()">← Volver</button><h2>Desde biblioteca</h2><label>Buscar ficha</label><input id="libQ" placeholder="Ej. gramma, ocellaris, euphyllia"><button class="primary" onclick="buscarAnimalBibliotecaResultados()">Buscar</button><div id="libRes"></div></section>`, 'acuarios'); };
async function searchLibrary(qv) { try { const r = await s.from('library_entries').select('*').or(`title.ilike.%${qv}%,scientific_name.ilike.%${qv}%,description.ilike.%${qv}%`).limit(40); if (!r.error && r.data) return r.data.map(normLib); } catch (e) { } return []; }
window.buscarAnimalBibliotecaResultados = async function() { try { const qv = val('libQ'); if (!qv) throw new Error('Escribe algo para buscar.'); const data = (await searchLibrary(qv)).filter(fichaBibliotecaCompleta); $('libRes').innerHTML = data.map((x, i) => `<div class="item"><b>${esc(x.title)}</b><p>${esc(x.scientific_name)}</p><p class="small">${esc(catEs(x.category))}</p><p>${esc(x.description).slice(0, 180)}${String(x.description).length > 180 ? '…' : ''}</p><button onclick='importarAnimalBiblioteca(${JSON.stringify(x).replace(/'/g, "&#039;")})'>Usar esta ficha</button></div>`).join('') || msg('No encontré fichas completas con esa búsqueda. Puedes añadirlo manualmente, pero debe llevar nombre, nombre científico y notas.'); } catch (e) { $('libRes').innerHTML = msg(e.message, 'error'); } };
window.importarAnimalBiblioteca = function(x) { const a = normLib(x); if (!fichaBibliotecaCompleta(a)) { alert('Esta ficha está incompleta y no se puede añadir al acuario. Debe tener nombre, nombre científico y descripción/notas.'); return; } setAqSection('animales'); shell(am('animales') + `<section class="panel"><button onclick="buscarAnimalBiblioteca()">← Volver</button><h2>Importar ficha</h2>${animalFields({ common_name: a.title, scientific_name: a.scientific_name, category: a.category, photo_url: a.photo_url, notes: a.description })}<button class="primary" onclick="saveAnimal()">Guardar en ${esc(window.q.name)}</button><div id="x"></div></section>`, 'acuarios'); };

async function uploadAnimalPhoto() { const f = ($('anCam')?.files?.[0]) || ($('anGal')?.files?.[0]); if (!f) return val('anPhotoUrl') || null; const ext = (f.name.split('.').pop() || 'jpg').toLowerCase(); const path = `animals/${state.user.id}/${window.q.id}/${Date.now()}.${ext}`; for (const b of ['aquarium-photos', 'photos', 'animal-photos']) { const up = await s.storage.from(b).upload(path, f, { upsert: true, contentType: f.type || 'image/jpeg' }); if (!up.error) return s.storage.from(b).getPublicUrl(path).data.publicUrl; } throw new Error('No se pudo subir la foto.'); }
window.saveAnimal = async function(id = '') { try { const name = val('anName'); if (!name) throw new Error('Pon el nombre del animal.'); if (!val('anSci')) throw new Error('Pon el nombre científico o técnico.'); if (!val('anNotes')) throw new Error('Añade notas de la ficha: cuidados, origen, compatibilidad o descripción.'); const d = val('anAcquired') ? new Date(val('anAcquired')) : null; const row = { user_id: state.user.id, aquarium_id: window.q.id, common_name: name, scientific_name: val('anSci') || null, category: val('anCat') || 'other', quantity: Number(val('anQty') || 1), acquisition_day: d ? d.getDate() : null, acquisition_month: d ? d.getMonth() + 1 : null, acquisition_year: d ? d.getFullYear() : null, acquired_at: val('anAcquired') || null, origin: val('anPlace') || null, purchase_place: val('anPlace') || null, purchase_price: num('anPrice'), death_date: val('anDeathDate') || null, loss_reason: val('anLossReason') || null, status: val('anStatus') || 'active', photo_url: await uploadAnimalPhoto(), notes: val('anNotes') || null }; const r = id ? await s.from('animals').update(row).eq('id', id) : await s.from('animals').insert(row); if (r.error) throw r.error; anis(); } catch (e) { $('x').innerHTML = msg(e.message, 'error'); } };
window.editAnimal = async function(id) { setAqSection('animales'); const { data, error } = await s.from('animals').select('*').eq('id', id).single(); if (error) return alert(error.message); shell(am('animales') + `<section class="panel"><button onclick="anis()">← Volver</button><h2>Editar animal</h2>${animalFields(data)}<button class="primary" onclick="saveAnimal('${id}')">Guardar cambios</button><div id="x"></div></section>`, 'acuarios'); };
window.deleteAnimal = async function(id) { if (!confirm('¿Eliminar este animal?')) return; const { error } = await s.from('animals').delete().eq('id', id); if (error) return alert(error.message); anis(); };

// --- BLOQUE 9: SECCIÓN FOTOS (GALERÍA REAL) ---
window.fotos = async function() {
  setAqSection('fotos');
  shell(am('fotos') + `<section class="panel"><div class="panel-head"><h2>Galería de Fotos 📷</h2><button class="primary" onclick="formFoto()">+ Añadir Foto</button></div><div id="galeriaList" class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 15px;">${msg('Cargando galería...')}</div></section>`, 'acuarios');
  try {
    const { data, error } = await s.from('aquarium_photos').select('*').eq('aquarium_id', window.q.id).order('created_at', { ascending: false }).limit(24);
    if (error) throw error;
    if (!data || data.length === 0) { $('galeriaList').innerHTML = `<p class="small" style="grid-column: 1/-1; text-align: center;">Aún no has subido ninguna foto de este acuario.</p>`; return; }
    $('galeriaList').innerHTML = data.map(p => `
      <div class="item" style="padding: 8px; position: relative;">
        <img src="${esc(p.image_url || p.photo_url || p.url)}" style="width:100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; margin-bottom: 4px;">
        <b style="font-size: 12px; display: block; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(p.title || p.caption || 'Sin título')}</b>
        <button class="danger small" onclick="deleteFoto('${p.id}')" style="position: absolute; top: 12px; right: 12px; padding: 4px 6px; font-size: 10px; background: rgba(219,68,85,0.9); border:none; color:white; border-radius:4px; cursor:pointer;">🗑️</button>
      </div>
    `).join('');
  } catch (e) { $('galeriaList').innerHTML = msg(e.message, 'error'); }
};

window.formFoto = function() {
  shell(am('fotos') + `
    <section class="panel">
      <button onclick="fotos()">← Volver</button>
      <h2>Subir foto al sistema</h2>
      <label>Título / Nota corta</label>
      <input id="fTitle" placeholder="Ej: Vista general, Nuevos corales, Crecimiento...">
      <label>Hacer foto con la cámara 📸</label>
      <input id="fCam" type="file" accept="image/*" capture="environment">
      <label>Seleccionar de la galería 🖼️</label>
      <input id="fGal" type="file" accept="image/*">
      <button class="primary" onclick="saveFoto()" style="margin-top: 15px;">Subir Imagen</button>
      <div id="x"></div>
    </section>
  `, 'acuarios');
};

window.saveFoto = async function() {
  try {
    const file = ($('fCam')?.files?.[0]) || ($('fGal')?.files?.[0]);
    if (!file) throw new Error('Por favor, selecciona o toma una foto primero.');
    $('x').innerHTML = msg('Subiendo archivo a Supabase Storage...');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `gallery/${state.user.id}/${window.q.id}/${Date.now()}.${ext}`;
    let publicUrl = null;
    for (const b of ['aquarium-photos', 'photos', 'animal-photos']) {
      const up = await s.storage.from(b).upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (!up.error) { publicUrl = s.storage.from(b).getPublicUrl(path).data.publicUrl; break; }
    }
    if (!publicUrl) throw new Error('Error al subir la imagen. Verifica tus buckets.');
    
    const row = { 
      user_id: state.user.id, 
      aquarium_id: window.q.id, 
      title: val('fTitle') || 'Foto de acuario', 
      image_url: publicUrl,
      photo_url: publicUrl,
      notes: val('fTitle') || null 
    };

    const { error } = await s.from('aquarium_photos').insert([row]); 
    if (error) throw error;
    window.fotos();
  } catch (e) { $('x').innerHTML = msg(e.message, 'error'); }
};

window.deleteFoto = async function(id) {
  if (!confirm('¿Eliminar esta foto permanentemente?')) return;
  try { const { error } = await s.from('aquarium_photos').delete().eq('id', id); if (error) throw error; window.fotos(); } catch (e) { alert(e.message); }
};

   

// --- BLOQUE 10: MEDIDAS Y PARÁMETROS CRÍTICOS ---
window.pars = async function() {
  setAqSection('parametros');
  shell(am('parametros') + `<section class="panel"><div class="panel-head"><h2>Panel de Control🧪</h2><button class="primary" onclick="formMedicion()">+ Nueva Medición</button></div><div class="quick-actions" style="margin-bottom:15px;"><button onclick="graficosAcuario()">📈 Gráficos</button><button onclick="icpAcuario()">🧪 Ver ICP</button></div><div id="parsList">${msg('Cargando mediciones...')}</div></section>`, 'acuarios');
  try {
    const { data, error } = await s.from('aquarium_measurements').select('*').eq('aquarium_id', window.q.id).order('measured_at', { ascending: false }).limit(30);
    if (error) throw error;
    if (!data || data.length === 0) { $('parsList').innerHTML = msg('No hay registros de parámetros para este acuario.'); return; }
    let html = `<table class="summary-table" style="width:100%; text-align:left; border-collapse:collapse;"><thead><tr style="border-bottom:1px solid #ccc;"><th style="padding:8px;">Fecha</th><th style="padding:8px;">Parámetro</th><th style="padding:8px;">Valor</th><th style="padding:8px;">Acción</th></tr></thead><tbody>`;
    data.forEach(m => { html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px; font-size:12px;">${fecha(m.measured_at || m.created_at)}</td><td style="padding:8px;"><b>${esc(m.parameter_label || m.parameter)}</b></td><td style="padding:8px;"><span class="badge">${esc(m.display_value || m.value)}</span></td><td style="padding:8px;"><button class="danger small" onclick="deleteMedicion('${m.id}')" style="padding:2px 6px; font-size:11px;">🗑️</button></td></tr>`; });
    html += `</tbody></table>`; $('parsList').innerHTML = html;
  } catch (e) { $('parsList').innerHTML = msg(e.message, 'error'); }
};

window.formMedicion = function() {
  const type = window.q?.aquarium_type || 'reef';
  const rangos = window.ACUARIONEXO_RANGOS[type] || window.ACUARIONEXO_RANGOS['reef'];
  let options = '';
  Object.keys(rangos).forEach(p => { options += `<option value="${p}">${p.toUpperCase()} (${rangos[p].unit})</option>`; });
  shell(am('parametros') + `<section class="panel"><button onclick="pars()">← Volver</button><h2>Registrar Parámetro</h2><label>Tipo de Parámetro</label><select id="pKey" onchange="updateParamHint()">${options}</select><div id="paramHint" class="small" style="margin:5px 0 15px 0; color:#666;"></div><label>Valor medido</label><input id="pVal" type="number" step="0.01" placeholder="Ej: 8.2"><label>Método de test (Opcional)</label><input id="pMethod" placeholder="Ej: Hanna, Salifert, Gotas..."><label>Notas</label><textarea id="pNotes" placeholder="Observaciones..."></textarea><button class="primary" onclick="saveMedicion()">Guardar Medición</button><div id="x"></div></section>`, 'acuarios');
  window.updateParamHint = function() { const k = val('pKey'); const r = rangos[k]; if (r) $('paramHint').innerHTML = `Rango óptimo para tu tipo: <b>${r.min} - ${r.max} ${r.unit}</b>`; };
  window.updateParamHint();
};

window.saveMedicion = async function() {
  try {
    const pKey = val('pKey'); const pVal = num('pVal'); if (pVal === null) throw new Error('Introduce un valor válido.');
    const row = { user_id: state.user.id, aquarium_id: window.q.id, parameter: pKey, parameter_label: pKey.toUpperCase(), value: pVal, display_value: String(pVal), test_method_label: val('pMethod') || null, notes: val('pNotes') || null, measured_at: new Date().toISOString() };
    const { error } = await s.from('aquarium_measurements').insert([row]); if (error) throw error; window.pars();
  } catch (e) { $('x').innerHTML = msg(e.message, 'error'); }
};
window.deleteMedicion = async function(id) { if (!confirm('¿Eliminar medición?')) return; try { const { error } = await s.from('aquarium_measurements').delete().eq('id', id); if (error) throw error; window.pars(); } catch (e) { alert(e.message); } };

// --- BLOQUE 11: HISTORIAL COMPLETO ---
function histBtn(id, label, count) { return `<button class="${state.histFilter === id ? 'active' : ''}" onclick="historialAcuario('${id}')">${label}${count != null ? ' ' + count : ''}</button>`; }
function histCard(i) { return `<div class="item"><b>${esc(i.label)} · ${esc(i.title)}</b><p class="small">${esc(fecha(i.date))}</p>${i.text ? `<p>${esc(i.text)}</p>` : ''}</div>`; }
function histSections(items) {
  const filtered = state.histFilter === 'todo' ? items : items.filter(i => i.kind === state.histFilter);
  if (!filtered.length) return msg('No hay entradas en esta sección.');
  const groups = {}; filtered.forEach(i => { const k = fechaDia(i.date); (groups[k] = groups[k] || []).push(i); });
  return Object.keys(groups).map(k => `<section class="panel"><h3>${esc(k)}</h3>${groups[k].map(histCard).join('')}</section>`).join('');
}
window.historialAcuario = async function(filter) {
  if (filter) state.histFilter = filter; setAqSection('historial');
  shell(am('historial') + `<section class="panel"><h2>Historial</h2>${msg('Cargando historial...')}</section>`, 'acuarios');
  const items = [];
  try {
    const animals = await s.from('animals').select('created_at,updated_at,common_name,scientific_name,category,status,notes').eq('aquarium_id', window.q.id).order('created_at', { ascending: false }).limit(80);
    if (!animals.error) (animals.data || []).forEach(a => items.push({ kind: 'animales', label: 'Animal', date: a.updated_at || a.created_at, title: a.common_name || 'Animal', text: [catEs(a.category), a.scientific_name, a.status, a.notes].filter(Boolean).join(' · ') }));
    const measures = await s.from('aquarium_measurements').select('*').eq('aquarium_id', window.q.id).order('created_at', { ascending: false }).limit(120);
    if (!measures.error) (measures.data || []).forEach(m => items.push({ kind: 'mediciones', label: 'Medición', date: m.measured_at || m.created_at, title: m.parameter_label || m.parameter || 'Parámetro', text: [m.display_value, m.value, m.test_method_label, m.notes].filter(Boolean).join(' · ') }));
    const photos = await s.from('aquarium_photos').select('*').eq('aquarium_id', window.q.id).order('created_at', { ascending: false }).limit(60);
    if (!photos.error) (photos.data || []).forEach(p => items.push({ kind: 'fotos', label: 'Foto', date: p.created_at || p.taken_at, title: p.title || p.caption || 'Foto', text: p.notes || '' }));
    const tasks = await s.from('tasks').select('*').eq('aquarium_id', window.q.id).order('created_at', { ascending: false }).limit(60);
    if (!tasks.error) (tasks.data || []).forEach(t => items.push({ kind: 'tareas', label: 'Tarea/Aviso', date: t.completed_at || t.due_at || t.created_at, title: t.title || 'Tarea', text: [t.status, t.priority, t.notes].filter(Boolean).join(' · ') }));
    const maintenance = await s.from('maintenance_events').select('*').eq('aquarium_id', window.q.id).order('created_at', { ascending: false }).limit(60);
    if (!maintenance.error) (maintenance.data || []).forEach(m => items.push({ kind: 'mantenimiento', label: 'Mantenimiento', date: m.performed_at || m.created_at, title: m.title || m.event_type || 'Mantenimiento', text: [m.event_type, m.notes].filter(Boolean).join(' · ') }));
    
    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const counts = { todo: items.length, mediciones: items.filter(i => i.kind === 'mediciones').length, animales: items.filter(i => i.kind === 'animales').length, fotos: items.filter(i => i.kind === 'fotos').length, tareas: items.filter(i => i.kind === 'tareas').length, mantenimiento: items.filter(i => i.kind === 'mantenimiento').length };
    const tabs = `<nav class="tank-tabs">${histBtn('todo', 'Todo', counts.todo)}${histBtn('mediciones', 'Mediciones', counts.mediciones)}${histBtn('animales', 'Animales', counts.animales)}${histBtn('fotos', 'Fotos', counts.fotos)}${histBtn('tareas', 'Tareas', counts.tareas)}${histBtn('mantenimiento', 'Mantenimiento', counts.mantenimiento)}</nav>`;
    shell(am('historial') + `<section class="panel"><h2>Historial</h2><p class="small">Revisión por fechas.</p>${tabs}</section>${histSections(items)}`, 'acuarios');
  } catch (e) { shell(am('historial') + `<section class="panel"><h2>Historial</h2>${msg(e.message, 'error')}</section>`, 'acuarios'); }
};

// --- BLOQUE 12: VISTAS ADICIONALES Y FUTURAS SECCIONES ---
window.graficosAcuario = function() { setAqSection('parametros'); shell(am('parametros') + `<section class="panel"><h2>Gráficos</h2><p>Módulos de visualización en desarrollo.</p></section>`, 'acuarios'); };
window.icpAcuario = function() { setAqSection('parametros'); shell(am('parametros') + `<section class="panel"><h2>ICP</h2><p>Analíticas completas de laboratorio.</p></section>`, 'acuarios'); };
const bibliotecaModulos = [
  { key: 'pez_marino', label: 'Peces marinos', desc: 'Fichas de peces marinos, comportamiento, alimentacion y compatibilidad.', icon: '🐠' },
  { key: 'pez_dulce', label: 'Peces de agua dulce', desc: 'Fichas de dulce por especie y variedad.', icon: '🐟' },
  { key: 'coral', label: 'Corales', desc: 'SPS, LPS, blandos, ubicacion, luz, flujo y cuidados.', icon: '🪸' },
  { key: 'invertebrado', label: 'Invertebrados', desc: 'Gambas, caracoles, cangrejos, estrellas y otros invertebrados.', icon: '🦐' },
  { key: 'planta', label: 'Plantas y algas', desc: 'Plantas de dulce, macroalgas y algas utiles o problematicas.', icon: '🌿' },
  { key: 'microfauna', label: 'Microfauna', desc: 'Copepodos, rotiferos, artemia, fitoplancton e infusorios.', icon: '∞' },
  { key: 'medicamento', label: 'Medicamentos', desc: 'Tratamientos, cuarentena, dosis y observaciones.', icon: '💊' },
  { key: 'sal', label: 'Sales', desc: 'Sales y mezclas: parametros objetivo, preparacion y verificacion.', icon: '🧂' },
  { key: 'test', label: 'Tests', desc: 'Tests de parametros, metodo, rango, lectura y mantenimiento.', icon: '🧪' },
  { key: 'alimento', label: 'Alimentos', desc: 'Alimentos, especies objetivo, frecuencia, dosis y conservacion.', icon: '🍽️' },
  { key: 'equipamiento', label: 'Equipamiento', desc: 'Bombas, luces, skimmer, filtros, calentadores y material tecnico.', icon: '⚙️' }
];
function bibliotecaTextoClasificacion(v) { return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function bibliotecaTiene(texto, palabras) { return palabras.some(p => texto.includes(p)); }
function bibliotecaCategoriaOriginal(f) {
  const raw = f?.raw || {};
  return raw?.ficha?.category || raw?.ficha_normalizada?.category || raw?.fichaNormalizada?.category || raw?.creator_category || raw?.tipo_ficha || raw?.tipo || raw?.category || f?.categoria || '';
}
function bibliotecaModulo(f) {
  const k = bibliotecaTextoClasificacion(bibliotecaCategoriaOriginal(f));
  const principal = bibliotecaTextoClasificacion([f?.nombre, f?.cientifico].filter(Boolean).join(' '));
  const t = bibliotecaTextoClasificacion([f?.nombre, f?.cientifico, f?.descripcion].filter(Boolean).join(' '));
  if (bibliotecaTiene(k, ['pez_marino', 'fish_marine', 'marine_fish', 'marino'])) return 'pez_marino';
  if (bibliotecaTiene(k, ['pez_dulce', 'fish_freshwater', 'freshwater_fish', 'dulce'])) return 'pez_dulce';
  if (bibliotecaTiene(k, ['invertebrado', 'invertebrate', 'crust', 'molus'])) return 'invertebrado';
  if (bibliotecaTiene(k, ['planta', 'plant', 'alga'])) return 'planta';
  if (bibliotecaTiene(k, ['medicamento', 'medicine', 'medic'])) return 'medicamento';
  if (bibliotecaTiene(k, ['equipamiento', 'equipment', 'equipo', 'equip'])) return 'equipamiento';
  if (bibliotecaTiene(k, ['sal', 'salt'])) return 'sal';
  if (bibliotecaTiene(k, ['test'])) return 'test';
  if (bibliotecaTiene(k, ['alimento', 'food', 'feeding'])) return 'alimento';
  if (bibliotecaTiene(k, ['microfauna'])) return 'microfauna';
  if (bibliotecaTiene(k, ['coral'])) return 'coral';
  if (bibliotecaTiene(principal, ['anubia', 'cryptocoryne', 'echinodorus', 'bucephalandra', 'vallisneria', 'hygrophila', 'rotala', 'limnophila', 'microsorum', 'java fern', 'musgo', 'planta', 'macroalga', 'alga'])) return 'planta';
  if (bibliotecaTiene(principal, ['camaron', 'gamba', 'shrimp', 'caracol', 'snail', 'cangrejo', 'crab', 'erizo', 'urchin', 'estrella', 'starfish', 'lysmata', 'amboinensis', 'caridina', 'neocaridina', 'turbo', 'trochus', 'nassarius'])) return 'invertebrado';
  if (bibliotecaTiene(principal, ['coral', 'acropora', 'euphyllia', 'zoanthus', 'zoanthid', 'montipora', 'sarcophyton', 'palythoa', 'duncanopsammia'])) return 'coral';
  if (t.includes('dulce') || t.includes('freshwater')) return 'pez_dulce';
  if (k.includes('fish') || k.includes('pez') || k.includes('peces') || t.includes('marin') || t.includes('arrecife')) return 'pez_marino';
  return 'general';
}
function bibliotecaModuloLabel(key) { return (bibliotecaModulos.find(m => m.key === key)?.label) || 'General'; }
function bibliotecaNorm(x, tabla) { const id = x.id || x.uuid || x.slug || ''; return { nombre: x.title || x.nombre || x.nombre_comun || x.common_name || x.nombre_cientifico || x.scientific_name || '', cientifico: x.scientific_name || x.nombre_cientifico || x.scientific || '', categoria: x?.ficha?.category || x?.ficha_normalizada?.category || x?.fichaNormalizada?.category || x.creator_category || x.category || x.tipo || x.tipo_ficha || x.grupo || x.seccion || 'fish', foto: x.photo_url || x.foto_url || x.foto || x.imagen || x.image_url || x.url_foto || '', descripcion: x.resumen_rapido || x.resumen || x.description || x.descripcion || x.descripcion_detallada || x.notes || '', raw: x, __source_table: tabla || x.__source_table || '', __source_id: id, __full: !!x.__full || tabla === 'library_entries' }; }
function bibliotecaCompleta(f) { return textOk(f.nombre) && (textOk(f.cientifico) || textOk(f.descripcion)); }
function bibliotecaTimeout(p, ms = 6500) { return Promise.race([p, new Promise(resolve => setTimeout(() => resolve({ data: [], error: { message: 'Tiempo de carga agotado' } }), ms))]); }
function bibliotecaFiltro(q, texto) { if (!texto) return q; const clean = String(texto).replace(/[%,]/g, ' ').trim(); if (!clean) return q; return q.or('title.ilike.%' + clean + '%,scientific_name.ilike.%' + clean + '%,description.ilike.%' + clean + '%'); }
async function bibliotecaTabla(texto) { try { const q = bibliotecaFiltro(s.from('library_entries').select('*').limit(texto ? 120 : 80), texto); const r = await bibliotecaTimeout(q); if (r.error) return { rows: [], warning: 'library_entries: ' + r.error.message }; const rows = Array.isArray(r.data) ? r.data.map(x => bibliotecaNorm(x, 'library_entries')).filter(bibliotecaCompleta) : []; return { rows, warning: '' }; } catch (e) { return { rows: [], warning: 'library_entries: ' + e.message }; } }
async function bibliotecaDatos(texto) { const cacheKey = String(texto || '').trim().toLowerCase(); window.__bibliotecaCache = window.__bibliotecaCache || {}; if (window.__bibliotecaCache[cacheKey]) { window.__bibliotecaWarnings = []; return window.__bibliotecaCache[cacheKey]; } const res = await bibliotecaTabla(texto); window.__bibliotecaWarnings = res.warning ? [res.warning] : []; const map = new Map(); res.rows.forEach(f => { const key = (f.nombre + '|' + f.cientifico).toLowerCase(); if (!map.has(key)) map.set(key, f); }); const out = Array.from(map.values()); window.__bibliotecaCache[cacheKey] = out; return out; }
async function bibliotecaFichaCompleta(f) { if (!f || f.__full || !f.__source_table || !f.__source_id) return f; try { const r = await bibliotecaTimeout(s.from(f.__source_table).select('*').eq('id', f.__source_id).single(), 8000); if (r.error || !r.data) return f; return bibliotecaNorm({ ...r.data, __full: true }, f.__source_table); } catch (e) { return f; } }
function bibliotecaCard(f, i) { const resumen = bibliotecaResumen(f); return `<article class="library-card" onclick="verFichaBiblioteca(${i})">${f.foto ? `<img src="${esc(f.foto)}" alt="${esc(f.nombre)}" loading="lazy">` : '<div class="library-no-photo">🐠</div>'}<div class="library-card-body"><small>${esc(bibliotecaModuloLabel(bibliotecaModulo(f)))}</small><h3>${esc(f.nombre)}</h3>${f.cientifico ? `<p class="scientific">${esc(f.cientifico)}</p>` : ''}${resumen ? `<p>${esc(resumen).slice(0, 180)}${String(resumen).length > 180 ? '…' : ''}</p>` : ''}${window.q ? `<button onclick='event.stopPropagation();importarAnimalBiblioteca(${JSON.stringify(f.raw).replace(/'/g, '&#039;')})'>Añadir a ${esc(window.q.name || 'mi acuario')}</button>` : ''}</div></article>`; }
function bibliotecaModulosHtml(lista, handler = 'filtrarBibliotecaModulo') { const mods = bibliotecaModulos.map(m => ({ ...m, n: lista.filter(f => bibliotecaModulo(f) === m.key).length })); return mods.length ? `<div class="library-modules">${mods.map(m => `<button onclick="${handler}('${esc(m.key)}')"><b>${esc(m.icon)} ${m.n}</b><span>${esc(m.label)}</span><small>${esc(m.desc)}</small></button>`).join('')}</div>` : ''; }
window.renderBibliotecaLista = function(lista, modulo) { const cont = $('bibliotecaResultados'); if (!cont) return; try { const filtrada = modulo ? lista.filter(f => bibliotecaModulo(f) === modulo) : lista; window.__bibliotecaListaActual = lista; window.__bibliotecaVistaActual = filtrada; const warnings = (window.__bibliotecaWarnings || []).map(w => msg(w, 'notice')).join(''); const cards = filtrada.length ? `<div class="library-grid">${filtrada.map(bibliotecaCard).join('')}</div>` : msg('No encontré fichas completas. Revisa conexión/Supabase o prueba a buscar por nombre.') + '<button class="primary" onclick="buscarBibliotecaReal()">Reintentar</button>'; cont.innerHTML = warnings + '<div class="library-section-title"><h3>Apartados</h3><p class="small">11 apartados de clasificación.</p></div>' + bibliotecaModulosHtml(lista) + `<div class="library-section-title"><h3>${esc(modulo ? bibliotecaModuloLabel(modulo) : 'Fichas disponibles')}</h3><p class="small">${filtrada.length} fichas encontradas.</p></div>` + cards; } catch (e) { cont.innerHTML = msg('No pude pintar la biblioteca: ' + e.message, 'error') + '<button class="primary" onclick="buscarBibliotecaReal()">Reintentar</button>'; } };
window.filtrarBibliotecaModulo = function(modulo) { window.renderBibliotecaLista(window.__bibliotecaListaActual || [], modulo); };
window.buscarBibliotecaReal = async function() { const texto = val('bibliotecaSearch'); const cont = $('bibliotecaResultados'); try { if (cont) cont.innerHTML = msg('Cargando fichas desde Supabase...'); const data = await bibliotecaDatos(texto); window.renderBibliotecaLista(data, null); } catch (e) { if (cont) cont.innerHTML = msg('No pude cargar biblioteca: ' + e.message, 'error') + '<button class="primary" onclick="buscarBibliotecaReal()">Reintentar</button>'; } };
window.biblioteca = function() { shell(`<section class="panel library-panel"><div class="panel-head"><div><h2>Biblioteca</h2><p class="small">Fichas reales guardadas en Supabase, separadas por módulos.</p></div></div><div class="library-search"><input id="bibliotecaSearch" placeholder="Buscar pez, coral, invertebrado, producto..."><button class="primary" onclick="buscarBibliotecaReal()">Buscar</button></div><div id="bibliotecaResultados">${msg('Cargando fichas desde Supabase...')}</div></section>`, 'biblioteca'); setTimeout(() => window.buscarBibliotecaReal(), 0); };
function bibliotecaClave(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ''); }
function bibliotecaValor(v) { if (v == null || v === '') return ''; if (Array.isArray(v)) return v.map(bibliotecaValor).filter(Boolean).join('\\n'); if (typeof v === 'object') return bibliotecaValor(v.texto || v.text || v.contenido || v.content || v.valor || v.value || v.descripcion || v.description || ''); return String(v); }
function bibliotecaCampoDeObjeto(obj, keys) { if (!obj || typeof obj !== 'object') return ''; const wanted = keys.map(bibliotecaClave); for (const [k, v] of Object.entries(obj)) { if (wanted.includes(bibliotecaClave(k))) { const out = bibliotecaValor(v).trim(); if (out) return out; } } return ''; }
function bibliotecaCampoDeArray(arr, keys) { if (!Array.isArray(arr)) return ''; const wanted = keys.map(bibliotecaClave); for (const item of arr) { if (!item || typeof item !== 'object') continue; const title = item.titulo || item.title || item.nombre || item.name || item.key || item.id || item.label || item.apartado || item.modulo || item.seccion; if (!wanted.includes(bibliotecaClave(title))) continue; const out = bibliotecaValor(item).trim(); if (out) return out; } return ''; }
function bibliotecaCampoRec(obj, keys, seen = new Set()) { if (!obj || typeof obj !== 'object' || seen.has(obj)) return ''; seen.add(obj); const direct = Array.isArray(obj) ? bibliotecaCampoDeArray(obj, keys) : bibliotecaCampoDeObjeto(obj, keys); if (direct) return direct; const wanted = keys.map(bibliotecaClave); if (Array.isArray(obj)) { for (const item of obj) { const title = item && typeof item === 'object' ? (item.titulo || item.title || item.nombre || item.name || item.key || item.id || item.label || item.apartado || item.modulo || item.seccion || item.heading || item.campo) : ''; if (wanted.includes(bibliotecaClave(title))) { const out = bibliotecaValor(item).trim(); if (out) return out; } const nested = bibliotecaCampoRec(item, keys, seen); if (nested) return nested; } return ''; } for (const [k, v] of Object.entries(obj)) { if (wanted.includes(bibliotecaClave(k))) { const out = bibliotecaValor(v).trim(); if (out) return out; } const nested = bibliotecaCampoRec(v, keys, seen); if (nested) return nested; } return ''; }
function bibliotecaCampo(f, keys) { const raw = f.raw || {}; const pools = [raw, raw.apartados, raw.bloques, raw.modulos, raw.modules, raw.sections, raw.secciones, raw.data, raw.ficha, raw.ficha_normalizada, raw.fichaNormalizada, raw.ficha_tecnica, raw.fichaTecnica, raw.ai_result, raw.ai, raw.generated, raw.internet].filter(Boolean); for (const p of pools) { const out = bibliotecaCampoRec(p, keys); if (out) return out; } return ''; }
function bibliotecaResumen(f) { return bibliotecaCampo(f, ['resumen_rapido', 'resumenRapido', 'resumen', 'summary', 'description', 'descripcion', 'descripcion_detallada']) || f.descripcion || ''; }
const bibliotecaSeccionesFicha = [
  ['Resumen rápido', ['resumen_rapido', 'resumenRapido', 'resumen', 'summary', 'description', 'descripcion']],
  ['Identificación', ['identificacion', 'identification', 'taxonomia', 'taxonomy']],
  ['Hábitat natural', ['habitat_natural', 'habitatNatural', 'habitat', 'natural_habitat', 'origen', 'distribucion', 'distribution']],
  ['Acuario recomendado', ['acuario_recomendado', 'acuarioRecomendado', 'aquarium_recommended', 'tank', 'acuario', 'tamano_acuario', 'litros_minimos', 'min_tank_liters', 'ubicacion']],
  ['Parámetros', ['parametros', 'parameters', 'parametros_agua', 'water_parameters', 'water', 'agua']],
  ['Comportamiento', ['comportamiento', 'behavior', 'temperamento', 'temperament']],
  ['Alimentación', ['alimentacion', 'feeding', 'diet', 'dieta']],
  ['Compatibilidad', ['compatibilidad', 'compatibility']],
  ['Reef Safe', ['reef_safe', 'reefSafe', 'reef']],
  ['Salud y enfermedades', ['salud_enfermedades', 'saludYEnfermedades', 'salud', 'enfermedades', 'health']],
  ['Antes de comprar', ['antes_comprar', 'antesDeComprar', 'before_buying', 'compra']],
  ['Errores frecuentes', ['errores_frecuentes', 'erroresFrecuentes', 'common_mistakes', 'errores']],
  ['Curiosidades', ['curiosidades', 'curiosities']],
  ['Fuentes', ['fuentes', 'sources', 'references_text', 'referencias']]
];
function bibliotecaTextoDerivado(f, title) {
  const raw = f.raw || {};
  if (title === 'Identificación') return [`Nombre común: ${f.nombre}`, f.cientifico ? `Nombre científico: ${f.cientifico}` : '', raw.category ? `Categoría: ${bibliotecaModuloLabel(bibliotecaModulo(f))}` : '', raw.care_level ? `Dificultad: ${raw.care_level}` : ''].filter(Boolean).join('\\n');
  if (title === 'Acuario recomendado') return [raw.min_tank_liters ? `Litros mínimos: ${raw.min_tank_liters} L` : '', raw.aquarium_zone ? `Zona: ${raw.aquarium_zone}` : ''].filter(Boolean).join('\\n');
  if (title === 'Parámetros') return bibliotecaValor(raw.parameters).trim();
  if (title === 'Comportamiento') return raw.temperament || '';
  if (title === 'Alimentación') return raw.feeding || raw.diet || '';
  if (title === 'Compatibilidad') return raw.compatibility || '';
  if (title === 'Reef Safe') return raw.reef_safe != null ? String(raw.reef_safe) : '';
  if (title === 'Fuentes') return [raw.references_text, raw.source_url ? `Fuente interna: ${raw.source_url}` : ''].filter(Boolean).join('\\n');
  return '';
}
function bibliotecaSeccionesHtml(f) { return bibliotecaSeccionesFicha.map(([title, keys]) => { const text = bibliotecaCampo(f, keys) || bibliotecaTextoDerivado(f, title); const body = text ? `<p>${esc(text).replaceAll('\\n', '<br>')}</p>` : `<p class="small">Pendiente de completar en la ficha original.</p>`; return `<details class="library-detail-section"><summary>${esc(title)}</summary>${body}</details>`; }).join(''); }
function bibliotecaNotasInventario(f) { return bibliotecaSeccionesFicha.map(([title, keys]) => { const text = bibliotecaCampo(f, keys); return text ? `${title}: ${text}` : ''; }).filter(Boolean).join('\\n\\n') || f.descripcion || ''; }
function bibliotecaCategoriaInventario(f) { const m = bibliotecaModulo(f); if (m === 'medicamento') return 'Medicamento'; if (m === 'equipamiento') return 'Equipo'; if (['sal', 'test', 'alimento'].includes(m)) return 'Producto'; if (['pez_marino', 'pez_dulce', 'coral', 'invertebrado', 'planta', 'microfauna'].includes(m)) return 'Ficha biblioteca'; return 'Producto'; }
window.guardarFichaInventario = async function(i) { const f = (window.__bibliotecaVistaActual || [])[i]; if (!f) return; try { if (!state.user) throw new Error('Debes iniciar sesión.'); const row = { user_id: state.user.id, name: f.nombre, brand: f.cientifico || null, category: bibliotecaCategoriaInventario(f), quantity: 1, unit: 'unidad', min_stock: 0, expiry_date: null, notes: bibliotecaNotasInventario(f), ai_review_status: 'biblioteca' }; const r = await s.from('inventory_items').insert(row); if (r.error) throw r.error; const x = $('x'); if (x) x.innerHTML = `<div class="success">Ficha guardada en inventario.</div><button onclick="inventario()">Ver inventario</button>`; } catch (e) { const x = $('x'); if (x) x.innerHTML = msg(e.message, 'error'); } };
window.verFichaBiblioteca = async function(i) { let f = (window.__bibliotecaVistaActual || [])[i]; if (!f) return; shell(`<section class="panel library-detail"><button onclick="biblioteca()">← Volver</button><h2>${esc(f.nombre)}</h2>${msg('Cargando ficha completa...')}</section>`, 'biblioteca'); f = await bibliotecaFichaCompleta(f); if (window.__bibliotecaVistaActual) window.__bibliotecaVistaActual[i] = f; shell(`<section class="panel library-detail"><button onclick="biblioteca()">← Volver</button>${f.foto ? `<img class="library-detail-photo" src="${esc(f.foto)}" alt="${esc(f.nombre)}">` : ''}<p class="small">${esc(bibliotecaModuloLabel(bibliotecaModulo(f)))}</p><h2>${esc(f.nombre)}</h2>${f.cientifico ? `<p class="scientific">${esc(f.cientifico)}</p>` : ''}<div class="quick-actions"><button onclick="guardarFichaInventario(${i})"><span>▤</span>Guardar en inventario</button>${window.q ? `<button onclick='importarAnimalBiblioteca(${JSON.stringify(f.raw).replace(/'/g, '&#039;')})'><span>＋</span>Añadir a ${esc(window.q.name || 'mi acuario')}</button>` : ''}</div><div id="x"></div>${bibliotecaSeccionesHtml(f)}</section>`, 'biblioteca'); };
function fichaAcuarioCard(f, i) { const resumen = bibliotecaResumen(f); return `<article class="library-card" onclick="verFichaAcuario(${i})">${f.foto ? `<img src="${esc(f.foto)}" alt="${esc(f.nombre)}" loading="lazy">` : '<div class="library-no-photo">□</div>'}<div class="library-card-body"><small>${esc(bibliotecaModuloLabel(bibliotecaModulo(f)))}</small><h3>${esc(f.nombre)}</h3>${f.cientifico ? `<p class="scientific">${esc(f.cientifico)}</p>` : ''}${resumen ? `<p>${esc(resumen).slice(0, 180)}${String(resumen).length > 180 ? '…' : ''}</p>` : ''}<button onclick="event.stopPropagation();verFichaAcuario(${i})">Ver ficha</button></div></article>`; }
window.renderFichasAcuarioLista = function(lista, modulo) { const cont = $('fichasAcuarioResultados'); if (!cont) return; const filtrada = modulo ? lista.filter(f => bibliotecaModulo(f) === modulo) : lista; window.__fichasAcuarioListaActual = lista; window.__fichasAcuarioVistaActual = filtrada; cont.innerHTML = bibliotecaModulosHtml(lista, 'filtrarFichasAcuarioModulo') + `<div class="library-section-title"><h3>${esc(modulo ? bibliotecaModuloLabel(modulo) : 'Fichas completas')}</h3><p class="small">${filtrada.length} fichas listas para consultar o cargar en este acuario.</p></div>` + (filtrada.length ? `<div class="library-grid">${filtrada.map(fichaAcuarioCard).join('')}</div>` : msg('No encontré fichas completas con esa búsqueda o módulo.')); };
window.filtrarFichasAcuarioModulo = function(modulo) { window.renderFichasAcuarioLista(window.__fichasAcuarioListaActual || [], modulo); };
window.buscarFichasAcuario = async function() { const texto = val('fichasAcuarioSearch'); const cont = $('fichasAcuarioResultados'); if (cont) cont.innerHTML = msg('Cargando fichas completas desde Supabase...'); try { window.renderFichasAcuarioLista(await bibliotecaDatos(texto), null); } catch (e) { if (cont) cont.innerHTML = msg('No pude cargar fichas: ' + e.message, 'error'); } };
window.fichasAcuario = async function() { if (!window.q) return dashboard(); setAqSection('fichas'); shell(am('fichas') + `<section class="panel library-panel"><div class="panel-head"><div><h2>Fichas</h2><p class="small">Base validada para consultar, guardar en inventario o convertir en habitante real del acuario.</p></div></div><div class="library-search"><input id="fichasAcuarioSearch" placeholder="Buscar pez, coral, invertebrado, producto..."><button class="primary" onclick="buscarFichasAcuario()">Buscar</button></div><div id="fichasAcuarioResultados">${msg('Cargando fichas completas desde Supabase...')}</div></section>`, 'acuarios'); await window.buscarFichasAcuario(); };
window.verFichaAcuario = async function(i) { let f = (window.__fichasAcuarioVistaActual || [])[i]; if (!f) return; setAqSection('fichas'); shell(am('fichas') + `<section class="panel library-detail"><button onclick="fichasAcuario()">← Fichas</button><h2>${esc(f.nombre)}</h2>${msg('Cargando ficha completa...')}</section>`, 'acuarios'); f = await bibliotecaFichaCompleta(f); if (window.__fichasAcuarioVistaActual) window.__fichasAcuarioVistaActual[i] = f; shell(am('fichas') + `<section class="panel library-detail"><button onclick="fichasAcuario()">← Fichas</button>${f.foto ? `<img class="library-detail-photo" src="${esc(f.foto)}" alt="${esc(f.nombre)}">` : ''}<p class="small">${esc(bibliotecaModuloLabel(bibliotecaModulo(f)))}</p><h2>${esc(f.nombre)}</h2>${f.cientifico ? `<p class="scientific">${esc(f.cientifico)}</p>` : ''}<div class="quick-actions"><button onclick="guardarFichaInventarioDesdeAcuario(${i})"><span>▤</span>Inventario</button><button onclick='importarAnimalBiblioteca(${JSON.stringify(f.raw).replace(/'/g, '&#039;')})'><span>＋</span>Añadir al acuario</button></div><div id="x"></div>${bibliotecaSeccionesHtml(f)}</section>`, 'acuarios'); };
window.guardarFichaInventarioDesdeAcuario = async function(i) { const old = window.__bibliotecaVistaActual; window.__bibliotecaVistaActual = window.__fichasAcuarioVistaActual || []; await window.guardarFichaInventario(i); window.__bibliotecaVistaActual = old; };
function aqName(id) { return (state.aquariums || []).find(a => a.id === id)?.name || (id ? 'Acuario' : 'General'); }
function avisoAbierto(x) { return !['done', 'completed', 'archived', 'closed'].includes(String(x?.status || 'open').toLowerCase()); }
function avisoBucket(a) {
  if (!a.date) return 'sin_fecha';
  const now = new Date(), d = new Date(a.date);
  if (isNaN(d)) return 'sin_fecha';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (day < today) return 'vencidos';
  if (day === today) return 'hoy';
  return 'proximos';
}
function avisoCard(a) {
  const cls = a.bucket === 'vencidos' ? 'error' : a.bucket === 'hoy' ? 'notice' : 'item';
  return `<div class="${cls}"><b>${esc(a.title || 'Aviso')}</b><p class="small">${esc(a.source)} · ${esc(a.aquarium)} · ${esc(fecha(a.date))}${a.priority ? ' · ' + esc(a.priority) : ''}</p>${a.notes ? `<p>${esc(a.notes)}</p>` : ''}${a.taskId ? `<button onclick="completeTask('${esc(a.taskId)}')">Marcar hecho</button>` : ''}</div>`;
}
function avisoGroup(title, list, emptyText) {
  return `<section class="panel"><h3>${esc(title)}</h3>${list.length ? list.map(avisoCard).join('') : msg(emptyText)}</section>`;
}
function mapTaskAviso(t) { return { taskId: t.id, title: t.title || 'Tarea', source: t.task_type || 'Tarea', aquarium: aqName(t.aquarium_id), date: t.due_at || null, priority: t.priority || '', notes: t.notes || '' }; }
function mapMaintenanceAviso(m) { return { title: m.title || m.event_type || 'Mantenimiento', source: 'Mantenimiento', aquarium: aqName(m.aquarium_id), date: m.next_due_at || null, priority: '', notes: m.notes || '' }; }
function mapMicrofaunaAviso(m) { return { title: m.name || m.culture_type || 'Microfauna', source: 'Microfauna', aquarium: aqName(m.aquarium_id), date: m.next_action_at || null, priority: '', notes: m.notes || '' }; }
function avisosIAMediciones(rows) {
  if (!window.AcuarioNexoMeasurementAI || !state.aquariums?.length) return [];
  const byAq = {};
  (rows || []).forEach(r => { const id = r.aquarium_id; if (id) (byAq[id] = byAq[id] || []).push(r); });
  return state.aquariums.flatMap(aq => window.AcuarioNexoMeasurementAI.parameterAlerts(aq, byAq[aq.id] || []));
}
async function readAvisosOpcional(tabla, select, dateField, mapper, warnings) {
  try {
    let q = s.from(tabla).select(select).eq('user_id', state.user.id).not(dateField, 'is', null).order(dateField, { ascending: true }).limit(80);
    const r = await q;
    if (r.error) { warnings.push(`No pude leer ${tabla}: ${r.error.message}`); return []; }
    return (r.data || []).map(mapper);
  } catch (e) {
    warnings.push(`No pude leer ${tabla}: ${e.message}`);
    return [];
  }
}
window.formAviso = async function() {
  if (!state.user) return login();
  await loadAquariums();
  const opts = ['<option value="">General</option>'].concat((state.aquariums || []).map(a => `<option value="${esc(a.id)}">${esc(a.name)}</option>`)).join('');
  shell(`<section class="panel"><button onclick="tareas()">← Volver</button><h2>Nuevo aviso</h2><label>Título</label><input id="avTitle" placeholder="Cambio de agua, revisar skimmer..."><label>Acuario</label><select id="avAq">${opts}</select><label>Fecha y hora</label><input id="avDue" type="datetime-local"><label>Prioridad</label><select id="avPriority"><option value="normal">Normal</option><option value="alta">Alta</option><option value="baja">Baja</option></select><label>Notas</label><textarea id="avNotes" placeholder="Detalles del recordatorio"></textarea><button class="primary" onclick="saveAviso()">Guardar aviso</button><div id="x"></div></section>`, 'avisos');
};
window.saveAviso = async function() {
  try {
    if (!state.user) throw new Error('Debes iniciar sesión.');
    if (!val('avTitle')) throw new Error('Pon un título para el aviso.');
    const row = { user_id: state.user.id, aquarium_id: val('avAq') || null, title: val('avTitle'), task_type: 'task', due_at: val('avDue') ? new Date(val('avDue')).toISOString() : null, priority: val('avPriority') || 'normal', status: 'open', notes: val('avNotes') || null };
    const r = await s.from('tasks').insert(row);
    if (r.error) throw r.error;
    window.tareas();
  } catch (e) { if ($('x')) $('x').innerHTML = msg(e.message, 'error'); }
};
window.completeTask = async function(id) {
  try {
    const r = await s.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id);
    if (r.error) throw r.error;
    window.tareas();
  } catch (e) { alert(e.message); }
};
window.tareas = async function() {
  if (!state.user) return login();
  shell(`<section class="panel"><h2>Avisos</h2><p>Tareas, alertas de mediciones y recordatorios periódicos.</p>${msg('Cargando avisos...')}</section>`, 'avisos');
  try {
    await loadAquariums();
    const warnings = [];
    const taskRes = await s.from('tasks').select('id,aquarium_id,title,task_type,due_at,priority,status,notes').eq('user_id', state.user.id).order('due_at', { ascending: true, nullsFirst: false }).limit(120);
    if (taskRes.error) throw taskRes.error;
    const measureRes = await s.from('aquarium_measurements').select('id,aquarium_id,parameter_key,parameter,parameter_label,display_value,normalized_value,value,color,risk_level,status,ai_title,ai_recommendation,ai_next_action,measured_at,created_at').eq('user_id', state.user.id).order('measured_at', { ascending: false }).limit(300);
    if (measureRes.error) warnings.push(`No pude leer mediciones IA: ${measureRes.error.message}`);
    const all = (taskRes.data || []).filter(avisoAbierto).map(mapTaskAviso)
      .concat(avisosIAMediciones(measureRes.data || []))
      .concat(await readAvisosOpcional('maintenance_events', 'id,aquarium_id,title,event_type,next_due_at,notes', 'next_due_at', mapMaintenanceAviso, warnings))
      .concat(await readAvisosOpcional('microfauna_cultures', 'id,aquarium_id,name,culture_type,next_action_at,status,notes', 'next_action_at', mapMicrofaunaAviso, warnings));
    all.forEach(a => { a.bucket = avisoBucket(a); });
    all.sort((a, b) => new Date(a.date || '2999-12-31') - new Date(b.date || '2999-12-31'));
    const vencidos = all.filter(a => a.bucket === 'vencidos'), hoy = all.filter(a => a.bucket === 'hoy'), proximos = all.filter(a => a.bucket === 'proximos'), sinFecha = all.filter(a => a.bucket === 'sin_fecha');
    const warnHtml = warnings.length ? msg('Algunos módulos aún no devuelven avisos: ' + warnings.join(' · '), 'notice') : '';
    const emptyHtml = all.length ? '' : msg('No hay avisos pendientes ahora mismo. Si esperabas ver alguno, todavía no existe como tarea o ya está marcado como hecho.', 'success');
    shell(`<section class="summary-card"><div><small>Avisos activos</small><h2>${all.length} pendientes</h2><p>${vencidos.length} vencidos · ${hoy.length} para hoy · ${proximos.length} próximos</p></div></section><section class="panel"><div class="panel-head"><div><h2>Avisos</h2><p class="small">Tareas, mantenimientos y recordatorios de tus acuarios.</p></div><button class="primary" onclick="formAviso()">+ Aviso</button></div>${warnHtml}${emptyHtml}</section>${avisoGroup('Vencidos', vencidos, 'No hay avisos vencidos.')}${avisoGroup('Hoy', hoy, 'No hay avisos para hoy.')}${avisoGroup('Próximos', proximos, 'No hay próximos avisos con fecha.')}${avisoGroup('Sin fecha', sinFecha, 'No hay tareas sin fecha.')}`, 'avisos');
  } catch (e) {
    shell(`<section class="panel"><h2>Avisos</h2>${msg(e.message, 'error')}<button class="primary" onclick="formAviso()">Crear aviso</button></section>`, 'avisos');
  }
};
window.microfauna = function() { page('Microfauna', '<p>Seguimiento y densidad de cultivos vivos (Copepodos, Rotíferos, Phyto).</p>', 'microfauna'); };
function inventarioEstado(i) { const q = Number(i.quantity || 0), m = Number(i.min_stock || 0); const exp = i.expiry_date ? Math.ceil((new Date(i.expiry_date) - Date.now()) / 86400000) : 99999; if (exp < 0) return ['error', 'Caducado']; if (exp < 30) return ['notice', 'Caduca pronto']; if (m && q <= m) return ['notice', 'Stock bajo']; return ['success', 'OK']; }
function inventarioCard(i) { const st = inventarioEstado(i); const compra = [i.purchase_date, i.purchase_place, i.purchase_price ? `${i.purchase_price} €` : ''].filter(Boolean).join(' · '); const links = [i.manufacturer_url ? `<a href="${esc(i.manufacturer_url)}" target="_blank" rel="noopener">Fabricante</a>` : '', i.manual_url ? `<a href="${esc(i.manual_url)}" target="_blank" rel="noopener">Manual</a>` : '', i.source_url ? `<a href="${esc(i.source_url)}" target="_blank" rel="noopener">Compra</a>` : ''].filter(Boolean).join(' · '); return `<div class="item"><span class="${st[0]}">${esc(st[1])}</span><h3>${esc(i.name)}</h3><p class="small">${esc(i.category || 'Producto')} · ${esc(i.brand || '')}${i.model ? ' · ' + esc(i.model) : ''}</p><p><b>${esc(i.quantity ?? '-')} ${esc(i.unit || '')}</b> · mínimo ${esc(i.min_stock ?? '-')}</p><p>Caducidad: <b>${esc(i.expiry_date || 'Sin fecha')}</b>${i.warranty_until ? ` · Garantía: <b>${esc(i.warranty_until)}</b>` : ''}</p>${compra ? `<p class="small">Compra: ${esc(compra)}</p>` : ''}${i.item_status ? `<p class="small">Estado: ${esc(i.item_status)}</p>` : ''}${links ? `<p class="small">${links}</p>` : ''}${i.notes ? `<details><summary>Notas</summary><p>${esc(i.notes).replaceAll('\\n', '<br>')}</p></details>` : ''}</div>`; }
const inventarioApartados = [
  { key: 'equipo', title: 'Equipo', desc: 'Skimmer, luces, bombas, calentadores, filtros y reactores.', icon: '⚙️' },
  { key: 'productos', title: 'Productos y sales', desc: 'Sales, aditivos y consumibles.', icon: '🧂' },
  { key: 'tests', title: 'Tests', desc: 'Tests de NO3, PO4, KH, Ca, Mg, pH, salinidad y otros parametros.', icon: '🧪' },
  { key: 'medicamentos', title: 'Medicamentos', desc: 'Tratamientos, cuarentena, dosis y observaciones.', icon: '💊' },
  { key: 'fichas', title: 'Fichas biblioteca', desc: 'Fichas guardadas desde biblioteca para consultar o comprar.', icon: '□' },
  { key: 'otros', title: 'Otros', desc: 'Material sin clasificar o notas de almacén.', icon: '▤' }
];
function inventarioApartadoKey(i) {
  const c = String(i.category || '').toLowerCase();
  const text = `${c} ${String(i.name || '').toLowerCase()} ${String(i.notes || '').toLowerCase()}`;
  if (c.includes('equipo') || /skimmer|bomba|luz|pantalla|calentador|filtro|reactor/.test(text)) return 'equipo';
  if (c.includes('medic') || /medic|tratamiento|cuarentena|antibiot|parasit/.test(text)) return 'medicamentos';
  if (c.includes('ficha') || c.includes('biblioteca')) return 'fichas';
  if (c.includes('test') || /test|checker|fotometro|fotómetro|reactivo|hanna|salifert|jbl|sera|nyos|red sea|no3|nitrato|po4|fosfato|kh|dkh|calcio|magnesio|amoniaco|nitrito|ph | ph|salinidad|refractometro|refractómetro/.test(text)) return 'tests';
  if (c.includes('producto') || c.includes('sal') || c.includes('alimento') || /sal|aditivo|comida|alimento|resina|carbon|carbón|perlon|consumible/.test(text)) return 'productos';
  return 'otros';
}
function inventarioApartadosHtml(data) {
  return inventarioApartados.map(ap => {
    const items = data.filter(i => inventarioApartadoKey(i) === ap.key);
    const avisos = items.filter(i => inventarioEstado(i)[1] !== 'OK').length;
    return `<section class="panel"><div class="panel-head"><div><h2>${esc(ap.icon)} ${esc(ap.title)}</h2><p class="small">${esc(ap.desc)}</p></div><b>${items.length}</b></div>${avisos ? msg(`${avisos} aviso${avisos === 1 ? '' : 's'} en este apartado.`, 'notice') : ''}${items.map(inventarioCard).join('') || msg(`Sin elementos en ${ap.title.toLowerCase()}.`)}</section>`;
  }).join('');
}
window.formInventario = function() { shell(`<section class="panel"><button onclick="inventario()">← Volver</button><h2>Añadir al inventario</h2><p class="small">Estos campos alimentan los avisos y la API: compra, caducidad, garantía, precio, fabricante y stock.</p><label>Apartado</label><select id="invCategory"><option>Producto</option><option>Sal</option><option>Aditivo</option><option>Test</option><option>Alimento</option><option>Medicamento</option><option>Equipo</option><option>Consumible</option><option>Ficha biblioteca</option><option>Otro</option></select><label>Nombre</label><input id="invName" placeholder="Ej. Reef Salt, carbón activo, medicamento..."><label>Marca</label><input id="invBrand"><label>Modelo / formato</label><input id="invModel" placeholder="Ej. 20 kg, 500 ml, Checker HI..."><div class="form-grid"><div><label>Cantidad</label><input id="invQty" type="number" step="0.01" value="1"></div><div><label>Unidad</label><input id="invUnit" value="unidad"></div><div><label>Mínimo</label><input id="invMin" type="number" step="0.01" value="0"></div><div><label>Caducidad</label><input id="invExpiry" type="date"></div><div><label>Compra</label><input id="invPurchaseDate" type="date"></div><div><label>Precio</label><input id="invPrice" type="number" step="0.01"></div><div><label>Garantía hasta</label><input id="invWarranty" type="date"></div><div><label>Estado</label><select id="invStatus"><option value="disponible">Disponible</option><option value="en_uso">En uso</option><option value="agotado">Agotado</option><option value="retirado">Retirado</option></select></div></div><label>Tienda / proveedor</label><input id="invPlace" placeholder="Tienda local, web, particular..."><label>URL fabricante</label><input id="invManufacturerUrl" placeholder="https://..."><label>URL compra / fuente</label><input id="invSourceUrl" placeholder="https://..."><label>Manual / PDF</label><input id="invManualUrl" placeholder="https://..."><label>Notas</label><textarea id="invNotes" placeholder="Dosis, uso, compatibilidades, observaciones..."></textarea><button class="primary" onclick="saveInventarioItem()">Guardar</button><div id="x"></div></section>`, 'inicio'); };
window.saveInventarioItem = async function() { try { if (!state.user) throw new Error('Debes iniciar sesión.'); if (!val('invName')) throw new Error('Pon un nombre.'); const row = { user_id: state.user.id, name: val('invName'), brand: val('invBrand') || null, model: val('invModel') || null, category: val('invCategory') || 'Producto', quantity: num('invQty'), unit: val('invUnit') || 'unidad', min_stock: num('invMin'), expiry_date: val('invExpiry') || null, purchase_date: val('invPurchaseDate') || null, purchase_place: val('invPlace') || null, purchase_price: num('invPrice'), warranty_until: val('invWarranty') || null, manufacturer_url: val('invManufacturerUrl') || null, source_url: val('invSourceUrl') || null, manual_url: val('invManualUrl') || null, item_status: val('invStatus') || 'disponible', notes: val('invNotes') || null, ai_review_status: 'manual' }; const r = await s.from('inventory_items').insert(row); if (r.error) throw r.error; window.inventario(); } catch (e) { if ($('x')) $('x').innerHTML = msg(e.message, 'error'); } };
window.inventario = async function() { if (!state.user) return login(); try { shell(`<section class="panel"><h2>Inventario</h2>${msg('Cargando inventario...')}</section>`, 'inicio'); const r = await s.from('inventory_items').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(300); if (r.error) throw r.error; const data = r.data || []; const avisos = data.filter(x => inventarioEstado(x)[1] !== 'OK').length; shell(`<section class="summary-card"><div><small>Almacén global</small><h2>Inventario</h2><p>${data.length} productos · ${avisos} avisos</p></div><button onclick="formInventario()">+</button></section><section class="panel"><div class="panel-head"><div><h2>Apartados</h2><p class="small">Stock, caducidades, equipo y fichas separados por tipo.</p></div><button class="primary" onclick="formInventario()">Añadir</button></div></section>${inventarioApartadosHtml(data)}`, 'inicio'); } catch (e) { shell(`<section class="panel"><h2>Inventario</h2>${msg(e.message, 'error')}</section>`, 'inicio'); } };

// --- BLOQUE 13: ARRANQUE GLOBAL (BOOT) ---
async function boot() { try { const r = await s.auth.getSession(); state.user = r.data.session?.user || null; window.u = state.user; document.getElementById('logoutBtn')?.classList.toggle('hidden', !state.user); if (document.getElementById('logoutBtn')) document.getElementById('logoutBtn').onclick = async () => { await s.auth.signOut(); location.reload(); }; state.user ? dashboard() : login(); } catch (e) { render(msg(e.message, 'error')); } }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();

/* ==========================================================================
   OBJETO JSON: RANGOS DE CONTROL TÉCNICO (Referencia Cruzada de Parámetros)
   ========================================================================== */
window.ACUARIONEXO_RANGOS = {
  "reef": {
    "salinity": { "min": 1024, "max": 1026, "unit": "sg" },
    "temperature": { "min": 24.0, "max": 26.0, "unit": "°C" },
    "ph": { "min": 8.1, "max": 8.4, "unit": "pH" },
    "kh": { "min": 7.0, "max": 8.5, "unit": "dKH" },
    "calcium": { "min": 410, "max": 440, "unit": "mg/L" },
    "magnesium": { "min": 1280, "max": 1350, "unit": "mg/L" },
    "phosphate": { "min": 0.02, "max": 0.08, "unit": "mg/L" },
    "nitrate": { "min": 2.0, "max": 10.0, "unit": "mg/L" }
  },
  "freshwater": {
    "temperature": { "min": 22.0, "max": 26.0, "unit": "°C" },
    "ph": { "min": 6.5, "max": 7.5, "unit": "pH" },
    "kh": { "min": 3.0, "max": 6.0, "unit": "dKH" },
    "gh": { "min": 4.0, "max": 10.0, "unit": "dGH" },
    "nitrate": { "min": 0.0, "max": 20.0, "unit": "mg/L" }
  }
};
