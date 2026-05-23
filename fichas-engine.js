window.AcuarioNexoFichas={version:'fichas-clean-23-05'};
window.fichaPremium=function(tipo,src,titulo){
  var box=document.createElement('div');
  box.className='ficha-premium-oficial';
  var bg=document.createElement('div');
  bg.className='ficha-bg-oficial';
  bg.style.backgroundImage='url(assets/fondos/fondo-ficha-oficial.svg?v=fichas-clean-23-05)';
  if(src){var im=document.createElement('img');im.className='ficha-sujeto';im.src=src;bg.appendChild(im)}else{var empty=document.createElement('div');empty.className='ficha-vacia';empty.innerHTML='Fondo oficial listo<br>sin sujeto fijo';bg.appendChild(empty)}
  box.appendChild(bg);
  return box.outerHTML;
};
