/* AcuarioNexo · sincronización Inventario -> Gemelo 3D */
(function () {
  const ANX = window.ANX = window.ANX || {};

  function normalizeCategory(value) {
    return String(value || '').trim().toLowerCase();
  }

  function markerTypeFromCategory(category) {
    const c = normalizeCategory(category);
    if (/pez|fish/.test(c)) return 'fish';
    if (/coral/.test(c)) return 'coral';
    if (/planta|plant/.test(c)) return 'plant';
    if (/equipo|equipamiento|bomba|filtro|skimmer|calentador|luz|iluminaci/.test(c)) return 'equipment';
    if (/invertebr|gamba|camar[oó]n|caracol|estrella|erizo|an[eé]mona/.test(c)) return 'other';
    return '';
  }

  function stableNumber(text, salt) {
    const s = String(text || '') + ':' + String(salt || '');
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  }

  function defaultPosition(id, type) {
    const x = 18 + (stableNumber(id, 'x') % 65);
    const z = 18 + (stableNumber(id, 'z') % 65);
    let y;
    if (type === 'fish') y = 25 + (stableNumber(id, 'y') % 46);
    else if (type === 'equipment') y = 18 + (stableNumber(id, 'y') % 56);
    else y = 72 + (stableNumber(id, 'y') % 18);
    return { x, y, z };
  }

  function eligibleRows(rows) {
    return (rows || []).map(function (row) {
      return { row, type: markerTypeFromCategory(row.category) };
    }).filter(x => !!x.type);
  }

  async function syncInventoryIntoMap(aq, map) {
    if (!aq || aq.__standalone_3d || !aq.id || String(aq.id).startsWith('__')) return map;
    if (!ANX.supabase || !ANX.state?.user) return map;

    const { data, error } = await ANX.supabase
      .from('inventory_items')
      .select('id,name,category,quantity,photo_url,notes')
      .eq('user_id', ANX.state.user.id)
      .eq('aquarium_id', aq.id);
    if (error) throw error;

    const rows = eligibleRows(data || []);
    const clean = ANX.MapState?.normalizeMap ? ANX.MapState.normalizeMap(map, aq) : (map || { markers: [] });
    clean.markers = Array.isArray(clean.markers) ? clean.markers : [];

    const validIds = new Set(rows.map(x => String(x.row.id)));
    clean.markers = clean.markers.filter(function (m) {
      return !m.auto_from_inventory || !m.source_inventory_id || validIds.has(String(m.source_inventory_id));
    });

    const existingByInventory = new Map();
    clean.markers.forEach(function (m) {
      if (m.source_inventory_id) existingByInventory.set(String(m.source_inventory_id), m);
    });

    rows.forEach(function ({ row, type }) {
      const key = String(row.id);
      const existing = existingByInventory.get(key);
      if (existing) {
        existing.label = row.name || existing.label;
        existing.type = type;
        existing.inventory_quantity = Number(row.quantity) || 1;
        existing.auto_from_inventory = true;
        if (!existing.model_family && ANX.MapModelFamilies?.resolveFamily) existing.model_family = ANX.MapModelFamilies.resolveFamily(existing);
        return;
      }

      const pos = defaultPosition(row.id, type);
      const marker = {
        id: `inv-${row.id}`,
        label: row.name || 'Elemento de inventario',
        type,
        note: row.notes || '',
        model_family: '',
        x: pos.x,
        y: pos.y,
        z: pos.z,
        size: type === 'fish' ? 12 : type === 'coral' ? 14 : 12,
        source_inventory_id: row.id,
        inventory_quantity: Number(row.quantity) || 1,
        auto_from_inventory: true
      };
      if (ANX.MapModelFamilies?.resolveFamily) marker.model_family = ANX.MapModelFamilies.resolveFamily(marker);
      clean.markers.push(marker);
    });

    if (!clean.selected_id && clean.markers.length) clean.selected_id = clean.markers[0].id;
    window.__aqMap = clean;
    return clean;
  }

  ANX.MapInventorySync = { markerTypeFromCategory, syncInventoryIntoMap };
})();
