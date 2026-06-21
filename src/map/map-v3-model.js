/* AcuarioNexo · Mapa IA V3 model contract
   Base limpia para Gemelo Digital del acuario.
   Este archivo no cambia la interfaz ni el render actual: solo define el contrato de datos V3. */
(function () {
  const ENTITY_TYPES = ['fish', 'coral', 'invertebrate', 'equipment', 'rock', 'zone', 'plant', 'other'];
  const SOURCE_TABLES = ['animals', 'inventory_items', 'manual', 'aquariums'];

  function clampPercent(value, fallback = 50) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(100, n));
  }

  function safeText(value, fallback = '') {
    const text = String(value ?? '').trim();
    return text || fallback;
  }

  function normalizeEntity(entity) {
    const type = ENTITY_TYPES.includes(String(entity?.entity_type || ''))
      ? String(entity.entity_type)
      : 'other';
    const sourceTable = SOURCE_TABLES.includes(String(entity?.source_table || ''))
      ? String(entity.source_table)
      : 'manual';

    return {
      id: safeText(entity?.id, `ent-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      entity_type: type,
      source_table: sourceTable,
      source_id: safeText(entity?.source_id),
      label: safeText(entity?.label, 'Elemento'),
      note: safeText(entity?.note),
      x: clampPercent(entity?.x),
      y: clampPercent(entity?.y),
      z: clampPercent(entity?.z),
      size: clampPercent(entity?.size, 12),
      visible: entity?.visible === false ? false : true
    };
  }

  function normalizeEntities(rawEntities) {
    return Array.isArray(rawEntities) ? rawEntities.map(normalizeEntity) : [];
  }

  function emptyV3Map(base = {}) {
    const photos = base.photos && typeof base.photos === 'object' ? base.photos : {};
    return {
      version: 3,
      photo_url: safeText(photos.front || base.photo_url),
      photos: {
        front: safeText(photos.front || base.photo_url),
        left: safeText(photos.left),
        right: safeText(photos.right),
        top: safeText(photos.top)
      },
      markers: Array.isArray(base.markers) ? base.markers : [],
      entities: normalizeEntities(base.entities),
      selected_id: safeText(base.selected_id),
      selected_entity_id: safeText(base.selected_entity_id),
      updated_at: safeText(base.updated_at, new Date().toISOString())
    };
  }

  function upgradeMapToV3(raw = {}) {
    return emptyV3Map({
      ...raw,
      version: 3,
      entities: normalizeEntities(raw.entities)
    });
  }

  window.ANX_MAP_V3 = {
    ENTITY_TYPES,
    SOURCE_TABLES,
    clampPercent,
    normalizeEntity,
    normalizeEntities,
    emptyV3Map,
    upgradeMapToV3
  };
})();
