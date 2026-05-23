(function(){
  const colors={pez:'#1fa3ff',coral:'#9b7cff',inv:'#ffb347',micro:'#7ad957',prod:'#35b0ff',enf:'#ff6b6b'};
  window.fichaPremium=function(tipo,src,titulo){
    const c=colors[tipo]||colors.prod;
    return '<div class="ficha-premium" style="background:#f8f8f6;border-radius:24px;padding:16px;margin:10px 0;border:4px solid '+c+';box-shadow:0 10px 28px #0005">'+
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="font-size:28px;color:#08213f">ACUARIO<span style="color:'+c+'">NEXO</span></b><b style="background:'+c+';color:white;padding:7px 12px;border-radius:999px;text-transform:uppercase">'+tipo+'</b></div>'+
      '<div style="min-height:260px;background:linear-gradient(180deg,#fff,#edf4f7);border-radius:18px;margin-top:14px;display:flex;align-items:center;justify-content:center;overflow:hidden">'+(src?'<img src="'+src+'" style="max-width:86%;max-height:245px;object-fit:contain">':'<span style="color:#789;font-weight:900">Fondo oficial de ficha</span>')+'</div>'+
      '<div style="text-align:center;color:#345;font-weight:900;margin-top:10px">'+(titulo||'Ficha visual AcuarioNexo')+'</div></div>';
  };
  const oldMake=window.anMakeClean;
  window.anMakeClean=function(tipo){
    const src=document.getElementById('foto_original')?.value||'';
    const clean=document.getElementById('foto_limpia');
    const prev=document.getElementById('foto_limpia_preview');
    if(clean)clean.value=src;
    if(prev)prev.innerHTML=window.fichaPremium(tipo||'prod',src,'Foto limpia de ficha');
    if(!prev && oldMake)oldMake(tipo);
  };
})();