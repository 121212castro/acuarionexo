/* AcuarioNexo · Biblioteca · congelación generador V1 y control de fichas */
(function () {
  function anx() { return window.ANX || {}; }
  function supa() { return anx().supabase; }
  function state() { return anx().state || {}; }
  function esc(value) { return anx().esc ? anx().esc(value) : String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch])); }
  function byId(id) { return anx().byId ? anx().byId(id) : document.getElementById(id); }
  function msg(text, type) { return anx().msg ? anx().msg(text, type) : `<div class="${esc(type || 'notice')}">${esc(text)}</div>`; }
  function render(html, active) { return anx().render ? anx().render(html, active) : null; }

  const labels = {
    pez_marino: 'Pez marino', pez_dulce: 'Pez agua dulce', coral: 'Coral', invertebrado: 'Invertebrado',
    planta: 'Planta / alga', medicamento: 'Medicamento', sal: 'Sal', aditivo: 'Aditivo', alimento: 'Alimento',
    equipamiento: 'Equipo', test: 'Test', microfauna: 'Microfauna', general: 'General'
  };
  const sectionLabels = {
    summary: 'Resumen', identity: 'Identificacion', habitat: 'Habitat', aquarium: 'Acuario recomendado',
    parameters: 'Parametros', behavior: 'Comportamiento', feeding: 'Alimentacion', compatibility: 'Compatibilidad',
    reef_safe: 'Reef safe', health: 'Salud', purchase: 'Antes de comprar', mistakes: 'Errores frecuentes',
    breeding: 'Reproduccion', lighting: 'Iluminacion', flow: 'Flujo', placement: 'Ubicacion', co2: 'CO2 / nutrientes',
    maintenance: 'Mantenimiento', uses: 'Usos', dose: 'Dosis', remove: 'Retirar durante tratamiento', risks: 'Riesgos',
    aftercare: 'Seguimiento', monitoring: 'Mediciones / seguimiento', inventory_logic: 'Logica AcuarioNexo',
    mixing: 'Preparacion', use: 'Uso', nutrition: 'Composicion', acuarionexo_plan: 'Plan AcuarioNexo',
    specs: 'Especificaciones', installation: 'Instalacion', reading: 'Lectura', range: 'Rangos', storage: 'Conservacion', sources: 'Fuentes'
  };
  const sectionsByType = {
    pez_marino: ['summary','identity','habitat','aquarium','parameters','behavior','feeding','compatibility','reef_safe','health','purchase','mistakes','sources'],
    pez_dulce: ['summary','identity','habitat','aquarium','parameters','behavior','feeding','compatibility','breeding','health','purchase','mistakes','sources'],
    coral: ['summary','identity','habitat','aquarium','parameters','lighting','flow','placement','feeding','compatibility','health','purchase','mistakes','sources'],
    invertebrado: ['summary','identity','habitat','aquarium','parameters','behavior','feeding','compatibility','reef_safe','health','purchase','mistakes','sources'],
    planta: ['summary','identity','habitat','aquarium','parameters','lighting','co2','maintenance','compatibility','health','sources'],
    medicamento: ['summary','identity','uses','dose','monitoring','compatibility','remove','risks','aftercare','inventory_logic','sources'],
    sal: ['summary','identity','parameters','mixing','use','monitoring','risks','sources'],
    aditivo: ['summary','identity','composition','dose','use','monitoring','compatibility','risks','storage','sources'],
    alimento: ['summary','identity','nutrition','use','monitoring','compatibility','risks','acuarionexo_plan','sources'],
    equipamiento: ['summary','identity','specs','installation','maintenance','monitoring','compatibility','risks','sources'],
    test: ['summary','identity','parameters','reading','range','use','monitoring','risks','storage','sources'],
    microfauna: ['summary','identity','culture','parameters','feeding','maintenance','harvest','risks','sources'],
    general: ['summary','identity','aquarium','parameters','compatibility','risks','sources']
  };

  function typeName(type) { return labels[type] || 'Ficha'; }
  function sectionsFor(row) {
    const type = row?.entry_type || 'general';
    const base = sectionsByType[type] || sectionsByType.general;
    const extra = Object.keys(row?.sections || {}).filter(key => !base.includes(key));
    return base.concat(extra);
  }
  function sectionText(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(sectionText).filter(Boolean).join('\n');
    if (typeof value === 'object') return Object.entries(value).map(([key, val]) => {
      const text = sectionText(val);
      return text ? `${key}: ${text}` : '';
    }).filter(Boolean).join('\n');
    return String(value);
  }
  function fichaValidadaParaInventario(row) {
    return row?.status === 'published' || row?.status === 'verificada';
  }
  function inventoryScopeForType(type) {
    const productTypes = new Set(['medicamento', 'sal', 'aditivo', 'alimento', 'test']);
    if (type === 'equipamiento') return 'aquarium';
    if (productTypes.has(type)) return 'general';
    if (['pez_marino', 'pez_dulce', 'coral', 'invertebrado', 'planta', 'microfauna'].includes(type)) return 'aquarium';
    return 'general';
  }

  window.generarFichaIA = async function () {
    const box = byId('aiBox');
    const text = 'Generador IA V1 congelado. No se generaran mas fichas con el motor antiguo hasta implantar el nuevo flujo AcuarioNexo: identificar, investigar, validar y construir ficha.';
    if (box) box.innerHTML = msg(text, 'notice');
    else alert(text);
  };

  window.eliminarFicha = async function (id) {
    try {
      const row = (state().libraryRows || []).find(r => String(r.id) === String(id));
      const title = row?.title || 'esta ficha';
      if (!confirm(`¿Eliminar definitivamente ${title}?`)) return;
      const { error } = await supa().from('library_entries').delete().eq('id', id);
      if (error) throw error;
      if (typeof window.biblioteca === 'function') await window.biblioteca();
    } catch (e) {
      const box = byId('x') || byId('aiBox');
      if (box) box.innerHTML = msg(e.message, 'error');
      else alert(e.message);
    }
  };

  const originalFormFicha = window.formFicha;
  window.formFicha = function () {
    if (typeof originalFormFicha === 'function') originalFormFicha.apply(this, arguments);
    setTimeout(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const aiButton = buttons.find(btn => btn.textContent.trim() === 'Generar borrador IA');
      if (aiButton) {
        aiButton.disabled = true;
        aiButton.title = 'Motor IA V1 congelado hasta implantar el nuevo flujo de fichas verificadas';
        aiButton.textContent = '🤖 Generador IA congelado';
      }
      const aiBox = byId('aiBox');
      if (aiBox && !aiBox.innerHTML.trim()) {
        aiBox.innerHTML = msg('Motor IA V1 congelado. Crea o edita fichas manualmente hasta activar el motor nuevo.', 'notice');
      }
    }, 0);
  };

  const originalPasarFichaAInventario = window.pasarFichaAInventario;
  window.pasarFichaAInventario = async function (id) {
    const row = (state().libraryRows || []).find(r => String(r.id) === String(id));
    if (!row) return typeof window.biblioteca === 'function' ? window.biblioteca() : null;
    if (!fichaValidadaParaInventario(row)) {
      const box = byId('x') || byId('aiBox');
      const text = 'Esta ficha no esta verificada. No puede pasar a inventario.';
      if (box) box.innerHTML = msg(text, 'error');
      else alert(text);
      return;
    }
    if (typeof originalPasarFichaAInventario === 'function') return originalPasarFichaAInventario.apply(this, arguments);
  };

  window.verFicha = function (id) {
    const row = (state().libraryRows || []).find(r => String(r.id) === String(id));
    if (!row) return typeof window.biblioteca === 'function' ? window.biblioteca() : null;
    const mainPhoto = row.photo_url || row.cover_url || '';
    const coverOnly = row.cover_url && row.cover_url !== mainPhoto;
    const sections = sectionsFor(row).map(key => {
      const text = sectionText(row.sections?.[key]);
      return text ? `<section class="library-detail-section"><h3>${esc(sectionLabels[key] || key)}</h3><p>${esc(text).replace(/\n/g, '<br>')}</p></section>` : '';
    }).join('');
    const inventoryButton = fichaValidadaParaInventario(row)
      ? `<button class="primary" onclick="pasarFichaAInventario('${esc(row.id)}')"><span>▤</span>Pasar a inventario</button>`
      : `<button disabled title="Solo fichas verificadas"><span>▤</span>Inventario bloqueado</button>`;
    render(`<section class="panel library-detail"><button onclick="biblioteca()">Volver</button>${mainPhoto ? `<img class="library-detail-photo" src="${esc(mainPhoto)}" alt="${esc(row.title)}">` : ''}${coverOnly ? `<div class="library-cover-note"><b>Portada</b><img src="${esc(row.cover_url)}" alt="Portada"></div>` : ''}<small>${esc(typeName(row.entry_type))} · ${esc(row.status || 'draft')}</small><h2>${esc(row.title || 'Ficha')}</h2>${row.scientific_name ? `<p class="scientific">${esc(row.scientific_name)}</p>` : ''}${sections}<div class="quick-actions">${inventoryButton}<button onclick="formFicha('${esc(row.id)}')"><span>□</span>Editar ficha</button><button class="danger" onclick="eliminarFicha('${esc(row.id)}')"><span>🗑</span>Eliminar ficha</button></div><div id="x"></div></section>`, 'biblioteca');
  };
})();
