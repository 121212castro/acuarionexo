window.AcuarioNexoAlerts={version:'alerts-23-05'};
(function(){
  function daysUntil(date){
    if(!date)return null;
    var d=new Date(date+'T00:00:00');
    if(isNaN(d.getTime()))return null;
    var now=new Date();
    var today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    return Math.ceil((d-today)/86400000);
  }
  function invAlerts(inv){
    var out=[];
    (inv||[]).forEach(function(x){
      var name=(x.marca?x.marca+' ':'')+(x.nombre||'Producto');
      var qty=parseFloat(String(x.cant||'').replace(',','.'));
      if(!isNaN(qty)&&qty<=5){out.push({tipo:'stock',nivel:'vigilar',titulo:'Stock bajo',mensaje:'Te quedan '+qty+' unidades/reactivos de '+name+'. Revisar compra.'})}
      var cad=x.cad||x.caducidad||x.fecha_caducidad;
      var d=daysUntil(cad);
      if(d!==null&&d<=7&&d>=0){out.push({tipo:'caducidad',nivel:'alto',titulo:'Caduca pronto',mensaje:name+' caduca en '+d+' dias.'})}
      if(d!==null&&d<0){out.push({tipo:'caducidad',nivel:'alto',titulo:'Producto caducado',mensaje:name+' esta caducado desde hace '+Math.abs(d)+' dias.'})}
    });
    return out;
  }
  function taskAlerts(tasks){
    var out=[];
    (tasks||[]).forEach(function(t){
      var d=daysUntil(t.fecha||t.date||t.proxima);
      if(d===0){out.push({tipo:'tarea',nivel:'hoy',titulo:t.titulo||t.nombre||'Tarea pendiente',mensaje:(t.titulo||t.nombre||'Tarea')+' toca hoy '+(t.hora?('a las '+t.hora):'')})}
      if(d!==null&&d<0){out.push({tipo:'tarea',nivel:'alto',titulo:'Tarea atrasada',mensaje:(t.titulo||t.nombre||'Tarea')+' esta atrasada '+Math.abs(d)+' dias.'})}
    });
    return out;
  }
  function microAlerts(cultivos){
    var out=[];
    (cultivos||[]).forEach(function(c){
      var d=daysUntil(c.proxima||c.fecha_proxima||c.fecha);
      if(d===0){out.push({tipo:'microfauna',nivel:'hoy',titulo:'Cultivo de microfauna',mensaje:'Toca revisar/cultivar '+(c.tipo||c.nombre||'microfauna')+' hoy.'})}
    });
    return out;
  }
  function build(ctx){
    ctx=ctx||{};
    return [].concat(invAlerts(ctx.inventario),taskAlerts(ctx.tareas),taskAlerts(ctx.limpiezas),taskAlerts(ctx.mantenimientos),microAlerts(ctx.microfauna));
  }
  window.AcuarioNexoAlerts.build=build;
  window.AcuarioNexoAlerts.inventory=invAlerts;
  window.AcuarioNexoAlerts.tasks=taskAlerts;
  window.AcuarioNexoAlerts.microfauna=microAlerts;
})();
