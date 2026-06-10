/* ==================================================================================================
   AcuarioNexo · NÚCLEO LIMPIO REAL · DASHBOARD MAESTRO
   ================================================================================================== */

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
document.getElementById('refreshAppBtn')?.addEventListener('click', () => location.reload());

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
  return `<section class="tank-head"><button onclick="dashboard()">←</button><div><h2>${esc(aq.name)}</h2><p>${esc(liters)} L · ${esc(labelType)}</p></div></section><nav class="tank-tabs">${aqChip('resumen', 'Resumen')}${aqChip('parametros', 'Parámetros')}${aqChip('animales', 'Animales')}${aqChip('fotos', 'Fotos')}${aqChip('tareas', 'Tareas')}${aqChip('historial', 'Historial')}</nav>`;
};

window.openAqSection = function(section) {
  setAqSection(section);
  if (section === 'resumen') return window.panel();
  if (section === 'parametros') return window.pars ? window.pars() : window.panel();
  if (section === 'animales') return window.anis();
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
async function loadAquariums() { const { data, error } = await s.from('aquariums').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }); if (error) throw error; state.aquariums = data || []; return state.aquariums; }
function aquariumIcon(a) { return a.aquarium_type === 'freshwater' ? '🌿' : (a.aquarium_type === 'hospital' || a.aquarium_type === 'quarantine' ? '🏥' : '🐠'); }
function aquariumCard(a) { const liters = a.real_liters ?? a.liters ?? '-'; return `<article class="tank-card" onclick="openA('${a.id}')"><div class="tank-art">${aquariumIcon(a)}</div><div class="tank-info"><h3>${esc(a.name)}</h3><p>${esc(a.aquarium_type || 'Acuario')}${a.subtype ? ' · ' + esc(a.subtype) : ''}</p><span>${esc(liters)} L</span></div><b>›</b></article>`; }

window.dashboard = async function() {
  if (!state.user) return login();
  try { const list = await loadAquariums(); shell(`<section class="summary-card"><div><small>AcuarioNexo</small><h2>Mis acuarios</h2><p>${list.length} sistemas activos bajo control</p></div><button onclick="formA()">+</button></section><section class="panel"><div class="panel-head"><h2>Acuarios</h2><button onclick="formA()">Nuevo</button></div><div class="tank-list">${list.map(aquariumCard).join('') || '<p class="small">Sin acuarios todavía.</p>'}</div></section>`, 'inicio'); }
  catch (e) { render(msg(e.message, 'error')); }
};
window.acs = window.dashboard; window.home = window.dashboard; window.menu = () => '';

window.formA = function(a = {}) { render(`<section class="panel"><button onclick="dashboard()">← Volver</button><h2>${a.id ? 'Editar' : 'Nuevo'} acuario</h2><label>Nombre</label><input id="name" value="${esc(a.name ||'')}"><label>Tipo</label><select id="type"><option value="reef" ${a.aquarium_type === 'reef' ? 'selected' : ''}>Reef</option><option value="marine" ${a.aquarium_type === 'marine' ? 'selected' : ''}>Marino</option><option value="freshwater" ${a.aquarium_type === 'freshwater' ? 'selected' : ''}>Dulce</option><option value="hospital" ${a.aquarium_type === 'hospital' ? 'selected' : ''}>Hospital</option><option value="quarantine" ${a.aquarium_type === 'quarantine' ? 'selected' : ''}>Cuarentena</option><option value="other" ${a.aquarium_type === 'other' ? 'selected' : ''}>Otro</option></select><label>Subtipo</label><input id="sub" value="${esc(a.subtype || '')}"><label>Descripción</label><textarea id="des">${esc(a.description || '')}</textarea><div class="form-grid"><div><label>Largo</label><input id="l" type="number" value="${esc(a.tank_length_cm || '')}" oninput="calc()"></div><div><label>Ancho</label><input id="w" type="number" value="${esc(a.tank_width_cm || '')}" oninput="calc()"></div><div><label>Alto agua</label><input id="h" type="number" value="${esc(a.display_water_height_cm || '')}" oninput="calc()"></div><div><label>Sump largo</label><input id="sl" type="number" value="${esc(a.sump_length_cm || '')}" oninput="calc()"></div><div><label>Sump ancho</label><input id="sw" type="number" value="${esc(a.sump_width_cm || '')}" oninput="calc()"></div><div><label>Sump alto</label><input id="sh" type="number" value="${esc(a.sump_height_cm || '')}" oninput="calc()"></div></div><div id="cal">${msg('Introduce medidas')}</div><button class="primary" onclick="saveA('${a.id || ''}')">Guardar</button><div id="x"></div></section>`); };
window.saveA = async function(id = '') {
  try { const tank = calcLiters(val('l'), val('w'), val('h')); const sump = calcLiters(val('sl'), val('sw'), val('sh')); const total = Math.round(((tank || 0) + (sump || 0)) * 100) / 100; const row = { user_id: state.user.id, name: val('name'), aquarium_type: val('type'), subtype: val('sub'), status: 'active', description: val('des'), tank_length_cm: num('l'), tank_width_cm: num('w'), display_water_height_cm: num('h'), sump_length_cm: num('sl'), sump_width_cm: num('sw'), sump_height_cm: num('sh'), real_liters: total || tank, liters: total || tank, ai_summary: 'Pendiente IA' }; const r = id ? await s.from('aquariums').update(row).eq('id', id) : await s.from('aquariums').insert(row); if (r.error) throw r.error; if (id && window.q?.id === id) { state.aquarium = { ...window.q, ...row, id }; window.q = state.aquarium; return panel(); } dashboard(); }
  catch (e) { $('x').innerHTML = msg(e.message, 'error'); }
};
window.editA = async function(id) { const { data, error } = await s.from('aquariums').select('*').eq('id', id).single(); if (error) return alert(error.message); formA(data); };
window.deleteA = async function(id) { if (!confirm('¿Borrar este acuario?')) return; const { error } = await s.from('aquariums').delete().eq('id', id); if (error) return alert(error.message); dashboard(); };
window.openA = async function(id) { const { data, error } = await s.from('aquariums').select('*').eq('id', id).single(); if (error) return render(msg(error.message, 'error')); state.aquarium = data; window.q = data; window.panel(); };

window.panel = function() { setAqSection('resumen'); shell(am('resumen') + `<section class="panel"><div class="panel-head"><h2>Ficha actual</h2><button onclick="editA('${window.q?.id || ''}')">Editar</button></div><p>Todo lo que guardes aquí pertenece a <b>${esc(window.q?.name || 'este acuario')}</b>.</p><div class="quick-actions"><button onclick="editA('${window.q?.id || ''}')"><span>✎</span>Datos</button><button onclick="formEquipoAcuario()"><span>⚙️</span>Equipo</button><button onclick="openAqSection('parametros')"><span>🧪</span>Parámetros</button><button onclick="openAqSection('animales')"><span>🐟</span>Animales</button><button onclick="openAqSection('fotos')"><span>📷</span>Fotos</button><button onclick="openAqSection('tareas')"><span>♢</span>Tareas</button><button onclick="inventario()"><span>▤</span>Inventario</button></div>${window.q?.description ? `<p>${esc(window.q.description)}</p>` : ''}</section>`, 'acuarios'); };
window.formEquipoAcuario = function() { shell(window.am('resumen') + `<section class="panel"><button onclick="panel()">← Volver</button><h2>Añadir equipo</h2><p class="small">Guarda aquí el equipo real de este acuario con datos útiles para garantía, mantenimiento y API.</p><label>Tipo</label><select id="eqType"><option>Skimmer</option><option>Luz</option><option>Bomba de subida</option><option>Bomba de movimiento</option><option>Calentador</option><option>Filtro</option><option>Reactor</option><option>Otro equipo</option></select><label>Nombre</label><input id="eqName" placeholder="Ej. Skimmer principal"><label>Marca</label><input id="eqBrand" placeholder="Ej. Bubble Magus"><label>Modelo</label><input id="eqModel" placeholder="Ej. Curve 5"><div class="form-grid"><div><label>Cantidad</label><input id="eqQty" type="number" step="1" value="1"></div><div><label>Estado</label><select id="eqStatus"><option value="en_uso">En uso</option><option value="repuesto">Repuesto</option><option value="retirado">Retirado</option></select></div><div><label>Compra</label><input id="eqPurchaseDate" type="date"></div><div><label>Garantía hasta</label><input id="eqWarranty" type="date"></div><div><label>Precio</label><input id="eqPrice" type="number" step="0.01"></div><div><label>Tienda</label><input id="eqPlace" placeholder="Tienda o web"></div></div><label>URL fabricante</label><input id="eqManufacturerUrl" placeholder="https://..."><label>Manual / PDF</label><input id="eqManualUrl" placeholder="https://..."><label>Notas</label><textarea id="eqNotes" placeholder="Potencia, litros recomendados, mantenimiento, repuestos..."></textarea><button class="primary" onclick="saveEquipoAcuario()">Guardar equipo</button><div id="x"></div></section>`, 'acuarios'); };
window.saveEquipoAcuario = async function() { try { if (!state.user) throw new Error('Debes iniciar sesión.'); if (!window.q) throw new Error('Abre un acuario primero.'); const name = val('eqName') || val('eqType'); const notes = [`Acuario: ${window.q.name}`, `Tipo: ${val('eqType')}`, val('eqNotes')].filter(Boolean).join('\n'); const row = { user_id: state.user.id, aquarium_id: window.q.id, name, brand: val('eqBrand') || null, model: val('eqModel') || null, category: 'Equipo', quantity: Number(val('eqQty') || 1), unit: 'unidad', min_stock: 0, expiry_date: null, purchase_date: val('eqPurchaseDate') || null, purchase_place: val('eqPlace') || null, purchase_price: num('eqPrice'), warranty_until: val('eqWarranty') || null, manufacturer_url: val('eqManufacturerUrl') || null, manual_url: val('eqManualUrl') || null, item_status: val('eqStatus') || 'en_uso', notes, ai_review_status: 'manual' }; const r = await s.from('inventory_items').insert(row); if (r.error) throw r.error; $('x').innerHTML = `<div class="success">Equipo guardado en inventario.</div><button onclick="inventario()">Ver inventario</button>`; } catch (e) { $('x').innerHTML = msg(e.message, 'error'); } };

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
function animalCard(a) { const buy = [a.acquired_at || [a.acquisition_year, a.acquisition_month, a.acquisition_day].filter(Boolean).join('-'), a.purchase_place || a.origin, a.purchase_price ? `${a.purchase_price} €` : ''].filter(Boolean).join(' · '); return `<div class="item">${a.photo_url ? `<img src="${esc(a.photo_url)}" style="width:100%;max-height:170px;object-fit:cover;border-radius:14px;margin-bottom:8px">` : ''}<b>${esc(a.common_name)}</b><p>${esc(a.scientific_name || '')}</p><p class="small">${esc(catEs(a.category))} · ${esc(a.status || 'active')} · Cantidad ${esc(a.quantity || 1)}</p>${buy ? `<p class="small">Alta/compra: ${esc(buy)}</p>` : ''}${a.death_date ? `<p class="error">Baja: ${esc(a.death_date)}${a.loss_reason ? ' · ' + esc(a.loss_reason) : ''}</p>` : ''}${a.notes ? `<p>${esc(a.notes)}</p>` : ''}<div class="quick-actions"><button onclick="editAnimal('${a.id}')">Editar</button><button onclick="deleteAnimal('${a.id}')">Eliminar</button></div></div>`; }

window.anis = async function() { setAqSection('animales'); try { const { data, error } = await s.from('animals').select('*').eq('aquarium_id', window.q.id).order('created_at', { ascending: false }); if (error) throw error; shell(am('animales') + `<section class="panel"><div class="panel-head"><h2>Animales</h2><button onclick="animalMenu()">Añadir</button></div>${(data || []).map(animalCard).join('') || msg('Sin animales en este acuario')}</section>`, 'acuarios'); } catch (e) { shell(am('animales') + `<section class="panel"><h2>Animales</h2>${msg(e.message, 'error')}</section>`, 'acuarios'); } };
window.animalMenu = function() { setAqSection('animales'); shell(am('animales') + `<section class="panel"><button onclick="anis()">← Volver</button><h2>Añadir animal</h2><div class="quick-actions"><button onclick="buscarAnimalBiblioteca()"><span>📚</span>Desde biblioteca</button><button onclick="formAnimalManual()"><span>✍️</span>Manual</button></div></section>`, 'acuarios'); };
function animalFields(a = {}) { const acquired = a.acquired_at || (a.acquisition_year ? `${a.acquisition_year}-${String(a.acquisition_month || 1).padStart(2, '0')}-${String(a.acquisition_day || 1).padStart(2, '0')}` : ''); return `<label>Nombre común</label><input id="anName" value="${esc(a.common_name || a.title || '')}"><label>Nombre científico</label><input id="anSci" value="${esc(a.scientific_name || '')}"><label>Tipo</label><select id="anCat"><option value="fish" ${a.category === 'fish' ? 'selected' : ''}>Pez</option><option value="coral" ${a.category === 'coral' ? 'selected' : ''}>Coral</option><option value="invertebrate" ${a.category === 'invertebrate' ? 'selected' : ''}>Invertebrado</option><option value="crustacean" ${a.category === 'crustacean' ? 'selected' : ''}>Crustáceo</option><option value="mollusk" ${a.category === 'mollusk' ? 'selected' : ''}>Molusco</option><option value="plant" ${a.category === 'plant' ? 'selected' : ''}>Planta</option><option value="other" ${!a.category || a.category === 'other' ? 'selected' : ''}>Otro</option></select><div class="form-grid"><div><label>Cantidad</label><input id="anQty" type="number" min="1" value="${esc(a.quantity || 1)}"></div><div><label>Estado</label><select id="anStatus"><option value="active" ${a.status === 'active' ? 'selected' : ''}>Vivo / activo</option><option value="quarantine" ${a.status === 'quarantine' ? 'selected' : ''}>Cuarentena</option><option value="hospital" ${a.status === 'hospital' ? 'selected' : ''}>Hospital</option><option value="deceased" ${a.status === 'deceased' ? 'selected' : ''}>Baja</option><option value="archived" ${a.status === 'archived' ? 'selected' : ''}>Archivado</option></select></div><div><label>Alta / compra</label><input id="anAcquired" type="date" value="${esc(acquired)}"></div><div><label>Tienda / origen</label><input id="anPlace" value="${esc(a.purchase_place || a.origin || '')}" placeholder="Tienda, particular, esqueje..."></div><div><label>Precio</label><input id="anPrice" type="number" step="0.01" value="${esc(a.purchase_price || '')}"></div><div><label>Fecha baja</label><input id="anDeathDate" type="date" value="${esc(a.death_date || '')}"></div></div><label>Motivo de baja</label><input id="anLossReason" value="${esc(a.loss_reason || '')}" placeholder="Salto, enfermedad, agresión, traslado..."><label>Foto desde cámara</label><input id="anCam" type="file" accept="image/*" capture="environment"><label>Foto desde galería</label><input id="anGal" type="file" accept="image/*"><label>Notas</label><textarea id="anNotes">${esc(a.notes || a.description || '')}</textarea><input id="anPhotoUrl" type="hidden" value="${esc(a.photo_url || '')}">`; }
window.formAnimalManual = function() { setAqSection('animales'); shell(am('animales') + `<section class="panel"><button onclick="animalMenu()">← Volver</button><h2>Animal manual</h2>${animalFields()}<button class="primary" onclick="saveAnimal()">Guardar animal</button><div id="x"></div></section>`, 'acuarios'); };
window.buscarAnimalBiblioteca = function() { setAqSection('animales'); shell(am('animales') + `<section class="panel"><button onclick="animalMenu()">← Volver</button><h2>Desde biblioteca</h2><label>Buscar ficha</label><input id="libQ" placeholder="Ej. gramma, ocellaris, euphyllia"><button class="primary" onclick="buscarAnimalBibliotecaResultados()">Buscar</button><div id="libRes"></div></section>`, 'acuarios'); };
async function searchLibrary(qv) { try { const r = await s.from('library_entries').select('*').or(`title.ilike.%${qv}%,scientific_name.ilike.%${qv}%`).limit(20); if (r.error) return []; return (r.data || []).map(normLib); } catch (e) { return []; } }
window.buscarAnimalBibliotecaResultados = async function() { try { const qv = val('libQ'); if (!qv) throw new Error('Escribe algo para buscar.'); const data = await searchLibrary(qv); $('libRes').innerHTML = data.map((x, i) => `<div class="item"><b>${esc(x.title)}</b><p>${esc(x.scientific_name)}</p><p class="small">${esc(catEs(x.category))}</p><button onclick='importarAnimalBiblioteca(${JSON.stringify(x).replace(/'/g, "&#039;")})'>Usar esta ficha</button></div>`).join('') || msg('No encontré fichas. Puedes añadirlo manualmente.'); } catch (e) { $('libRes').innerHTML = msg(e.message, 'error'); } };
window.importarAnimalBiblioteca = function(x) { const a = normLib(x); setAqSection('animales'); shell(am('animales') + `<section class="panel"><button onclick="buscarAnimalBiblioteca()">← Volver</button><h2>Importar ficha</h2>${animalFields({ common_name: a.title, scientific_name: a.scientific_name, category: a.category, photo_url: a.photo_url, notes: a.description })}<button class="primary" onclick="saveAnimal()">Guardar en ${esc(window.q.name)}</button><div id="x"></div></section>`, 'acuarios'); };

async function uploadAnimalPhoto() { const f = ($('anCam')?.files?.[0]) || ($('anGal')?.files?.[0]); if (!f) return val('anPhotoUrl') || null; const ext = (f.name.split('.').pop() || 'jpg').toLowerCase(); const path = `animals/${state.user.id}/${window.q.id}/${Date.now()}.${ext}`; for (const b of ['aquarium-photos', 'photos', 'animal-photos']) { const up = await s.storage.from(b).upload(path, f, { upsert: true, contentType: f.type || 'image/jpeg' }); if (!up.error) return s.storage.from(b).getPublicUrl(path).data.publicUrl; } throw new Error('No se pudo subir la foto.'); }
window.saveAnimal = async function(id = '') { try { const name = val('anName'); if (!name) throw new Error('Pon el nombre del animal.'); const d = val('anAcquired') ? new Date(val('anAcquired')) : null; const row = { user_id: state.user.id, aquarium_id: window.q.id, common_name: name, scientific_name: val('anSci') || null, category: val('anCat') || 'other', quantity: Number(val('anQty') || 1), acquisition_day: d ? d.getDate() : null, acquisition_month: d ? d.getMonth() + 1 : null, acquisition_year: d ? d.getFullYear() : null, acquired_at: val('anAcquired') || null, origin: val('anPlace') || null, purchase_place: val('anPlace') || null, purchase_price: num('anPrice'), death_date: val('anDeathDate') || null, loss_reason: val('anLossReason') || null, status: val('anStatus') || 'active', photo_url: await uploadAnimalPhoto(), notes: val('anNotes') || null }; const r = id ? await s.from('animals').update(row).eq('id', id) : await s.from('animals').insert(row); if (r.error) throw r.error; anis(); } catch (e) { $('x').innerHTML = msg(e.message, 'error'); } };
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
  { key: 'fish_marine', label: 'Peces marinos', desc: 'Fichas de peces marinos, comportamiento, alimentacion y compatibilidad.', icon: '🐠' },
  { key: 'fish_freshwater', label: 'Peces de agua dulce', desc: 'Fichas de dulce por especie y variedad.', icon: '🐟' },
  { key: 'coral', label: 'Corales', desc: 'SPS, LPS, blandos, ubicacion, luz, flujo y cuidados.', icon: '🪸' },
  { key: 'invertebrate', label: 'Invertebrados', desc: 'Gambas, caracoles, cangrejos, estrellas y otros invertebrados.', icon: '🦐' },
  { key: 'plant', label: 'Plantas y algas', desc: 'Plantas de dulce, macroalgas y algas utiles o problematicas.', icon: '🌿' },
  { key: 'microfauna', label: 'Microfauna', desc: 'Copepodos, rotiferos, artemia, fitoplancton e infusorios.', icon: '∞' },
  { key: 'medicine', label: 'Medicamentos', desc: 'Tratamientos, cuarentena, dosis y observaciones.', icon: '💊' },
  { key: 'product', label: 'Productos y sales', desc: 'Sales, aditivos, tests, alimentos y consumibles.', icon: '🧂' },
  { key: 'equipment', label: 'Equipamiento', desc: 'Bombas, luces, skimmer, filtros, calentadores y material tecnico.', icon: '⚙️' }
];
function bibliotecaModulo(f) { const k = String(f?.categoria || '').toLowerCase(); const t = String([f?.nombre, f?.cientifico, f?.descripcion].filter(Boolean).join(' ')).toLowerCase(); if (k.includes('coral')) return 'coral'; if (k.includes('fresh') || k.includes('dulce')) return 'fish_freshwater'; if (k.includes('fish') || k.includes('pez') || k.includes('peces') || k.includes('marino') || t.includes('marin') || t.includes('arrecife')) return 'fish_marine'; if (k.includes('invert') || k.includes('crust') || k.includes('molus')) return 'invertebrate'; if (k.includes('plant') || k.includes('alga')) return 'plant'; if (k.includes('micro')) return 'microfauna'; if (k.includes('medic')) return 'medicine'; if (k.includes('equip')) return 'equipment'; if (k.includes('product') || k.includes('producto') || k.includes('sal') || k.includes('test') || k.includes('alimento')) return 'product'; return 'general'; }
function bibliotecaModuloLabel(key) { return (bibliotecaModulos.find(m => m.key === key)?.label) || 'General'; }
function bibliotecaNorm(x) { return { nombre: x.title || x.nombre || x.nombre_comun || x.common_name || x.nombre_cientifico || x.scientific_name || 'Ficha sin nombre', cientifico: x.scientific_name || x.nombre_cientifico || x.scientific || '', categoria: x.category || x.tipo || x.tipo_ficha || x.grupo || x.seccion || 'fish', foto: x.photo_url || x.foto_url || x.foto || x.imagen || x.image_url || x.url_foto || '', descripcion: x.resumen_rapido || x.resumen || x.description || x.descripcion || x.descripcion_detallada || x.notes || '', raw: x }; }
async function bibliotecaTabla(tabla, texto) { try { let q = s.from('library_entries').select('*').limit(60); if (texto) q = q.or('title.ilike.%' + texto + '%,scientific_name.ilike.%' + texto + '%,description.ilike.%' + texto + '%'); const r = await q; return r.error || !Array.isArray(r.data) ? [] : r.data.map(bibliotecaNorm); } catch (e) { return []; } }
async function bibliotecaDatos(texto) { const rows = await bibliotecaTabla('library_entries', texto); const map = new Map(); rows.forEach(f => { const key = (f.nombre + '|' + f.cientifico).toLowerCase(); if (!map.has(key)) map.set(key, f); }); return Array.from(map.values()); }
function bibliotecaCard(f, i) { const resumen = bibliotecaResumen(f); return `<article class="library-card" onclick="verFichaBiblioteca(${i})">${f.foto ? `<img src="${esc(f.foto)}" alt="${esc(f.nombre)}" loading="lazy">` : '<div class="library-no-photo">🐠</div>'}<div class="library-card-body"><small>${esc(bibliotecaModuloLabel(bibliotecaModulo(f)))}</small><h3>${esc(f.nombre)}</h3>${f.cientifico ? `<p class="scientific">${esc(f.cientifico)}</p>` : ''}${resumen ? `<p>${esc(resumen).slice(0, 180)}${String(resumen).length > 180 ? '…' : ''}</p>` : ''}${window.q ? `<button onclick='event.stopPropagation();importarAnimalBiblioteca(${JSON.stringify(f.raw).replace(/'/g, '&#039;')})'>Añadir a ${esc(window.q.name || 'mi acuario')}</button>` : ''}</div></article>`; }
function bibliotecaModulosHtml(lista) { const mods = bibliotecaModulos.map(m => ({ ...m, n: lista.filter(f => bibliotecaModulo(f) === m.key).length })).filter(m => m.n > 0); return mods.length ? `<div class="library-modules">${mods.map(m => `<button onclick="filtrarBibliotecaModulo('${esc(m.key)}')"><b>${esc(m.icon)} ${m.n}</b><span>${esc(m.label)}</span><small>${esc(m.desc)}</small></button>`).join('')}</div>` : ''; }
window.renderBibliotecaLista = function(lista, modulo) { const cont = $('bibliotecaResultados'); if (!cont) return; const filtrada = modulo ? lista.filter(f => bibliotecaModulo(f) === modulo) : lista; window.__bibliotecaListaActual = lista; window.__bibliotecaVistaActual = filtrada; cont.innerHTML = bibliotecaModulosHtml(lista) + `<div class="library-section-title"><h3>${esc(modulo ? bibliotecaModuloLabel(modulo) : 'Fichas disponibles')}</h3><p class="small">${filtrada.length} fichas encontradas.</p></div>` + (filtrada.length ? `<div class="library-grid">${filtrada.map(bibliotecaCard).join('')}</div>` : msg('No encontré fichas con esa búsqueda o módulo.')); };
window.filtrarBibliotecaModulo = function(modulo) { window.renderBibliotecaLista(window.__bibliotecaListaActual || [], modulo); };
window.buscarBibliotecaReal = async function() { const texto = val('bibliotecaSearch'); const cont = $('bibliotecaResultados'); if (cont) cont.innerHTML = msg('Cargando biblioteca desde Supabase...'); window.renderBibliotecaLista(await bibliotecaDatos(texto), null); };
window.biblioteca = async function() { shell(`<section class="panel library-panel"><div class="panel-head"><div><h2>Biblioteca</h2><p class="small">Fichas reales guardadas en Supabase, separadas por módulos.</p></div></div><div class="library-search"><input id="bibliotecaSearch" placeholder="Buscar pez, coral, invertebrado, producto..."><button class="primary" onclick="buscarBibliotecaReal()">Buscar</button></div><div id="bibliotecaResultados">${msg('Cargando biblioteca desde Supabase...')}</div></section>`, 'biblioteca'); await window.buscarBibliotecaReal(); };
function bibliotecaClave(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ''); }
function bibliotecaValor(v) { if (v == null || v === '') return ''; if (Array.isArray(v)) return v.map(bibliotecaValor).filter(Boolean).join('\n'); if (typeof v === 'object') return bibliotecaValor(v.texto || v.text || v.contenido || v.content || v.valor || v.value || v.descripcion || v.description || ''); return String(v); }
function bibliotecaCampoDeObjeto(obj, keys) { if (!obj || typeof obj !== 'object') return ''; const wanted = keys.map(bibliotecaClave); for (const [k, v] of Object.entries(obj)) { if (wanted.includes(bibliotecaClave(k))) { const out = bibliotecaValor(v).trim(); if (out) return out; } } return ''; }
function bibliotecaCampoDeArray(arr, keys) { if (!Array.isArray(arr)) return ''; const wanted = keys.map(bibliotecaClave); for (const item of arr) { if (!item || typeof item !== 'object') continue; const title = item.titulo || item.title || item.nombre || item.name || item.key || item.id || item.label || item.apartado || item.modulo || item.seccion; if (!wanted.includes(bibliotecaClave(title))) continue; const out = bibliotecaValor(item).trim(); if (out) return out; } return ''; }
function bibliotecaCampo(f, keys) { const raw = f.raw || {}; const pools = [raw, raw.apartados, raw.bloques, raw.modulos, raw.modules, raw.sections, raw.secciones, raw.data, raw.ficha, raw.ficha_normalizada, raw.fichaNormalizada].filter(Boolean); for (const p of pools) { const out = Array.isArray(p) ? bibliotecaCampoDeArray(p, keys) : bibliotecaCampoDeObjeto(p, keys); if (out) return out; } return ''; }
function bibliotecaResumen(f) { return bibliotecaCampo(f, ['resumen_rapido', 'resumenRapido', 'resumen', 'summary', 'description', 'descripcion', 'descripcion_detallada']) || f.descripcion || ''; }
const bibliotecaSeccionesFicha = [
  ['Resumen rápido', ['resumen_rapido', 'resumenRapido', 'resumen', 'summary', 'description', 'descripcion']],
  ['Identificación', ['identificacion', 'identification', 'taxonomia', 'taxonomy']],
  ['Hábitat natural', ['habitat_natural', 'habitatNatural', 'habitat', 'natural_habitat']],
  ['Acuario recomendado', ['acuario_recomendado', 'acuarioRecomendado', 'aquarium_recommended', 'tank', 'acuario']],
  ['Parámetros', ['parametros', 'parameters', 'parametros_agua', 'water_parameters']],
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
  if (title === 'Identificación') return [`Nombre común: ${f.nombre}`, f.cientifico ? `Nombre científico: ${f.cientifico}` : '', raw.category ? `Categoría: ${bibliotecaModuloLabel(bibliotecaModulo(f))}` : '', raw.care_level ? `Dificultad: ${raw.care_level}` : ''].filter(Boolean).join('\n');
  if (title === 'Acuario recomendado') return [raw.min_tank_liters ? `Litros mínimos: ${raw.min_tank_liters} L` : '', raw.aquarium_zone ? `Zona: ${raw.aquarium_zone}` : ''].filter(Boolean).join('\n');
  if (title === 'Parámetros') return bibliotecaValor(raw.parameters).trim();
  if (title === 'Comportamiento') return raw.temperament || '';
  if (title === 'Alimentación') return raw.feeding || raw.diet || '';
  if (title === 'Compatibilidad') return raw.compatibility || '';
  if (title === 'Reef Safe') return raw.reef_safe != null ? String(raw.reef_safe) : '';
  if (title === 'Fuentes') return [raw.references_text, raw.source_url ? `Fuente interna: ${raw.source_url}` : ''].filter(Boolean).join('\n');
  return '';
}
function bibliotecaSeccionesHtml(f) { return bibliotecaSeccionesFicha.map(([title, keys], idx) => { const text = bibliotecaCampo(f, keys) || bibliotecaTextoDerivado(f, title); const body = text ? `<p>${esc(text).replaceAll('\n', '<br>')}</p>` : `<p class="small">Pendiente de completar en la ficha original.</p>`; return `<details class="library-detail-section" ${idx === 0 ? 'open' : ''}><summary>${esc(title)}</summary>${body}</details>`; }).join(''); }
function bibliotecaNotasInventario(f) { return bibliotecaSeccionesFicha.map(([title, keys]) => { const text = bibliotecaCampo(f, keys); return text ? `${title}: ${text}` : ''; }).filter(Boolean).join('\n\n') || f.descripcion || ''; }
function bibliotecaCategoriaInventario(f) { const m = bibliotecaModulo(f); if (m === 'medicine') return 'Medicamento'; if (m === 'equipment') return 'Equipo'; if (m === 'product') return 'Producto'; if (m.includes('fish') || ['coral', 'invertebrate', 'plant', 'microfauna'].includes(m)) return 'Ficha biblioteca'; return 'Producto'; }
window.guardarFichaInventario = async function(i) { const f = (window.__bibliotecaVistaActual || [])[i]; if (!f) return; try { if (!state.user) throw new Error('Debes iniciar sesión.'); const row = { user_id: state.user.id, name: f.nombre, brand: f.cientifico || null, category: bibliotecaCategoriaInventario(f), quantity: 1, unit: 'unidad', min_stock: 0, expiry_date: null, notes: bibliotecaNotasInventario(f), ai_review_status: 'biblioteca' }; const r = await s.from('inventory_items').insert(row); if (r.error) throw r.error; const x = $('x'); if (x) x.innerHTML = `<div class="success">Ficha guardada en inventario.</div><button onclick="inventario()">Ver inventario</button>`; } catch (e) { const x = $('x'); if (x) x.innerHTML = msg(e.message, 'error'); } };
window.verFichaBiblioteca = function(i) { const f = (window.__bibliotecaVistaActual || [])[i]; if (!f) return; shell(`<section class="panel library-detail"><button onclick="biblioteca()">← Volver</button>${f.foto ? `<img class="library-detail-photo" src="${esc(f.foto)}" alt="${esc(f.nombre)}">` : ''}<p class="small">${esc(bibliotecaModuloLabel(bibliotecaModulo(f)))}</p><h2>${esc(f.nombre)}</h2>${f.cientifico ? `<p class="scientific">${esc(f.cientifico)}</p>` : ''}<div class="quick-actions"><button onclick="guardarFichaInventario(${i})"><span>▤</span>Guardar en inventario</button>${window.q ? `<button onclick='importarAnimalBiblioteca(${JSON.stringify(f.raw).replace(/'/g, '&#039;')})'><span>＋</span>Añadir a ${esc(window.q.name || 'mi acuario')}</button>` : ''}</div><div id="x"></div>${bibliotecaSeccionesHtml(f)}</section>`, 'biblioteca'); };
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
async function readAvisosOpcional(tabla, select, dateField, mapper, warnings) {
  try {
    let q = s.from(tabla).select(select).eq('user_id', state.user.id).not(dateField, 'is', null).order(dateField, { ascending: true }).limit(80);
    const r = await q;
    if (r.error) { warnings.push(`No pude leer ${tabla}: ${r.error.message}`); return []; }
    return (r.data || []).map(mapper);
  } catch (e) { warnings.push(`No pude leer ${tabla}: ${e.message}`); return []; }
}
window.tareas = async function() {
  if (!state.user) return login();
  await loadAquariums().catch(() => {});
  shell(`<section class="panel"><h2>Avisos</h2>${msg('Cargando avisos reales...')}</section>`, 'avisos');
  const warnings = [];
  const avisos = [];
  try {
    const tasksR = await s.from('tasks').select('id,title,task_type,aquarium_id,due_at,priority,status,notes').eq('user_id', state.user.id).order('due_at', { ascending: true, nullsFirst: false }).limit(120);
    if (tasksR.error) warnings.push(`No pude leer tasks: ${tasksR.error.message}`);
    else (tasksR.data || []).filter(avisoAbierto).map(mapTaskAviso).forEach(a => avisos.push(a));
    (await readAvisosOpcional('maintenance_events', 'title,event_type,aquarium_id,next_due_at,notes', 'next_due_at', mapMaintenanceAviso, warnings)).forEach(a => avisos.push(a));
    (await readAvisosOpcional('microfauna_cultures', 'name,culture_type,aquarium_id,next_action_at,notes', 'next_action_at', mapMicrofaunaAviso, warnings)).forEach(a => avisos.push(a));
    avisos.forEach(a => a.bucket = avisoBucket(a));
    avisos.sort((a,b) => new Date(a.date || '2999-12-31') - new Date(b.date || '2999-12-31'));
    const vencidos = avisos.filter(a => a.bucket === 'vencidos'), hoy = avisos.filter(a => a.bucket === 'hoy'), proximos = avisos.filter(a => a.bucket === 'proximos'), sin = avisos.filter(a => a.bucket === 'sin_fecha');
    shell(`<section class="summary-card"><div><small>Avisos reales</small><h2>${avisos.length} activos</h2><p>${vencidos.length} vencidos · ${hoy.length} hoy · ${proximos.length} próximos</p></div><button onclick="dashboard()">⌂</button></section>${warnings.length ? `<section class="panel">${warnings.map(w => msg(w,'notice')).join('')}</section>` : ''}${avisoGroup('Vencidos', vencidos, 'No hay avisos vencidos.')}${avisoGroup('Hoy', hoy, 'No hay avisos para hoy.')}${avisoGroup('Próximos', proximos, 'No hay avisos próximos.')}${avisoGroup('Sin fecha', sin, 'No hay avisos sin fecha.')}`, 'avisos');
  } catch (e) { page('Avisos', msg(e.message, 'error'), 'avisos'); }
};
window.completeTask = async function(id) { const r = await s.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id); if (r.error) return alert(r.error.message); tareas(); };
window.inventario = async function() { try { const r = await s.from('inventory_items').select('*').eq('user_id', state.user.id).order('created_at', { ascending:false }).limit(100); if (r.error) throw r.error; page('Inventario', `<button onclick="panel()">← Volver</button>${(r.data||[]).map(i=>`<div class="item"><b>${esc(i.name)}</b><p class="small">${esc(i.category||'')} · ${esc(i.brand||'')} ${esc(i.model||'')}</p><p>${esc(i.notes||'')}</p></div>`).join('') || msg('Inventario vacío.')}`, 'acuarios'); } catch(e){ page('Inventario', msg(e.message,'error'), 'acuarios'); } };
window.microfauna = function(){ page('Microfauna', msg('Módulo preparado para cultivos y avisos.'), 'microfauna'); };

// --- BLOQUE 13: BOOT ---
async function boot() {
  try { const { data } = await s.auth.getUser(); state.user = data?.user || null; window.u = state.user; document.getElementById('logoutBtn')?.classList.toggle('hidden', !state.user); if (!state.user) return login(); await dashboard(); } catch (e) { render(msg(e.message, 'error')); }
}
document.getElementById('logoutBtn')?.addEventListener('click', async () => { await s.auth.signOut(); location.reload(); });
boot();
