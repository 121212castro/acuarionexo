window.AcuarioNexoGemini={version:'gemini-base-23-05-v2'};
(function(){
  var campos={marca:'no inventar',producto:'no inventar',categoria:'elegir tipo',uso:'resumir',dosis:'solo si aparece',acuario:'marino dulce ambos revisar',advertencias:'si se ven',usuario:'precio tienda cantidad fecha los cubre el cliente'};
  function buildPrompt(area){
    return 'AcuarioNexo IA '+area+'. Devuelve JSON con marca, producto, categoria, uso, dosis, acuario, advertencias, confianza. No inventes datos. Si no se ve pon No detectado. Campos usuario: precio, tienda, cantidad, fecha.';
  }
  async function analyse(area,image){
    if(!window.s || !window.s.functions) throw new Error('Cliente Supabase no disponible');
    var res=await window.s.functions.invoke('gemini-inventory',{body:{area:area,image:image,prompt:buildPrompt(area)}});
    if(res.error) throw new Error(res.error.message||'IA no disponible');
    if(res.data && res.data.error) throw new Error(res.data.error);
    return res.data||{};
  }
  window.AcuarioNexoGemini.campos=campos;
  window.AcuarioNexoGemini.prompt=buildPrompt;
  window.AcuarioNexoGemini.analyse=analyse;
})();
