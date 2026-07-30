/* AcuarioNexo · Crear ficha desde texto del Chat */
(function(){
  function anx(){return window.ANX||{}}
  function S(){return anx().LibrarySchema}
  function esc(v){return anx().esc?anx().esc(v):String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
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
      .replace(/[\u201C\u201D\u2033]/g,'"')
      .replace(/[\u2018\u2019\u2032]/g,"'")
      .replace(/\u00A0/g,' ')
      .replace(/,\s*([}\]])/g,'$1')
      .trim()
  }
  function extractStructuredJson(text){
    const raw=String(text||'')
    const start=raw.indexOf('ACUARIONEXO_JSON_START')
    const end=raw.indexOf('ACUARIONEXO_JSON_END')
    if(start===-1||end===-1||end<=start)return null
    const jsonText=normalizeStructuredJson(raw.slice(start+'ACUARIONEXO_JSON_START'.length,end))
    if(!jsonText)return null
    try{
      const parsed=JSON.parse(jsonText)
      return parsed&&typeof parsed==='object'?parsed:null
    }catch(e){
      throw new Error(`El bloque JSON está localizado, pero contiene un error: ${e.message}`)
    }
  }
  function detectType(text,selected){const structured=extractStructuredJson(text);if(structured?.entry_type&&S()?.CONTRACTS?.[structured.entry_type])return structured.entry_type;const selectedType=String(selected||'').trim();if(selectedType&&S()?.CONTRACTS?.[selectedType])return selectedType;return'pez_marino'}
  function parseSourcesRaw(text){const rows=String(text||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);return rows.map((line,i)=>{const url=(line.match(/https?:\/\/[^\s|]+/i)||[])[0]||'';const parts=line.split('|').map(s=>s.trim());let name=parts[0]&&!/^https?:\/\//i.test(parts[0])?parts[0]:'';if(!name&&url){try{name=new URL(url).hostname}catch(_){name=`Fuente ${i+1}`}}return{url,name:name||`Fuente ${i+1}`,used_for:parts[2]||'Ficha creada desde texto del Chat',pending_url:!url};});}
  function cleanData(raw){const data={...(raw&&typeof raw==='object'?raw:{})};TOP_LEVEL.forEach(key=>delete data[key]);return data}
  function parseStructuredFicha(parsed,fallbackType){const type=String(parsed.entry_type||fallbackType||'').trim();if(!type||!S().CONTRACTS[type])throw new Error(`Tipo de ficha no permitido: ${type||'vacío'}.`);const summary=String(parsed.summary||parsed.sections?.summary||'').trim();return{title:String(parsed.title||'').trim(),scientific_name:String(parsed.scientific_name||'').trim(),summary,tags:Array.isArray(parsed.tags)?parsed.tags.map(s=>String(s).trim()).filter(Boolean):[],data:cleanData(parsed.data),sections:{...(parsed.sections&&typeof parsed.sections==='object'?parsed.sections:{}),summary},sources:S().normalizeSources(parsed.sources||[]),entry_type:type};}
  function hasValue(v){return !(v===undefined||v===null||String(v).trim()==='')}
  function contractMissing(entry){const contract=S().CONTRACTS?.[entry.entry_type]||[];const missing=contract.filter(field=>{if(field==='title')return !hasValue(entry.title);if(field==='scientific_name')return !hasValue(entry.scientific_name);if(field==='sources')return !Array.isArray(entry.sources)||entry.sources.length<3;return !hasValue(entry.data?.[field]);});if(String(entry.summary||'').trim().length<20)missing.push('summary');return[...new Set(missing)]}
  function auditText(audit){return(audit?.errors||[]).map(error=>String(error)).join('\n')}
  function assertChatFichaComplete(entry){const missing=contractMissing(entry);if(missing.length)throw new Error(`La ficha no contiene todos los campos del esqueleto ${entry.entry_type}. Faltan o son inválidos: ${missing.join(', ')}.`);const audit=S().audit(entry);if(audit.approved)return audit;const details=auditText(audit);throw new Error(`La ficha del Chat no cumple el contrato de AcuarioNexo y no se guardó.${details?`\n${details}`:''}`)}
  window.mostrarCrearFichaDesdeChat=function(){if(!isAdmin())return;const app=byId('app');if(!app)return;const box=document.createElement('section');box.className='panel library-detail';box.id='chatCreatePanel';box.innerHTML=`<button onclick="document.getElementById('chatCreatePanel')?.remove()">Cerrar</button><h2>Crear ficha desde texto del Chat</h2><div class="notice">Pega el bloque JSON completo. Se comprobarán tipo, resumen, todos los campos, fuentes y auditoría antes de guardar.</div><label>Tipo de ficha</label><select id="chatCreateType">${typeOptions()}</select><label>Ficha completa creada por ChatGPT</label><textarea id="chatCreateText"></textarea><button class="primary" onclick="crearFichaDesdeChat()">Crear ficha</button><div id="chatCreateStatus"></div>`;app.prepend(box);box.scrollIntoView({behavior:'smooth',block:'start'})}
  window.crearFichaDesdeChat=async function(){const box=byId('chatCreateStatus');try{const A=anx(),supabase=A.supabase,state=A.state;if(!isAdmin())throw new Error('Esta acción está restringida al panel Admin.');if(!state?.user?.id)throw new Error('Sesión no disponible.');const selected=val('chatCreateType')||'pez_marino',text=val('chatCreateText');if(!text.trim())throw new Error('Pega primero la ficha completa.');const structured=extractStructuredJson(text);if(!structured)throw new Error('Falta un bloque JSON válido entre ACUARIONEXO_JSON_START y ACUARIONEXO_JSON_END.');const type=detectType(text,selected);const parsed=parseStructuredFicha(structured,type);if(parsed.entry_type!==type)throw new Error('El tipo seleccionado y entry_type no coinciden.');const row={user_id:state.user.id,title:parsed.title,scientific_name:parsed.scientific_name||null,entry_type:parsed.entry_type,status:'review',visibility:'public',summary:parsed.summary,sections:parsed.sections,data:parsed.data,tags:parsed.tags,identity_confirmed:true,confidence:null,identify_result:{source:'chat_paste',identity_confirmed:true,title:parsed.title,scientific_name:parsed.scientific_name,entry_type:parsed.entry_type},sources:parsed.sources,ai_model:'chat-paste-manual',ai_generated_at:new Date().toISOString(),updated_at:new Date().toISOString()};assertChatFichaComplete(row);if(box)box.innerHTML=msg('Contrato completo y auditoría aprobada. Guardando...','notice');const{data,error}=await supabase.from('library_entries').insert(row).select('*').single();if(error)throw error;if(window.biblioteca)await window.biblioteca();if(window.formFicha)setTimeout(()=>window.formFicha(data.id),300)}catch(e){if(box)box.innerHTML=msg(e.message,'error')}};
})();
