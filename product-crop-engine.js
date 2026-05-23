window.AcuarioNexoProductCrop={version:'product-crop-23-05-v3-manual'};
(function(){
  var cropState={zoom:1,x:0,y:0,src:'',clean:''};
  function readFile(file){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(e){resolve(e.target.result)};r.onerror=reject;r.readAsDataURL(file)})}
  function loadImage(src){return new Promise(function(resolve,reject){var img=new Image();img.onload=function(){resolve(img)};img.onerror=reject;img.src=src})}
  function colorDist(a,b){var dr=a[0]-b[0],dg=a[1]-b[1],db=a[2]-b[2];return Math.sqrt(dr*dr+dg*dg+db*db)}
  function sampleBg(data,w,h){var pts=[[8,8],[w-9,8],[8,h-9],[w-9,h-9],[Math.floor(w/2),8],[Math.floor(w/2),h-9],[8,Math.floor(h/2)],[w-9,Math.floor(h/2)]];var r=0,g=0,b=0,n=0;pts.forEach(function(p){var x=Math.max(0,Math.min(w-1,p[0])),y=Math.max(0,Math.min(h-1,p[1]));var i=(y*w+x)*4;r+=data[i];g+=data[i+1];b+=data[i+2];n++});return [r/n,g/n,b/n]}
  function detectBox(img){
    var maxSide=820,scale=Math.min(1,maxSide/Math.max(img.width,img.height));
    var w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
    var c=document.createElement('canvas');c.width=w;c.height=h;var ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);
    var im=ctx.getImageData(0,0,w,h),d=im.data,bg=sampleBg(d,w,h);var minX=w,minY=h,maxX=0,maxY=0,count=0;var step=Math.max(1,Math.floor(Math.max(w,h)/520));
    for(var y=0;y<h;y+=step){for(var x=0;x<w;x+=step){var i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];if(a<20)continue;var bright=(r+g+b)/3;var sat=Math.max(r,g,b)-Math.min(r,g,b);var diff=colorDist([r,g,b],bg);var edge=x<12||y<12||x>w-13||y>h-13;var isObject=!edge&&((diff>30&&bright<250)||(sat>36&&diff>18)||bright<165);if(isObject){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);count++}}}
    if(count<100)return {x:img.width*0.18,y:img.height*0.08,w:img.width*0.64,h:img.height*0.78};
    var bw=maxX-minX,bh=maxY-minY,pad=Math.round(Math.max(bw,bh)*0.14);minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(w,maxX+pad);maxY=Math.min(h,maxY+pad);
    return {x:minX/scale,y:minY/scale,w:(maxX-minX)/scale,h:(maxY-minY)/scale};
  }
  function renderClean(src,opts){
    opts=opts||{};return loadImage(src).then(function(img){
      var box=detectBox(img);var zoom=opts.zoom||1;var offX=opts.x||0,offY=opts.y||0;
      var side=Math.max(box.w,box.h)*1.25/zoom;
      var cx=box.x+box.w/2+offX*side*0.18,cy=box.y+box.h/2+offY*side*0.18;
      var sx=Math.max(0,cx-side/2),sy=Math.max(0,cy-side/2);if(sx+side>img.width)sx=Math.max(0,img.width-side);if(sy+side>img.height)sy=Math.max(0,img.height-side);side=Math.min(side,img.width-sx,img.height-sy);
      var canvas=document.createElement('canvas');canvas.width=900;canvas.height=900;var ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,900,900);ctx.imageSmoothingQuality='high';ctx.drawImage(img,sx,sy,side,side,105,85,690,690);
      return canvas.toDataURL('image/jpeg',0.86);
    })
  }
  function makeThumb(src){return loadImage(src).then(function(img){var c=document.createElement('canvas');c.width=360;c.height=360;var ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,360,360);ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,360,360);return c.toDataURL('image/jpeg',0.72)})}
  function updatePreview(src,label){
    cropState.clean=src;if(window.foto_limpia)foto_limpia.value=src;
    makeThumb(src).then(function(t){if(window.foto_thumb)foto_thumb.value=t}).catch(function(){});
    if(window.foto_limpia_preview&&window.fichaPremium){foto_limpia_preview.innerHTML=window.fichaPremium('prod',src,label||'Producto recortado')+controls()}
  }
  function controls(){return '<div class="crop-tools"><p class="small">Ajuste fino sin gastar IA</p><div class="grid4"><button onclick="anCropAdjust(0,0,0.88)">− Zoom</button><button onclick="anCropAdjust(0,0,1.12)">+ Zoom</button><button onclick="anCropAdjust(-1,0,1)">←</button><button onclick="anCropAdjust(1,0,1)">→</button><button onclick="anCropAdjust(0,-1,1)">↑</button><button onclick="anCropAdjust(0,1,1)">↓</button><button onclick="anCropReset()">Auto</button></div></div>'}
  function refresh(){var st=document.getElementById('ia_status');if(!cropState.src)return;if(st)st.innerHTML='✨ Ajustando ficha limpia...';renderClean(cropState.src,cropState).then(function(clean){updatePreview(clean,'Producto recortado');if(st)st.innerHTML='✅ Ficha limpia preparada. Ahora IA solo una vez.'}).catch(function(e){if(st)st.innerHTML='⚠️ No se pudo recortar: '+e.message})}
  window.anCropAdjust=function(dx,dy,z){cropState.x+=(dx||0);cropState.y+=(dy||0);cropState.zoom=Math.max(0.55,Math.min(2.4,cropState.zoom*(z||1)));refresh()};
  window.anCropReset=function(){cropState.zoom=1;cropState.x=0;cropState.y=0;refresh()};
  window.anMakeClean=function(){var src=(window.foto_original&&foto_original.value)||(window.foto_limpia&&foto_limpia.value)||'';var st=document.getElementById('ia_status');if(!src){if(st)st.innerHTML='⚠️ Primero sube una foto.';return}cropState={zoom:1,x:0,y:0,src:src,clean:''};refresh()};
  window.ivCleanPhoto=function(inp){var f=inp.files&&inp.files[0];if(!f)return;var st=document.getElementById('ia_status');if(st)st.innerHTML='📷 Cargando foto y preparando recorte automático...';readFile(f).then(function(original){if(window.foto_original)foto_original.value=original;cropState={zoom:1,x:0,y:0,src:original,clean:''};return renderClean(original,cropState).then(function(clean){updatePreview(clean,'Producto recortado');if(st)st.innerHTML='✅ Foto cargada. Ajusta el recorte si hace falta; después pulsa IA una sola vez.'})}).catch(function(e){if(st)st.innerHTML='⚠️ Error preparando foto: '+e.message})};
})();
