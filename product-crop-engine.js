window.AcuarioNexoProductCrop={version:'product-crop-23-05-v2'};
(function(){
  function readFile(file){
    return new Promise(function(resolve,reject){
      var r=new FileReader();
      r.onload=function(e){resolve(e.target.result)};
      r.onerror=reject;
      r.readAsDataURL(file);
    });
  }
  function loadImage(src){
    return new Promise(function(resolve,reject){
      var img=new Image();
      img.onload=function(){resolve(img)};
      img.onerror=reject;
      img.src=src;
    });
  }
  function colorDist(a,b){
    var dr=a[0]-b[0],dg=a[1]-b[1],db=a[2]-b[2];
    return Math.sqrt(dr*dr+dg*dg+db*db);
  }
  function sampleBg(data,w,h){
    var pts=[[8,8],[w-9,8],[8,h-9],[w-9,h-9],[Math.floor(w/2),8],[Math.floor(w/2),h-9]];
    var r=0,g=0,b=0,n=0;
    pts.forEach(function(p){
      var x=Math.max(0,Math.min(w-1,p[0])),y=Math.max(0,Math.min(h-1,p[1]));
      var i=(y*w+x)*4;r+=data[i];g+=data[i+1];b+=data[i+2];n++;
    });
    return [r/n,g/n,b/n];
  }
  function detectBox(img){
    var maxSide=900,scale=Math.min(1,maxSide/Math.max(img.width,img.height));
    var w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
    var c=document.createElement('canvas');c.width=w;c.height=h;
    var ctx=c.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(img,0,0,w,h);
    var im=ctx.getImageData(0,0,w,h),d=im.data,bg=sampleBg(d,w,h);
    var minX=w,minY=h,maxX=0,maxY=0,count=0;
    var step=Math.max(1,Math.floor(Math.max(w,h)/450));
    for(var y=0;y<h;y+=step){
      for(var x=0;x<w;x+=step){
        var i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];
        if(a<20)continue;
        var bright=(r+g+b)/3;
        var diff=colorDist([r,g,b],bg);
        var isObject=(diff>34 && bright<248) || bright<178;
        if(isObject){
          minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);count++;
        }
      }
    }
    if(count<80){
      return {x:img.width*0.22,y:img.height*0.10,w:img.width*0.56,h:img.height*0.72};
    }
    var pad=Math.round(Math.max(maxX-minX,maxY-minY)*0.10);
    minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);
    maxX=Math.min(w,maxX+pad);maxY=Math.min(h,maxY+pad);
    return {x:minX/scale,y:minY/scale,w:(maxX-minX)/scale,h:(maxY-minY)/scale};
  }
  function makeClean(src){
    return loadImage(src).then(function(img){
      var box=detectBox(img);
      var side=Math.max(box.w,box.h)*1.18;
      var sx=Math.max(0,box.x+box.w/2-side/2),sy=Math.max(0,box.y+box.h/2-side/2);
      if(sx+side>img.width)sx=Math.max(0,img.width-side);
      if(sy+side>img.height)sy=Math.max(0,img.height-side);
      side=Math.min(side,img.width-sx,img.height-sy);
      var canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1000;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1000,1000);
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,sx,sy,side,side,110,90,780,780);
      return canvas.toDataURL('image/png',0.94);
    });
  }
  function updatePreview(src,label){
    if(window.foto_limpia)foto_limpia.value=src;
    if(window.foto_limpia_preview && window.fichaPremium){
      foto_limpia_preview.innerHTML=window.fichaPremium('prod',src,label||'Producto recortado');
    }
  }
  window.anMakeClean=function(){
    var src=(window.foto_original&&foto_original.value)||(window.foto_limpia&&foto_limpia.value)||'';
    var st=document.getElementById('ia_status');
    if(!src){if(st)st.innerHTML='⚠️ Primero sube una foto.';return;}
    if(st)st.innerHTML='✨ Recortando producto y preparando ficha limpia...';
    makeClean(src).then(function(clean){updatePreview(clean,'Producto recortado');if(st)st.innerHTML='✅ Ficha limpia preparada.'}).catch(function(e){if(st)st.innerHTML='⚠️ No se pudo recortar: '+e.message});
  };
  window.ivCleanPhoto=function(inp){
    var f=inp.files&&inp.files[0];
    if(!f)return;
    var st=document.getElementById('ia_status');
    if(st)st.innerHTML='📷 Cargando foto y recortando producto...';
    readFile(f).then(function(original){
      if(window.foto_original)foto_original.value=original;
      return makeClean(original).then(function(clean){
        updatePreview(clean,'Producto recortado');
        if(st)st.innerHTML='✅ Foto cargada y producto recortado.';
      });
    }).catch(function(e){if(st)st.innerHTML='⚠️ Error preparando foto: '+e.message});
  };
})();
