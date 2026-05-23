window.AcuarioNexoGemini={version:'gemini-brain-23-05-v1'};
(function(){
  var schema={
    comun:['ok','area','tipo_registro','titulo','resumen_corto','resumen_tecnico','confianza','campos','advertencias','acciones_recomendadas','automatizaciones','fuentes_necesarias','no_inventar'],
    inventario:['marca','producto','categoria','subcategoria','uso','descripcion','dosis_marino','dosis_dulce','metodo_uso','compatibilidad','reef_safe','riesgos','saturacion_reemplazo','almacenamiento','parametros_relacionados'],
    animales:['nombre_comun','nombre_cientifico','tipo','familia','dificultad','tamano_adulto','litros_minimos','temperamento','compatibilidad','reef_safe','alimentacion','zona_nado','observaciones','riesgos'],
    parametros:['parametro','valor_detectado','unidad','comparador','metodo_test','rango_objetivo_marino','rango_objetivo_dulce','estado','riesgo','causas_probables','acciones_recomendadas','frecuencia_control'],
    acuario:['estado_visual','problemas_detectados','algas','ciano','dinos','turbidez','corales_estado','peces_estado','causas_probables','prioridad','acciones_recomendadas'],
    microfauna:['cultivo','especie_grupo','estado_cultivo','densidad_estimada','alimentacion','luz','aireacion','cosecha','riesgos','protocolo_mantenimiento'],
    mantenimiento:['tarea','frecuencia','prioridad','material_necesario','pasos','riesgos','automatizacion_sugerida'],
    enfermedades:['especie_afectada','sintomas','posibles_causas','gravedad','contagioso','reef_safe','tratamiento_sugerido','cuarentena','seguimiento'],
    biblioteca:['nombre','categoria','ficha_resumen','ficha_completa','compatibilidad','dosis','advertencias','uso_practico','errores_comunes'],
    equipamiento:['marca','modelo','tipo','uso','instalacion','mantenimiento','limpieza','riesgos','garantia','repuestos'],
    sales:['marca','producto','tipo_sal','salinidad_objetivo','gramos_por_litro','kh','calcio','magnesio','trazas','uso','advertencias'],
    dashboard:['estado_general','alertas','prioridades','tareas_hoy','tareas_semana','riesgos','acciones_recomendadas']
  };
  var categoriasInventario=['Alimento','Medicamento','Bacterias/Probiótico','Resina/Medio filtrante','Sal','Test','Suplemento','Aditivo','Equipamiento','Repuesto','Otro'];
  function baseRules(){return [
    'Eres el motor tecnico interno de AcuarioNexo, no un chat general.',
    'Tu trabajo es generar informacion completa, util y guardable para una app real de acuariofilia.',
    'No inventes datos criticos. Si no estas seguro, marca confianza baja y pide verificacion.',
    'Separa siempre datos detectados, interpretacion, riesgos y acciones.',
    'Cuando falte un dato usa cadena vacia, null o pendiente_verificacion.',
    'Prioriza seguridad de peces, corales, invertebrados, bacterias y estabilidad del acuario.',
    'Distingue marino, reef, agua dulce, hospital, cuarentena y cultivos de microfauna.',
    'Devuelve SOLO JSON valido. No uses markdown. No expliques fuera del JSON.',
    'Incluye siempre resumen_corto para movil y resumen_tecnico para ficha completa.',
    'Incluye automatizaciones sugeridas cuando proceda: aviso, tarea, frecuencia, condicion y prioridad.'
  ].join(' ')}
  function moduleRules(area){
    var a=String(area||'inventario').toLowerCase();
    var m={
      inventario:'Modo INVENTARIO: identifica productos, marca, categoria, uso real, dosis si existe, compatibilidad reef/dulce, riesgos, forma de uso, almacenamiento, caducidad si se ve, y ficha limpia para guardar. Categorias permitidas: '+categoriasInventario.join(', ')+'.',
      animales:'Modo ANIMALES: identifica especie o grupo, nombre comun/cientifico si es posible, compatibilidad, agresividad, reef safe, dificultad, alimentacion, litros minimos, zona del acuario, riesgos y observaciones para ficha del acuario.',
      parametros:'Modo PARAMETROS: interpreta tests, valores con comparador < = >, unidad, metodo de medicion, rango objetivo segun tipo de acuario, riesgo, causas probables y acciones. Nunca conviertas <0,02 en numero negativo.',
      acuario:'Modo ACUARIO/FOTO GENERAL: analiza estado visual del acuario, algas, cianobacteria, dinoflagelados, turbidez, comportamiento animal, corales cerrados, suciedad, causas probables y prioridad.',
      microfauna:'Modo MICROFAUNA: analiza cultivos de fitoplancton, copepodos, rotiferos, artemia, infusorios y paramecios. Evalua color, densidad, olor descrito, aireacion, luz, alimentacion, cosecha y riesgos de colapso.',
      mantenimiento:'Modo MANTENIMIENTO: crea tareas paso a paso, frecuencia, material, seguridad, avisos y automatizaciones para limpieza, cambios de agua, skimmer, bombas, cristales, sump y reactores.',
      enfermedades:'Modo ENFERMEDADES/HOSPITAL: analiza sintomas visibles o descritos, urgencia, posible contagio, cuarentena, tratamientos posibles, riesgos reef y seguimiento. No diagnostiques como certeza si no hay evidencia.',
      biblioteca:'Modo BIBLIOTECA: genera ficha educativa completa, ordenada y practica, no ficha de tienda. Incluye resumen, uso, compatibilidad, errores comunes, advertencias y datos pendientes de verificar.',
      equipamiento:'Modo EQUIPAMIENTO: identifica aparato, funcion, instalacion, mantenimiento, limpieza, garantia, repuestos, riesgos electricos/agua y calendario de revisiones.',
      sales:'Modo SALES: genera ficha de sal, mezcla, salinidad, gramos por litro si se conoce, KH/Ca/Mg/trazas si se conocen, uso para cambios de agua y advertencias.',
      dashboard:'Modo DASHBOARD: resume estado global, detecta alertas, prioriza acciones, crea avisos y tareas inteligentes sin cargar datos pesados.'
    };
    return m[a]||m.inventario;
  }
  function buildPrompt(area,extra){
    var a=String(area||'inventario').toLowerCase();
    var fields=(schema[a]||schema.inventario).concat(schema.comun);
    return baseRules()+' '+moduleRules(a)+' Estructura JSON obligatoria con estas claves principales: '+fields.join(', ')+'. En campos incluye objetos simples listos para rellenar formularios de AcuarioNexo. En automatizaciones devuelve array con titulo, tipo, prioridad, frecuencia, condicion, mensaje. Contexto adicional: '+(extra||'');
  }
  function normalize(area,d){
    d=d||{};var f=d.ficha||d.data||d.analysis||d;
    var campos=f.campos||f;
    return {
      ok:d.ok!==false,
      area:area,
      raw:d,
      ficha:f,
      campos:campos,
      marca:campos.marca||f.marca||'',
      producto:campos.producto||campos.nombre||f.producto||f.nombre||'',
      categoria:campos.categoria||f.categoria||'',
      uso:campos.uso||f.uso||f.descripcion||'',
      dosis:campos.dosis||campos.dosis_marino||f.dosis||'',
      advertencias:campos.advertencias||f.advertencias||'',
      compatibilidad:campos.compatibilidad||campos.acuario||f.compatibilidad||'',
      resumen_corto:f.resumen_corto||f.descripcion||f.uso||'',
      resumen_tecnico:f.resumen_tecnico||f.notas||'',
      automatizaciones:f.automatizaciones||[],
      confianza:Number(f.confianza||campos.confianza||0)||0
    };
  }
  async function analyse(area,image,extra){
    if(!window.s || !window.s.functions) throw new Error('Cliente Supabase no disponible');
    var prompt=buildPrompt(area,extra||'');
    var res=await window.s.functions.invoke('gemini-inventory',{body:{area:area,image:image,imageBase64:image,prompt:prompt,texto:prompt}});
    if(res.error) throw new Error(res.error.message||'IA no disponible');
    if(res.data && (res.data.error||res.data.message) && res.data.ok===false) throw new Error(res.data.error||res.data.message);
    return normalize(area,res.data||{});
  }
  window.AcuarioNexoGemini.schema=schema;
  window.AcuarioNexoGemini.prompt=buildPrompt;
  window.AcuarioNexoGemini.normalize=normalize;
  window.AcuarioNexoGemini.analyse=analyse;
  window.AcuarioNexoGemini.areas=Object.keys(schema).filter(function(x){return x!=='comun'});
})();
