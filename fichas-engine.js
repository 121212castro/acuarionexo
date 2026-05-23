window.AcuarioNexoFichas={version:'fichas-clean-23-05-v2'};
window.fichaPremium=function(tipo,src,titulo){
  var box=document.createElement('div');
  box.className='ficha-premium-oficial';
  var bg=document.createElement('div');
  bg.className='ficha-bg-oficial';
  bg.style.backgroundImage='url(assets/fondos/fondo-ficha-oficial.svg?v=fichas-clean-23-05-v2)';
  if(src){
    var frame=document.createElement('div');
    frame.className='ficha-product-frame';
    var im=document.createElement('img');
    im.className='ficha-sujeto ficha-sujeto-producto';
    im.src=src;
    frame.appendChild(im);
    bg.appendChild(frame);
  }else{
    var empty=document.createElement('div');
    empty.className='ficha-vacia';
    empty.innerHTML='Fondo oficial listo<br>sin sujeto fijo';
    bg.appendChild(empty);
  }
  box.appendChild(bg);
  return box.outerHTML;
};
