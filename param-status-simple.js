/* AcuarioNexo · estados visuales simples: verde, amarillo, rojo, gris */
(function(){
  function normalizeCard(card){
    const badge=card.querySelector('.pc-status');
    if(!badge)return;
    const old=(badge.textContent||'').trim().toLowerCase();
    let state='gray', label='Sin datos';

    if(card.classList.contains('param-red')||card.classList.contains('param-purple')||old.includes('fuera')||old.includes('crít')||old.includes('critic')||old.includes('mal')){state='red';label='Mal'}
    else if(card.classList.contains('param-yellow')||card.classList.contains('param-orange')||old.includes('vigilar')||old.includes('cuidado')||old.includes('bajo')||old.includes('alto')){state='yellow';label='Cuidado'}
    else if(card.classList.contains('param-green')||card.classList.contains('param-blue')||old.includes('correcto')||old.includes('ideal')||old.includes('bien')){state='green';label='Bien'}
    else {state='gray';label='Sin datos'}

    card.classList.remove('param-blue','param-orange','param-purple','param-green','param-yellow','param-red','param-gray');
    card.classList.add('param-'+state);
    badge.textContent=label;
  }

  function run(){document.querySelectorAll('.param-card').forEach(normalizeCard)}

  function wrapPars(){
    const old=window.pars;
    if(typeof old!=='function'||old.__simpleStatusWrapped)return;
    const wrapped=async function(){
      const r=await old.apply(this,arguments);
      setTimeout(run,0);setTimeout(run,80);setTimeout(run,250);
      return r;
    };
    wrapped.__simpleStatusWrapped=true;
    window.pars=wrapped;
  }

  function boot(){wrapPars();run()}
  document.addEventListener('click',()=>setTimeout(run,80),true);
  new MutationObserver(()=>setTimeout(run,0)).observe(document.body,{childList:true,subtree:true,characterData:true});
  boot();setTimeout(boot,0);setTimeout(boot,300);setTimeout(boot,1000);
})();
