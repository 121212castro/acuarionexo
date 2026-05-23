/* AcuarioNexo · estados visuales simples: verde, amarillo, rojo, gris */
(function(){
  function normalizeCard(card){
    const badge=card.querySelector('.pc-status');
    if(!badge)return;
    const old=(badge.textContent||'').trim().toLowerCase();
    let state='gray', label='Sin datos';
    if(old.includes('fuera')||old.includes('crít')||old.includes('critic')||old.includes('mal')){state='red';label='Mal'}
    else if(old.includes('vigilar')||old.includes('cuidado')||old.includes('bajo')||old.includes('alto')){state='yellow';label='Cuidado'}
    else if(old.includes('correcto')||old.includes('ideal')||old.includes('bien')){state='green';label='Bien'}
    else if(!old||old.includes('sin datos')){state='gray';label='Sin datos'}
    else if(card.classList.contains('param-red')||card.classList.contains('param-purple')){state='red';label='Mal'}
    else if(card.classList.contains('param-yellow')||card.classList.contains('param-orange')){state='yellow';label='Cuidado'}
    else if(card.classList.contains('param-green')||card.classList.contains('param-blue')){state='green';label='Bien'}
    card.classList.remove('param-blue','param-orange','param-purple','param-green','param-yellow','param-red','param-gray');
    card.classList.add('param-'+state);
    badge.textContent=label;
  }
  function run(){document.querySelectorAll('.param-card').forEach(normalizeCard)}
  document.addEventListener('click',()=>setTimeout(run,60),true);
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
  setTimeout(run,120);
})();
