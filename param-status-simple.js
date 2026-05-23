/* AcuarioNexo · estados visuales simples seguro */
(function(){
  function normalizeCard(card){
    const badge=card.querySelector('.pc-status');
    if(!badge)return;

    const old=(badge.textContent||'').trim().toLowerCase();
    let state='gray',label='Sin datos';

    if(card.classList.contains('param-red')||card.classList.contains('param-purple')||old.includes('fuera')||old.includes('crít')||old.includes('critic')||old.includes('mal')){
      state='red';label='Mal';
    }else if(card.classList.contains('param-yellow')||card.classList.contains('param-orange')||old.includes('vigilar')||old.includes('cuidado')||old.includes('bajo')||old.includes('alto')){
      state='yellow';label='Cuidado';
    }else if(card.classList.contains('param-green')||card.classList.contains('param-blue')||old.includes('correcto')||old.includes('ideal')||old.includes('bien')){
      state='green';label='Bien';
    }

    card.classList.remove('param-blue','param-orange','param-purple');
    card.classList.add('param-'+state);

    if(badge.textContent!==label){
      badge.textContent=label;
    }
  }

  function run(){
    const cards=document.querySelectorAll('.param-card');
    if(!cards.length)return;
    cards.forEach(normalizeCard);
  }

  function safeBoot(){
    try{run()}catch(e){console.warn('simple-status',e)}
  }

  window.addEventListener('load',()=>{
    setTimeout(safeBoot,100);
    setTimeout(safeBoot,500);
    setTimeout(safeBoot,1200);
  });

  document.addEventListener('click',()=>setTimeout(safeBoot,120),true);
})();
