
const cfg = window.ACUARIONEXO_CONFIG;
const supa = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
const app = document.getElementById("app");
document.getElementById("version").textContent = cfg.APP_VERSION;

let session=null,user=null,currentAquarium=null;

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const val=id=>$(id)?.value?.trim()||"";
const num=id=>val(id)===""?null:Number(val(id));
const bool=id=>$(id)?.checked||false;
const msg=(t,c="notice")=>`<div class="${c}">${esc(t)}</div>`;
const set=html=>{app.innerHTML=html;scrollTo(0,0)};
const today=()=>new Date().toISOString().slice(0,10);

async function init(){
  const r=await supa.auth.getSession(); session=r.data.session; user=session?.user||null;
  $("logoutBtn").classList.toggle("hidden",!user);
  $("logoutBtn").onclick=async()=>{await supa.auth.signOut();currentAquarium=null;init()};
  user?home():login();
}
function login(){
  set(`<section class="card"><h2>Entrar</h2><label>Email</label><input id="email" type="email"><label>Contraseña</label><input id="pass" type="password"><div class="grid"><button onclick="doLogin()">Entrar</button><button class="secondary" onclick="doSignup()">Crear cuenta</button></div><div id="m"></div></section>`);
}
async function doLogin(){const {error}=await supa.auth.signInWithPassword({email:val("email"),password:val("pass")}); if(error)$("m").innerHTML=msg(error.message,"error"); else init()}
async function doSignup(){const {error}=await supa.auth.signUp({email:val("email"),password:val("pass")}); $("m").innerHTML=error?msg(error.message,"error"):msg("Cuenta creada. Si Supabase pide confirmación, revisa el correo.","success")}

async function upload(bucket,id){
  const f=$(id)?.files?.[0]; if(!f)return null;
  const ext=(f.name.split(".").pop()||"jpg").toLowerCase();
  const path=`${user.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const {error}=await supa.storage.from(bucket).upload(path,f);
  if(error)throw error;
  return supa.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
async function history(aq,table,id,action,summary,payload={}){
  if(!user)return;
  await supa.from("history_events").insert({user_id:user.id,aquarium_id:aq,source_table:table,source_id:id,action,summary,payload});
}
function mainMenu(){
  return `<section class="card"><div class="grid">
    <button onclick="aquariums()">Acuarios</button>
    <button onclick="inventory()">Inventario técnico</button>
    <button onclick="library()">Biblioteca</button>
    <button onclick="microfauna()">Microfauna</button>
    <button onclick="alerts()">Avisos</button>
    <button onclick="treatmentsGlobal()">Hospital/Tratamientos</button>
  </div></section>`;
}
function home(){currentAquarium=null;set(`${mainMenu()}<section class="card"><h2>Panel principal</h2><p>App real conectada a Supabase. Los datos se guardan online.</p><p class="small">${esc(user.email)}</p></section>`)}

async function aquariums(){
  const {data,error}=await supa.from("aquariums").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
  if(error)return set(mainMenu()+msg(error.message,"error"));
  set(`${mainMenu()}<section class="card"><h2>Acuarios</h2><button onclick="aquariumForm()">+ Nuevo acuario completo</button><hr>${(data||[]).map(a=>`
    <div class="item"><h3>${esc(a.name)}</h3><span class="badge">${esc(a.aquarium_type)}</span><span class="badge">${esc(a.subtype||"")}</span><p class="small">Real: ${esc(a.real_liters||"-")} L · Bruto: ${esc(a.gross_liters||"-")} L · Estado: ${esc(a.status)}</p>${a.cover_photo_url?`<img class="photo" src="${esc(a.cover_photo_url)}">`:""}<div class="grid"><button onclick="openAquarium('${a.id}')">Abrir</button><button class="danger" onclick="del('aquariums','${a.id}',aquariums)">Borrar</button></div></div>`).join("")||msg("Sin acuarios.")}</section>`);
}
function aquariumForm(){
  set(`<section class="card"><button class="secondary" onclick="aquariums()">← Volver</button><h2>Acuario completo</h2>
  <div class="row"><div><label>Nombre</label><input id="name"></div><div><label>Tipo</label><select id="aquarium_type"><option value="reef">Reef</option><option value="marine">Marino</option><option value="freshwater">Dulce</option><option value="planted">Plantado</option><option value="breeding">Cría</option><option value="hospital">Hospital</option><option value="quarantine">Cuarentena</option><option value="other">Otro</option></select></div></div>
  <label>Subtipo</label><input id="subtype" placeholder="SPS/LPS/blandos, comunitario, betta, cría...">
  <h3>Medidas urna</h3><div class="row4"><div><label>Largo cm</label><input id="tank_length_cm" type="number"></div><div><label>Ancho cm</label><input id="tank_width_cm" type="number"></div><div><label>Alto cm</label><input id="tank_height_cm" type="number"></div><div><label>Relleno cm</label><input id="display_water_height_cm" type="number"></div></div>
  <h3>Sump</h3><div class="row3"><div><label>Largo</label><input id="sump_length_cm" type="number"></div><div><label>Ancho</label><input id="sump_width_cm" type="number"></div><div><label>Alto agua</label><input id="sump_height_cm" type="number"></div></div>
  <div class="row"><div><label>Litros brutos</label><input id="gross_liters" type="number"></div><div><label>Litros reales</label><input id="real_liters" type="number"></div></div>
  <div class="row"><div><label>Fecha montaje</label><input id="mounted_at" type="date"></div><div><label>Inicio ciclado</label><input id="cycling_start_date" type="date"></div></div>
  <label>Objetivos</label><textarea id="goals"></textarea><label>Estado</label><select id="status"><option value="active">Activo</option><option value="paused">Pausado</option><option value="archived">Archivado</option></select>
  <label>Descripción</label><textarea id="description"></textarea><label>Foto portada</label><input id="photo" type="file" accept="image/*">
  <button onclick="saveAquarium()">Guardar</button><div id="m"></div></section>`);
}
async function saveAquarium(){
  try{
    const photo=await upload("aquarium-photos","photo");
    const row={user_id:user.id,name:val("name"),aquarium_type:val("aquarium_type"),subtype:val("subtype"),tank_length_cm:num("tank_length_cm"),tank_width_cm:num("tank_width_cm"),tank_height_cm:num("tank_height_cm"),display_water_height_cm:num("display_water_height_cm"),sump_length_cm:num("sump_length_cm"),sump_width_cm:num("sump_width_cm"),sump_height_cm:num("sump_height_cm"),gross_liters:num("gross_liters"),real_liters:num("real_liters"),liters:num("real_liters"),mounted_at:val("mounted_at")||null,cycling_start_date:val("cycling_start_date")||null,start_date:val("mounted_at")||null,goals:val("goals"),status:val("status"),description:val("description"),cover_photo_url:photo,ai_summary:"Pendiente de analizar con datos reales."};
    const {data,error}=await supa.from("aquariums").insert(row).select().single(); if(error)throw error;
    await history(data.id,"aquariums",data.id,"create","Acuario creado",row); aquariums();
  }catch(e){$("m").innerHTML=msg(e.message,"error")}
}
async function openAquarium(id){
  const {data,error}=await supa.from("aquariums").select("*").eq("id",id).eq("user_id",user.id).single();
  if(error)return set(msg(error.message,"error")); currentAquarium=data; aqPanel();
}
function aqMenu(){
  return `<section class="card"><button class="secondary" onclick="aquariums()">← Acuarios</button><h2>${esc(currentAquarium.name)}</h2><p class="small">${esc(currentAquarium.aquarium_type)} · ${esc(currentAquarium.real_liters||currentAquarium.liters||"-")} L</p><div class="grid">
  <button onclick="currentCard()">Ficha actual</button><button onclick="parameters()">Parámetros</button><button onclick="animals()">Animales</button><button onclick="equipment()">Equipamiento</button><button onclick="usedInventory()">Inventario usado</button><button onclick="photos()">Fotos</button><button onclick="maintenance('cleaning')">Limpieza</button><button onclick="maintenance('maintenance')">Mantenimiento</button><button onclick="tasksAq()">Tareas</button><button onclick="historyAq()">Historial</button><button onclick="treatmentsAq()">Tratamientos/Hospital</button><button onclick="aiContext()">IA contexto</button></div></section>`;
}
function aqPanel(){set(aqMenu()+`<section class="card"><h2>Resumen</h2><p>${esc(currentAquarium.description||"")}</p><p class="notice">${esc(currentAquarium.ai_summary||"Sin resumen IA contextual.")}</p></section>`)}

async function currentCard(){
 const {data}=await supa.from("aquarium_current_cards").select("*").eq("aquarium_id",currentAquarium.id).maybeSingle();
 set(aqMenu()+`<section class="card"><h2>Ficha actual</h2>${["summary","lighting","filtration","flow","substrate","rocks","salt_or_minerals","target_notes"].map(f=>`<label>${f}</label><textarea id="${f}">${esc(data?.[f]||"")}</textarea>`).join("")}<button onclick="saveCurrentCard('${data?.id||""}')">Guardar</button><div id="m"></div></section>`);
}
async function saveCurrentCard(id){
 const row={user_id:user.id,aquarium_id:currentAquarium.id,summary:val("summary"),lighting:val("lighting"),filtration:val("filtration"),flow:val("flow"),substrate:val("substrate"),rocks:val("rocks"),salt_or_minerals:val("salt_or_minerals"),target_notes:val("target_notes")};
 const q=id?supa.from("aquarium_current_cards").update(row).eq("id",id).select().single():supa.from("aquarium_current_cards").insert(row).select().single();
 const {data,error}=await q;if(error)return $("m").innerHTML=msg(error.message,"error");await history(currentAquarium.id,"aquarium_current_cards",data.id,id?"update":"create","Ficha actual guardada",row);$("m").innerHTML=msg("Guardado.","success")
}

async function parameters(){
 const {data,error}=await supa.from("parameters").select("*").eq("aquarium_id",currentAquarium.id).order("measured_at",{ascending:false}).limit(100);
 if(error)return set(aqMenu()+msg(error.message,"error"));
 set(aqMenu()+`<section class="card"><h2>Parámetros completos</h2>
 <div class="row"><div><label>Fecha/hora</label><input id="measured_at" type="datetime-local"></div><div><label>Método test</label><input id="test_method" placeholder="Hanna, JBL, Salifert..."></div></div>
 <div class="row3"><div><label>Marca kit</label><input id="test_kit_brand"></div><div><label>Lote</label><input id="test_kit_lot"></div><div><label>Comparador</label><select id="comparator"><option>=</option><option>&lt;</option><option>&gt;</option><option>&lt;=</option><option>&gt;=</option></select></div></div>
 <div class="row3"><div><label>Hanna Fósforo ULR ppb P</label><input id="hanna_phosphorus_ulr_ppb_p" type="number" step="0.01" oninput="calcPo4()"></div><div><label>PO4 ppm</label><input id="phosphate_po4" type="number" step="0.001"></div><div><label>NO3</label><input id="nitrate_no3" type="number" step="0.01"></div></div>
 <p id="calc" class="notice">Conversión Hanna: -</p>
 <div class="row4"><div><label>Temp °C</label><input id="temperature_c" type="number" step="0.1"></div><div><label>Salinidad ppt</label><input id="salinity_ppt" type="number" step="0.1"></div><div><label>Densidad</label><input id="specific_gravity" type="number" step="0.001"></div><div><label>pH</label><input id="ph" type="number" step="0.01"></div></div>
 <div class="row4"><div><label>KH</label><input id="kh_dkh" type="number" step="0.1"></div><div><label>NH3</label><input id="ammonia_nh3" type="number" step="0.01"></div><div><label>NO2</label><input id="nitrite_no2" type="number" step="0.01"></div><div><label>O2</label><input id="oxygen_o2" type="number" step="0.1"></div></div>
 <div class="row4"><div><label>Ca</label><input id="calcium_ca" type="number"></div><div><label>Mg</label><input id="magnesium_mg" type="number"></div><div><label>K</label><input id="potassium_k" type="number"></div><div><label>Fe</label><input id="iron_fe" type="number" step="0.01"></div></div>
 <div class="row3"><div><label>Iodo</label><input id="iodine_i" type="number" step="0.01"></div><div><label>Silicato</label><input id="silicate_sio2" type="number" step="0.01"></div><div><label>ORP mV</label><input id="orp_mv" type="number"></div></div>
 <label>Notas</label><textarea id="notes"></textarea><button onclick="saveParameters()">Guardar parámetros</button><div id="m"></div><hr>
 <h3>Gráfica PO4 / NO3 / KH</h3><canvas id="chart" width="900" height="260"></canvas><hr>
 ${(data||[]).map(p=>`<div class="item"><h3>${new Date(p.measured_at).toLocaleString()}</h3><p class="small">${esc(p.test_method||"")} ${esc(p.comparator||"=")} · PO4 ${esc(p.phosphate_po4??"-")} · NO3 ${esc(p.nitrate_no3??"-")} · KH ${esc(p.kh_dkh??"-")} · pH ${esc(p.ph??"-")}</p><p>${esc(p.ai_interpretation||p.notes||"")}</p><button class="danger" onclick="del('parameters','${p.id}',parameters)">Borrar</button></div>`).join("")||msg("Sin parámetros.")}</section>`);
 drawChart(data||[]);
}
function calcPo4(){const v=num("hanna_phosphorus_ulr_ppb_p");$("calc").textContent=v==null?"Conversión Hanna: -":`PO4 calculado: ${(v*3.066/1000).toFixed(4)} ppm`; if(v!=null && !val("phosphate_po4"))$("phosphate_po4").value=(v*3.066/1000).toFixed(4)}
function interpretParams(r){let a=[];if(r.phosphate_po4>0.08)a.push("PO4 alto");if(r.nitrate_no3>25)a.push("NO3 alto");if(r.kh_dkh&& (r.kh_dkh<7||r.kh_dkh>9.5))a.push("KH fuera de zona estable");if(r.ammonia_nh3>0)a.push("amonio detectable");return a.length?a.join(", "):"Sin alerta principal con los datos introducidos."}
async function saveParameters(){
 const fields=["temperature_c","salinity_ppt","specific_gravity","ph","kh_dkh","ammonia_nh3","nitrite_no2","nitrate_no3","phosphate_po4","hanna_phosphorus_ulr_ppb_p","calcium_ca","magnesium_mg","potassium_k","iodine_i","iron_fe","silicate_sio2","oxygen_o2","orp_mv"];
 const row={user_id:user.id,aquarium_id:currentAquarium.id,measured_at:val("measured_at")?new Date(val("measured_at")).toISOString():new Date().toISOString(),test_method:val("test_method"),test_kit_brand:val("test_kit_brand"),test_kit_lot:val("test_kit_lot"),comparator:val("comparator"),notes:val("notes")};
 fields.forEach(f=>row[f]=num(f)); if(row.hanna_phosphorus_ulr_ppb_p&&!row.phosphate_po4)row.phosphate_po4=Number((row.hanna_phosphorus_ulr_ppb_p*3.066/1000).toFixed(4));
 row.ai_interpretation=interpretParams(row); row.contextual_risk=row.ai_interpretation.includes("alto")||row.ai_interpretation.includes("detectable")?"medium":"low";
 const {data,error}=await supa.from("parameters").insert(row).select().single(); if(error)return $("m").innerHTML=msg(error.message,"error");
 await history(currentAquarium.id,"parameters",data.id,"create","Parámetros guardados",row);parameters();
}
function drawChart(rows){const c=$("chart"); if(!c)return; const x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);x.fillStyle="#64748b";x.fillText("Historial reciente",20,20);const arr=[...rows].reverse().slice(-20);["phosphate_po4","nitrate_no3","kh_dkh"].forEach((k,ki)=>{x.beginPath();arr.forEach((r,i)=>{let v=Number(r[k]);if(!isFinite(v))return;let px=40+i*(820/Math.max(1,arr.length-1));let py=230-Math.min(210,(v/(k=="kh_dkh"?15:k=="nitrate_no3"?50:.3))*210);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();x.fillText(k,40,40+ki*16)})}

async function animals(){
 const {data,error}=await supa.from("animals").select("*").eq("aquarium_id",currentAquarium.id).order("created_at",{ascending:false});
 if(error)return set(aqMenu()+msg(error.message,"error"));
 set(aqMenu()+`<section class="card"><h2>Animales completos</h2>
 <div class="row"><div><label>Nombre común</label><input id="common_name"></div><div><label>Nombre científico</label><input id="scientific_name"></div></div>
 <div class="row3"><div><label>Categoría</label><select id="category"><option value="fish">Pez</option><option value="coral">Coral</option><option value="invertebrate">Invertebrado</option><option value="crustacean">Crustáceo</option><option value="mollusk">Molusco</option><option value="plant">Planta</option><option value="algae">Alga</option><option value="other">Otro</option></select></div><div><label>Cantidad</label><input id="quantity" type="number" value="1"></div><div><label>Reef safe</label><select id="reef_safe"><option value="unknown">Desconocido</option><option value="yes">Sí</option><option value="no">No</option><option value="caution">Con cuidado</option></select></div></div>
 <div class="row3"><div><label>Día entrada</label><input id="acquisition_day" type="number" min="1" max="31"></div><div><label>Mes</label><input id="acquisition_month" type="number" min="1" max="12"></div><div><label>Año</label><input id="acquisition_year" type="number" min="1900" max="2200"></div></div>
 <label>Compatibilidad</label><textarea id="compatibility"></textarea><label>Alimentación</label><textarea id="feeding"></textarea><label>Zona</label><input id="aquarium_zone"><label>Seguimiento / observación</label><textarea id="observation_schedule"></textarea><label>Estado salud</label><input id="health_status"><label>Foto</label><input id="photo" type="file" accept="image/*"><label>Notas</label><textarea id="notes"></textarea>
 <button onclick="saveAnimal()">Guardar animal</button><div id="m"></div><hr>
 ${(data||[]).map(a=>`<div class="item"><h3>${esc(a.common_name)}</h3><p class="small">${esc(a.scientific_name||"")} · ${esc(a.category||"")} · ${esc(a.quantity)} ud · reef safe: ${esc(a.reef_safe||"")}</p><p class="small">Entrada: ${esc([a.acquisition_day,a.acquisition_month,a.acquisition_year].filter(Boolean).join("/"))}</p>${a.photo_url?`<img class="photo" src="${esc(a.photo_url)}">`:""}<p>${esc(a.compatibility||"")}</p><p>${esc(a.feeding||"")}</p><button onclick="animalObservation('${a.id}')">Añadir seguimiento</button> <button class="danger" onclick="del('animals','${a.id}',animals)">Borrar</button></div>`).join("")||msg("Sin animales.")}</section>`);
}
async function saveAnimal(){
 try{const photo=await upload("animal-photos","photo");const row={user_id:user.id,aquarium_id:currentAquarium.id,common_name:val("common_name"),scientific_name:val("scientific_name"),category:val("category"),quantity:num("quantity")||1,reef_safe:val("reef_safe"),acquisition_day:num("acquisition_day"),acquisition_month:num("acquisition_month"),acquisition_year:num("acquisition_year"),compatibility:val("compatibility"),feeding:val("feeding"),aquarium_zone:val("aquarium_zone"),observation_schedule:val("observation_schedule"),health_status:val("health_status"),photo_url:photo,notes:val("notes"),ai_notes:"IA contextual pendiente de suficientes datos."};const {data,error}=await supa.from("animals").insert(row).select().single();if(error)throw error;await history(currentAquarium.id,"animals",data.id,"create","Animal guardado",row);animals()}catch(e){$("m").innerHTML=msg(e.message,"error")}}
function animalObservation(id){set(aqMenu()+`<section class="card"><h2>Seguimiento animal</h2><label>Apetito</label><input id="appetite"><label>Comportamiento</label><textarea id="behavior"></textarea><label>Síntomas</label><textarea id="symptoms"></textarea><label>Foto</label><input id="photo" type="file" accept="image/*"><label>Notas</label><textarea id="notes"></textarea><button onclick="saveAnimalObservation('${id}')">Guardar seguimiento</button><div id="m"></div></section>`)}
async function saveAnimalObservation(id){try{const photo=await upload("animal-photos","photo");const row={user_id:user.id,aquarium_id:currentAquarium.id,animal_id:id,appetite:val("appetite"),behavior:val("behavior"),symptoms:val("symptoms"),photo_url:photo,notes:val("notes"),ai_interpretation:val("symptoms")?"Revisar síntomas y evolución.":"Seguimiento sin síntomas registrados."};const {data,error}=await supa.from("animal_observations").insert(row).select().single();if(error)throw error;await history(currentAquarium.id,"animal_observations",data.id,"create","Seguimiento animal",row);animals()}catch(e){$("m").innerHTML=msg(e.message,"error")}}

async function inventory(){
 const {data,error}=await supa.from("inventory_items").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
 if(error)return set(mainMenu()+msg(error.message,"error"));
 set(mainMenu()+`<section class="card"><h2>Inventario técnico completo</h2>
 <div class="row3"><div><label>Producto</label><input id="name"></div><div><label>Marca</label><input id="brand"></div><div><label>Modelo</label><input id="model"></div></div>
 <div class="row4"><div><label>Categoría</label><input id="category"></div><div><label>Cantidad</label><input id="quantity" type="number" step="0.1"></div><div><label>Unidad</label><input id="unit"></div><div><label>Stock mínimo</label><input id="min_stock" type="number" step="0.1"></div></div>
 <div class="row4"><div><label>Compra</label><input id="purchase_date" type="date"></div><div><label>Tienda</label><input id="purchase_place"></div><div><label>Precio</label><input id="purchase_price" type="number" step="0.01"></div><div><label>Garantía hasta</label><input id="warranty_until" type="date"></div></div>
 <label>Caducidad</label><input id="expiry_date" type="date"><label>URL fabricante/fuente</label><input id="source_url"><label>Manual URL/PDF</label><input id="manual_url"><label>Foto producto</label><input id="photo" type="file" accept="image/*"><label>Notas</label><textarea id="notes"></textarea>
 <button onclick="saveInventory()">Guardar inventario</button><div id="m"></div><hr>
 ${(data||[]).map(i=>`<div class="item"><h3>${esc(i.name)}</h3><p class="small">${esc(i.brand||"")} ${esc(i.model||"")} · stock ${esc(i.quantity||"-")} ${esc(i.unit||"")} · caduca ${esc(i.expiry_date||"-")}</p>${i.photo_url?`<img class="photo" src="${esc(i.photo_url)}">`:""}<p>${esc(i.ai_product_summary||"")}</p><button class="danger" onclick="del('inventory_items','${i.id}',inventory)">Borrar ficha mala</button></div>`).join("")||msg("Sin inventario.")}</section>`);
}
async function saveInventory(){try{const photo=await upload("inventory-photos","photo");const row={user_id:user.id,name:val("name"),brand:val("brand"),model:val("model"),category:val("category"),quantity:num("quantity"),unit:val("unit"),min_stock:num("min_stock"),purchase_date:val("purchase_date")||null,purchase_place:val("purchase_place"),purchase_price:num("purchase_price"),warranty_until:val("warranty_until")||null,expiry_date:val("expiry_date")||null,source_url:val("source_url"),manufacturer_url:val("source_url"),manual_url:val("manual_url"),source_checked_at:val("source_url")?new Date().toISOString():null,photo_url:photo,notes:val("notes"),ai_review_status:"manual",ai_product_summary:"Ficha manual pendiente de reconocimiento IA de producto/fabricante."};const {data,error}=await supa.from("inventory_items").insert(row).select().single();if(error)throw error;await history(null,"inventory_items",data.id,"create","Inventario guardado",row);inventory()}catch(e){$("m").innerHTML=msg(e.message,"error")}}

function simpleForm(title,table,fields,bucket=null,scope="aq"){
 set((scope==="aq"?aqMenu():mainMenu())+`<section class="card"><h2>${esc(title)}</h2>${fields.map(f=>f.type==="textarea"?`<label>${f.label}</label><textarea id="${f.id}"></textarea>`:f.type==="select"?`<label>${f.label}</label><select id="${f.id}">${f.options.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join("")}</select>`:`<label>${f.label}</label><input id="${f.id}" type="${f.type||"text"}">`).join("")}${bucket?`<label>Foto/archivo</label><input id="photo" type="file">`:""}<button onclick='saveSimple(${JSON.stringify(title)},${JSON.stringify(table)},${JSON.stringify(fields)},${JSON.stringify(bucket)},${JSON.stringify(scope)})'>Guardar</button><div id="m"></div><hr><div id="list"></div></section>`); listSimple(title,table,fields,scope);
}
async function listSimple(title,table,fields,scope){
 let q=supa.from(table).select("*").eq("user_id",user.id).order("created_at",{ascending:false}); if(scope==="aq")q=q.eq("aquarium_id",currentAquarium.id);
 const {data,error}=await q;if(error){$("list").innerHTML=msg(error.message,"error");return}
 $("list").innerHTML=(data||[]).map(r=>`<div class="item"><h3>${esc(r.title||r.name||r.caption||r.culture_type||"Registro")}</h3><p>${esc(r.notes||r.diagnosis||r.description||"")}</p>${r.photo_url||r.public_url?`<img class="photo" src="${esc(r.photo_url||r.public_url)}">`:""}<button class="danger" onclick="del('${table}','${r.id}',()=>simpleForm('${title}','${table}',${JSON.stringify(fields).replaceAll('"','&quot;')},${JSON.stringify(null)},'${scope}'))">Borrar</button></div>`).join("")||msg("Sin registros.");
}
async function saveSimple(title,table,fields,bucket,scope){
 try{const row={user_id:user.id}; if(scope==="aq")row.aquarium_id=currentAquarium.id; fields.forEach(f=>row[f.id]=f.num?num(f.id):(f.date?(val(f.id)||null):val(f.id))); if(bucket){const u=await upload(bucket,"photo");row.photo_url=u;row.public_url=u;row.bucket=bucket;row.path=u||""} if(table==="maintenance_events"&&!row.event_type)row.event_type="other"; const {data,error}=await supa.from(table).insert(row).select().single();if(error)throw error;await history(scope==="aq"?currentAquarium.id:null,table,data.id,"create",`${title} guardado`,row);simpleForm(title,table,fields,bucket,scope)}catch(e){$("m").innerHTML=msg(e.message,"error")}}
function equipment(){simpleForm("Equipamiento","equipment",[{id:"name",label:"Equipo"},{id:"brand",label:"Marca"},{id:"model",label:"Modelo"},{id:"category",label:"Categoría"},{id:"serial_number",label:"Nº serie"},{id:"installed_at",label:"Instalado",type:"date",date:true},{id:"notes",label:"Notas",type:"textarea"}],"inventory-photos","aq")}
function usedInventory(){simpleForm("Inventario usado","aquarium_inventory_usage",[{id:"quantity",label:"Cantidad",type:"number",num:true},{id:"unit",label:"Unidad"},{id:"notes",label:"Notas",type:"textarea"}],null,"aq")}
function photos(){simpleForm("Fotos","photos",[{id:"caption",label:"Descripción"},{id:"taken_at",label:"Fecha",type:"date",date:true}],"aquarium-photos","aq")}
function maintenance(kind){simpleForm(kind==="cleaning"?"Limpieza":"Mantenimiento","maintenance_events",[{id:"event_type",label:"Tipo",type:"select",options:[[kind==="cleaning"?"cleaning":"filter",kind==="cleaning"?"Limpieza":"Mantenimiento"],["water_change","Cambio agua"],["calibration","Calibración"],["dosing","Aditado"],["inspection","Inspección"],["other","Otro"]]},{id:"title",label:"Título"},{id:"performed_at",label:"Fecha",type:"datetime-local"},{id:"next_due_at",label:"Próxima",type:"datetime-local"},{id:"notes",label:"Notas",type:"textarea"}],null,"aq")}
function tasksAq(){simpleForm("Tareas","tasks",[{id:"title",label:"Tarea"},{id:"task_type",label:"Tipo",type:"select",options:[["task","Tarea"],["expiry","Caducidad"],["low_stock","Stock bajo"],["culture","Cultivo"],["treatment","Tratamiento"],["maintenance","Mantenimiento"],["test","Test"]]},{id:"due_at",label:"Vence",type:"datetime-local"},{id:"priority",label:"Prioridad",type:"select",options:[["low","Baja"],["normal","Normal"],["high","Alta"],["urgent","Urgente"]]},{id:"notes",label:"Notas",type:"textarea"}],null,"aq")}
function treatmentsAq(){treatmentForm("aq")} function treatmentsGlobal(){treatmentForm("global")}
function treatmentForm(scope){simpleForm("Hospital / Tratamientos","treatments",[{id:"title",label:"Caso/tratamiento"},{id:"symptoms",label:"Síntomas",type:"textarea"},{id:"diagnosis",label:"Diagnóstico",type:"textarea"},{id:"medication",label:"Medicamento"},{id:"dose",label:"Dosis"},{id:"dose_frequency",label:"Frecuencia"},{id:"started_at",label:"Inicio",type:"date",date:true},{id:"ended_at",label:"Fin",type:"date",date:true},{id:"evolution",label:"Evolución",type:"textarea"},{id:"mortality_count",label:"Mortalidad",type:"number",num:true},{id:"notes",label:"Notas",type:"textarea"}],"hospital-photos",scope)}
function library(){simpleForm("Biblioteca enciclopedia","library_entries",[{id:"title",label:"Título"},{id:"scientific_name",label:"Nombre científico"},{id:"category",label:"Categoría"},{id:"description",label:"Ficha completa",type:"textarea"},{id:"compatibility",label:"Compatibilidad",type:"textarea"},{id:"diet",label:"Alimentación"},{id:"reef_safe",label:"Reef safe"},{id:"references_text",label:"Referencias",type:"textarea"},{id:"source_url",label:"Fuente URL"}],"library-photos","global")}
function microfauna(){simpleForm("Microfauna","microfauna_cultures",[{id:"culture_type",label:"Tipo",type:"select",options:[["fitoplancton","Fitoplancton"],["copepodos","Copépodos"],["rotiferos","Rotíferos"],["artemia","Artemia"],["infusorios","Infusorios"],["paramecios","Paramecios"],["other","Otro"]]},{id:"name",label:"Nombre cultivo"},{id:"container",label:"Recipiente"},{id:"volume_ml",label:"Volumen ml",type:"number",num:true},{id:"density",label:"Densidad"},{id:"contamination_status",label:"Contaminación"},{id:"production_rate",label:"Producción"},{id:"started_at",label:"Inicio",type:"date",date:true},{id:"feeding_schedule",label:"Alimentación",type:"textarea"},{id:"harvest_schedule",label:"Cosecha",type:"textarea"},{id:"next_action_at",label:"Próxima acción",type:"datetime-local"},{id:"notes",label:"Notas",type:"textarea"}],"microfauna-photos","global")}
async function alerts(){
 const {data}=await supa.from("tasks").select("*").eq("user_id",user.id).order("due_at",{ascending:true});
 const now=new Date(); const groups={over:[],today:[],next:[],none:[]};
 (data||[]).forEach(t=>{if(!t.due_at)groups.none.push(t);else{const d=new Date(t.due_at);if(d<now&&t.status==="open")groups.over.push(t);else if(d.toDateString()===now.toDateString())groups.today.push(t);else groups.next.push(t)}});
 set(mainMenu()+`<section class="card"><h2>Avisos</h2>${["over","today","next","none"].map(k=>`<h3>${{over:"Vencidos",today:"Hoy",next:"Próximos",none:"Sin fecha"}[k]}</h3>${groups[k].map(t=>`<div class="item"><h3>${esc(t.title)}</h3><p class="small">${esc(t.task_type)} · ${esc(t.priority)} · ${esc(t.due_at||"-")}</p></div>`).join("")||msg("Nada.")}`).join("")}</section>`)
}
async function historyAq(){const {data}=await supa.from("history_events").select("*").eq("aquarium_id",currentAquarium.id).order("created_at",{ascending:false}).limit(100);set(aqMenu()+`<section class="card"><h2>Historial</h2>${(data||[]).map(h=>`<div class="item"><h3>${esc(h.summary)}</h3><p class="small">${new Date(h.created_at).toLocaleString()} · ${esc(h.source_table)} · ${esc(h.action)}</p></div>`).join("")||msg("Sin historial.")}</section>`)}
function aiContext(){set(aqMenu()+`<section class="card"><h2>IA contextual</h2><p class="notice">Motor contextual por módulo preparado en base de datos. Sin chatbot genérico. En esta fase genera interpretación local con datos del acuario; la IA externa se conecta después mediante Edge Function si se decide.</p><button onclick="buildLocalContext()">Generar resumen contextual local</button><div id="m"></div></section>`)}
async function buildLocalContext(){const {data:p}=await supa.from("parameters").select("*").eq("aquarium_id",currentAquarium.id).order("measured_at",{ascending:false}).limit(1);const text=p?.[0]?interpretParams(p[0]):"No hay parámetros todavía.";await supa.from("aquarium_ai_contexts").insert({user_id:user.id,aquarium_id:currentAquarium.id,module:"global",context_summary:text,risk_level:text.includes("alto")?"medium":"low"});$("m").innerHTML=msg(text,"success")}
async function del(table,id,cb){if(!confirm("¿Borrar?"))return;await supa.from(table).delete().eq("id",id).eq("user_id",user.id);cb()}

Object.assign(window,{doLogin,doSignup,home,aquariums,aquariumForm,saveAquarium,openAquarium,del,currentCard,saveCurrentCard,parameters,saveParameters,calcPo4,animals,saveAnimal,animalObservation,saveAnimalObservation,inventory,saveInventory,equipment,usedInventory,photos,maintenance,tasksAq,historyAq,treatmentsAq,treatmentsGlobal,library,microfauna,alerts,aiContext,buildLocalContext,saveSimple});
init();
