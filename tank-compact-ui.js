/* AcuarioNexo · cabecera compacta + chips de acuario · 24/05 */
(function(){
  const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function injectStyle(){
    if(document.getElementById('tankCompactStyle'))return;
    const st=document.createElement('style');
    st.id='tankCompactStyle';
    st.textContent=`
      .tank-shell{position:sticky;top:calc(92px + env(safe-area-inset-top));z-index:42;margin:0 -14px 10px;padding:8px 14px 10px;background:linear-gradient(180deg,rgba(4,18,34,.98),rgba(4,18,34,.88));backdrop-filter:blur(14px);border-bottom:1px solid rgba(139,190,255,.20)}
      .tank-head-compact{border:1px solid rgba(139,190,255,.22);border-radius:20px;padding:10px 12px;background:linear-gradient(135deg,rgba(16,54,89,.96),rgba(7,28,49,.96));box-shadow:0 10px 22px rgba(0,0,0,.22)}
      .tank-head-line{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
      .tank-title{min-width:0}.tank-title h2{font-size:26px;line-height:1.05;margin:0 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tank-meta{display:flex;flex-wrap:wrap;gap:6px}.tank-meta span,.tank-ia{display:inline-flex;align-items:center;min-height:26px;border-radius:999px;padding:5px 9px;background:rgba(255,255,255,.08);border:1px solid rgba(190,225,255,.16);font-size:13px;font-weight:900;color:#dff2ff}.tank-ia{color:#9fffc4;border-color:rgba(46,232,124,.25);background:rgba(46,232,124,.10);white-space:nowrap}.tank-back{flex:0 0 auto;border-radius:999px!important;padding:8px 10px!important;min-width:auto!important;font-size:13px!important;background:rgba(255,255,255,.07)!important}
      .tank-chip-nav{display:flex;gap:8px;overflow-x:auto;padding:9px 1px 2px;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity}.tank-chip-nav::-webkit-scrollbar{display:none}.tank-chip{flex:0 0 auto;scroll-snap-align:start;border-radius:999px!important;min-width:auto!important;padding:10px 14px!important;font-size:14px!important;line-height:1!important;background:rgba(16,52,85,.90)!important;border:1px solid rgba(120,180,255,.26)!important;box-shadow:none!important}.tank-chip.active{background:linear-gradient(135deg,#0877ff,#0bbcff)!important;border-color:rgba(186,235,255,.78)!important;color:#fff!important}.tank-chip.more{padding-right:18px!important}
      .tank-more-panel{display:none;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}.tank-more-panel.open{display:grid}.tank-more-panel button{border-radius:15px!important;padding:10px!important;font-size:13px!important;background:rgba(16,52,85,.70)!important}.param-screen{margin-top:10px}.param-screen h2{font-size:24px;margin-bottom:8px}.param-live-head{font-size:14px!important;line-height:1.35!important;margin-top:0!important}.param-card-grid{grid-template-columns:repeat(auto-fit,minmax(138px,1fr))!important}.param-card{position:relative;overflow:hidden;min-height:104px!important;padding:12px!important;background:linear-gradient(180deg,rgba(20,50,78,.96),rgba(8,27,48,.96))!important;border:1px solid rgba(145,205,255,.22)!important}.param-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:7px;background:#94a3b8}.param-card:after{content:"";position:absolute;right:10px;top:10px;width:11px;height:11px;border-radius:999px;background:#94a3b8;box-shadow:0 0 16px rgba(148,163,184,.55)}.pc-value{font-size:24px!important}.pc-value small{font-size:13px!important;color:#bdd7ed!important}.pc-status{font-size:12px!important}.pc-original{font-size:11px!important}
      /* Colores simples: verde correcto, amarillo vigilar, rojo peligro, gris sin datos */
      .param-green,.param-blue{background:linear-gradient(180deg,rgba(10,76,48,.96),rgba(5,36,31,.96))!important;border-color:rgba(46,232,124,.52)!important}.param-green:before,.param-green:after,.param-blue:before,.param-blue:after{background:#2ee87c}.param-green:after,.param-blue:after{box-shadow:0 0 16px rgba(46,232,124,.65)}.param-green .pc-status,.param-blue .pc-status{background:rgba(46,232,124,.18)!important;color:#caffdd!important;border:1px solid rgba(46,232,124,.32)!important}
      .param-yellow,.param-orange{background:linear-gradient(180deg,rgba(93,77,10,.96),rgba(47,39,7,.96))!important;border-color:rgba(255,209,47,.62)!important}.param-yellow:before,.param-yellow:after,.param-orange:before,.param-orange:after{background:#ffd12f}.param-yellow:after,.param-orange:after{box-shadow:0 0 16px rgba(255,209,47,.70)}.param-yellow .pc-status,.param-orange .pc-status{background:rgba(255,209,47,.20)!important;color:#fff4bd!important;border:1px solid rgba(255,209,47,.38)!important}
      .param-red,.param-purple{background:linear-gradient(180deg,rgba(106,23,37,.96),rgba(52,10,21,.96))!important;border-color:rgba(255,85,112,.70)!important}.param-red:before,.param-red:after,.param-purple:before,.param-purple:after{background:#ff5570}.param-red:after,.param-purple:after{box-shadow:0 0 16px rgba(255,85,112,.75)}.param-red .pc-status,.param-purple .pc-status{background:rgba(255,85,112,.22)!important;color:#ffd2da!important;border:1px solid rgba(255,85,112,.42)!important}
      .param-gray{background:linear-gradient(180deg,rgba(38,57,78,.96),rgba(19,31,46,.96))!important;border-color:rgba(148,163,184,.36)!important}.param-gray:before,.param-gray:after{background:#94a3b8}.param-gray:after{box-shadow:0 0 16px rgba(148,163,184,.55)}.param-gray .pc-status{background:rgba(148,163,184,.18)!important;color:#e2e8f0!important;border:1px solid rgba(148,163,184,.30)!important}
      @media(max-width:760px){.tank-shell{top:calc(78px + env(safe-area-inset-top));margin-left:-10px;margin-right:-10px;padding:7px 10px 9px}.tank-head-compact{padding:9px 10px;border-radius:18px}.tank-title h2{font-size:23px}.tank-meta span,.tank-ia{font-size:12px;min-height:24px;padding:4px 8px}.tank-chip{padding:9px 12px!important;font-size:13px!important}.param-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.param-card{min-height:100px!important}.pc-name{font-size:13px!important}.pc-value{font-size:21px!important}.topbar{padding-top:calc(8px + env(safe-area-inset-top))!important;padding-bottom:8px!important}.topbar h1{font-size:29px!important}.connection-pill{margin-top:3px!important}.ghost{padding:8px 8px!important}}
      @media(max-width:430px){.tank-title h2{font-size:22px}.tank-back{font-size:12px!important;padding:7px 9px!important}.tank-chip-nav{gap:7px}.tank-chip{padding:9px 11px!important}.param-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.param-live-head{display:none!important}}
    `;
    document.head.appendChild(st);
  }

  function tipo(q){
    const t=String(q?.aquarium_type||q?.subtype||'').toLowerCase();
    if(t.includes('fresh')||t.includes('dulce'))return'Dulce';
    if(t.includes('reef'))return'Marino-Reef';
    if(t.includes('marine')||t.includes('marino'))return'Marino';
    if(t.includes('hospital'))return'Hospital';
    return q?.subtype||q?.aquarium_type||'Acuario';
  }

  function chip(label,fn,active){return `<button class="tank-chip ${active===label?'active':''}" onclick="window.__aqActive='${label}';${fn}">${label}</button>`}

  window.toggleTankMore=function(){document.getElementById('tankMorePanel')?.classList.toggle('open')};

  window.am=function(){
    injectStyle();
    const q=window.q||{};
    const active=window.__aqActive||'Ficha';
    const litros=esc(q.real_liters??q.liters??'-');
    const ia=(q.ai_summary&&q.ai_summary!=='Pendiente IA')?'IA activa':'IA alerta';
    return `<section class="tank-shell">
      <div class="tank-head-compact">
        <div class="tank-head-line">
          <div class="tank-title"><h2>${esc(q.name||'Acuario')}</h2><div class="tank-meta"><span>${litros} L</span><span>${esc(tipo(q))}</span><span class="tank-ia">${esc(ia)}</span></div></div>
          <button class="tank-back" onclick="acs()">← Acuarios</button>
        </div>
        <nav class="tank-chip-nav" aria-label="Menú del acuario">
          ${chip('Parámetros','pars()',active)}
          ${chip('Animales','anis()',active)}
          ${chip('Fotos','fotos()',active)}
          ${chip('Historial',"moduleBase('Historial','aquarium_events')",active)}
          <button class="tank-chip more" onclick="toggleTankMore()">Más ▾</button>
        </nav>
        <div id="tankMorePanel" class="tank-more-panel">
          <button onclick="window.__aqActive='Hospital';hosp()">Hospital</button>
          <button onclick="window.__aqActive='Equipamiento';moduleBase('Equipamiento','equipment')">Equipamiento</button>
          <button onclick="window.__aqActive='Mantenimiento';moduleBase('Mantenimiento','maintenance_logs')">Mantenimiento</button>
          <button onclick="window.__aqActive='ICP';moduleBase('ICP','icp_analyses')">ICP</button>
          <button onclick="window.__aqActive='Consumo';moduleBase('Consumo','consumption_logs')">Consumo</button>
          <button onclick="window.__aqActive='Gastos';moduleBase('Gastos','expenses')">Gastos</button>
        </div>
      </div>
    </section>`;
  };

  function wrap(name,label){
    const old=window[name];
    if(typeof old!=='function'||old.__compactWrapped)return;
    const nw=function(){window.__aqActive=label;return old.apply(this,arguments)};
    nw.__compactWrapped=true;
    window[name]=nw;
  }
  function wrapModule(){
    const old=window.moduleBase;
    if(typeof old!=='function'||old.__compactWrapped)return;
    const nw=function(title,table){window.__aqActive=title||'Más';return old.apply(this,arguments)};
    nw.__compactWrapped=true;
    window.moduleBase=nw;
  }

  function install(){
    injectStyle();
    wrap('panel','Ficha');wrap('pars','Parámetros');wrap('anis','Animales');wrap('fotos','Fotos');wrap('hosp','Hospital');wrapModule();
  }
  install();
  setTimeout(install,0);
})();
