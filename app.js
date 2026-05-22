
const cfg = window.ACUARIONEXO_CONFIG;
const supa = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
const app = document.getElementById("app");
document.getElementById("version").textContent = cfg.APP_VERSION;

let user = null;
let currentAquarium = null;

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const val = id => $(id)?.value?.trim() || "";
const num = id => val(id)==="" ? null : Number(val(id));
const checked = id => !!$(id)?.checked;
const msg = (t,c="notice") => `<div class="${c}">${esc(t)}</div>`;
const set = html => { app.innerHTML = html; scrollTo(0,0); };

document.getElementById("refreshAppBtn")?.addEventListener("click",()=>{
  const u = new URL(location.href);
  u.searchParams.set("v", Date.now());
  location.href = u.toString();
});

async function init(){
  const res = await supa.auth.getSession();
  user = res.data.session?.user || null;
  $("logoutBtn").classList.toggle("hidden", !user);
  $("logoutBtn").onclick = async()=>{ await supa.auth.signOut(); user=null; currentAquarium=null; init(); };
  user ? home() : login();
}

function login(){
  set(`<section class="card">
    <h2>Entrar</h2>
    <label>Email</label><input id="email" type="email">
    <label>ContraseÃ±a</label><input id="pass" type="password">
    <div class="grid2"><button class="primary" onclick="doLogin()">Entrar</button><button onclick="doSignup()">Crear cuenta</button></div>
    <div id="m"></div>
  </section>`);
}
async function doLogin(){
  const {error} = await supa.auth.signInWithPassword({email:val("email"), password:val("pass")});
  if(error) $("m").innerHTML = msg(error.message,"error"); else init();
}
async function doSignup(){
  const {error} = await supa.auth.signUp({email:val("email"), password:val("pass")});
  $("m").innerHTML = error ? msg(error.message,"error") : msg("Cuenta creada. Revisa el correo si Supabase pide confirmaciÃ³n.","success");
}

async function upload(bucket, id){
  const f = $(id)?.files?.[0];
  if(!f) return null;
  const ext = (f.name.split(".").pop()||"jpg").toLowerCase();
  const path = `${user.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const {error} = await supa.storage.from(bucket).upload(path, f, {upsert:false});
  if(error) throw error;
  return supa.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function hist(aq, table, id, action, summary, payload={}){
  await supa.from("history_events").insert({user_id:user.id,aquarium_id:aq,source_table:table,source_id:id,action,summary,payload});
}

function mainMenu(){
  return `<section class="card"><div class="grid">
    <button onclick="aquariums()">Acuarios</button>
    <button onclick="alerts()">Avisos</button>
    <button onclick="inventory()">Inventario tÃ©cnico</button>
    <button onclick="library()">Biblioteca</button>
    <button onclick="microfauna()">Microfauna</button>
    <button onclick="hospitalGlobal()">Hospital/Tratamientos</button>
  </div></section>`;
}
function home(){
  currentAquarium=null;
  set(`${mainMenu()}<section class="card"><h2>Panel principal</h2><p class="notice">Datos reales en Supabase. App base real V1.</p><p class="small">${esc(user.email)}</p></section>`);
}

function calcLiters(l,w,h){
  if(!l||!w||!h) return null;
  const r = Number(l)*Number(w)*Number(h)/1000;
  return Number.isFinite(r) ? Math.round(r*100)/100 : null;
}
function refreshAquariumCalc(){
  const dg = calcLiters(val("display_length_cm"),val("display_width_cm"),val("display_height_cm"));
  const dr = val("display_manual_liters") ? Number(val("display_manual_liters")) : calcLiters(val("display_length_cm"),val("display_width_cm"),val("display_water_height_cm"));
  const sr = checked("sump_enabled") ? calcLiters(val("sump_length_cm"),val("sump_width_cm"),val("sump_water_height_cm")) : null;
  const au = checked("ato_enabled") ? calcLiters(val("ato_length_cm"),val("ato_width_cm"),val("ato_useful_height_cm")||val("ato_height_cm")) : null;
  const disp = num("estimated_displacement_liters") || 0;
  const total = Math.round(((dr||0)+(sr||0)-disp)*100)/100;
  $("calcBox").innerHTML = msg(`Urna bruta: ${dg??"-"} L Â· Urna real: ${dr??"-"} L Â· Sump real: ${sr??"-"} L Â· Relleno Ãºtil: ${au??"-"} L Â· Total sistema para dosis: ${total||"-"} l`);
}

async function aquariums(){
  const {data,error}=await supa.from("aquariums").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
  if(error) return set(mainMenu()+msg(error.message,"error"));
  set(`${mainMenu()}<section class="card"><h2>Acuarios</h2><button class="primary" onclick="aquariumForm()">+ Nuevo acuario completo</button><hr>
  ${{(data||[]).map(a=>`<div class="item">
    <h3>${esc(a.name)}</h3>
    <span class="badge">${esc(a.aquarium_type)}</span><span class="badge">${esc(a.aquarium_subtype||"")}</span><span class="badge">${esc(a.status||"")}</span>
    <p><b>Total real:</b> ${esc(a.total_real_liters??"-")} L Â· <b>Urna:</b> ${esc(a.display_real_liters??"-")} L Â· <b>Sump:</b> ${esc(a.sump_real_liters??"-")} L Â· <b>Relleno:</b> ${esc(a.ato_useful_liters??"-")} L</p>
    ${a.cover_photo_url?`<img class="photo" src="${esc(a.cover_photo_url)}">`:""}
    <div class="grid2"><button onclick="openAquarium('${a.id}')">Abrir</button><button class="danger" onclick="del('aquariums','${a.id}',aquariums)">Borrar</button></div>
  </div>`).join("") || msg("Sin acuarios.")}</section>`);
}

function aquariumForm(){
  set(`<section class="card"><button onclick="aquariums()">â†‘ Volver</button><h2>Acuario completo</h2>
    <h3>Identidad</h3>
    <div class="grid2"><div><label>Nombre</label><input id="name"></div><div><label>Tipo</label><select id="aquarium_type"><option>marino</option><option>dulce</option><option>salobre</option><option>hospital</option><option>cuarentena</option><option>otro</option></select></div></div>
    <label>Subtipo</label><input id="aquarium_subtype" placeholder="Reef, FOWLR, comunitario, crÃ­a...">
    <div class="grid2"><div><label>UbicaciÃ³n</label><input id="location"></div><div><label>Estado</label><select id="status"><option>activo</option><option>ciclando</option><option>madurando</option><option>enfermo</option><option>tratamiento</option><option>cuarentena</option><option>desmontado</option></select></div></div>
    <div class="grid2"><div><label>Fecha montaje</label><input id="setup_date" type="date"></div><div><label>Inicio ciclado</label><input id="cycling_start_date" type="date"></div></div>
    <label>Objetivo</label><textarea id="objective"></textarea>
    <h3>Urna principal</h3>
    <div class="grid4">
      <div><label>Largo cm</label><input id="display_length_cm" type="number" oninput="refreshAquariumCalc()"></div>
      <div><label>Ancho cm</label><input id="display_width_cm" type="number" oninput="refreshAquariumCalc()"></div>
      <div><label>Alto total cm</label><input id="display_height_cm" type="number" oninput="refreshAquariumCalc()"></div>
      <div><label>Alto real agua cm</label><input id="display_water_height_cm" type="number" oninput="refreshAquariumCalc()"></div>
    </div>
    <div class="grid2"><div><label>Litros manuales corregidos</label><input id="display_manual_liters" type="number" oninput="refreshAquariumCalc()"></div><div><label>Desplazamiento roca/arena L</label><input id="estimated_displacement_liters" type="number" oninput="refreshAquariumCalc()"></div></div>
    <h3>Sump</h3>
    <label><input id="sump_enabled" type="checkbox" onchange="refreshAquariumCalc()"> Tiene sump</label>
    <div class="grid4"><div><label>Largo</label><input id="sump_length_cm" type="number" oninput="refreshAquariumCalc()"></div><div><label>Ancho</label><input id="sump_width_cm" type="number" oninput="refreshAquariumCalc()"></div><div><label>Alto total</label><input id="sump_height_cm" type="number" oninput="refreshAquariumCalc()"></div><div><label>Alto agua</label><input id="sump_water_height_cm" type="number" oninput="refreshAquariumCalc()"></div></div>
    <h3>Urna de relleno / ATO</h3>
    <label><input id="ato_enabled" type="checkbox" onchange="refreshAquariumCalc()"> Tiene urna de relleno</label>
    <div class="grid4"><div><label>Largo</label><input id="ato_length_cm" type="number" oninput="refreshAquariumCalc()"></div><div><label>Ancho</label><input id="ato_width_cm" type="number" oninput="refreshAquariumCalc()"></div><div><label>Alto</label><input id="ato_height_cm" type="number" oninput="refreshAquariumCalc()"></div><div><label>Alto Ãºtil</label><input id="ato_useful_height_cm" type="number" oninput="refreshAquariumCalc()"></div></div>
    <div class="grid2"><div><label>Tipo agua relleno</label><input id="ato_water_type" placeholder="Ã³smosis, salada..."></div><div><label>EvaporaciÃ³n L/dÃ­a</label><input id="ato_daily_evaporation_liters" type="number" oninput="refreshAquariumCalc()"></div></div>
    <div id="calcBox">${msg("Introduce medidas para calcular litros automÃ¡ticamente.")}</div>
    <h3>Objetivos</h3>
    <div class="grid4"><div><label>Temp objetivo</label><input id="target_temperature_c" type="number"></div><div><label>Salinidad ppt</label><input id="target_salinity_ppt" type="number"></div><div><label>Densidad</label><input id="target_specific_gravity" type="number" step="0.001"></div><div><label>Foto portada</label><input id="photo" type="file" accept="image/*"></div></div>
    <label>DescripciÃ³n </label><textarea id="description"></textarea>
    <button class="primary" onclick="saveAquarium()">Guardar acuario</button><div id="m"></div>
  </section>`);
}

async function saveAquarium(){
  try{
    const photo = await upload("aquarium-photos","photo");
    const row = {
      user_id:user.id,name:val("name"),aquarium_type:val("aquarium_type"),aquarium_subtype:val("aquarium_subtype"),
      status:val("status"),location:val("location"),setup_date:val("setup_date")||null,cycling_start_date:val("cycling_start_date")||null,
      objective:val("objective"),description:val("description"),cover_photo_url:photo,
      display_length_cm:num("display_length_cm"),display_width_cm:num("display_width_cm"),display_height_cm:num("display_height_cm"),display_water_height_cm:num("display_water_height_cm"),
      display_manual_liters:num("display_manual_liters"),estimated_displacement_liters:num("estimated_displacement_liters"),
      sump_enabled:checked("sump_enabled"),sump_length_cm:num("sump_length_cm"),sump_width_cm:num("sump_width_cm"),sump_height_cm:num("sump_height_cm"),sump_water_height_cm:num("sump_water_height_cm"),
      ato_enabled:checked("ato_enabled"),ato_length_cm:num("ato_length_cm"),ato_width_cm:num("ato_width_cm"),ato_height_cm:num("ato_height_cm"),ato_useful_height_cm:num("ato_useful_height_cm"),ato_water_type:val("ato_water_type"),ato_daily_evaporation_liters:num("ato_daily_evaporation_liters"),
      target_temperature_c:num("target_temperature_c"),target_salinity_ppt:num("target_salinity_ppt"),target_specific_gravity:num("target_specific_gravity"),
      ai_summary:"Pendiente de datos reales para anÃ¡lisis contextual.", ai_risk_level:"unknown"
    };
    const {data,error}=await supa.from("aquariums").insert(row).select().single();
    if(error) throw error;
    await hist(data.id,"aquariums",data.id,"create","Acuario creado",row);
    aquariums();
  }catch(e){ $("m").innerHTML = msg(e.message,"error"); }
}

async function openAquarium(id){
  const {data,error}=await supa.from("aquariums").select("*").eq("id",id).eq("user_id",user.id).single();
  if(error) return set(msg(error.message,"error"));
  currentAquarium=data; aquariumPanel();
}
function aqMenu(){
  return `<section class="card"><button onclick="aquariums()">â† Acuarios</button><h2>${esc(currentAquarium.name)}</h2>
  <p><b>Total:</b> ${esc(currentAquarium.total_real_liters??"-")} L Â· <b>Urna:</b> ${esc(currentAquarium.display_real_liters??"-")} L Â· <b>Sump:</b> ${esc(currentAquarium.sump_real_liters??"-")} L Â· <b>Relleno:</b> ${esc(currentAquarium.ato_useful_liters??"-")} L</p>
  <div class="grid">
    <button onclick="parameters()">ParÃ¡metros</button><button onclick="animals()">Animales</button><button onclick="hospital()">Hospital</button>
    <button onclick="photos()">Fotos</button><button onclick="tasks()">Tareas</button><button onclick="historyView()">Historial</button>
    <button onclick="aiContext()">IA contexto</button><button onclick="inventory()">Inventario</button><button onclick="home()">Principal</button>
  </div></section>`;
}
function aquariumPanel(){ set(aqMenu()+`<section class="card"><h2>Ficha actual</h2><p>${esc(currentAquarium.description||"")}</p><p class="notice">${esc(currentAquarium.ai_summary||‰M¥¸%Ñ½‘…Ûµ„¸ˆ¥ôğ½Àøğ½Í•Ñ¥½¸ù€¤ìô()…Íå¹Œ™Õ¹Ñ¥½¸Á…É…µ•Ñ•ÉÌ ¥ì(€½¹ÍĞí‘…Ñ…ôõ…İ…¥ĞÍÕÁ„¹™É½´ ‰Á…É…µ•Ñ•É}É•…‘¥¹Ìˆ¤¹Í•±•Ğ ˆ¨ˆ¤¹•Ä ‰…ÅÕ…É¥Õµ}¥ˆ±ÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥¤¹½É‘•È ‰µ•…ÍÕÉ•‘}…Ğˆ±í…Í•¹‘¥¹œé™…±Í•ô¤¹±¥µ¥Ğ àÀ¤ì(€Í•Ğ¡…Å5•¹Ô ¤­€ñÍ•Ñ¥½¸±…ÍÌô‰…Éˆøñ ÈùA…Ë…µ•ÑÉ½Ìğ½ Èø(€€ñ‘¥Ø±…ÍÌô‰É¥Èˆøñ‘¥Øøñ±…‰•°ùA…É…µ•ÑÉ¼ğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰Á…É…µ•Ñ•É}¹…µ”ˆÁ±…•¡½±‘•Èô‰A<Ğ°9<Ì°- ¸¸¸ˆøğ½‘¥Øøñ‘¥Øøñ±…‰•°ù½µÁ…É…‘½Èğ½±…‰•°øñÍ•±•Ğ¥ô‰½µÁ…É…Ñ½Èˆøñ½ÁÑ¥½¸øôğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ø™±Ğìğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ø™Ğìğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ø™±Ğìôğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ø™Ğìôğ½½ÁÑ¥½¸øğ½Í•±•Ğøğ½‘¥Øøğ½‘¥Øø(€€ñ‘¥Ø±…ÍÌô‰É¥Èˆøñ‘¥Øøñ±…‰•°ùY…±½Èğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰Ù…±Õ”ˆÑåÁ”ô‰¹Õµ‰•ÈˆÍÑ•ÀôˆÀ¸ÀÀÄˆøğ½‘¥Øøñ‘¥Øøñ±…‰•°ùU¹¥‘…ğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰Õ¹¥ĞˆÁ±…•¡½±‘•Èô‰ÁÁ´°‘- ¸¸¸ˆøğ½‘¥Øøğ½‘¥Øø(€€ñ‘¥Ø±…ÍÌô‰É¥Èˆøñ‘¥Øøñ±…‰•°ù!…¹¹„ÍÍ™½É¼U1HÁÁˆ@ğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰¡…¹¹…}Á¡½ÍÁ¡½ÉÕÍ}Õ±É}ÁÁ‰}ÀˆÑåÁ”ô‰¹Õµ‰•ÈˆÍÑ•ÀôˆÀ¸ÀÄˆøğ½‘¥Øøñ‘¥Øøñ±…‰•°ù7¥Ñ½‘¼½Ñ•ÍĞğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰Ñ•ÍÑ}µ•Ñ¡½ˆøğ½‘¥Øøğ½‘¥Øø(€€ñ±…‰•°ù9½Ñ…Ìğ½±…‰•°øñÑ•áÑ…É•„¥ô‰¹½Ñ•Ìˆøğ½Ñ•áÑ…É•„øñ±…‰•°ù½Ñ¼Ñ•ÍĞğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰Á¡½Ñ¼ˆÑåÁ”ô‰™¥±”ˆ…•ÁĞô‰¥µ…”¼¨ˆø(€€ñ‰ÕÑÑ½¸±…ÍÌô‰ÁÉ¥µ…Éäˆ½¹±¥¬ô‰Í…Ù•A…É…µ•Ñ•È ¤ˆùÕ…É‘…ÈÁ…Ë…µ•ÑÉ¼ğ½‰ÕÑÑ½¸øñ‘¥Ø¥ô‰´ˆøğ½‘¥Øøñ¡Èø(€€‘ì¡‘…Ñ…ññmt¤¹µ…À¡àôù€ñ‘¥Ø±…ÍÌô‰¥Ñ•´ˆøñˆø‘í•ÍŒ¡à¹Á…É…µ•Ñ•É}¹…µ”¥ôğ½ˆø€‘í•ÍŒ¡à¹½µÁ…É…Ñ½È¥ô€‘í•ÍŒ¡à¹Ù…±Õ”üüˆ´ˆ¥ô€‘í•ÍŒ¡à¹Õ¹¥Ññğˆˆ¥ôñÀ±…ÍÌô‰Íµ…±°ˆø‘í¹•Ü…Ñ”¡à¹µ•…ÍÕÉ•‘}…Ğ¤¹Ñ½1½…±•MÑÉ¥¹œ ¥ôƒ
Ü€‘í•ÍŒ¡à¹Ñ•ÍÑ}µ•Ñ¡½‘ñğˆˆ¥ôğ½ÀøñÀø‘í•ÍŒ¡à¹…¥}¥¹Ñ•ÉÁÉ•Ñ…Ñ¥½¹ññà¹¹½Ñ•Íñğˆˆ¥ôğ½Àøğ½‘¥Øù€¤¹©½¥¸ ˆˆ¥ññµÍœ ‰M¥¸Á…Ë…µ•ÑÉ½Ì¸ˆ¥ôğ½Í•Ñ¥½¸ù€¤ì)ô)…Íå¹Œ™Õ¹Ñ¥½¸Í…Ù•A…É…µ•Ñ•È ¥ì(€ÑÉåì(€€€½¹ÍĞÁ¡½Ñ¼õ…İ…¥ĞÕÁ±½… ‰Á…É…µ•Ñ•ÈµÁ¡½Ñ½Ìˆ°‰Á¡½Ñ¼ˆ¤ì(€€€½¹ÍĞÉ½ÜõíÕÍ•É}¥éÕÍ•È¹¥±…ÅÕ…É¥Õµ}¥éÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥±…ÅÕ…É¥Õµ}ÑåÁ•}Í¹…ÁÍ¡½ĞéÕÉÉ•¹ÑÅÕ…É¥Õ´¹…ÅÕ…É¥Õµ}ÑåÁ”±Á…É…µ•Ñ•É}¹…µ”éÙ…° ‰Á…É…µ•Ñ•É}¹…µ”ˆ¤±½µÁ…É…Ñ½ÈéÙ…° ‰½µÁ…É…Ñ½Èˆ¤±Ù…±Õ”é¹Õ´ ‰Ù…±Õ”ˆ¤±Õ¹¥ĞéÙ…° ‰Õ¹¥Ğˆ¤±¡…¹¹…}Á¡½ÍÁ¡½ÉÕÍ}Õ±É}ÁÁ‰}Àé¹Õ´ ‰¡…¹¹…}Á¡½ÍÁ¡½ÉÕÍ}Õ±É}ÁÁ‰}Àˆ¤±Ñ•ÍÑ}µ•Ñ¡½éÙ…° ‰Ñ•ÍÑ}µ•Ñ¡½ˆ¤±¹½Ñ•ÌéÙ…° ‰¹½Ñ•Ìˆ¤±Á¡½Ñ½}ÕÉ°éÁ¡½Ñ¼±…¥}¥¹Ñ•ÉÁÉ•Ñ…Ñ¥½¸è‰%Á•¹‘¥•¹Ñ”‘”ÉÕé…È½¸¡¥ÍÓÍÉ¥¼ä…¹¥µ…±•Ì¸ˆ±…¥}…±•ÉÑ}±•Ù•°è‰Õ¹­¹½İ¸‰ôì(€€€½¹ÍĞí‘…Ñ„±•ÉÉ½Éôõ…İ…¥ĞÍÕÁ„¹™É½´ ‰Á…É…µ•Ñ•É}É•…‘¥¹Ìˆ¤¹¥¹Í•ÉĞ¡É½Ü¤¹Í•±•Ğ ¤¹Í¥¹±” ¤ì¥˜¡•ÉÉ½È¤Ñ¡É½Ü•ÉÉ½Èì(€€€…İ…¥Ğ¡¥ÍĞ¡ÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥°‰Á…É…µ•Ñ•É}É•…‘¥¹Ìˆ±‘…Ñ„¹¥°‰É•…Ñ”ˆ°‰A…Ë…µ•ÑÉ¼É•¥ÍÑÉ…‘¼ˆ±É½Ü¤ìÁ…É…µ•Ñ•ÉÌ ¤ì(€õ…Ñ ¡”¥ì€ ‰´ˆ¤¹¥¹¹•É!Q50õµÍœ¡”¹µ•ÍÍ…”°‰•ÉÉ½Èˆ¤ìô)ô()…Íå¹Œ™Õ¹Ñ¥½¸…¹¥µ…±Ì ¥ì(€½¹ÍĞí‘…Ñ…ôõ…İ…¥ĞÍÕÁ„¹™É½´ ‰…¹¥µ…±Ìˆ¤¹Í•±•Ğ ˆ¨ˆ¤¹•Ä ‰…ÅÕ…É¥Õµ}¥ˆ±ÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥¤¹½É‘•È ‰É•…Ñ•‘}…Ğˆ±í…Í•¹‘¥¹œé™…±Í•ô¤ì(€Í•Ğ¡…Å5•¹Ô ¤­€ñÍ•Ñ¥½¸±…ÍÌô‰…Éˆøñ Èù¹¥µ…±•Ìğ½ Èø(€€ñ‘¥Ø±…ÍÌô‰É¥Èˆøñ‘¥Øøñ±…‰•°ùQ¥Á¼ğ½±…‰•°øñÍ•±•Ğ¥ô‰…¹¥µ…±}ÑåÁ”ˆøñ½ÁÑ¥½¸ùÁ•èğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ù½É…°ğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ù¥¹Ù•ÉÑ•‰É…‘¼ğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ùÉÕÍÓ…•¼ğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ùµ½±ÕÍ¼ğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ù½ÑÉ¼ğ½½ÁÑ¥½¸øğ½Í•±•Ğøğ½‘¥Øøñ‘¥Øøñ±…‰•°ù…¹Ñ¥‘…ğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰ÅÕ…¹Ñ¥ÑäˆÑåÁ”ô‰¹Õµ‰•ÈˆÙ…±Õ”ôˆÄˆøğ½‘¥Øøğ½‘¥Øø(€€ñ‘¥Ø±…ÍÌô‰É¥Èˆøñ‘¥Øøñ±…‰•°ù9½µ‰É”½·é¸ğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰½µµ½¹}¹…µ”ˆøğ½‘¥Øøñ‘¥Øøñ±…‰•°ù9½µ‰É”¥•¹Óµ™¥¼ğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰Í¥•¹Ñ¥™¥}¹…µ”ˆøğ½‘¥Øøğ½‘¥Øø(€€ñ‘¥Ø±…ÍÌô‰É¥Ğˆøñ‘¥Øøñ±…‰•°ùµ„ğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰•¹ÑÉå}‘…äˆÑåÁ”ô‰¹Õµ‰•Èˆøğ½‘¥Øøñ‘¥Øøñ±…‰•°ù5•Ìğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰•¹ÑÉå}µ½¹Ñ ˆÑåÁ”ô‰¹Õµ‰•Èˆøğ½‘¥Øøñ‘¥Øøñ±…‰•°ùÅ¼ğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰•¹ÑÉå}å•…ÈˆÑåÁ”ô‰¹Õµ‰•Èˆøğ½‘¥Øøñ‘¥Øøñ±…‰•°ùÍÑ…‘¼ğ½±…‰•°øñÍ•±•Ğ¥ô‰ÍÑ…ÑÕÌˆøñ½ÁÑ¥½¸ù…Ñ¥Ù¼ğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ù•¹™•Éµ¼ğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ù½‰Í•ÉÙ…§Í¸ğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ùµÕ•ÉÑ¼ğ½½ÁÑ¥½¸øñ½ÁÑ¥½¸ù‘•Í…Á…É•¥‘¼ğ½½ÁÑ¥½¸øğ½Í•±•Ğøğ½‘¥Øøğ½‘¥Øø(€€ñ±…‰•°ù±¥µ•¹Ñ…§Í¸ğ½±…‰•°øñÑ•áÑ…É•„¥ô‰™••‘¥¹œˆøğ½Ñ•áÑ…É•„øñ±…‰•°ù½µÁ…Ñ¥‰¥±¥‘…ğ½±…‰•°øñÑ•áÑ…É•„¥ô‰½µÁ…Ñ¥‰¥±¥Ñäˆøğ½Ñ•áÑ…É•„øñ±…‰•°ù=‰Í•ÉÙ…¥½¹•Ìğ½±…‰•°øñÑ•áÑ…É•„¥ô‰¹½Ñ•Ìˆøğ½Ñ•áÑ…É•„ø(€€ñ±…‰•°ù½Ñ¼ğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰Á¡½Ñ¼ˆÑåÁ”ô‰™¥±”ˆ…•ÁĞô‰¥µ…”¼¨ˆø(€€ñ‰ÕÑÑ½¸±…ÍÌô‰ÁÉ¥µ…Éäˆ½¹±¥¬ô‰Í…Ù•¹¥µ…° ¤ˆùÕ…É‘…È…¹¥µ…°ğ½‰ÕÑÑ½¸øñ‘¥Ø¥ô‰´ˆøğ½‘¥Øøñ¡Èø(€€‘íì¡‘…Ñ…ññmt¤¹µ…À¡„ôù€ñ‘¥Ø±…ÍÌô‰¥Ñ•´ˆøñ Ìø‘í•ÍŒ¡„¹½µµ½¹}¹…µ•ñğ‰¹¥µ…°ˆ¥ôğ½ ÌøñÀø‘í•ÍŒ¡„¹Í¥•¹Ñ¥™¥}¹…µ•ñğˆˆ¥ôƒ
Ü€‘í•ÍŒ¡„¹ÍÑ…ÑÕÍñğˆˆ¥ôƒ
Ü€‘í•ÍŒ¡„¹ÅÕ…¹Ñ¥Ñä¥ôÕ¸ğ½Àø‘í„¹Á¡½Ñ½}ÕÉ°ı€ñ¥µœ±…ÍÌô‰Á¡½Ñ¼ˆÍÉŒôˆ‘í•ÍŒ¡„¹Á¡½Ñ½}ÕÉ°¥ôˆù€èˆ‰ôñÀø‘í•ÍŒ¡„¹…¥}…É•}ÍÕµµ…Éåññ„¹¹½Ñ•Íñğˆˆ¥ôğ½Àøğ½‘¥Øù€¤¹©½¥¸ ˆˆ¥ññµÍœ ‰M¥¸…¹¥µ…±•Ì¸ˆ¥ôğ½Í•Ñ¥½¸ù€¤ì)ô)…Íå¹Œ™Õ¹Ñ¥½¸Í…Ù•¹¥µ…° ¥ì(€ÑÉåì(€€€½¹ÍĞÁ¡½Ñ¼õ…İ…¥ĞÕÁ±½… ‰…¹¥µ…°µÁ¡½Ñ½Ìˆ°‰Á¡½Ñ¼ˆ¤ì(€€€½¹ÍĞÉ½ÜõíÕÍ•É}¥éÕÍ•È¹¥±…ÅÕ…É¥Õµ}¥éÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥±…¹¥µ…±}ÑåÁ”éÙ…° ‰…¹¥µ…±}ÑåÁ”ˆ¤±½µµ½¹}¹…µ”éÙ…° ‰½µµ½¹}¹…µ”ˆ¤±Í¥•¹Ñ¥™¥}¹…µ”éÙ…° ‰Í¥•¹Ñ¥™¥}¹…µ”ˆ¤±ÅÕ…¹Ñ¥Ñäé¹Õ´ ‰ÅÕ…¹Ñ¥Ñäˆ¥ñğÄ±•¹ÑÉå}‘…äé¹Õ´ ‰•¹ÑÉå}‘…äˆ¤±•¹ÑÉå}µ½¹Ñ é¹Õ´ ‰•¹ÑÉå}µ½¹Ñ ˆ¤±•¹ÑÉå}å•…Èé¹Õ´ ‰•¹ÑÉå}å•…Èˆ¤±ÍÑ…ÑÕÌéÙ…° ‰ÍÑ…ÑÕÌˆ¤±™••‘¥¹œéÙ…° ‰™••‘¥¹œˆ¤±½µÁ…Ñ¥‰¥±¥ÑäéÙ…° ‰½µÁ…Ñ¥‰¥±¥Ñäˆ¤±¹½Ñ•ÌéÙ…° ‰¹½Ñ•Ìˆ¤±Á¡½Ñ½}ÕÉ°éÁ¡½Ñ¼±…¥}…É•}ÍÕµµ…Éäè‰%Á•¹‘¥•¹Ñ”‘”¥‘•¹Ñ¥™¥…§Í¸Á½È™½Ñ¼½™¥¡„¸‰ôì(€€€½¹ÍĞí‘…Ñ„±•ÉÉ½Éôõ…İ…¥ĞÍÕÁ„¹™É½´ ‰…¹¥µ…±Ìˆ¤¹¥¹Í•ÉĞ¡É½Ü¤¹Í•±•Ğ ¤¹Í¥¹±” ¤ì¥˜¡•ÉÉ½È¤Ñ¡É½Ü•ÉÉ½Èì(€€€…İ…¥Ğ¡¥ÍĞ¡ÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥°‰…¹¥µ…±Ìˆ±‘…Ñ„¹¥°‰É•…Ñ”ˆ°‰¹¥µ…°É•¥ÍÑÉ…‘¼ˆ±É½Ü¤ì…¹¥µ…±Ì ¤ì(€õ…Ñ ¡”¥ì€ ‰´ˆ¤¹¥¹¹•É!Q50õµÍœ¡”¹µ•ÍÍ…”°‰•ÉÉ½Èˆ¤ìô)ô()™Õ¹Ñ¥½¸Í¥µÁ±•5½‘Õ±”¡Ñ¥Ñ±”°Ñ…‰±”°™¥•±‘Ì°‰Õ­•Ğõ¹Õ±°°Í½Á”ô‰…ÅÕ…É¥Õ´ˆ¥ì(€Í•Ğ ¡Í½Á”ôôô‰…ÅÕ…É¥Õ´ˆı…Å5•¹Ô ¤éµ…¥¹5•¹Ô ¤¤­€ñÍ•Ñ¥½¸±…ÍÌô‰…Éˆøñ Èø‘í•ÍŒ¡Ñ¥Ñ±”¥ôğ½ Èø(€€‘í™¥•±‘Ì¹µ…À¡˜ôù€ñ±…‰•°ø‘í•ÍŒ¡˜¹±…‰•°¥ôğ½±…‰•°ø‘í˜¹…É•„ı€ñÑ•áÑ…É•„¥ôˆ‘í˜¹¥‘ôˆøğ½Ñ•áÑ…É•„ù€é€ñ¥¹ÁÕĞ¥ôˆ‘í˜¹¥‘ôˆÑåÁ”ôˆ‘í˜¹ÑåÁ•ñğ‰Ñ•áĞ‰ôˆùõ€¤¹©½¥¸ ˆˆ¥ô(€€‘í‰Õ­•Ğı€ñ±…‰•°ù½Ñ¼ğ½±…‰•°øñ¥¹ÁÕĞ¥ô‰Á¡½Ñ¼ˆÑåÁ”ô‰™¥±”ˆ…•ÁĞô‰¥µ…”¼¨ˆù€èˆ‰ô(€€ñ‰ÕÑÑ½¸±…ÍÌô‰ÁÉ¥µ…Éäˆ½¹±¥¬ôÍ…Ù•M¥µÁ±” ‘í)M=8¹ÍÑÉ¥¹¥™ä¡Ñ¥Ñ±”¥ô°‘í)M=8¹ÍÑÉ¥¹¥™ä¡Ñ…‰±”¥ô°‘í)M=8¹ÍÑÉ¥¹¥™ä¡™¥•±‘Ì¥ô°‘í)M=8¹ÍÑÉ¥¹¥™ä¡‰Õ­•Ğ¥ô°‘í)M=8¹ÍÑÉ¥¹¥™ä¡Í½Á”¥ô¤œùÕ…É‘…Èğ½‰ÕÑÑ½¸øñ‘¥Ø¥ô‰´ˆøğ½‘¥Øøñ¡Èøñ‘¥Ø¥ô‰±¥ÍĞˆøğ½‘¥Øøğ½Í•Ñ¥½¸ù€¤ì(€±¥ÍÑM¥µÁ±”¡Ñ…‰±”±Í½Á”¤ì)ô)…Íå¹Œ™Õ¹Ñ¥½¸±¥ÍÑM¥µÁ±”¡Ñ…‰±”±Í½Á”¥ì(€±•ĞÄõÍÕÁ„¹™É½´¡Ñ…‰±”¤¹Í•±•Ğ ˆ¨ˆ¤¹•Ä ‰ÕÍ•É}¥ˆ±ÕÍ•È¹¥¤¹½É‘•È ‰É•…Ñ•‘}…Ğˆ±í…Í•¹‘¥¹œé™…±Í•ô¤ì(€¥˜¡Í½Á”ôôô‰…ÅÕ…É¥Õ´ˆ¤ÄõÄ¹•Ä ‰…ÅÕ…É¥Õµ}¥ˆ±ÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥¤ì(€½¹ÍĞí‘…Ñ„±•ÉÉ½Éôõ…İ…¥ĞÄì(€¥˜¡•ÉÉ½È¥ì€ ‰±¥ÍĞˆ¤¹¥¹¹•É!Q50õµÍœ¡•ÉÉ½È¹µ•ÍÍ…”°‰•ÉÉ½Èˆ¤ìÉ•ÑÕÉ¸ìô(€€ ‰±¥ÍĞˆ¤¹¥¹¹•É!Q50ô¡‘…Ñ…ññmt¤¹µ…À¡àôù€ñ‘¥Ø±…ÍÌô‰¥Ñ•´ˆøñ Ìø‘í•ÍŒ¡à¹Ñ¥Ñ±•ññà¹ÁÉ½‘ÕÑ}¹…µ•ññà¹Õ±ÑÕÉ•}ÑåÁ•ññà¹‘•ÍÉ¥ÁÑ¥½¹ññà¹¡½Ñ½}ÑåÁ•ñğ‰I•¥ÍÑÉ¼ˆ¥ôğ½ ÌøñÀø‘í•ÍŒ¡à¹‘•ÍÉ¥ÁÑ¥½¹ññà¹…ÁÑ¥½¹ññà¹¹½Ñ•Íññà¹ÍåµÁÑ½µÍññà¹…¥}ÍÕµµ…Éåñğˆˆ¥ôğ½Àø‘íà¹Á¡½Ñ½}ÕÉ°ı€ñ¥µœ±…ÍÌô‰Á¡½Ñ¼ˆÍÉŒôˆ‘í•ÍŒ¡à¹Á¡½Ñ½}ÕÉ°¥ôˆù€èˆ‰ôğ½‘¥Øù€¤¹©½¥¸ ˆˆ¥ññµÍœ ‰M¥¸É•¥ÍÑÉ½Ì¸ˆ¤ì)ô)…Íå¹Œ™Õ¹Ñ¥½¸Í…Ù•M¥µÁ±”¡Ñ¥Ñ±”±Ñ…‰±”±™¥•±‘Ì±‰Õ­•Ğ±Í½Á”¥ì(€ÑÉåì(€€€½¹ÍĞÉ½ÜõíÕÍ•É}¥éÕÍ•È¹¥‘ôì(€€€¥˜¡Í½Á”ôôô‰…ÅÕ…É¥Õ´ˆ¤É½Ü¹…ÅÕ…É¥Õµ}¥õÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥ì(€€€™¥•±‘Ì¹™½É… ¡˜ôùÉ½İm˜¹¥‘tõ˜¹¹Õ´ı¹Õ´¡˜¹¥¤éÙ…°¡˜¹¥¤¤ì(€€€¥˜¡‰Õ­•Ğ¤É½Ü¹Á¡½Ñ½}ÕÉ°õ…İ…¥ĞÕÁ±½…¡‰Õ­•Ğ°‰Á¡½Ñ¼ˆ¤ì(€€€½¹ÍĞí‘…Ñ„±•ÉÉ½Éôõ…İ…¥ĞÍÕÁ„¹™É½´¡Ñ…‰±”¤¹¥¹Í•ÉĞ¡É½Ü¤¹Í•±•Ğ ¤¹Í¥¹±” ¤ì¥˜¡•ÉÉ½È¤Ñ¡É½Ü•ÉÉ½Èì(€€€…İ…¥Ğ¡¥ÍĞ¡Í½Á”ôôô‰…ÅÕ…É¥Õ´ˆıÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥é¹Õ±°±Ñ…‰±”±‘…Ñ„¹¥°‰É•…Ñ”ˆ±€‘íÑ¥Ñ±•ôÕ…É‘…‘½€±É½Ü¤ì(€€€Í¥µÁ±•5½‘Õ±”¡Ñ¥Ñ±”±Ñ…‰±”±™¥•±‘Ì±‰Õ­•Ğ±Í½Á”¤ì(€õ…Ñ ¡”¥ì€ ‰´ˆ¤¹¥¹¹•É!Q50õµÍœ¡”¹µ•ÍÍ…”°‰•ÉÉ½Èˆ¤ìô)ô()™Õ¹Ñ¥½¸¡½ÍÁ¥Ñ…° ¥íÍ¥µÁ±•5½‘Õ±” ‰!½ÍÁ¥Ñ…°€¼QÉ…Ñ…µ¥•¹Ñ½Ìˆ°‰¡½ÍÁ¥Ñ…±}…Í•Ìˆ±mí¥è‰Ñ¥Ñ±”ˆ±±…‰•°è‰SµÑÕ±¼‰ô±í¥è‰ÍåµÁÑ½µÌˆ±±…‰•°è‰O¹Ñ½µ…Ìˆ±…É•„éÑÉÕ•ô±í¥è‰ÍÕÍÁ•Ñ•‘}‘¥…¹½Í¥Ìˆ±±…‰•°è‰¥…»ÍÍÑ¥¼Í½ÍÁ•¡…‘¼ˆ±…É•„éÑÉÕ•ô±í¥è‰Í•Ù•É¥Ñäˆ±±…‰•°è‰É…Ù•‘…‰ô±í¥è‰¹½Ñ•Ìˆ±±…‰•°è‰9½Ñ…Ìˆ±…É•„éÑÉÕ•õt°‰¡½ÍÁ¥Ñ…°µÁ¡½Ñ½Ìˆ¤íô)™Õ¹Ñ¥½¸Á¡½Ñ½Ì ¥íÍ¥µÁ±•5½‘Õ±” ‰½Ñ½Ìˆ°‰Á¡½Ñ½Ìˆ±mí¥è‰Á¡½Ñ½}ÑåÁ”ˆ±±…‰•°è‰Q¥Á¼‰ô±í¥è‰…ÁÑ¥½¸ˆ±±…‰•°è‰9½Ñ…Ìˆ±…É•„éÑÉÕ•ô±í¥è‰Ñ…Ìˆ±±…‰•°è‰Ñ¥ÅÕ•Ñ…Ì‰õt°‰…ÅÕ…É¥Õ´µÁ¡½Ñ½Ìˆ¤íô)™Õ¹Ñ¥½¸Ñ…Í­Ì ¥íÍ¥µÁ±•5½‘Õ±” ‰Q…É•…Ìˆ°‰Ñ…Í­Ìˆ±mí¥è‰Ñ…Í­}ÑåÁ”ˆ±±…‰•°è‰Q¥Á¼‰ô±í¥è‰Ñ¥Ñ±”ˆ±±…‰•°è‰SµÑÕ±¼‰ô±í¥è‰¹½Ñ•Ìˆ±±…‰•°è‰9½Ñ…Ìˆ±…É•„éÑÉÕ•ô±í¥è‰‘Õ•}…Ğˆ±±…‰•°è‰•¡„½¡½É„ˆ±ÑåÁ”è‰‘…Ñ•Ñ¥µ”µ±½…°‰õt±¹Õ±°¤íô)™Õ¹Ñ¥½¸¥¹Ù•¹Ñ½Éä ¥íÍ¥µÁ±•5½‘Õ±” ‰%¹Ù•¹Ñ…É¥¼Ó¥¹¥¼ˆ°‰¥¹Ù•¹Ñ½Éå}ÁÉ½‘ÕÑÌˆ±mí¥è‰ÁÉ½‘ÕÑ}¹…µ”ˆ±±…‰•°è‰AÉ½‘ÕÑ¼‰ô±í¥è‰‰É…¹ˆ±±…‰•°è‰5…É„‰ô±í¥è‰…Ñ•½Éäˆ±±…‰•°è‰…Ñ•½Ëµ„‰ô±í¥è‰ÅÕ…¹Ñ¥Ñå}ÕÉÉ•¹Ğˆ±±…‰•°è‰…¹Ñ¥‘…ˆ±¹Õ´éÑÉÕ•ô±í¥è‰ÅÕ…¹Ñ¥Ñå}Õ¹¥Ğˆ±±…‰•°è‰U¹¥‘…‰ô±í¥è‰•áÁ¥É…Ñ¥½¹}‘…Ñ”ˆ±±…‰•°è‰…‘Õ¥‘…ˆ±ÑåÁ”è‰‘…Ñ”‰ô±í¥è‰‘½Í…”ˆ±±…‰•°è‰½Í¥Ìˆ±…É•„éÑÉÕ•ô±í¥è‰İ…É¹¥¹Ìˆ±±…‰•°è‰Ù¥Í½Ìˆ±…É•„éÑÉÕ•ô±í¥è‰µ…¹Õ™…ÑÕÉ•É}ÕÉ°ˆ±±…‰•°è‰Õ•¹Ñ”™…‰É¥…¹Ñ”‰õt°‰ÁÉ½‘ÕĞµÁ¡½Ñ½Ìˆ°‰±½‰…°ˆ¤íô)™Õ¹Ñ¥½¸µ¥É½™…Õ¹„ ¥íÍ¥µÁ±•5½‘Õ±” ‰5¥É½™…Õ¹„ˆ°‰µ¥É½™…Õ¹…}Õ±ÑÕÉ•Ìˆ±mí¥è‰Õ±ÑÕÉ•}ÑåÁ”ˆ±±…‰•°è‰Q¥Á¼Õ±Ñ¥Ù¼‰ô±í¥è‰ÍÑÉ…¥¹}ÍÁ•¥•Ìˆ±±…‰•°è‰•Á„½•ÍÁ•¥”‰ô±í¥è‰Ù½±Õµ•}±¥Ñ•ÉÌˆ±±…‰•°è‰Y½±Õµ•¸0ˆ±¹Õ´éÑÉÕ•ô±í¥è‰Í…±¥¹¥Ñå}ÁÁĞˆ±±…‰•°è‰M…±¥¹¥‘…ˆ±¹Õ´éÑÉÕ•ô±í¥è‰Ñ•µÁ•É…ÑÕÉ•}Œˆ±±…‰•°è‰Q•µÁ•É…ÑÕÉ„ˆ±¹Õ´éÑÉÕ•ô±í¥è‰™½½ˆ±±…‰•°è‰±¥µ•¹Ñ¼‰ô±í¥è‰ÁÉ½‘ÕÑ¥½¹}¹½Ñ•Ìˆ±±…‰•°è‰9½Ñ…Ìˆ±…É•„éÑÉÕ•õt°‰µ¥É½™…Õ¹„µÁ¡½Ñ½Ìˆ°‰±½‰…°ˆ¤íô)™Õ¹Ñ¥½¸±¥‰É…Éä ¥íÍ¥µÁ±•5½‘Õ±” ‰	¥‰±¥½Ñ•„ˆ°‰±¥‰É…Éå}•¹ÑÉ¥•Ìˆ±mí¥è‰•¹ÑÉå}ÑåÁ”ˆ±±…‰•°è‰Q¥Á¼‰ô±í¥è‰Ñ¥Ñ±”ˆ±±…‰•°è‰SµÑÕ±¼‰ô±í¥è‰Í¥•¹Ñ¥™¥}¹…µ”ˆ±±…‰•°è‰9½µ‰É”¥•¹Óµ™¥¼‰ô±í¥è‰‘•ÍÉ¥ÁÑ¥½¸ˆ±±…‰•°è‰•ÍÉ¥Á§Í¸ˆ±…É•„éÑÉÕ•ô±í¥è‰½µÁ…Ñ¥‰¥±¥Ñäˆ±±…‰•°è‰½µÁ…Ñ¥‰¥±¥‘…ˆ±…É•„éÑÉÕ•ô±í¥è‰É•™•É•¹•Í}Ñ•áĞˆ±±…‰•°è‰I•™•É•¹¥…Ìˆ±…É•„éÑÉÕ•õt°‰±¥‰É…ÉäµÁ¡½Ñ½Ìˆ°‰±½‰…°ˆ¤íô)™Õ¹Ñ¥½¸¡½ÍÁ¥Ñ…±±½‰…° ¥íÍ¥µÁ±•5½‘Õ±” ‰!½ÍÁ¥Ñ…°±½‰…°ˆ°‰¡½ÍÁ¥Ñ…±}…Í•Ìˆ±mí¥è‰Ñ¥Ñ±”ˆ±±…‰•°è‰SµÑÕ±¼‰ô±í¥è‰ÍåµÁÑ½µÌˆ±±…‰•°è‰Oµ¹Ñ½µ…Ìˆ±…É•„éÑÉÕ•ô±í¥è‰ÍÕÍÁ•Ñ•‘}‘¥…¹½Í¥Ìˆ±±…‰•°è‰¥…»ÍÍÑ¥¼ˆ±…É•„éÑÉÕ•ô±í¥è‰Í•Ù•É¥Ñäˆ±±…‰•°è‰É…Ù•‘…‰õt°‰¡½ÍÁ¥Ñ…°µÁ¡½Ñ½Ìˆ°‰±½‰…°ˆ¤íô)…Íå¹Œ™Õ¹Ñ¥½¸…±•ÉÑÌ ¥ì½¹ÍĞí‘…Ñ…ôõ…İ…¥ĞÍÕÁ„¹™É½´ ‰…±•ÉÑÌˆ¤¹Í•±•Ğ ˆ¨ˆ¤¹•Ä ‰ÕÍ•É}¥ˆ±ÕÍ•È¹¥¤¹½É‘•È ‰É•…Ñ•‘}…Ğˆ±í…Í•¹‘¥¹œé™…±Í•ô¤ìÍ•Ğ¡µ…¥¹5•¹Ô ¤­€ñÍ•Ñ¥½¸±…ÍÌô‰…Éˆøñ ÈùÙ¥Í½Ìğ½ Èø‘íì¡‘…Ñ…ññmt¤¹µ…À¡„ôù€ñ‘¥Ø±…ÍÌô‰¥Ñ•´ˆøñ Ìø‘í•ÍŒ¡„¹Ñ¥Ñ±”¥ôğ½ ÌøñÍÁ…¸±…ÍÌô‰‰…‘”ˆø‘í•ÍŒ¡„¹ÁÉ¥½É¥Ñä¥ôğ½ÍÁ…¸øñÀø‘í•ÍŒ¡„¹‘•ÍÉ¥ÁÑ¥½¹ñğˆˆ¥ôğ½Àøğ½‘¥Øù€¤¹©½¥¸ ˆˆ¥ññµÍœ ‰M¥¸…Ù¥Í½Ì¸ˆ¥ôğ½Í•Ñ¥½¸ù€¤ìô)…Íå¹Œ™Õ¹Ñ¥½¸¡¥ÍÑ½ÉåY¥•Ü ¥ì½¹ÍĞí‘…Ñ…ôõ…İ…¥ĞÍÕÁ„¹™É½´ ‰¡¥ÍÑ½Éå}•Ù•¹ÑÌˆ¤¹Í•±•Ğ ˆ¨ˆ¤¹•Ä ‰…ÅÕ…É¥Õµ}¥ˆ±ÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥¤¹½É‘•È ‰É•…Ñ•‘}…Ğˆ±í…Í•¹‘¥¹œé™…±Í•ô¤¹±¥µ¥Ğ ÄÀÀ¤ìÍ•Ğ¡…Å5•¹Ô ¤­€ñÍ•Ñ¥½¸±…ÍÌô‰…Éˆøñ Èù!¥ÍÑ½É¥…°ğ½ Èø‘ì¡‘…Ñ…ññmt¤¹µ…À¡ ôù€ñ‘¥Ø±…ÍÌô‰¥Ñ•´ˆøñ Ìø‘í•ÍŒ¡ ¹ÍÕµµ…Éä¥ôğ½ ÌøñÀ±…ÍÌô‰Íµ…±°ˆø‘í¹•Ü…Ñ”¡ ¹É•…Ñ•‘}…Ğ¤¹Ñ½1½…±•MÑÉ¥¹œ ¥ôƒ
Ü€‘í•ÍŒ¡ ¹Í½ÕÉ•}Ñ…‰±•ñğˆˆ¥ôğ½Àøğ½‘¥Øù€¤¹©½¥¸ ˆˆ¥ññµÍœ ‰M¥¸¡¥ÍÑ½É¥…°¸ˆ¥ôğ½Í•Ñ¥½¸ù€¤íô)…Íå¹Œ™Õ¹Ñ¥½¸…¥½¹Ñ•áĞ ¥ì½¹ÍĞí‘…Ñ„±•ÉÉ½Éôõ…İ…¥ĞÍÕÁ„¹™É½´ ‰…ÅÕ…É¥Õµ}½¹Ñ•áÑ}Ù¥•Üˆ¤¹Í•±•Ğ ˆ¨ˆ¤¹•Ä ‰…ÅÕ…É¥Õµ}¥ˆ±ÕÉÉ•¹ÑÅÕ…É¥Õ´¹¥¤¹Í¥¹±” ¤ìÍ•Ğ¡…Å5•¹Ô ¤­€ñÍ•Ñ¥½¸±…ÍÌô‰…Éˆøñ Èù%½¹Ñ•áÑ¼ğ½ ÈøñÀ±…ÍÌô‰¹½Ñ¥”ˆù5½‘¼%½¹Ñ•áÑÕ…°ÁÉ•Á…É…‘¼èÉ•ÍÕµ”…Õ…É¥¼°É¥•Í½Ì°…¹¥µ…±•Ì°‰…©…Ì°¡½ÍÁ¥Ñ…°ä…Ù¥Í½Ì¸ğ½Àø‘í•ÉÉ½ÈıµÍœ¡•ÉÉ½È¹µ•ÍÍ…”°‰•ÉÉ½Èˆ¤é€ñÁÉ”ø‘í•ÍŒ¡)M=8¹ÍÑÉ¥¹¥™ä¡‘…Ñ„±¹Õ±°°È¤¥ôğ½ÁÉ”ùôğ½Í•Ñ¥½¸ù€¤ìô()…Íå¹Œ™Õ¹Ñ¥½¸‘•°¡Ñ…‰±”±¥±ˆ¥ì(€¥˜ …½¹™¥É´ ‹
ı	½ÉÉ…Èüˆ¤¤É•ÑÕÉ¸ì(€…İ…¥ĞÍÕÁ„¹™É½´¡Ñ…‰±”¤¹‘•±•Ñ” ¤¹•Ä ‰¥ˆ±¥¤¹•Ä ‰ÕÍ•É}¥ˆ±ÕÍ•È¹¥¤ì(€ˆ ¤ì)ô()¥¹¥Ğ ¤ì(