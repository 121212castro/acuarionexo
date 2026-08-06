/* AcuarioNexo · Contrato oficial del generador IA 3D
   Define la salida que deberá producir la IA para crear proyectos de acuario editables.
   No renderiza ni guarda: valida y normaliza el proyecto antes de entregarlo al mapa 3D. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.ANX = root.ANX || {};
    root.ANX.MapAiGeneratorContract = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const VERSION = '1.0.0';
  const PROJECT_TYPES = Object.freeze(['freshwater', 'marine', 'reef', 'coldwater', 'pond', 'hospital', 'quarantine']);
  const OBJECT_TYPES = Object.freeze(['substrate', 'rock', 'wood', 'plant', 'coral', 'equipment', 'zone', 'decoration']);
  const SOURCE_TYPES = Object.freeze(['generated', 'library_entry', 'inventory_item', 'manual']);
  const UNITS = Object.freeze({ length: 'cm', volume: 'L', angle: 'deg', position: 'cm' });

  function text(value, fallback = '') {
    const result = String(value == null ? '' : value).trim();
    return result || fallback;
  }

  function number(value, fallback = 0, min = -Infinity, max = Infinity) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }

  function id(value, prefix) {
    return text(value, `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  }

  function vector3(value = {}, limits = {}) {
    return {
      x: number(value.x, 0, limits.minX ?? -Infinity, limits.maxX ?? Infinity),
      y: number(value.y, 0, limits.minY ?? -Infinity, limits.maxY ?? Infinity),
      z: number(value.z, 0, limits.minZ ?? -Infinity, limits.maxZ ?? Infinity)
    };
  }

  function normalizeTank(value = {}) {
    const width = number(value.width_cm, 80, 10, 1000);
    const depth = number(value.depth_cm, 35, 10, 500);
    const height = number(value.height_cm, 40, 10, 500);
    const waterHeight = number(value.water_height_cm, height - 3, 1, height);
    return {
      width_cm: width,
      depth_cm: depth,
      height_cm: height,
      water_height_cm: waterHeight,
      glass_thickness_mm: number(value.glass_thickness_mm, 8, 2, 40),
      estimated_gross_liters: Number(((width * depth * height) / 1000).toFixed(1)),
      estimated_water_liters: Number(((width * depth * waterHeight) / 1000).toFixed(1))
    };
  }

  function normalizeObject(value = {}, tank) {
    const type = OBJECT_TYPES.includes(value.object_type) ? value.object_type : 'decoration';
    const sourceType = SOURCE_TYPES.includes(value.source_type) ? value.source_type : 'generated';
    return {
      id: id(value.id, 'obj'),
      object_type: type,
      label: text(value.label, 'Elemento'),
      source_type: sourceType,
      library_entry_id: text(value.library_entry_id) || null,
      inventory_item_id: text(value.inventory_item_id) || null,
      position_cm: vector3(value.position_cm, { minX: 0, maxX: tank.width_cm, minY: 0, maxY: tank.height_cm, minZ: 0, maxZ: tank.depth_cm }),
      rotation_deg: vector3(value.rotation_deg, { minX: -360, maxX: 360, minY: -360, maxY: 360, minZ: -360, maxZ: 360 }),
      dimensions_cm: {
        width: number(value.dimensions_cm?.width, 5, 0.1, tank.width_cm),
        height: number(value.dimensions_cm?.height, 5, 0.1, tank.height_cm),
        depth: number(value.dimensions_cm?.depth, 5, 0.1, tank.depth_cm)
      },
      material: text(value.material),
      color: text(value.color),
      locked: value.locked === true,
      visible: value.visible !== false,
      notes: text(value.notes),
      constraints: Array.isArray(value.constraints) ? value.constraints.map(item => text(item)).filter(Boolean) : []
    };
  }

  function normalizeProject(value = {}) {
    const tank = normalizeTank(value.tank || {});
    const projectType = PROJECT_TYPES.includes(value.project_type) ? value.project_type : 'freshwater';
    const objects = Array.isArray(value.objects) ? value.objects.map(item => normalizeObject(item, tank)) : [];
    return {
      contract_version: VERSION,
      project_id: id(value.project_id, 'project'),
      title: text(value.title, 'Proyecto de acuario'),
      project_type: projectType,
      status: ['draft', 'generated', 'reviewed', 'approved'].includes(value.status) ? value.status : 'draft',
      tank,
      design_intent: text(value.design_intent),
      style: text(value.style),
      objects,
      warnings: Array.isArray(value.warnings) ? value.warnings.map(item => text(item)).filter(Boolean) : [],
      missing_information: Array.isArray(value.missing_information) ? value.missing_information.map(item => text(item)).filter(Boolean) : [],
      generated_at: text(value.generated_at, new Date().toISOString())
    };
  }

  function validate(project) {
    const value = normalizeProject(project);
    const errors = [];
    const warnings = [...value.warnings];
    if (!value.design_intent) warnings.push('Falta una descripción del objetivo visual o funcional.');
    if (!value.objects.length) warnings.push('El proyecto todavía no contiene objetos 3D.');
    const ids = new Set();
    value.objects.forEach((object, index) => {
      if (ids.has(object.id)) errors.push(`Objeto ${index + 1}: id duplicado.`);
      ids.add(object.id);
      const p = object.position_cm;
      const d = object.dimensions_cm;
      if (p.x + d.width > value.tank.width_cm) errors.push(`${object.label}: supera el ancho de la urna.`);
      if (p.y + d.height > value.tank.height_cm) errors.push(`${object.label}: supera la altura de la urna.`);
      if (p.z + d.depth > value.tank.depth_cm) errors.push(`${object.label}: supera el fondo de la urna.`);
      if (object.source_type === 'library_entry' && !object.library_entry_id) errors.push(`${object.label}: falta library_entry_id.`);
    });
    return { approved: errors.length === 0, errors, warnings: [...new Set(warnings)], project: value };
  }

  function toMapV3(project) {
    const result = validate(project);
    if (!result.approved) throw new Error(result.errors.join(' · '));
    const tank = result.project.tank;
    return {
      version: 3,
      entities: result.project.objects.map(object => ({
        id: object.id,
        entity_type: ({ substrate: 'zone', wood: 'other', decoration: 'other' })[object.object_type] || object.object_type,
        source_table: object.library_entry_id ? 'manual' : 'manual',
        source_id: object.library_entry_id || object.inventory_item_id || '',
        label: object.label,
        note: object.notes,
        x: Number(((object.position_cm.x / tank.width_cm) * 100).toFixed(2)),
        y: Number(((object.position_cm.y / tank.height_cm) * 100).toFixed(2)),
        z: Number(((object.position_cm.z / tank.depth_cm) * 100).toFixed(2)),
        size: Number(Math.max(1, Math.min(100, (object.dimensions_cm.width / tank.width_cm) * 100)).toFixed(2)),
        visible: object.visible
      })),
      ai_project: result.project,
      selected_entity_id: '',
      updated_at: new Date().toISOString()
    };
  }

  return Object.freeze({ VERSION, PROJECT_TYPES, OBJECT_TYPES, SOURCE_TYPES, UNITS, normalizeTank, normalizeObject, normalizeProject, validate, toMapV3 });
});
