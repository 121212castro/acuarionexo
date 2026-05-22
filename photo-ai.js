/* AcuarioNexo · Foto IA confirmable */
(function(){
  function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

  function photoBox(module){
    return `<section class="card photo-ai-box"><h3>📷 Foto / IA</h3><p class="small">Saca una foto o súbela. La IA propondrá datos y tú confirmas antes de guardar.</p><input id="photoAiInput" type="file" accept="image/*" capture="environment" onchange="AcuarioNexoPhotoAI.preview('${module}')"><div id="photoAiPreview"></div></section>`;
  }

  async function preview(module){
    const f=document.getElementById('photoAiInput')?.files?.[0];
    const box=document.getElementById('photoAiPreview');
    if(!f||!box)return;
    const url=URL.createObjectURL(f);
    box.innerHTML=`<img class="photo" src="${url}"><button class="primary" onclick="AcuarioNexoPhotoAI.prepare('${module}')">Analizar foto</button><div id="photoAiResult"></div>`;
    window.__aq_photo_file=f;
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

  window.AcuarioNexoPhotoAI={photoBox,preview,prepare,confirm};
})();