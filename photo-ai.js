/* AcuarioNexo · Foto IA + subida real */
(function(){
function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function photoBox(module){
return `<section class="card photo-ai-box"><h3>📷 Fotos</h3><p class="small">Haz una foto o súbela desde galería. Se guardará en este acuario.</p><div class="grid"><label class="primary" style="display:flex;align-items:center;justify-content:center;cursor:pointer">📷 Hacer foto<input id="photoAiCamera" type="file" accept="image/*" capture="environment" style="display:none" onchange="AcuarioNexoPhotoAI.preview('${module}','camera')"></label><label class="primary" style="display:flex;align-items:center;justify-content:center;cursor:pointer">🖼️ Galería<input id="photoAiGallery" type="file" accept="image/*" style="display:none" onchange="AcuarioNexoPhotoAI.preview('${module}','gallery')"></label></div><div id="photoAiPreview"></div><div id="photoAiSaved"></div></section>`;
}
async function preview(module,source){
const input=source==='camera'?document.getElementById('photoAiCamera'):document.getElementById('photoAiGallery');
const f=input?.files?.[0];
const box=document.getElementById('photoAiPreview');
if(!f||!box)return;
window.__aq_photo_file=f;
const url=URL.createObjectURL(f);
box.innerHTML=`<img class="photo" src="${url}" style="width:100%;border-radius:16px;margin:10px 0"><label>Título</label><input id="photoTitle" placeholder="Ej: Estado general reef"><label>Notas</label><textarea id="photoNotes" placeholder="Observaciones..."></textarea><button class="primary" onclick="AcuarioNexoPhotoAI.save('${module}')">Guardar foto</button>`;
}
async function save(module){
try{
const f=window.__aq_photo_file;
if(!f)throw new Error('No hay foto seleccionada');
if(!window.q?.id)throw new Error('No hay acuario activo');
const bucket='aquarium-photos';
const ext=(f.name.split('.').pop()||'jpg').toLowerCase();
const fileName=`${window.u.id}/${window.q.id}/${Date.now()}.${ext}`;
const upload=await window.s.storage.from(bucket).upload(fileName,f,{upsert:false});
if(upload.error)throw upload.error;
const pub=window.s.storage.from(bucket).getPublicUrl(fileName);
const publicUrl=pub?.data?.publicUrl||'';
const row={user_id:window.u.id,aquarium_id:window.q.id,bucket:bucket,path:fileName,public_url:publicUrl,caption:document.getElementById('photoTitle')?.value||'',taken_at:new Date().toISOString()};
const ins=await window.s.from('aquarium_photos').insert(row);
if(ins.error)throw ins.error;
const ok=document.getElementById('photoAiSaved');
if(ok)ok.innerHTML=`<div class="success">✅ Foto guardada correctamente</div><img class="photo" src="${publicUrl}" style="width:100%;border-radius:16px;margin-top:10px">`;
}catch(e){
const ok=document.getElementById('photoAiSaved');
if(ok)ok.innerHTML=`<div class="error">${esc(e.message)}</div>`;
}
}
function guess(module){
if(module==='parameters')return {title:'Hoja de parámetros detectada',text:'Revisar fecha, salinidad/densidad, KH, NO2, NO3, PO4, Ca, Mg y pH antes de guardar.',action:'Abrir revisión de parámetros'};
if(module==='animals')return {title:'Animal detectado',text:'Buscar coincidencias en biblioteca. Confirmar especie antes de crear ficha en este acuario.',action:'Crear ficha tras confirmar'};
if(module==='hospital')return {title:'Foto clínica detectada',text:'Registrar síntoma, especie afectada, fecha y observaciones. Confirmar antes de crear caso.',action:'Crear caso hospital'};
return {title:'Foto del acuario',text:'Guardar foto con fecha, módulo y notas.',action:'Guardar foto'};
}
function prepare(module){
const r=guess(module);
const el=document.getElementById('photoAiResult');
if(!el)return;
el.innerHTML=`<div class="notice"><b>${esc(r.title)}</b><p>${esc(r.text)}</p><label>Notas / corrección manual</label><textarea id="photoAiNotes"></textarea><button class="primary" onclick="AcuarioNexoPhotoAI.confirm('${module}')">Confirmar: ${esc(r.action)}</button></div>`;
}
async function confirm(module){
const notes=document.getElementById('photoAiNotes')?.value||'';
const msg=`Foto IA confirmada en ${module}. ${notes}`;
const el=document.getElementById('photoAiResult');
if(el)el.innerHTML=`<div class="success">${esc(msg)}</div>`;
}
window.AcuarioNexoPhotoAI={photoBox,preview,prepare,confirm,save};
})();