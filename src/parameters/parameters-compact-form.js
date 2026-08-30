/* AcuarioNexo · formulario compacto de mediciones */
(function () {
  const ANX = window.ANX = window.ANX || {};

  function esc(value) {
    return ANX.esc ? ANX.esc(value) : String(value ?? '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
    });
  }

  function compactTestLabel(test) {
    const data = test?.data || {};
    const brand = String(data.brand || data.manufacturer || '').trim();
    const code = String(data.product_code || data.sku || '').trim();
    let title = String(test?.title || 'Test').trim();
    title = title
      .replace(/\s*[—-]\s*TMC\s+SKU\s+[^;·]+/ig, '')
      .replace(/\s*;?\s*GTIN\/EAN\s+\d+/ig, '')
      .replace(/\s*;?\s*Tropic Marin Art\. Nr\.\s*\d+/ig, '')
      .replace(/\s+/g, ' ')
      .trim();
    const parts = [];
    if (brand && !title.toLowerCase().startsWith(brand.toLowerCase())) parts.push(brand);
    parts.push(title);
    if (code && !title.includes(code)) parts.push(code);
    return parts.filter(Boolean).join(' · ');
  }

  function optionForTest(test, selected) {
    const id = String(test?.id || '').trim();
    return `<option value="${esc(id)}" ${id === selected ? 'selected' : ''}>${esc(compactTestLabel(test))}</option>`;
  }

  if (typeof ANX.testsForParameter === 'function') {
    ANX.parameterTestLabel = compactTestLabel;
    ANX.parameterTestOptions = function (parameterKey, tests, selected = '') {
      const matching = ANX.testsForParameter(tests, parameterKey);
      return `<option value="">Test...</option>${matching.map(test => optionForTest(test, selected)).join('')}<option value="__manual__">Otro test</option>`;
    };
    ANX.allParameterTestOptions = function (tests, selected = '') {
      return `<option value="">Test...</option>${(tests || []).map(test => optionForTest(test, selected)).join('')}<option value="__manual__">Otro test</option>`;
    };
  }

  function injectStyle() {
    if (document.getElementById('anxParameterCompactStyle')) return;
    const style = document.createElement('style');
    style.id = 'anxParameterCompactStyle';
    style.textContent = `
      .guided-box .measurement-grid{display:grid;gap:8px!important}
      .guided-box .measurement-row{
        display:grid!important;
        grid-template-columns:minmax(74px,110px) minmax(210px,1.25fr) minmax(190px,1fr) minmax(190px,.9fr)!important;
        gap:8px 10px!important;
        align-items:center!important;
        padding:10px 12px!important;
        border-radius:14px!important;
        min-height:0!important;
      }
      .guided-box .measurement-row>label:first-child{
        margin:0!important;
        font-size:16px!important;
        font-weight:900!important;
        align-self:center!important;
      }
      .guided-box .measurement-row>label[for^="t_"],
      .guided-box .measurement-row>label[for^="md_"]{display:none!important}
      .guided-box .measurement-row>select[id^="t_"]{grid-column:2!important;margin:0!important;min-width:0!important}
      .guided-box .measurement-row>select[id^="md_"]{grid-column:3!important;margin:0!important;min-width:0!important}
      .guided-box .measurement-row>.measurement-row-inputs{grid-column:4!important;display:grid!important;grid-template-columns:minmax(95px,1fr) 72px!important;gap:7px!important;margin:0!important}
      .guided-box .measurement-row>input[id^="tm_"],
      .guided-box .measurement-row>input[id^="mm_"]{grid-column:2 / -1!important;margin:0!important}
      .guided-box .measurement-row>div[id^="h_"]{grid-column:2 / -1!important;margin:0!important}
      .guided-box .measurement-row select,
      .guided-box .measurement-row input{min-height:42px!important;height:42px!important;margin-top:0!important;margin-bottom:0!important}
      .guided-box .measurement-row .notice{margin:2px 0 0!important;padding:8px 10px!important;max-height:110px!important;overflow:auto!important}
      @media(max-width:760px){
        .guided-box .measurement-row{
          grid-template-columns:74px minmax(0,1fr)!important;
          gap:7px!important;
        }
        .guided-box .measurement-row>label:first-child{grid-column:1!important;grid-row:1 / span 3!important;align-self:start!important;padding-top:10px!important}
        .guided-box .measurement-row>select[id^="t_"]{grid-column:2!important;grid-row:1!important}
        .guided-box .measurement-row>select[id^="md_"]{grid-column:2!important;grid-row:2!important}
        .guided-box .measurement-row>.measurement-row-inputs{grid-column:2!important;grid-row:3!important}
        .guided-box .measurement-row>input[id^="tm_"],
        .guided-box .measurement-row>input[id^="mm_"],
        .guided-box .measurement-row>div[id^="h_"]{grid-column:1 / -1!important}
      }
    `;
    document.head.appendChild(style);
  }

  function labelControls(root) {
    (root || document).querySelectorAll('.guided-box .measurement-row').forEach(function (row) {
      const test = row.querySelector('select[id^="t_"]');
      const method = row.querySelector('select[id^="md_"]');
      const value = row.querySelector('[id^="m_"]');
      if (test) { test.title = 'Test utilizado'; test.setAttribute('aria-label', 'Test utilizado'); }
      if (method) { method.title = 'Cómo se midió'; method.setAttribute('aria-label', 'Cómo se midió'); }
      if (value) { value.title = 'Valor medido'; value.setAttribute('aria-label', 'Valor medido'); }
    });
  }

  injectStyle();
  labelControls(document);
  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) labelControls(node);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });

  ANX.ParametersCompactForm = { compactTestLabel, labelControls };
})();