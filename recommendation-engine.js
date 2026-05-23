window.AcuarioNexoRecommendations={version:'recommendations-23-05'};
(function(){
  function num(v){var n=parseFloat(String(v||'').replace(',','.').replace(/[<>]/g,''));return isNaN(n)?null:n}
  function litros(a){return num(a&&((a.real_liters)||(a.liters)||(a.litros)))||0}
  function findInventory(inv,words){
    inv=inv||[];
    return inv.filter(function(x){var t=((x.nombre||'')+' '+(x.marca||'')+' '+(x.cat||'')+' '+(x.dosis||'')).toLowerCase();return words.some(function(w){return t.indexOf(w)>=0})})
  }
  function phAdvice(ctx){
    var ph=num(ctx.valor);
    var aquarium=ctx.acuario||{};
    var l=litros(aquarium);
    var inv=ctx.inventario||[];
    var out={riesgo:'normal',acciones:[],productos:[],litros:l,nota:'Revisar siempre antes de actuar.'};
    if(ph===null){out.acciones.push('No se pudo interpretar el valor de pH. Repite o confirma el test.');return out}
    if(ph>=8.6){out.riesgo='alto';out.acciones.push('No dosificar a ciegas. Confirmar pH con segundo test o sonda calibrada.');out.acciones.push('Revisar KH, CO2/aireacion, salinidad y hora de medicion.');out.acciones.push('Evitar bajadas bruscas. Cambios graduales.');}
    else if(ph>=8.4){out.riesgo='vigilar';out.acciones.push('pH algo alto. Revisar KH, aireacion y horario de medicion.');}
    else if(ph<7.8){out.riesgo='bajo';out.acciones.push('pH bajo. Revisar KH, aireacion, CO2 y acumulacion organica.');}
    else{out.acciones.push('pH dentro de zona normal aproximada. Mantener seguimiento.');}
    out.productos=findInventory(inv,['buffer','kh','alk','alcalinidad','ph','seachem','red sea','salifert']);
    if(out.productos.length){out.acciones.push('Hay productos relacionados en inventario. Revisar etiqueta antes de calcular dosis.');}
    if(l){out.acciones.push('Litros detectados: '+l+' L. Cualquier dosis debe calcularse sobre litros reales netos.');}
    return out;
  }
  function recommend(ctx){
    ctx=ctx||{};
    var tipo=(ctx.tipo||ctx.parametro||'').toLowerCase();
    if(tipo.indexOf('ph')>=0 || tipo.indexOf('pH')>=0)return phAdvice(ctx);
    return {riesgo:'sin_regla',acciones:['No hay regla especifica aun. La IA debe pedir parametro, valor, acuario e inventario.'],productos:[],nota:'Motor preparado para ampliar.'};
  }
  window.AcuarioNexoRecommendations.recommend=recommend;
  window.AcuarioNexoRecommendations.phAdvice=phAdvice;
})();
