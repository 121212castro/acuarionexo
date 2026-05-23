(function(){
  const bg='assets/fondos/fondo-ficha-oficial.svg?v=oficial-clean-v2';
  window.fichaPremium=function(tipo,src,titulo){
    const sujeto=src
      ?'<img src="'+src+'" class="ficha-sujeto">'
      :'<div class="ficha-vacia">Fondo oficial listo<br>sin sujeto fijo</div>';

    return '<div class="ficha-premium-oficial">'
      +'<div class="ficha-bg-oficial" style="background-image:url('+bg+')">'
      +sujeto
      +'</div>'
      +'</div>';
  };

  window.anMakeClean=function(tipo){
    const src=document.getElementById('foto_original')?.value||'';
    const clean=document.getElementById('foto_limpia');
    const prev=document.getElementById('foto_limpia_preview');

    if(clean) clean.value=src;

    if(prev){
      prev.innerHTML=window.fichaPremium(tipo||'prod',src,'Foto limpia de ficha');
    }
  };
})();