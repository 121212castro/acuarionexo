globalThis.window = globalThis;
globalThis.ANX = {};

await import('../src/library/core/library-schema.js');
await import('../src/library/core/library-schema-rules.js');

const S = globalThis.ANX?.LibrarySchema;
if (!S) throw new Error('LibrarySchema no quedó disponible.');

const report = S.contractIntegrityReport?.();
if (!report?.approved) throw new Error(`Contratos inválidos:\n${(report?.errors || []).join('\n')}`);

const biological = new Set(S.BIOLOGICAL_TYPES || []);
const topLevel = new Set(['title', 'scientific_name', 'summary', 'sources']);
const sourceList = [
  { name: 'Fuente oficial A', url: 'https://example.com/source-a', used_for: 'Verificación técnica completa del formulario.' },
  { name: 'Fuente oficial B', url: 'https://example.org/source-b', used_for: 'Contraste independiente de campos y parámetros.' }
];

function longText(field) {
  return `Dato concreto y verificable para ${field}, con contexto suficiente para cumplir exactamente su regla contractual.`;
}

function valueFor(field, type) {
  if (field === 'title') return `Ficha completa de prueba ${type}`;
  if (field === 'scientific_name') return 'Amphiprion ocellaris';
  if (field === 'sources') return sourceList;
  const definition = S.completeTemplateFor(type).flatMap(section => section.fields).find(item => item.id === field);
  if (definition?.allowed?.length) return definition.allowed[0];
  if (definition?.type === 'number') return 10;
  const minimum = Number(definition?.minLength || 1);
  return longText(field).padEnd(minimum, ' x');
}

function completeEntry(type, contract) {
  const data = {};
  for (const field of contract) {
    if (topLevel.has(field)) continue;
    data[field] = valueFor(field, type);
  }
  return {
    entry_type: type,
    status: 'review',
    identity_confirmed: true,
    title: valueFor('title', type),
    scientific_name: biological.has(type) ? valueFor('scientific_name', type) : null,
    summary: `Resumen completo y verificable para la ficha de prueba del tipo ${type}.`,
    sections: { summary: `Resumen completo y verificable para la ficha de prueba del tipo ${type}.` },
    data,
    sources: sourceList
  };
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }

const failures = [];
for (const [type, contract] of Object.entries(S.CONTRACTS || {})) {
  const template = S.completeTemplateFor(type);
  const fields = template.flatMap(section => section.fields);
  const ids = fields.map(field => field.id);

  if (ids.length !== contract.length) failures.push(`${type}: contrato (${contract.length}) y plantilla (${ids.length}) tienen distinto número de campos.`);
  for (const field of contract) if (!ids.includes(field)) failures.push(`${type}.${field}: está en contrato pero no en plantilla.`);
  for (const field of ids) if (!contract.includes(field)) failures.push(`${type}.${field}: está en plantilla pero no en contrato.`);

  const entry = completeEntry(type, contract);
  const audit = S.audit(entry);
  if (!audit.approved) failures.push(`${type}: la ficha completa no aprueba: ${(audit.errors || []).join(' | ')}`);

  for (const fieldId of contract) {
    const definition = fields.find(field => field.id === fieldId);
    const broken = clone(entry);
    if (fieldId === 'title') broken.title = '';
    else if (fieldId === 'scientific_name') broken.scientific_name = '';
    else if (fieldId === 'sources') broken.sources = [];
    else broken.data[fieldId] = '';
    if (S.audit(broken).approved) failures.push(`${type}.${fieldId}: la auditoría aprobó un campo obligatorio vacío.`);

    if (definition?.allowed?.length) {
      if (definition.minLength !== 1) failures.push(`${type}.${fieldId}: un valor cerrado conserva longitud textual ${definition.minLength}.`);
      const invalid = clone(entry);
      if (topLevel.has(fieldId)) invalid[fieldId] = 'Valor inventado';
      else invalid.data[fieldId] = 'Valor inventado';
      if (S.audit(invalid).approved) failures.push(`${type}.${fieldId}: aceptó un valor fuera de ${definition.allowed.join(' | ')}.`);
    } else if (definition?.type === 'number') {
      const invalid = clone(entry);
      if (topLevel.has(fieldId)) invalid[fieldId] = 'sin dato numérico';
      else invalid.data[fieldId] = 'sin dato numérico';
      if (S.audit(invalid).approved) failures.push(`${type}.${fieldId}: aceptó texto sin valor numérico.`);
    } else if (fieldId !== 'sources' && fieldId !== 'scientific_name' && Number(definition?.minLength || 1) > 1) {
      const invalid = clone(entry);
      const short = 'x'.repeat(Math.max(1, Number(definition.minLength) - 1));
      if (topLevel.has(fieldId)) invalid[fieldId] = short;
      else invalid.data[fieldId] = short;
      if (S.audit(invalid).approved) failures.push(`${type}.${fieldId}: aceptó menos de ${definition.minLength} caracteres.`);
    }
  }

  const noSummary = clone(entry);
  noSummary.summary = '';
  noSummary.sections.summary = '';
  if (S.audit(noSummary).approved) failures.push(`${type}.summary: aprobó un resumen vacío.`);

  const shortSummary = clone(entry);
  shortSummary.summary = 'Resumen corto';
  shortSummary.sections.summary = 'Resumen corto';
  if (S.audit(shortSummary).approved) failures.push(`${type}.summary: aprobó un resumen inferior a 20 caracteres.`);
}

if (failures.length) throw new Error(`Auditoría de enlace contrato-plantilla-validación fallida:\n${failures.join('\n')}`);
console.log(`Auditoría correcta: ${Object.keys(S.CONTRACTS).length} tipos enlazados campo por campo con su plantilla y validación.`);