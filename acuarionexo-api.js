/* AcuarioNexo · API interna Fase 1 Parámetros
   Punto 1: capa única para saber qué parámetros faltan, cuáles están correctos,
   cuáles van tarde y cuál es la próxima medición. */
(function(){
  const DAY = 24*60*60*1000;
  const defaults = {
    marine: { temperature_c:1, salinity_ppt:2, specific_gravity:2, ph:2, kh_dkh:3, nitrite_no2:7, nitrate_no3:7, phosphate_po4:7, calcium_ca:14, magnesium_mg:14, potassium_k:30 },
    freshwater: { temperature_c:1, ph:7, kh_dkh:14, gh:14, ammonia_nh3:7, nitrite_no2:7, nitrate_no3:7, phosphate_po4:14, tds:14, conductivity:14, co2:7, iron_fe:14 }
  };
  function schema(){ return window.MEASUREMENT_SCHEMA || window.MeasurementSchema || {parameters:{}, mainByMode:{}}; }
  function aquariumMode(aq){
    const t = String(aq?.aquarium_type || aq?.type || '').toLowerCase();
    if(['freshwater','planted','betta','angelfish','breeding'].includes(t)) return 'freshwater';
    return 'marine';
  }
  function mainKeys(aq){ const m=aquariumMode(aq), sc=schema(); return (sc.mainByMode?.[m] || defaults[m] && Object.keys(defaults[m]) || []).slice(); }
  function label(k){ return schema().parameters?.[k]?.label || k; }
  function freqDays(k, aq){ return Number((defaults[aquariumMode(aq)]||{})[k] || 14); }
  function statusText(row){
    if(!row) return 'pendiente';
    if(['red','purple'].includes(row.color) || ['high','critical'].includes(row.risk_level)) return 'crítico';
    if(['yellow','orange'].includes(row.color) || row.risk_level === 'medium') return 'revisar';
    return 'correcto';
  }
  function latestByKey(rows){
    const out = {};
    (rows||[]).forEach(r => { const k = r.parameter_key || r.parameter; if(k && !out[k]) out[k]=r; });
    return out;
  }
  function dueInfo(k, row, aq, now){
    const freq = freqDays(k, aq);
    if(!row) return { state:'pending', pending:true, delayed:true, next:null, daysLate:null, freq };
    const base = new Date(row.measured_at || row.created_at || Date.now());
    const next = new Date(base.getTime() + freq*DAY);
    const daysLate = Math.floor((now - next)/DAY);
    return { state: daysLate>0?'late':'ok', pending:false, delayed:daysLate>0, next:next.toISOString(), daysLate:daysLate>0?daysLate:0, freq };
  }
  async function measurements(aquariumId, limit){
    const r = await window.s.from('aquarium_measurements').select('*').eq('aquarium_id', aquariumId).order('measured_at',{ascending:false}).limit(limit||500);
    if(r.error) throw r.error;
    return r.data || [];
  }
  async function parameterState(aq){
    if(!aq?.id) throw new Error('No hay acuario seleccionado.');
    const rows = await measurements(aq.id, 500), latest = latestByKey(rows), keys = mainKeys(aq), now = new Date();
    const items = keys.map(k => {
      const row = latest[k], due = dueInfo(k,row,aq,now);
      return { key:k, label:label(k), latest:row||null, status:statusText(row), ...due };
    });
    const pending = items.filter(x=>!x.latest);
    const delayed = items.filter(x=>x.latest && x.delayed);
    const next = items.filter(x=>x.next).sort((a,b)=>new Date(a.next)-new Date(b.next))[0] || null;
    const bad = items.filter(x=>['crítico','revisar'].includes(x.status));
    const overall = pending.length ? 'incompleto' : delayed.length ? 'retrasado' : bad.length ? 'revisar' : 'correcto';
    return { aquarium: aq, mode:aquariumMode(aq), rows, items, pending, delayed, next, bad, overall };
  }
  function graphSeries(rows){
    const g = {};
    (rows||[]).forEach(r=>{ const k=r.parameter_key||r.parameter; const v=Number(r.normalized_value ?? r.value ?? r.raw_value); if(!k || !Number.isFinite(v)) return; (g[k]=g[k]||[]).push({x:r.measured_at||r.created_at,y:v,label:label(k)}); });
    Object.keys(g).forEach(k=>g[k].sort((a,b)=>new Date(a.x)-new Date(b.x)));
    return g;
  }
  window.AcuarioNexoAPI = { aquariumMode, mainKeys, freqDays, measurements, parameterState, graphSeries, label };
})();