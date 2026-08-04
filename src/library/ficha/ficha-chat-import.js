/* AcuarioNexo · Importación individual y masiva de fichas desde Chat/JSON */
(function(){
  function anx(){return window.ANX||{}}
  function S(){return anx().LibrarySchema}
  function esc(v){return anx().esc?anx().esc(v):String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
  function byId(id){return document.getElementById(id)}
  function val(id){return byId(id)?.value||''}
  function msg(text,type){return anx().msg?anx().msg(text,type):`<div class="${type||'notice'}">${esc(text)}</div>`}
  function isAdmin(){return !!anx().state?.isAdmin}
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[*#`_\[\](){}]/g,'').replace(/[:：]+$/,'').replace(/\s+/g,' ').trim()}
  const TYPES=[['pez_marino','Pez marino'],['pez_dulce','Pez de agua dulce'],['coral','Coral'],['invertebrado','Invertebrado'],['planta','Planta'],['microfauna','Microfauna'],['producto','Producto'],['medicamento','Medicamento'],['sal','Sal'],['aditivo','Aditivo'],['alimento','Alimento'],['test','Test'],['equipamiento','Equipamiento']];
  const TOP_LEVEL=new Set(['title','scientific_name','summary','sources','entry_type','tags','sections']);
  function typeOptions(){return TYPES.map(([k,n])=>`<option value="${k}">${esc(n)}</option>`).join('')}
  function normalizeStructuredJson(text){
    return String(text||'')
      .replace(/^\uFEFF/,'')
      .replace(/[\u200B-\u200D\u2060]/g,'')
      .replace(/^\s*```(?:json)?\s*/i,'')
      .replace(/\s*```\s*$/,'')
      .replace(/[\u201C\u201D\u2033]/g,'\"')
      .replace(/[\u2018\u2019\u2032]/g,"'")
      .replace(/\u00A0/g,' ')
      .replace(/,\s*([}\]])/g,'$1')
      .trim()
  }
  function parseJsonText(text,label){
    const normalized=normalizeStructuredJson(text);
    if(!normalized)throw new Error(`${label||'El contenido'} está vacío.`);
    try{return JSON.parse(normalized)}catch(e){throw new Error(`${label||'El contenido'} contiene JSON inválido: ${e.message}`)}
  }
  function extractStructuredJsonBlocks(text){
    const raw=String(text||'');
    const blocks=[];
    const re=/ACUARIONEXO_JSON_START([\s\S]*?)ACUARIONEXO_JSON_END/g;
    let match;
    while((match=re.exec(raw))!==null){blocks.push(parseJsonText(match[1],`Bloque ${blocks.length+1}`))}
    return blocks;
  }
  function extractStructuredJson(text){return extractStructuredJsonBlocks(text)[0]||null}
  function parseImportPayload(text,label){
    const blocks=extractStructuredJsonBlocks(text);
    if(blocks.length)return blocks.flatMap(item=>Array.isArray(item)?item:[item]);
    const parsed=parseJsonText(text,label);
    return Array.isArray(parsed)?parsed:[parsed];
  }
  function detectType(parsed,selected){
    if(parsed?.entry_type&&S()?.CONTRACTS?.[parsed.entry_type])return parsed.entry_type;
    const selectedType=String(selected||'').trim();
    if(selectedType&&S()?.CONTRACTS?.[selectedType])return selectedType;
    throw new Error('La ficha no declara un entry_type válido y no existe un tipo seleccionado aplicable.');
  }
  function cleanData(raw){const data={...(raw&&typeof raw==='object'?raw:{})};TOP_LEVEL.forEach(key=>delete data[key]);return data}
  function parseStructuredFicha(parsed,fallbackType){
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Cada ficha debe ser un objeto JSON.');
    const type=detectType(parsed,fallbackType);
    const summary=String(parsed.summary||parsed.sections?.summary||'').trim();
    return{title:String(parsed.title||'').trim(),scientific_name:String(parsed.scientific_name||'').trim(),summary,tags:Array.isArray(parsed.tags)?parsed.tags.map(s=>String(s).trim()).filter(Boolean):[],data:cleanData(parsed.data),sections:{...(parsed.sections&&typeof parsed.sections==='object'?parsed.sections:{}),summary},sources:S().normalizeSources(parsed.sources||[]),entry_type:type};
  }
  function hasValue(v){return !(v===undefined||v===null||String(v).trim()==='')}
  function contractMissing(entry){
    const contract=S().CONTRACTS?.[entry.entry_type]||[];
    const missing=contract.filter(field=>{if(field==='title')return !hasValue(entry.title);if(field==='scientific_name')return !hasValue(entry.scientific_name);if(field==='sources')return !Array.isArray(entry.sources)||entry.sources.length<3;return !hasValue(entry.data?.[field]);});
    if(String(entry.summary||'').trim().length<20)missing.push('summary');
    return[...new Set(missing)];
  }
  function auditText(audit){return(audit?.errors||[]).map(error=>String(error)).join('\n')}
  function assertChatFichaComplete(entry){
    const missing=contractMissing(entry);
    if(missing.length)throw new Error(`La ficha no contiene todos los campos del esqueleto ${entry.entry_type}. Faltan o son inválidos: ${missing.join(', ')}.`);
    const audit=S().audit(entry);
    if(audit.approved)return audit;
    const details=auditText(audit);
    throw new Error(`La ficha no cumple el contrato de AcuarioNexo.${details?`\n${details}`:''}`);
  }
  function makeRow(parsed,userId,source){
    return{user_id:userId,title:parsed.title,scientific_name:parsed.scientific_name||null,entry_type:parsed.entry_type,status:'review',visibility:'public',summary:parsed.summary,sections:parsed.sections,data:parsed.data,tags:parsed.tags,identity_confirmed:true,confidence:null,identify_result:{source,identity_confirmed:true,title:parsed.title,scientific_name:parsed.scientific_name,entry_type:parsed.entry_type},sources:parsed.sources,ai_model:source==='json_batch_import'?'json-batch-import':'chat-paste-manual',ai_generated_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  }
  function duplicateKey(entry){return`${entry.entry_type}::${norm(entry.title)}`}
  function assertNoInternalDuplicates(rows){
    const seen=new Map();
    rows.forEach((row,index)=>{const key=duplicateKey(row);if(seen.has(key))throw new Error(`El lote contiene una ficha duplicada: «${row.title}» (${row.entry_type}), posiciones ${seen.get(key)+1} y ${index+1}.`);seen.set(key,index)});
  }
  async function assertNoStoredDuplicates(supabase,rows){
    const types=[...new Set(rows.map(row=>row.entry_type))];
    const{data,error}=await supabase.from('library_entries').select('id,title,entry_type').in('entry_type',types);
    if(error)throw error;
    const existing=new Set((data||[]).map(duplicateKey));
    const repeated=rows.filter(row=>existing.has(duplicateKey(row)));
    if(repeated.length)throw new Error(`Ya existen en la biblioteca: ${repeated.map(row=>`«${row.title}» (${row.entry_type})`).join(', ')}. No se importó ninguna ficha.`);
  }
  function renderFileList(files){
    const host=byId('chatImportFileList');
    if(!host)return;
    host.innerHTML=files.length?`<div class="notice"><strong>${files.length} archivo(s) seleccionado(s)</strong><br>${files.map(file=>esc(file.name)).join('<br>')}</div>`:'';
  }
  async function readSelectedFiles(){
    const input=byId('chatImportFiles');
    const files=[...(input?.files||[])];
    const payload=[];
    for(const file of files){
      const text=await file.text();
      const parsed=parseImportPayload(text,`El archivo ${file.name}`);
      parsed.forEach((item,index)=>payload.push({item,label:`${file.name}${parsed.length>1?` · ficha ${index+1}`:''}`}));
    }
    return payload;
  }
  function renderImportSummary(rows){
    return `<div class="notice"><strong>${rows.length} ficha(s) verificadas</strong><br>${rows.map((row,index)=>`${index+1}. ${esc(row.title)} · ${esc(row.entry_type)}`).join('<br>')}</div>`;
  }
  window.mostrarCrearFichaDesdeChat=function(){
    if(!isAdmin())return;
    const app=byId('app');if(!app)return;
    const box=document.createElement('section');
    box.className='panel library-detail';box.id='chatCreatePanel';
    box.innerHTML=`<button onclick="document.getElementById('chatCreatePanel')?.remove()">Cerrar</button><h2>Importar fichas JSON</h2><div class="notice">Importa una ficha o un lote completo. Todas se validan con el contrato oficial antes de guardar. Si una falla o ya existe, no se guarda ninguna.</div><label>Tipo de respaldo</label><select id="chatCreateType"><option value="">Usar entry_type de cada ficha</option>${typeOptions()}</select><label>Archivos JSON, TXT o MD</label><input id="chatImportFiles" type="file" accept=".json,.txt,.md,application/json,text/plain,text/markdown" multiple onchange="chatImportFilesChanged()"><div id="chatImportFileList"></div><label>O pega una ficha, varios bloques ACUARIONEXO_JSON o un array JSON</label><textarea id="chatCreateText" placeholder="ACUARIONEXO_JSON_START\n{ ... }\nACUARIONEXO_JSON_END"></textarea><div class="quick-actions"><button onclick="validarFichasDesdeChat()">Validar sin guardar</button><button class="primary" onclick="crearFichaDesdeChat()">Importar fichas</button></div><div id="chatCreateStatus"></div>`;
    app.prepend(box);box.scrollIntoView({behavior:'smooth',block:'start'});
  }
  window.chatImportFilesChanged=function(){renderFileList([...(byId('chatImportFiles')?.files||[])])}
  async function collectRows(){
    const A=anx(),state=A.state;
    if(!isAdmin())throw new Error('Esta acción está restringida al panel Admin.');
    if(!state?.user?.id)throw new Error('Sesión no disponible.');
    const selected=val('chatCreateType');
    const items=await readSelectedFiles();
    const pasted=val('chatCreateText').trim();
    if(pasted){parseImportPayload(pasted,'El texto pegado').forEach((item,index)=>items.push({item,label:`Texto pegado${index?` · ficha ${index+1}`:''}`}))}
    if(!items.length)throw new Error('Selecciona uno o más archivos o pega al menos una ficha JSON.');
    const rows=items.map(({item,label})=>{try{const parsed=parseStructuredFicha(item,selected);const row=makeRow(parsed,state.user.id,items.length>1?'json_batch_import':'chat_paste');assertChatFichaComplete(row);return row}catch(e){throw new Error(`${label}: ${e.message}`)}});
    assertNoInternalDuplicates(rows);
    return rows;
  }
  window.validarFichasDesdeChat=async function(){
    const box=byId('chatCreateStatus');
    try{const rows=await collectRows();await assertNoStoredDuplicates(anx().supabase,rows);if(box)box.innerHTML=renderImportSummary(rows)+msg('Validación completa. El lote puede importarse.','success')}
    catch(e){if(box)box.innerHTML=msg(e.message,'error')}
  }
  window.crearFichaDesdeChat=async function(){
    const box=byId('chatCreateStatus');
    try{
      const A=anx(),supabase=A.supabase;
      const rows=await collectRows();
      if(box)box.innerHTML=renderImportSummary(rows)+msg('Comprobando duplicados en la biblioteca...','notice');
      await assertNoStoredDuplicates(supabase,rows);
      if(box)box.innerHTML=renderImportSummary(rows)+msg('Contrato completo y auditoría aprobada. Guardando el lote...','notice');
      const{data,error}=await supabase.from('library_entries').insert(rows).select('*');
      if(error)throw error;
      if(box)box.innerHTML=renderImportSummary(rows)+msg(`${data?.length||rows.length} ficha(s) importadas en estado de revisión. Ninguna se publicó automáticamente.`,'success');
      if(window.biblioteca)setTimeout(()=>window.biblioteca({statusFilter:['review'],adminReturn:true}),500);
    }catch(e){if(box)box.innerHTML=msg(e.message,'error')}
  };
})();