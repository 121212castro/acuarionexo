window.AcuarioNexoStudioTouchLock={version:'studio-touch-lock-23-05-v2-gemini'};
(function(){
  function lockCanvas(){
    var c=document.getElementById('adminCanvas');
    if(!c || c.dataset.touchLocked==='1') return;
    c.dataset.touchLocked='1';
    c.style.touchAction='none';
    c.style.userSelect='none';
    c.style.webkitUserSelect='none';
    c.style.webkitTouchCallout='none';
    function hold(ev){if(ev && ev.cancelable) ev.preventDefault()}
    c.addEventListener('touchstart',hold,{passive:false});
    c.addEventListener('touchmove',hold,{passive:false});
    c.addEventListener('gesturestart',hold,{passive:false});
  }
  function loadGemini(){
    if(window.AcuarioNexoStudioGemini || document.getElementById('studioGeminiLoader')) return;
    var sc=document.createElement('script');
    sc.id='studioGeminiLoader';
    sc.src='studio-gemini-engine.js?v=23-05-gemini-'+Date.now();
    document.body.appendChild(sc);
  }
  loadGemini();
  setInterval(lockCanvas,300);
  setTimeout(loadGemini,500);
  document.addEventListener('DOMContentLoaded',function(){lockCanvas();loadGemini()});
})();
