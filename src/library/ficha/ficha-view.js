/* AcuarioNexo · Biblioteca · ficha-view */
(function () {
  const { state, esc, render } = window.ANX;

  const sectionLabels = {
    summary: 'Resumen', identity: 'Identificacion', habitat: 'Habitat', aquarium: 'Acuario recomendado',
    parameters: 'Parametros', behavior: 'Comportamiento', feeding: 'Alimentacion', compatibility: 'Compatibilidad',
    reef_safe: 'Reef safe', health: 'Salud', purchase: 'Antes de comprar', mistakes: 'Errores frecuentes',
    breeding: 'Reproduccion', lighting: 'Iluminacion', flow: 'Flujo', placement: 'Ubicacion', co2: 'CO2 / nutrientes',
    maintenance: 'Mantenimiento', uses: 'Usos', dose: 'Dosis', remove: 'Retirar durante tratamiento', risks: 'Riesgos',
    aftercare: 'Seguimiento', monitoring: 'Mediciones / seguimiento', inventory_logic: 'Logica AcuarioNexo', mixing: 'Preparacion', use: 'Uso', nutrition: 'Composicion',
    acuarionexo_plan: 'Plan AcuarioNexo', specs: 'Especificaciones', installation: 'Instalacion', reading: 'Lectura',
    range: 'Rangos', storage: 'Conservacion', sources: 'Fuentes'
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

  const sectionsFor = type => sectionsByType[type] || sectionsByType.general;

  function sectionText(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(sectionText).filter(Boolean).join('\n');

    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([key, val]) => {
          if (val == null || val === '') return '';
          if (typeof val === 'object') {
            return `${key}:\n${sectionText(val)}`;
          }
          return `${key}: ${String(val)}`;
        })
        .filter(Boolean)
        .join('\n');
    }

    return String(value);
  }

  window.verFicha = function (id) {
    const row = (state.libraryRows || []).find(r => r.id === id);
    if (!row) return biblioteca();
    const mainPhoto = row.photo_url || row.cover_url || '';
    const coverOnly = row.cover_url && row.cover_url !== mainPhoto;
    render(`<section class="panel library-detail"><button onclick="biblioteca()">Volver</button>${mainPhoto ? `<img class="library-detail-photo" src="${esc(mainPhoto)}" alt="${esc(row.title)}">` : ''}${coverOnly ? `<div class="library-cover-note"><b>Portada</b><img src="${esc(row.cover_url)}" alt="Portada"></div>` : ''}<small>${esc(row.entry_type || 'Ficha')} · ${esc(row.status || 'draft')}</small><h2>${esc(row.title || 'Ficha')}</h2>${row.scientific_name ? `<p class="scientific">${esc(row.scientific_name)}</p>` : ''}${sectionsFor(row.entry_type).map(key => sectionText(row.sections?.[key]) ? `<section class="library-detail-section"><h3>${esc(sectionLabels[key] || key)}</h3><p>${esc(sectionText(row.sections[key])).replace(/\n/g, '<br>')}</p></section>` : '').join('')}<div class="quick-actions"><button class="primary" onclick="pasarFichaAInventario('${esc(row.id)}')"><span>▤</span>Pasar a inventario</button><button onclick="formFicha('${esc(row.id)}')"><span>□</span>Editar ficha</button></div><div id="x"></div></section>`, 'biblioteca');
  };
})();