window.AcuarioNexoStudioTouchLock={version:'studio-touch-lock-23-05-v1'};
(function(){
  function lockCanvas(){
    var c=document.getElementById('adminCanvas');
    if(!c || c.dataset.touchLocked==='1') return;
    c.dataset.touchLocked='1';
    c.style.touchAction='none';
    c.style.userSelect='none';
    c.style.webkitUserSelect='none';
    c.style.webkitTouchCallout='none';
    function hold(ev){
      if(ev && ev.cancelable) ev.preventDefault();
    }
    c.addEventListener('touchstart',hold,{passive:false});
    c.addEventListener('touchmove',hold,{passive:false});
    c.addEventListener('gesturestart',hold,{passive:false});
  }
  setInterval(lockCanvas,300);
  document.addEventListener('DOMContentLoaded',lockCanvas);
})();
