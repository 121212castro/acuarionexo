/* AcuarioNexo · Parameters AI fallback */
(function () {
  function escText(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  function injectFallbackParameterAi() {
    const screen = document.querySelector('.param-screen');
    if (!screen || screen.querySelector('.param-ai-card')) return;
    const tiles = Array.from(screen.querySelectorAll('.param-latest'));
    if (!tiles.length) return;
    const missing = [];
    const risk = [];
    const alert = [];
    const caution = [];
    tiles.forEach(function (tile) {
      const name = (tile.querySelector('b')?.textContent || '').trim();
      const value = (tile.querySelector('strong')?.textContent || '').trim();
      const state = (tile.querySelector('.status-pill')?.textContent || '').trim();
      const text = name + (value ? ': ' + value : '');
      if (/sin datos|pendiente/i.test(state) || /pendiente/i.test(value)) missing.push(name);
      else if (/riesgo/i.test(state)) risk.push(text);
      else if (/alerta/i.test(state)) alert.push(text);
      else if (/precaución|precaucion/i.test(state)) caution.push(text);
    });
    const title = risk.length ? 'Riesgo detectado' : alert.length ? 'Alertas pendientes' : missing.length ? 'Faltan mediciones para decidir' : caution.length ? 'Revisión recomendada' : 'Sin urgencias detectadas';
    const cls = risk.length ? 'error' : (alert.length || missing.length || caution.length ? 'notice' : 'success');
    const lines = [];
    if (missing.length) lines.push('Faltan mediciones: ' + missing.slice(0, 8).join(', ') + (missing.length > 8 ? '...' : '') + '.');
    if (risk.length) lines.push('Riesgo: ' + risk.slice(0, 6).join(' · ') + '.');
    if (alert.length) lines.push('Alerta: ' + alert.slice(0, 6).join(' · ') + '.');
    if (caution.length) lines.push('Revisar: ' + caution.slice(0, 6).join(' · ') + '.');
    if (!lines.length) lines.push('Mantén la rutina y registra cambios de agua, aditivos e incidencias.');
    const html = `<div class="param-aq-card param-ai-card">
      <h3>Análisis IA</h3>
      <div class="${cls}"><b>${escText(title)}</b><br>${escText(lines.join(' '))}</div>
      <section class="param-ai-block"><h4>Consejos seguros</h4><ul>
        <li>Antes de aditar o corregir, repite los parámetros marcados y confirma el método/test usado.</li>
        <li>Si faltan mediciones, mide primero; no tomes decisiones con datos incompletos.</li>
        <li>Anota cambios recientes: agua, salinidad, alimentación, aditivos, bajas o limpieza.</li>
      </ul></section>
    </div>`;
    const cycle = Array.from(screen.querySelectorAll('.param-aq-card')).find(function (card) {
      return /Ciclos de medición/i.test(card.textContent || '');
    });
    if (cycle) cycle.insertAdjacentHTML('beforebegin', html);
    else screen.insertAdjacentHTML('beforeend', html);
  }

  function installParameterAiFallback() {
    const run = function () { try { injectFallbackParameterAi(); } catch (_) {} };
    setInterval(run, 1200);
    document.addEventListener('click', function () { setTimeout(run, 350); }, true);
    window.addEventListener('focus', run);
    run();
  }

  installParameterAiFallback();

  window.ANX = window.ANX || {};
  window.ANX.ParametersAiFallback = { injectFallbackParameterAi };
})();
