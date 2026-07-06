/* AcuarioNexo · Inventory core */
(function () {
  const generalInventoryCategories = ['Medicamentos', 'Sales', 'Aditivos', 'Alimentos', 'Tests', 'Material general'];
  const marineInventoryCategories = ['Peces marinos', 'Corales', 'Invertebrados', 'Microfauna', 'Equipos'];
  const freshwaterInventoryCategories = ['Peces', 'Invertebrados', 'Plantas', 'Equipos'];
  const liveCategories = new Set(['Peces marinos', 'Peces', 'Corales', 'Invertebrados', 'Plantas', 'Microfauna']);
  const importedSectionLabels = {
    summary: 'Resumen', identity: 'Identificacion', habitat: 'Habitat', aquarium: 'Acuario recomendado',
    parameters: 'Parametros', behavior: 'Comportamiento', feeding: 'Alimentacion', compatibility: 'Compatibilidad',
    reef_safe: 'Reef safe', health: 'Salud', purchase: 'Antes de comprar', mistakes: 'Errores frecuentes',
    breeding: 'Reproduccion', lighting: 'Iluminacion', flow: 'Flujo', placement: 'Ubicacion', co2: 'CO2 / nutrientes',
    maintenance: 'Mantenimiento', uses: 'Usos', dose: 'Dosis', remove: 'Retirar durante tratamiento', risks: 'Riesgos',
    aftercare: 'Seguimiento', inventory_logic: 'Logica AcuarioNexo', mixing: 'Preparacion', use: 'Uso', nutrition: 'Composicion',
    acuarionexo_plan: 'Plan AcuarioNexo', specs: 'Especificaciones', installation: 'Instalacion', reading: 'Lectura',
    range: 'Rangos', storage: 'Conservacion', sources: 'Fuentes', culture: 'Cultivo', harvest: 'Recolecta'
  };

  function inventoryMode(aq) {
    const type = String(aq?.aquarium_type || aq?.type || '').toLowerCase();
    return /fresh|dulce|plant|gamb|betta|discus/.test(type) ? 'freshwater' : 'marine';
  }

  function aquariumInventoryCategoriesFor(aq) {
    return inventoryMode(aq) === 'freshwater' ? freshwaterInventoryCategories : marineInventoryCategories;
  }

  function inventoryNoteText(item) {
    return String(item.notes || '')
      .replace(/^AcuarioNexoAcuario:[^|\n]+[|\n]\s*/i, '')
      .replace(/^AcuarioNexoMeta:\{[^\n]*\}\n?/i, '')
      .replace(/^AcuarioNexoLibrary:[^\n]*\n?/i, '')
      .trim();
  }

  function inventoryMeta(item) {
    const text = String(item.notes || '');
    const match = text.match(/^AcuarioNexoMeta:(\{[^\n]*\})/i) || text.match(/\nAcuarioNexoMeta:(\{[^\n]*\})/i);
    if (!match) return {};
    try { return JSON.parse(match[1]); } catch (_) { return {}; }
  }

  function sectionText(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(sectionText).filter(Boolean).join('\n');
    if (typeof value === 'object') {
      return Object.entries(value).map(([key, val]) => {
        const text = sectionText(val);
        return text ? `${key}: ${text}` : '';
      }).filter(Boolean).join('\n');
    }
    return String(value);
  }

  function inventoryCover(item) {
    const meta = inventoryMeta(item);
    return item.photo_url || meta.library_card?.photo_url || meta.library_card?.cover_url || meta.cover_url || meta.image_url || '';
  }

  function inventoryExpiryStatus(item) {
    const exp = item.expiry_date || inventoryMeta(item).expires_at || '';
    if (!exp) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(`${exp}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    const days = Math.round((date - today) / 86400000);
    if (days < 0) return 'caducado';
    if (days <= 30) return 'caduca pronto';
    return 'ok';
  }

  function inventoryAqId(item) {
    if (item.aquarium_id) return String(item.aquarium_id);
    const note = String(item.notes || '');
    const match = note.match(/^AcuarioNexoAcuario:([^|\n]+)/i);
    return match ? match[1] : '';
  }

  window.ANX = window.ANX || {};
  Object.assign(window.ANX, {
    generalInventoryCategories,
    marineInventoryCategories,
    freshwaterInventoryCategories,
    liveCategories,
    importedSectionLabels,
    inventoryMode,
    aquariumInventoryCategoriesFor,
    inventoryNoteText,
    inventoryMeta,
    sectionText,
    inventoryCover,
    inventoryExpiryStatus,
    inventoryAqId
  });
  window.ANX.InventoryCore = {
    generalInventoryCategories,
    marineInventoryCategories,
    freshwaterInventoryCategories,
    liveCategories,
    importedSectionLabels,
    inventoryMode,
    aquariumInventoryCategoriesFor,
    inventoryNoteText,
    inventoryMeta,
    sectionText,
    inventoryCover,
    inventoryExpiryStatus,
    inventoryAqId
  };
})();