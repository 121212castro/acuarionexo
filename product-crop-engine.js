window.AcuarioNexoProductCrop={version:'product-crop-23-05'};
(function(){
  function cropImage(file,done){
    var reader=new FileReader();
    reader.onload=function(ev){
      var img=new Image();
      img.onload=function(){
        var w=img.width,h=img.height;
        var vertical=h>w;
        var cw=vertical?w*0.48:w*0.72;
        var ch=vertical?h*0.72:h*0.62;
        var sx=(w-cw)/2;
        var sy=(h-ch)/2;
        var canvas=document.createElement('canvas');
        canvas.width=900;
        canvas.height=900;
        var ctx=canvas.getContext('2d');
        ctx.fillStyle='#ffffff';
        ctx.fillRect(0,0,900,900);
        ctx.drawImage(img,sx,sy,cw,ch,130,130,640,640);
        done(ev.target.result,canvas.toDataURL('image/png',0.92));
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  }
  window.ivCleanPhoto=function(inp){
    var f=inp.files&&inp.files[0];
    if(!f)return;
    cropImage(f,function(original,cropped){
      if(window.foto_original)foto_original.value=original;
      if(window.foto_limpia)foto_limpia.value=cropped;
      if(window.foto_limpia_preview && window.fichaPremium){
        foto_limpia_preview.innerHTML=window.fichaPremium('prod',cropped,'Producto recortado');
      }
    });
  };
})();
