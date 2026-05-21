const cfg = window.ACUARIONEXO_CONFIG;
const supa = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);

let session = null;
let user = null;
let currentAquarium = null;

const $ = (id)=>document.getElementById(id);
const app = $("app");
$("version").textContent = cfg.APP_VERSION;

function esc(v){
  return String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function todayISO(){ return new Date().toISOString().slice(0,10); }
function msg(txt,type="notice"){ return `<div class="${type}">${esc(txt)}</div>`; }
function set(html){ app.innerHTML = html; window.scrollTo(0,0); }
async function getSession(){
  const res = await supa.auth.getSession();
  session = res.data.session;
  user = session?.user || null;
  $("logoutBtn").classList.toggle("hidden", !user);
}
async function recordHistory(aquarium_id, source_table, source_id, action, summary, payload={}){
  if(!user) return;
  await supa.from("history_events").insert({
    user_id:user.id, aquarium_id, source_table, source_id, action, summary, payload
  });
}
async function uploadFile(bucket, file){
  if(!file) return null;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const up = await supa.storage.from(bucket).upload(path,file,{upsert:false});
  if(up.error) throw up.error;
  const pub = supa.storage.from(bucket).getPublicUrl(path);
  return pub.data.publicUrl;
}

async function init(){
  await getSession();
  $("logoutBtn").onclick = async()=>{ await supa.auth.signOut(); currentAquarium=null; await init(); };
  if(!user) renderLogin(); else renderHome();
}
function renderLogin(){
  set(`
    <section class="card">
      <h2>Entrar en AcuarioNexo</h2>
      <p class="small">Proyecto limpio conectado a Supabase. Los datos se guardan online.</p>
      <label>Email</label><input id="email" type="email" autocomplete="email">
      <label>Contraseña</label><input id="pass" type="password" autocomplete="current-password">
      <div class="grid">
        <button id="login">Entrar</button>
        <button id="signup" class="secondary">Crear cuenta</button>
      </div>
      <div id="authMsg"></div>
    </section>
  `);
  $("login").onclick = async()=>{
    $("authMsg").innerHTML = "";
    const {error} = await supa.auth.signInWithPassword({email:$("email").value.trim(), password:$("pass").value});
    if(error) $("authMsg").innerHTML = msg(error.message,"error"); else init();
  };
  $("signup").onclick = async()=>{
    $("authMsg").innerHTML = "";
    const {error} = await supa.auth.signUp({email:$("email").value.trim(), password:$("pass").value});
    if(error) $("authMsg").innerHTML = msg(error.message,"error"); else $("authMsg").innerHTML = msg("Cuenta creada. Revisa el correo si Supabase pide confirmación.","success");
  };
}

function mainButtons(){
  return `
    <section class="card">
      <div class="grid">
        <button onclick="renderAquariums()">Acuarios</button>
        <button onclick="renderInventory()">Inventario técnico</button>
        <button onclick="renderLibrary()">Biblioteca</button>
        <button onclick="renderMicrofauna()">Microfauna</button>
        <button onclick="renderAlerts()">Avisos</button>
        <button onclick="renderTreatments()">Hospital / Tratamientos</button>
      </div>
    </section>
  `;
}
function renderHome(){
  currentAquarium=null;
  set(`
    ${mainButtons()}
    <section class="card">
      <h2>Panel principal</h2>
      <p>Base limpia de AcuarioNexo. Sin scripts viejos, sin PWA y sin service worker.</p>
      <p class="small">Usuario: ${esc(user.email)}</p>
    </section>
  `);
}
function backHome(){ renderHome(); }

async function renderAquariums(){
  const {data,error} = await supa.from("aquariums").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
  if(error) return set(mainButtons()+msg(error.message,"error"));
  set(`
    ${mainButtons()}
    <section class="card">
      <h2>Acuarios</h2>
      <button onclick="renderNewAquarium()">+ Nuevo acuario</button>
      ${(data||[]).map(a=>`
        <div class="item">
          <h3>${esc(a.name)}</h3>
          <p class="small">${esc(a.aquarium_type)} · ${esc(a.liters||"")} L</p>
          ${a.cover_photo_url?`<img class="photo" src="${esc(a.cover_photo_url)}">`:""}
          <div class="grid">
            <button onclick="openAquarium('${a.id}')">Abrir</button>
            <button class="danger" onclick="deleteAquarium('${a.id}')">Borrar</button>
          </div>
        </div>
      `).join("") || msg("Todavía no hay acuarios.")}
    </section>
  `);
}
function renderNewAquarium(){
  set(`
    <section class="card">
      <button class="secondary" onclick="renderAquariums()">← Volver</button>
      <h2>Nuevo acuario</h2>
      <label>Nombre</label><input id="aqName" placeholder="Reef Castro">
      <label>Tipo</label>
      <select id="aqType">
        <option value="reef">Reef</option><option value="marine">Marino</option>
        <option value="freshwater">Dulce</option><option value="planted">Plantado</option>
        <option value="breeding">Cría</option><option value="hospital">Hospital</option>
      </select>
      <label>Litros</label><input id="aqLiters" type="number" step="0.1">
      <label>Fecha de inicio</label><input id="aqStart" type="date">
      <label>Descripción</label><textarea id="aqDesc"></textarea>
      <label>Foto portada</label><input id="aqPhoto" type="file" accept="image/*">
      <button onclick="saveAquarium()">Guardar acuario</button>
      <div id="formMsg"></div>
    </section>
  `);
}
async function saveAquarium(){
  try{
    const photo = await uploadFile("aquarium-photos",$("aqPhoto").files[0]);
    const row = {
      user_id:user.id,name:$("aqName").value.trim(),aquarium_type:$("aqType").value,
      liters:$("aqLiters").value?Number($("aqLiters").value):null,
      start_date:$("aqStart").value||null,description:$("aqDesc").value.trim()||null,
      cover_photo_url:photo
    };
    const {data,error} = await supa.from("aquariums").insert(row).select().single();
    if(error) throw error;
    await recordHistory(data.id,"aquariums",data.id,"create",`Acuario creado: ${data.name}`,data);
    renderAquariums();
  }catch(e){ $("formMsg").innerHTML = msg(e.message,"error"); }
}
async function deleteAquarium(id){
  if(!confirm("¿Borrar este acuario y sus datos relacionados?")) return;
  await supa.from("aquariums").delete().eq("id",id).eq("user_id",user.id);
  renderAquariums();
}
async function openAquarium(id){
  const {data,error} = await supa.from("aquariums").select("*").eq("id",id).eq("user_id",user.id).single();
  if(error) return set(msg(error.message,"error"));
  currentAquarium=data;
  renderAquariumPanel();
}
function aquariumMenu(){
  return `
    <section class="card">
      <button class="secondary" onclick="renderAquariums()">← Mis acuarios</button>
      <h2>${esc(currentAquarium.name)}</h2>
      <p class="small">${esc(currentAquarium.aquarium_type)} · ${esc(currentAquarium.liters||"")} L</p>
      <div class="grid">
        <button onclick="renderCurrentCard()">Ficha actual</button>
        <button onclick="renderParameters()">Parámetros</button>
        <button onclick="renderAnimals()">Animales</button>
        <button onclick="renderEquipment()">Equipamiento</button>
        <button onclick="renderUsedInventory()">Inventario usado</button>
        <button onclick="renderAquariumPhotos()">Fotos</button>
        <button onclick="renderMaintenance('cleaning')">Limpieza</button>
        <button onclick="renderMaintenance('maintenance')">Mantenimiento</button>
        <button onclick="renderAquariumTasks()">Tareas</button>
        <button onclick="renderAquariumHistory()">Historial</button>
        <button onclick="renderAquariumTreatments()">Tratamientos/Hospital</button>
      </div>
    </section>
  `;
}
function renderAquariumPanel(){ set(aquariumMenu()+`<section class="card"><h2>Panel del acuario</h2><p>Todo lo que crees aquí queda asociado automáticamente a ${esc(currentAquarium.name)}.</p></section>`); }

async function renderCurrentCard(){
  const {data} = await supa.from("aquarium_current_cards").select("*").eq("aquarium_id",currentAquarium.id).maybeSingle();
  set(aquariumMenu()+`
    <section class="card">
      <h2>Ficha actual</h2>
      <label>Resumen</label><textarea id="ccSummary">${esc(data?.summary||"")}</textarea>
      <label>Iluminación</label><textarea id="ccLighting">${esc(data?.lighting||"")}</textarea>
      <label>Filtración</label><textarea id="ccFiltration">${esc(data?.filtration||"")}</textarea>
      <label>Movimiento</label><textarea id="ccFlow">${esc(data?.flow||"")}</textarea>
      <label>Objetivos/notas</label><textarea id="ccTarget">${esc(data?.target_notes||"")}</textarea>
      <button onclick="saveCurrentCard('${data?.id||""}')">Guardar ficha</button>
      <div id="formMsg"></div>
    </section>
  `);
}
async function saveCurrentCard(id){
  const row={user_id:user.id,aquarium_id:currentAquarium.id,summary:$("ccSummary").value,lighting:$("ccLighting").value,filtration:$("ccFiltration").value,flow:$("ccFlow").value,target_notes:$("ccTarget").value};
  const q = id ? supa.from("aquarium_current_cards").update(row).eq("id",id).select().single()
               : supa.from("aquarium_current_cards").insert(row).select().single();
  const {data,error}=await q;
  if(error) return $("formMsg").innerHTML=msg(error.message,"error");
  await recordHistory(currentAquarium.id,"aquarium_current_cards",data.id,id?"update":"create","Ficha actual guardada",row);
  $("formMsg").innerHTML=msg("Ficha guardada.","success");
}

async function renderParameters(){
  const {data,error}=await supa.from("parameters").select("*").eq("aquarium_id",currentAquarium.id).order("measured_at",{ascending:false}).limit(50);
  if(error) return set(aquariumMenu()+msg(error.message,"error"));
  set(aquariumMenu()+`
    <section class="card">
      <h2>Parámetros</h2>
      <div class="row">
        <div><label>Fecha</label><input id="pDate" type="datetime-local"></div>
        <div><label>Método test</label><input id="pMethod" placeholder="Hanna, JBL gotas..."></div>
      </div>
      <div class="row">
        <div><label>Comparador</label><select id="pComp"><option>=</option><option>&lt;</option><option>&gt;</option><option>&lt;=</option><option>&gt;=</option></select></div>
        <div><label>Hanna Fósforo ULR ppb P</label><input id="pHanna" type="number" step="0.01" oninput="calcPo4()"></div>
      </div>
      <p id="po4Calc" class="notice">PO4 calculado: -</p>
      <div class="row3">
        <div><label>Temp °C</label><input id="pTemp" type="number" step="0.1"></div>
        <div><label>Salinidad ppt</label><input id="pSal" type="number" step="0.1"></div>
        <div><label>pH</label><input id="pPh" type="number" step="0.01"></div>
      </div>
      <div class="row3">
        <div><label>KH</label><input id="pKh" type="number" step="0.1"></div>
        <div><label>NO3</label><input id="pNo3" type="number" step="0.01"></div>
        <div><label>PO4</label><input id="pPo4" type="number" step="0.001"></div>
      </div>
      <div class="row3">
        <div><label>Ca</label><input id="pCa" type="number" step="1"></div>
        <div><label>Mg</label><input id="pMg" type="number" step="1"></div>
        <div><label>NH3</label><input id="pNh3" type="number" step="0.01"></div>
      </div>
      <label>Notas</label><textarea id="pNotes"></textarea>
      <button onclick="saveParameters()">Guardar parámetros</button>
      <div id="formMsg"></div>
      <hr>
      <h3>Historial</h3>
      ${(data||[]).map(p=>`<div class="item"><b>${new Date(p.measured_at).toLocaleString()}</b><p class="small">${esc(p.test_method||"")} ${esc(p.comparator||"=")} · PO4 ${esc(p.phosphate_po4??"-")} · NO3 ${esc(p.nitrate_no3??"-")} · KH ${esc(p.kh_dkh??"-")} · pH ${esc(p.ph??"-")}</p><p>${esc(p.notes||"")}</p></div>`).join("")||msg("Sin mediciones.")}
    </section>
  `);
}
function calcPo4(){
  const v=Number($("pHanna").value);
  $("po4Calc").textContent = Number.isFinite(v) ? `PO4 calculado: ${(v*3.066/1000).toFixed(4)} ppm` : "PO4 calculado: -";
}
async function saveParameters(){
  const hanna = $("pHanna").value ? Number($("pHanna").value) : null;
  const po4 = $("pPo4").value ? Number($("pPo4").value) : (hanna!==null ? Number((hanna*3.066/1000).toFixed(4)) : null);
  const row={user_id:user.id,aquarium_id:currentAquarium.id,measured_at:$("pDate").value?new Date($("pDate").value).toISOString():new Date().toISOString(),test_method:$("pMethod").value,comparator:$("pComp").value,temperature_c:num("pTemp"),salinity_ppt:num("pSal"),ph:num("pPh"),kh_dkh:num("pKh"),nitrate_no3:num("pNo3"),phosphate_po4:po4,hanna_phosphorus_ulr_ppb_p:hanna,calcium_ca:num("pCa"),magnesium_mg:num("pMg"),ammonia_nh3:num("pNh3"),notes:$("pNotes").value};
  const {data,error}=await supa.from("parameters").insert(row).select().single();
  if(error) return $("formMsg").innerHTML=msg(error.message,"error");
  await recordHistory(currentAquarium.id,"parameters",data.id,"create","Parámetros registrados",row);
  renderParameters();
}
function num(id){ return $(id).value===""?null:Number($(id).value); }

async function renderAnimals(){
  const {data,error}=await supa.from("animals").select("*").eq("aquarium_id",currentAquarium.id).order("created_at",{ascending:false});
  if(error) return set(aquariumMenu()+msg(error.message,"error"));
  set(aquariumMenu()+`
    <section class="card">
      <h2>Animales</h2>
      <label>Nombre común</label><input id="anName">
      <label>Nombre científico</label><input id="anSci">
      <label>Categoría</label><select id="anCat"><option value="fish">Pez</option><option value="coral">Coral</option><option value="invertebrate">Invertebrado</option><option value="crustacean">Crustáceo</option><option value="mollusk">Molusco</option><option value="other">Otro</option></select>
      <label>Cantidad</label><input id="anQty" type="number" value="1">
      <div class="row3">
        <div><label>Día</label><input id="anDay" type="number" min="1" max="31"></div>
        <div><label>Mes</label><input id="anMonth" type="number" min="1" max="12"></div>
        <div><label>Año</label><input id="anYear" type="number" min="1900" max="2200"></div>
      </div>
      <label>Foto</label><input id="anPhoto" type="file" accept="image/*">
      <label>Notas</label><textarea id="anNotes"></textarea>
      <button onclick="saveAnimal()">Guardar animal</button>
      <div id="formMsg"></div>
      <hr>
      ${(data||[]).map(a=>`<div class="item"><h3>${esc(a.common_name)}</h3><p class="small">${esc(a.scientific_name||"")} · ${esc(a.category||"")} · ${esc(a.quantity)} ud.</p><p class="small">Fecha: ${esc([a.acquisition_day,a.acquisition_month,a.acquisition_year].filter(Boolean).join("/"))}</p>${a.photo_url?`<img class="photo" src="${esc(a.photo_url)}">`:""}<p>${esc(a.notes||"")}</p><button class="danger" onclick="deleteRow('animals','${a.id}',renderAnimals)">Borrar</button></div>`).join("")||msg("Sin animales.")}
    </section>
  `);
}
async function saveAnimal(){
  try{
    const photo=await uploadFile("animal-photos",$("anPhoto").files[0]);
    const row={user_id:user.id,aquarium_id:currentAquarium.id,common_name:$("anName").value,scientific_name:$("anSci").value,category:$("anCat").value,quantity:Number($("anQty").value||1),acquisition_day:num("anDay"),acquisition_month:num("anMonth"),acquisition_year:num("anYear"),photo_url:photo,notes:$("anNotes").value};
    const {data,error}=await supa.from("animals").insert(row).select().single();
    if(error) throw error;
    await recordHistory(currentAquarium.id,"animals",data.id,"create",`Animal guardado: ${data.common_name}`,row);
    renderAnimals();
  }catch(e){ $("formMsg").innerHTML=msg(e.message,"error"); }
}

async function renderInventory(){
  const {data,error}=await supa.from("inventory_items").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
  if(error) return set(mainButtons()+msg(error.message,"error"));
  set(`${mainButtons()}<section class="card">
    <h2>Inventario técnico</h2>
    <p class="notice">Inventario IA preparado: ahora guarda foto/fuente/revisión. La lectura IA real se añadirá con Edge Function cuando la base esté probada.</p>
    <label>Producto</label><input id="invName">
    <div class="row"><div><label>Marca</label><input id="invBrand"></div><div><label>Modelo</label><input id="invModel"></div></div>
    <label>Categoría</label><input id="invCat">
    <div class="row"><div><label>Cantidad</label><input id="invQty" type="number" step="0.1" value="1"></div><div><label>Unidad</label><input id="invUnit" placeholder="ml, g, ud..."></div></div>
    <label>Caducidad</label><input id="invExp" type="date">
    <label>Fuente fabricante / revisión</label><input id="invSource" placeholder="URL oficial">
    <label>Foto producto</label><input id="invPhoto" type="file" accept="image/*">
    <label>Notas</label><textarea id="invNotes"></textarea>
    <button onclick="saveInventory()">Guardar producto</button>
    <div id="formMsg"></div><hr>
    ${(data||[]).map(x=>`<div class="item"><h3>${esc(x.name)}</h3><p class="small">${esc(x.brand||"")} ${esc(x.model||"")} · ${esc(x.quantity||"")} ${esc(x.unit||"")}</p><p class="small">Caducidad: ${esc(x.expiry_date||"-")} · Revisión: ${esc(x.ai_review_status)}</p>${x.photo_url?`<img class="photo" src="${esc(x.photo_url)}">`:""}<p>${esc(x.notes||"")}</p><button class="danger" onclick="deleteRow('inventory_items','${x.id}',renderInventory)">Borrar ficha mala</button></div>`).join("")||msg("Sin inventario.")}
  </section>`);
}
async function saveInventory(){
  try{
    const photo=await uploadFile("inventory-photos",$("invPhoto").files[0]);
    const row={user_id:user.id,name:$("invName").value,brand:$("invBrand").value,model:$("invModel").value,category:$("invCat").value,quantity:num("invQty"),unit:$("invUnit").value,expiry_date:$("invExp").value||null,source_url:$("invSource").value,source_checked_at:$("invSource").value?new Date().toISOString():null,photo_url:photo,notes:$("invNotes").value,ai_review_status:"manual"};
    const {data,error}=await supa.from("inventory_items").insert(row).select().single();
    if(error) throw error;
    await recordHistory(null,"inventory_items",data.id,"create",`Inventario guardado: ${data.name}`,row);
    renderInventory();
  }catch(e){ $("formMsg").innerHTML=msg(e.message,"error"); }
}

async function renderEquipment(){ renderSimpleAquariumTable("equipment","Equipamiento",["name","brand","model","category","notes"]); }
async function renderUsedInventory(){ renderSimpleAquariumTable("aquarium_inventory_usage","Inventario usado",["quantity","unit","notes"]); }
async function renderAquariumPhotos(){ renderSimpleAquariumTable("photos","Fotos",["caption"]); }
async function renderMaintenance(kind){ renderSimpleAquariumTable("maintenance_events",kind==="cleaning"?"Limpieza":"Mantenimiento",["title","notes"], {event_type:kind==="cleaning"?"cleaning":"other"}); }
async function renderAquariumTasks(){ renderSimpleAquariumTable("tasks","Tareas",["title","notes"]); }
async function renderAquariumTreatments(){ renderSimpleAquariumTable("treatments","Tratamientos / Hospital",["title","diagnosis","medication","dose","notes"]); }

async function renderSimpleAquariumTable(table,title,fields,extra={}){
  const {data,error}=await supa.from(table).select("*").eq("aquarium_id",currentAquarium.id).order("created_at",{ascending:false});
  if(error) return set(aquariumMenu()+msg(error.message,"error"));
  set(aquariumMenu()+`<section class="card"><h2>${esc(title)}</h2>
    ${fields.map(f=>`<label>${esc(f)}</label>${f==="notes"||f==="diagnosis"?`<textarea id="f_${f}"></textarea>`:`<input id="f_${f}">`}`).join("")}
    ${table==="photos"?`<label>Foto</label><input id="simplePhoto" type="file" accept="image/*">`:""}
    <button onclick="saveSimple('${table}','${fields.join(",")}','${esc(JSON.stringify(extra)).replaceAll("'","")}')">Guardar</button>
    <div id="formMsg"></div><hr>
    ${(data||[]).map(x=>`<div class="item"><h3>${esc(x.title||x.name||x.caption||"Registro")}</h3><p>${esc(x.notes||x.diagnosis||"")}</p>${x.public_url?`<img class="photo" src="${esc(x.public_url)}">`:""}<button class="danger" onclick="deleteRow('${table}','${x.id}',()=>renderSimpleAquariumTable('${table}','${title}','${fields.join(",")}'.split(',')))">Borrar</button></div>`).join("")||msg("Sin registros.")}
  </section>`);
}
async function saveSimple(table,fieldsCsv,extraJson){
  try{
    const fields=fieldsCsv.split(",");
    const extra=extraJson?JSON.parse(extraJson.replaceAll("&quot;",'"')):{};
    const row={user_id:user.id,aquarium_id:currentAquarium.id,...extra};
    fields.forEach(f=>row[f]=$("f_"+f)?.value||null);
    if(table==="photos"){
      const file=$("simplePhoto").files[0];
      const url=await uploadFile("aquarium-photos",file);
      row.bucket="aquarium-photos"; row.path=url||""; row.public_url=url;
    }
    if(table==="maintenance_events" && !row.title) row.title="Registro";
    if(table==="tasks" && !row.title) row.title="Tarea";
    if(table==="treatments" && !row.title) row.title="Tratamiento";
    const {data,error}=await supa.from(table).insert(row).select().single();
    if(error) throw error;
    await recordHistory(currentAquarium.id,table,data.id,"create",`${table} guardado`,row);
    renderAquariumPanel();
  }catch(e){ $("formMsg").innerHTML=msg(e.message,"error"); }
}

async function renderLibrary(){
  const {data}=await supa.from("library_entries").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
  set(mainButtons()+`<section class="card"><h2>Biblioteca</h2><p class="notice">Enciclopedia, no tienda. Desde aquí se podrá crear “Nueva adquisición”.</p>
    <label>Título</label><input id="libTitle"><label>Categoría</label><input id="libCat"><label>Descripción</label><textarea id="libDesc"></textarea>
    <button onclick="saveLibrary()">Guardar ficha</button><div id="formMsg"></div><hr>
    ${(data||[]).map(x=>`<div class="item"><h3>${esc(x.title)}</h3><p>${esc(x.description||"")}</p><button onclick="newAcquisitionFromLibrary('${x.id}')">Nueva adquisición</button> <button class="danger" onclick="deleteRow('library_entries','${x.id}',renderLibrary)">Borrar</button></div>`).join("")||msg("Sin fichas.")}
  </section>`);
}
async function saveLibrary(){
  const row={user_id:user.id,title:$("libTitle").value,category:"other",description:$("libDesc").value};
  const {error}=await supa.from("library_entries").insert(row);
  if(error) $("formMsg").innerHTML=msg(error.message,"error"); else renderLibrary();
}
async function newAcquisitionFromLibrary(id){ alert("Primera base lista. La adquisición guiada se conectará al selector de acuarios en la siguiente vuelta."); }

async function renderMicrofauna(){
  set(mainButtons()+`<section class="card"><h2>Microfauna</h2><p>Fitoplancton, copépodos, rotíferos, artemia, infusorios y paramecios.</p>${msg("Módulo preparado en base de datos. Interfaz detallada siguiente paso.")}</section>`);
}
async function renderAlerts(){
  const now=new Date().toISOString();
  const {data}=await supa.from("tasks").select("*").eq("user_id",user.id).order("due_at",{ascending:true});
  set(mainButtons()+`<section class="card"><h2>Avisos</h2>${(data||[]).map(t=>`<div class="item"><h3>${esc(t.title)}</h3><p class="small">${esc(t.task_type)} · ${esc(t.due_at||"-")} · ${esc(t.status)}</p></div>`).join("")||msg("Sin avisos.")}</section>`);
}
async function renderTreatments(){
  const {data}=await supa.from("treatments").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
  set(mainButtons()+`<section class="card"><h2>Hospital / Tratamientos</h2>${(data||[]).map(t=>`<div class="item"><h3>${esc(t.title)}</h3><p>${esc(t.diagnosis||"")}</p></div>`).join("")||msg("Sin tratamientos globales.")}</section>`);
}
async function renderAquariumHistory(){
  const {data}=await supa.from("history_events").select("*").eq("aquarium_id",currentAquarium.id).order("created_at",{ascending:false}).limit(100);
  set(aquariumMenu()+`<section class="card"><h2>Historial</h2>${(data||[]).map(h=>`<div class="item"><h3>${esc(h.summary)}</h3><p class="small">${new Date(h.created_at).toLocaleString()} · ${esc(h.source_table)} · ${esc(h.action)}</p></div>`).join("")||msg("Sin historial.")}</section>`);
}
async function deleteRow(table,id,cb){
  if(!confirm("¿Borrar este registro?")) return;
  await supa.from(table).delete().eq("id",id).eq("user_id",user.id);
  cb();
}

window.renderHome=renderHome; window.renderAquariums=renderAquariums; window.renderNewAquarium=renderNewAquarium; window.saveAquarium=saveAquarium; window.openAquarium=openAquarium; window.deleteAquarium=deleteAquarium;
window.renderCurrentCard=renderCurrentCard; window.saveCurrentCard=saveCurrentCard; window.renderParameters=renderParameters; window.saveParameters=saveParameters; window.calcPo4=calcPo4;
window.renderAnimals=renderAnimals; window.saveAnimal=saveAnimal; window.deleteRow=deleteRow;
window.renderInventory=renderInventory; window.saveInventory=saveInventory; window.renderLibrary=renderLibrary; window.saveLibrary=saveLibrary; window.newAcquisitionFromLibrary=newAcquisitionFromLibrary;
window.renderMicrofauna=renderMicrofauna; window.renderAlerts=renderAlerts; window.renderTreatments=renderTreatments;
window.renderEquipment=renderEquipment; window.renderUsedInventory=renderUsedInventory; window.renderAquariumPhotos=renderAquariumPhotos; window.renderMaintenance=renderMaintenance; window.renderAquariumTasks=renderAquariumTasks; window.renderAquariumHistory=renderAquariumHistory; window.renderAquariumTreatments=renderAquariumTreatments; window.renderSimpleAquariumTable=renderSimpleAquariumTable; window.saveSimple=saveSimple;

init();
