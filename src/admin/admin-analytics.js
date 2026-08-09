/* AcuarioNexo · analítica y control económico IA */
(function () {
  const ANX = window.ANX;
  if (!ANX) return;
  let customerRows = [];

  function esc(value) { return ANX.esc ? ANX.esc(value) : String(value ?? ''); }
  function metric(label, value, description) { return `<article class="summary-card"><div><small>${esc(label)}</small><h2>${esc(value)}</h2><p>${esc(description || '')}</p></div></article>`; }
  function num(value) { return new Intl.NumberFormat('es-ES').format(Number(value) || 0); }
  function money(value, currency) { try { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency || 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(Number(value) || 0); } catch (_) { return `${Number(value || 0).toFixed(4)} ${currency || ''}`; } }
  function value(id) { return document.getElementById(id)?.value?.trim() || ''; }
  function nullableNumber(id) { const v = value(id); if (v === '') return null; const n = Number(v.replace(',', '.')); return Number.isFinite(n) ? n : null; }

  function listRows(items, labelKey, valueKey) {
    if (!Array.isArray(items) || !items.length) return '<p class="small">Aún no hay datos.</p>';
    return `<div class="admin-analytics-list">${items.map(item => `<div class="admin-analytics-row"><span>${esc(item[labelKey] || 'Sin dato')}</span><strong>${esc(item[valueKey] ?? 0)}</strong></div>`).join('')}</div>`;
  }
  function dailyRows(items) {
    if (!Array.isArray(items) || !items.length) return '<p class="small">Aún no hay datos diarios.</p>';
    const max = Math.max.apply(null, items.map(item => Number(item.views) || 0).concat([1]));
    return `<div class="admin-analytics-daily">${items.map(item => { const width = Math.max(4, Math.round(((Number(item.views) || 0) / max) * 100)); return `<div class="admin-analytics-day"><span>${esc(item.date)}</span><div class="admin-analytics-bar-wrap"><div class="admin-analytics-bar" style="width:${width}%"></div></div><strong>${esc(item.views || 0)}</strong><small>${esc(item.sessions || 0)} sesiones</small></div>`; }).join('')}</div>`;
  }
  function analyticsStyles() {
    if (document.getElementById('adminAnalyticsStyles')) return;
    const style = document.createElement('style'); style.id = 'adminAnalyticsStyles';
    style.textContent = `.admin-analytics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.admin-analytics-list{display:grid;gap:8px}.admin-analytics-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(128,128,128,.18)}.admin-analytics-row:last-child{border-bottom:0}.admin-analytics-daily{display:grid;gap:10px}.admin-analytics-day{display:grid;grid-template-columns:90px minmax(120px,1fr) 50px 90px;align-items:center;gap:10px}.admin-analytics-bar-wrap{height:10px;border-radius:999px;background:rgba(128,128,128,.16);overflow:hidden}.admin-analytics-bar{height:100%;border-radius:999px;background:currentColor;opacity:.72}.ai-customer-grid{display:grid;gap:12px}.ai-customer-row{border:1px solid rgba(128,128,128,.2);border-radius:12px;padding:13px}.ai-customer-row .line{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.ai-status{font-weight:700}.ai-billing-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.ai-billing-form .wide{grid-column:1/-1}@media(max-width:640px){.admin-analytics-day{grid-template-columns:78px 1fr 36px}.admin-analytics-day small{grid-column:2/4}}`;
    document.head.appendChild(style);
  }

  window.adminAnalytics = async function () {
    const requireAdmin = ANX.Admin?.requireAdmin; if (typeof requireAdmin === 'function' && !await requireAdmin()) return; analyticsStyles();
    ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Analítica</h2><p>Actividad de AcuarioNexo</p></div></section><section class="panel"><button onclick="adminPanel()">← Admin</button>${ANX.msg ? ANX.msg('Cargando analítica...') : '<p>Cargando...</p>'}</section>`, 'admin');
    try {
      const { data, error } = await ANX.supabase.rpc('admin_analytics_summary'); if (error) throw error; const d = data || {};
      ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Analítica</h2><p>Datos propios de AcuarioNexo · solo con consentimiento</p></div></section><section class="panel"><div class="panel-head"><h2>Resumen</h2><button onclick="adminPanel()">← Admin</button></div><div class="quick-actions">${metric('Activos ahora', d.activeNow || 0, 'Sesiones con actividad en los últimos 5 min')}${metric('Visitas hoy', d.visitsToday || 0, `${d.sessionsToday || 0} sesiones`)}${metric('Visitas 7 días', d.visits7d || 0, `${d.sessions7d || 0} sesiones`)}${metric('Visitas 30 días', d.visits30d || 0, `${d.sessions30d || 0} sesiones`)}</div></section><section class="panel"><div class="panel-head"><h2>Últimos 14 días</h2></div>${dailyRows(d.daily)}</section><section class="admin-analytics-grid"><section class="panel"><h2>Páginas</h2>${listRows(d.topPages,'page','views')}</section><section class="panel"><h2>Dispositivos</h2>${listRows(d.devices,'device','views')}</section><section class="panel"><h2>Origen</h2>${listRows(d.referrers,'source','views')}</section><section class="panel"><h2>Países</h2>${listRows(d.countries,'country','views')}</section></section><section class="panel"><button onclick="adminAnalytics()">↻ Actualizar</button></section>`, 'admin');
    } catch (e) { ANX.render(`<section class="panel"><button onclick="adminPanel()">← Admin</button>${ANX.msg ? ANX.msg(e.message || 'No se pudo cargar la analítica.','error') : `<p>${esc(e.message)}</p>`}</section>`, 'admin'); }
  };

  function customerCard(r) {
    const status = r.quota_blocked ? '⛔ Límite alcanzado' : (r.quota_warning ? '⚠ Cerca del límite' : '✓ Disponible');
    const limits = [`${r.monthly_action_limit == null ? '∞' : num(r.monthly_action_limit)} acciones`, `${r.monthly_token_limit == null ? '∞' : num(r.monthly_token_limit)} tokens`, `${r.monthly_provider_cost_limit_usd == null ? '∞' : money(r.monthly_provider_cost_limit_usd,'USD')} coste API`].join(' · ');
    const canEdit = ['owner','admin'].includes(ANX.state?.adminRole?.role);
    return `<article class="ai-customer-row"><div class="line"><div><b>${esc(r.email || 'Sin email')}</b><p class="small">Acceso: ${esc(r.entitlement_plan || 'free')} · Cuota comercial: ${esc(r.commercial_plan || 'sin_configurar')}</p></div><span class="ai-status">${esc(status)}</span></div><p><b>${num(r.actions_month)}</b> acciones · <b>${num(r.tokens_month)}</b> tokens · coste proveedor <b>${money(r.provider_cost_usd,'USD')}</b></p><p class="small">Límites: ${esc(limits)}</p><p><b>Cobro calculado: ${money(r.estimated_charge,r.billing_currency || 'EUR')}</b></p>${canEdit ? `<button onclick="adminAiCustomerEdit('${esc(r.user_id)}')">Configurar cuota y precio</button>` : ''}</article>`;
  }

  window.adminAiCustomers = async function () {
    const requireAdmin = ANX.Admin?.requireAdmin; if (typeof requireAdmin === 'function' && !await requireAdmin()) return; analyticsStyles();
    ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Clientes IA</h2><p>Consumo, coste, límites y cuotas</p></div></section><section class="panel"><button onclick="adminPanel()">← Admin</button>${ANX.msg('Cargando clientes y consumos...')}</section>`, 'admin');
    try {
      const { data, error } = await ANX.supabase.rpc('admin_ai_customer_usage'); if (error) throw error; customerRows = data || [];
      const actions = customerRows.reduce((a,r)=>a+Number(r.actions_month||0),0), tokens = customerRows.reduce((a,r)=>a+Number(r.tokens_month||0),0), provider = customerRows.reduce((a,r)=>a+Number(r.provider_cost_usd||0),0), blocked = customerRows.filter(r=>r.quota_blocked).length;
      ANX.render(`<section class="summary-card"><div><small>Admin</small><h2>Clientes IA</h2><p>Control económico mensual por cuenta</p></div></section><section class="panel"><div class="panel-head"><h2>Mes actual</h2><button onclick="adminPanel()">← Admin</button></div><div class="quick-actions">${metric('Acciones IA',num(actions),'Todas las cuentas')}${metric('Tokens',num(tokens),'Consumo mensual')}${metric('Coste API',money(provider,'USD'),'Coste interno estimado')}${metric('Bloqueados',blocked,'Por límite configurado')}</div><p class="small">El coste API es el coste interno estimado del proveedor. El cobro al cliente se calcula aparte según la cuota fija, precio por acción y/o precio por 1.000 tokens que configures.</p></section><section class="panel"><div class="panel-head"><h2>Cuentas</h2><button onclick="adminAiCustomers()">↻ Actualizar</button></div><div class="ai-customer-grid">${customerRows.map(customerCard).join('') || '<p class="small">No hay cuentas.</p>'}</div></section>`, 'admin');
    } catch (e) { ANX.render(`<section class="panel"><button onclick="adminPanel()">← Admin</button>${ANX.msg(e.message || 'No se pudo cargar el control de clientes.','error')}</section>`, 'admin'); }
  };

  window.adminAiCustomerEdit = function (userId) {
    analyticsStyles(); const r = customerRows.find(x => String(x.user_id) === String(userId)); if (!r) return adminAiCustomers();
    const checked = v => v ? 'checked' : '';
    ANX.render(`<section class="summary-card"><div><small>Cliente IA</small><h2>${esc(r.email || 'Cuenta')}</h2><p>Configurar límites y cobro</p></div></section><section class="panel"><button onclick="adminAiCustomers()">← Clientes IA</button><div class="ai-billing-form"><div><label>Nombre de cuota / plan</label><input id="aiCommercialPlan" value="${esc(r.commercial_plan === 'sin_configurar' ? '' : r.commercial_plan || '')}" placeholder="Ej.: Pro 10"></div><div><label>Límite acciones / mes</label><input id="aiActionLimit" type="number" min="0" value="${r.monthly_action_limit ?? ''}" placeholder="Vacío = sin límite"></div><div><label>Límite tokens / mes</label><input id="aiTokenLimit" type="number" min="0" value="${r.monthly_token_limit ?? ''}" placeholder="Vacío = sin límite"></div><div><label>Límite coste API / mes (USD)</label><input id="aiCostLimit" type="number" min="0" step="0.0001" value="${r.monthly_provider_cost_limit_usd ?? ''}" placeholder="Vacío = sin límite"></div><div><label>Aviso al %</label><input id="aiWarningPercent" type="number" min="1" max="100" step="1" value="${r.warning_percent ?? 80}"></div><div><label>Moneda de cobro</label><select id="aiCurrency"><option value="EUR" ${(r.billing_currency||'EUR')==='EUR'?'selected':''}>EUR</option><option value="USD" ${r.billing_currency==='USD'?'selected':''}>USD</option></select></div><div><label>Cuota fija mensual</label><input id="aiMonthlyFee" type="number" min="0" step="0.01" value="${r.monthly_fee ?? 0}"></div><div><label>Precio por acción</label><input id="aiPriceAction" type="number" min="0" step="0.0001" value="${r.price_per_action ?? 0}"></div><div><label>Precio por 1.000 tokens</label><input id="aiPriceTokens" type="number" min="0" step="0.0001" value="${r.price_per_1k_tokens ?? 0}"></div><div><label><input id="aiHardLimit" type="checkbox" ${checked(r.hard_limit)}> Bloquear al alcanzar límite</label></div><div><label><input id="aiProfileActive" type="checkbox" ${checked(r.profile_active)}> Perfil de cobro activo</label></div><div class="wide"><label>Notas internas</label><textarea id="aiBillingNotes" rows="3"></textarea></div></div><div class="quick-actions"><button class="primary" onclick="adminAiCustomerSave('${esc(r.user_id)}')">Guardar configuración</button></div><div id="aiBillingStatus"></div><p class="small">Puedes usar solo cuota fija, solo consumo o combinar ambos. Un límite vacío significa sin límite; un límite 0 bloquea ese recurso desde el inicio.</p></section>`, 'admin');
  };

  window.adminAiCustomerSave = async function (userId) {
    const box = document.getElementById('aiBillingStatus'); if (box) box.innerHTML = ANX.msg('Guardando...');
    try {
      const args = { p_user_id:userId, p_commercial_plan:value('aiCommercialPlan') || 'sin_configurar', p_monthly_action_limit:nullableNumber('aiActionLimit'), p_monthly_token_limit:nullableNumber('aiTokenLimit'), p_monthly_provider_cost_limit_usd:nullableNumber('aiCostLimit'), p_hard_limit:!!document.getElementById('aiHardLimit')?.checked, p_warning_percent:nullableNumber('aiWarningPercent') ?? 80, p_monthly_fee:nullableNumber('aiMonthlyFee') ?? 0, p_price_per_action:nullableNumber('aiPriceAction') ?? 0, p_price_per_1k_tokens:nullableNumber('aiPriceTokens') ?? 0, p_billing_currency:value('aiCurrency') || 'EUR', p_active:!!document.getElementById('aiProfileActive')?.checked, p_notes:value('aiBillingNotes') || null };
      const { error } = await ANX.supabase.rpc('admin_set_ai_billing_profile', args); if (error) throw error; if (box) box.innerHTML = ANX.msg('Configuración guardada.','success'); setTimeout(()=>adminAiCustomers(),500);
    } catch (e) { if (box) box.innerHTML = ANX.msg(e.message || 'No se pudo guardar.','error'); }
  };

  function injectButtons() {
    const headings = Array.from(document.querySelectorAll('.panel-head h2')); const target = headings.find(node => /Administración|Control general/i.test(node.textContent || '')); const actions = target?.closest('.panel')?.querySelector('.quick-actions'); if (!actions) return;
    if (!document.getElementById('adminAnalyticsButton')) { const b=document.createElement('button'); b.id='adminAnalyticsButton'; b.setAttribute('onclick','adminAnalytics()'); b.innerHTML='<span>▥</span>Analítica'; actions.appendChild(b); }
    if (!document.getElementById('adminAiCustomersButton')) { const b=document.createElement('button'); b.id='adminAiCustomersButton'; b.setAttribute('onclick','adminAiCustomers()'); b.innerHTML='<span>€</span>Clientes IA'; actions.appendChild(b); }
  }
  const observer = new MutationObserver(injectButtons); observer.observe(document.body,{childList:true,subtree:true}); injectButtons();
})();
