window.AcuarioNexoGemini={version:'gemini-base-23-05'};
(function(){
  var endpoint='/functions/v1/gemini-inventory';
  var campos={marca:'no inventar',producto:'no inventar',categoria:'elegir tipo',uso:'resumir',dosis:'solo si aparece',acuario:'marino dulce ambos revisar',advertencias:'si se ven',usuario:'precio tienda cantidad fecha los cubre el cliente'};
  function buildPrompt(area){
    return 'AcuarioNexo IA '+area+'. Devuelve JSON con marca, producto, categoria, uso, dosis, acuario, advertencias, confianza. No inventes datos. Si no se ve pon No detectado. Campos usuario: precio, tienda, cantidad, fecha.';
  }
  async function analyse(area,image){
    var r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({area:area,image:image,prompt:buildPrompt(area)})});
    if(!r.ok)throw new Error('IA no disponible');
    return await r.json();
  }
  window.AcuarioNexoGemini.campos=campos;
  window.AcuarioNexoGemini.prompt=buildPrompt;
  window.AcuarioNexoGemini.analyse=analyse;
})();
