const app = document.getElementById('app');
const tabs = document.querySelectorAll('.tabs button[data-view]');
const refreshBtn = document.querySelector('[data-action="refresh"]');
const newBtn = document.querySelector('[data-action="new"]');

const STORAGE_KEY = 'acuarionexo_creador_fichas_v44_limpio';

const tipos = {
  animal_pez_marino:'🐠 Pez marino',
  animal_pez_dulce:'🐟 Pez dulce',
  animal_coral:'🪸 Coral',
  animal_invertebrado:'🦐 Invertebrado',
  planta:'🌿 Planta',
  microfauna:'🧫 Microfauna',
  producto:'🧴 Producto',
  sal:'🧂 Sal',
  test:'🧪 Test',
  medicamento:'💊 Medicamento',
  alimento:'🍽️ Alimento',
  equipo:'⚙️ Equipo',
  guia:'📘 Guía',
  otro:'📄 Otro'
};

const estado = {
  vista:'lista',
  fichas:cargar(),
  editando:null,
  fotoTemporal:''
};

function uid(){
  return `ficha_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function now(){
  return new Date().toISOString();
}

function esc(valor){
  return String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function cargar(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).map(normalizarFicha) : [];
  }catch(_){
    return [];
  }
}

function guardarTodo(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado.fichas));
}

function fichaBase(datos = {}){
  const fecha = now();
  return normalizarFicha({
    schema:'acuarionexo.ficha.v4',
    id:uid(),
    tipo:'animal_pez_marino',
    estado:'borrador',
    tarjeta:{titulo:'', subtitulo:'', resumen:'', aviso:'', portada:'', chips:[]},
    identificacion:{nombre_comun:'', nombre_cientifico:'', fabricante:'', marca:'', modelo:'', otros_nombres:''},
    clasificacion:{ambito:'marino', grupo:'', familia:'', origen:'', reef_safe:'pendiente'},
    detalle:{descripcion:'', uso_principal:'', observaciones:''},
    parametros:{temperatura:'', salinidad:'', ph:'', kh:'', gh:'', no3:'', po4:'', calcio:'', magnesio:'', otros:''},
    cuidados:{dificultad:'Media', tamano_adulto:'', litros_minimos:'', zona:'', luz:'', flujo:'', mantenimiento:'', aclimatacion:'', cuarentena:''},
    compatibilidad:{temperamento:'', compatible_con:'', evitar_con:'', notas:''},
    alimentacion:{tipo:'', frecuencia:'', alimentos:'', suplementos:'', notas:''},
    producto:{categoria:'', composicion:'', dosificacion:'', modo_uso:'', precauciones:'', conservacion:'', compatibilidad:''},
    riesgos:{toxicidad:'', enfermedades:'', plagas:'', errores_frecuentes:'', alertas_ia:[]},
    ia:{proveedor:'gratis/manual', prompt:'', respuesta:'', origen_foto:false, tipo_sugerido:'', instrucciones_foto:''},
    fuentes:[],
    media:{foto_original:'', portada_generada:''},
    created_at:fecha,
    updated_at:fecha,
    ...datos
  });
}

function normalizarFicha(f){
  const base = {
    schema:'acuarionexo.ficha.v4', id:uid(), tipo:'animal_pez_marino', estado:'borrador',
    tarjeta:{titulo:'', subtitulo:'', resumen:'', aviso:'', portada:'', chips:[]},
    identificacion:{nombre_comun:'', nombre_cientifico:'', fabricante:'', marca:'', modelo:'', otros_nombres:''},
    clasificacion:{ambito:'marino', grupo:'', familia:'', origen:'', reef_safe:'pendiente'},
    detalle:{descripcion:'', uso_principal:'', observaciones:''},
    parametros:{}, cuidados:{}, compatibilidad:{}, alimentacion:{}, producto:{}, riesgos:{alertas_ia:[]},
    ia:{proveedor:'gratis/manual', prompt:'', respuesta:'', origen_foto:false, tipo_sugerido:'', instrucciones_foto:''},
    fuentes:[], media:{foto_original:'', portada_generada:''}, created_at:now(), updated_at:now()
  };
  const out = {...base, ...(f || {})};
  for(const k of ['tarjeta','identificacion','clasificacion','detalle','parametros','cuidados','compatibilidad','alimentacion','producto','riesgos','ia','media']){
    out[k] = {...base[k], ...(f?.[k] || {})};
  }
  out.fuentes = Array.isArray(f?.fuentes) ? f.fuentes : [];
  out.tarjeta.chips = Array.isArray(out.tarjeta.chips) ? out.tarjeta.chips : textoLista(out.tarjeta.chips);
  out.riesgos.alertas_ia = Array.isArray(out.riesgos.alertas_ia) ? out.riesgos.alertas_ia : textoLista(out.riesgos.alertas_ia);
  out.tarjeta.titulo ||= out.identificacion.nombre_comun || out.identificacion.modelo || 'Ficha sin título';
  out.tarjeta.subtitulo ||= out.identificacion.nombre_cientifico || out.identificacion.fabricante || tipos[out.tipo] || '';
  out.tarjeta.resumen ||= out.detalle.uso_principal || out.detalle.descripcion || '';
  out.tarjeta.portada ||= out.media.portada_generada || out.media.foto_original || '';
  return out;
}

function textoLista(texto){
  return String(texto || '').split(/[\n,]/).map(x=>x.trim()).filter(Boolean);
}

function activarTab(vista){
  tabs.forEach(btn=>btn.classList.toggle('active', btn.dataset.view === vista));
}

function cambiarVista(vista){
  estado.vista = vista;
  estado.editando = null;
  render();
}

function render(){
  activarTab(estado.vista);
  if(estado.vista === 'foto') return vistaFoto();
  if(estado.vista === 'ia') return vistaIA();
  if(estado.vista === 'json') return vistaJSON();
  return vistaLista();
}

function vistaLista(){
  const cards = estado.fichas.length ? estado.fichas.map(cardFicha).join('') : '<div class="empty">Aún no hay fichas guardadas.</div>';
  app.innerHTML = `<div class="topActions"><button class="primary" data-new>+ Nueva ficha</button><button data-export>Exportar JSON</button></div><h2>📚 Fichas guardadas</h2><div class="library">${cards}</div>`;
}

function cardFicha(f){
  return `<article class="card"><div class="cover">${f.tarjeta.portada ? `<img src="${f.tarjeta.portada}" alt="">` : `<span>${(tipos[f.tipo]||'📄').split(' ')[0]}</span>`}</div><div class="cardBody"><h3>${esc(f.tarjeta.titulo)}</h3><p class="small">${esc(f.tarjeta.subtitulo)}</p><p>${esc(f.tarjeta.resumen || 'Sin resumen.')}</p><div>${(f.tarjeta.chips||[]).slice(0,4).map(c=>`<span class="pill">${esc(c)}</span>`).join('')}</div><div class="actions"><button data-edit="${f.id}">Editar</button><button data-dup="${f.id}">Duplicar</button><button data-del="${f.id}">Eliminar</button></div></div></article>`;
}

function vistaEditor(f = fichaBase()){
  estado.vista = 'editor';
  estado.editando = f.id;
  activarTab('');
  app.innerHTML = `<h2>✍️ Ficha</h2><form id="formFicha" class="form"><label>Tipo</label><select name="tipo">${Object.entries(tipos).map(([k,v])=>`<option value="${k}" ${f.tipo===k?'selected':''}>${v}</option>`).join('')}</select><label>Título visible</label><input name="titulo" value="${esc(f.tarjeta.titulo)}"><label>Subtítulo</label><input name="subtitulo" value="${esc(f.tarjeta.subtitulo)}"><label>Resumen</label><textarea name="resumen">${esc(f.tarjeta.resumen)}</textarea><label>Nombre común</label><input name="nombre_comun" value="${esc(f.identificacion.nombre_comun)}"><label>Nombre científico / modelo</label><input name="nombre_cientifico" value="${esc(f.identificacion.nombre_cientifico || f.identificacion.modelo)}"><label>Descripción completa</label><textarea name="descripcion">${esc(f.detalle.descripcion)}</textarea><label>Observaciones</label><textarea name="observaciones">${esc(f.detalle.observaciones)}</textarea><label>Chips separados por coma</label><input name="chips" value="${esc((f.tarjeta.chips||[]).join(', '))}"><label>Fuentes, una por línea</label><textarea name="fuentes">${esc((f.fuentes||[]).join('\n'))}</textarea><div class="actions"><button class="good" type="submit">Guardar</button><button type="button" data-prompt-editor>Prompt IA gratis</button><button type="button" data-back>Volver</button></div></form>`;
}

function leerForm(){
  const form = document.getElementById('formFicha');
  const data = Object.fromEntries(new FormData(form).entries());
  const previa = estado.fichas.find(f=>f.id===estado.editando) || fichaBase({id:estado.editando || uid()});
  const f = normalizarFicha(previa);
  f.tipo = data.tipo;
  f.tarjeta.titulo = data.titulo.trim();
  f.tarjeta.subtitulo = data.subtitulo.trim();
  f.tarjeta.resumen = data.resumen.trim();
  f.tarjeta.chips = textoLista(data.chips);
  f.identificacion.nombre_comun = data.nombre_comun.trim();
  f.identificacion.nombre_cientifico = data.nombre_cientifico.trim();
  f.detalle.descripcion = data.descripcion.trim();
  f.detalle.observaciones = data.observaciones.trim();
  f.fuentes = String(data.fuentes || '').split('\n').map(x=>x.trim()).filter(Boolean);
  f.updated_at = now();
  return normalizarFicha(f);
}

function guardarFicha(f){
  const i = estado.fichas.findIndex(x=>x.id===f.id);
  if(i >= 0) estado.fichas[i] = f; else estado.fichas.unshift(f);
  guardarTodo();
  cambiarVista('lista');
}

function vistaFoto(){
  app.innerHTML = `<h2>📷 Crear ficha desde foto</h2><p>Funciona gratis: carga foto, la app prepara ficha base y genera un prompt para pegar en una IA gratuita/manual.</p><input type="file" accept="image/*" capture="environment" data-photo><div id="photoBox">${estado.fotoTemporal ? `<img class="photoPreview" src="${estado.fotoTemporal}" alt="foto">` : '<div class="empty">Sin foto cargada.</div>'}</div><label>Pista opcional</label><input id="fotoPista" placeholder="Ej.: pez payaso, caja de sal, coral..."><div class="actions"><button class="primary" data-photo-base>Crear ficha base</button><button data-photo-prompt>Generar prompt gratis</button></div>`;
}

function crearFichaDesdeFoto(){
  const pista = document.getElementById('fotoPista')?.value || '';
  const f = fichaBase();
  f.ia.origen_foto = true;
  f.ia.instrucciones_foto = pista;
  f.media.foto_original = estado.fotoTemporal;
  f.media.portada_generada = estado.fotoTemporal;
  f.tarjeta.portada = estado.fotoTemporal;
  f.tarjeta.titulo = pista ? `Ficha desde foto: ${pista}` : 'Ficha desde foto';
  f.tarjeta.resumen = 'Ficha base creada desde foto. Pendiente de completar con IA gratuita/manual.';
  f.tarjeta.chips = ['📷 Foto','IA gratis/manual','Revisar'];
  vistaEditor(f);
}

function promptParaFicha(f){
  return `Crea o completa una ficha para AcuarioNexo. Devuelve SOLO JSON valido con schema acuarionexo.ficha.v4. No inventes datos; usa pendiente si no puedes verificar. IA gratis/manual: puedes usar buscador, fuentes oficiales o conocimiento general, pero cita fuentes en el campo fuentes.\n\nFicha base:\n${JSON.stringify(f,null,2)}`;
}

async function copiarPrompt(f){
  const texto = promptParaFicha(f);
  try{ await navigator.clipboard.writeText(texto); }catch(_){ }
  estado.vista = 'ia';
  activarTab('ia');
  app.innerHTML = `<h2>🤖 Prompt IA gratis/manual</h2><p>Pega este texto en una IA gratuita o buscador con IA. Después importa el JSON en la pestaña JSON.</p><textarea class="bigText">${esc(texto)}</textarea>`;
}

function vistaIA(){
  app.innerHTML = `<h2>🤖 IA gratis/manual</h2><p>No depende de API de pago. Usa prompt copiable, IA gratuita o búsqueda manual, y luego importa el JSON.</p><button data-new-prompt>Crear ficha base para prompt</button>`;
}

function vistaJSON(){
  app.innerHTML = `<h2>⇄ JSON</h2><div class="actions"><button data-export>Exportar todo</button><button class="primary" data-import>Importar / fusionar</button></div><textarea id="jsonBox" class="bigText" placeholder='Pega aquí una ficha JSON o una lista de fichas'>${esc(JSON.stringify(estado.fichas,null,2))}</textarea>`;
}

function exportar(){
  const blob = new Blob([JSON.stringify(estado.fichas,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'acuarionexo_fichas_v44_limpio.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importar(){
  try{
    const raw = document.getElementById('jsonBox').value;
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [data];
    arr.map(normalizarFicha).forEach(f=>{
      const i = estado.fichas.findIndex(x=>x.id===f.id);
      if(i >= 0) estado.fichas[i] = f; else estado.fichas.unshift(f);
    });
    guardarTodo();
    cambiarVista('lista');
  }catch(e){
    alert('JSON no válido: ' + e.message);
  }
}

document.addEventListener('click', e=>{
  const el = e.target.closest('button');
  if(!el) return;
  if(el.dataset.view) cambiarVista(el.dataset.view);
  if(el.dataset.action === 'refresh') location.reload();
  if(el.dataset.action === 'new' || el.dataset.new !== undefined) vistaEditor(fichaBase());
  if(el.dataset.back !== undefined) cambiarVista('lista');
  if(el.dataset.edit) vistaEditor(estado.fichas.find(f=>f.id===el.dataset.edit));
  if(el.dataset.dup){ const f = normalizarFicha({...estado.fichas.find(x=>x.id===el.dataset.dup), id:uid(), created_at:now(), updated_at:now()}); f.tarjeta.titulo += ' copia'; guardarFicha(f); }
  if(el.dataset.del){ estado.fichas = estado.fichas.filter(f=>f.id!==el.dataset.del); guardarTodo(); render(); }
  if(el.dataset.export !== undefined) exportar();
  if(el.dataset.import !== undefined) importar();
  if(el.dataset.photoBase !== undefined) crearFichaDesdeFoto();
  if(el.dataset.photoPrompt !== undefined) copiarPrompt(fichaBase({media:{foto_original:'[foto cargada]',portada_generada:''}, ia:{proveedor:'gratis/manual', origen_foto:true, instrucciones_foto:document.getElementById('fotoPista')?.value || ''}}));
  if(el.dataset.promptEditor !== undefined) copiarPrompt(leerForm());
  if(el.dataset.newPrompt !== undefined) copiarPrompt(fichaBase());
});

document.addEventListener('submit', e=>{
  if(e.target.id === 'formFicha'){
    e.preventDefault();
    guardarFicha(leerForm());
  }
});

document.addEventListener('change', e=>{
  if(e.target.matches('[data-photo]')){
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => { estado.fotoTemporal = reader.result; vistaFoto(); };
    reader.readAsDataURL(file);
  }
});

render();
