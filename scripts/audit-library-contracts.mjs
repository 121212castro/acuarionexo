globalThis.window = globalThis;
globalThis.ANX = {};

await import('../src/library/core/library-schema.js');
await import('../src/library/core/library-schema-rules.js');

const S = globalThis.ANX?.LibrarySchema;
if (!S) throw new Error('LibrarySchema no quedó disponible.');

const report = S.contractIntegrityReport?.();
if (!report?.approved) {
  throw new Error(`Contratos inválidos:\n${(report?.errors || []).join('\n')}`);
}

const biological = new Set(S.BIOLOGICAL_TYPES || []);
const sourceList = [
  { name: 'Fuente oficial A', url: 'https://example.com/source-a', used_for: 'Verificación técnica completa del formulario.' },
  { name: 'Fuente oficial B', url: 'https://example.org/source-b', used_for: 'Contraste independiente de campos y parámetros.' }
];

function valueFor(field, type) {
  if (field === 'title') return `Ficha completa de prueba ${type}`;
  if (field === 'scientific_name') return 'Amphiprion ocellaris';
  if (field === 'sources') return sourceList;
  const templateField = S.templateFor(type).flatMap(section => section.fields).find(item => item.id === field);
  if (templateField?.allowed?.length) return templateField.allowed[0];
  if (templateField?.type === 'number') return 10;
  return `Dato concreto y verificable para ${field}, con contexto suficiente para superar la auditoría.`;
}

const failures = [];
for (const [type, contract] of Object.entries(S.CONTRACTS || {})) {
  const data = {};
  for (const field of contract) {
    if (['title', 'scientific_name', 'sources'].includes(field)) continue;
    data[field] = valueFor(field, type);
  }
  const entry = {
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

  const audit = S.audit(entry);
  if (!audit.approved) failures.push(`${type}: la ficha completa no aprueba: ${(audit.errors || []).join(' | ')}`);

  for (const field of contract) {
    const broken = JSON.parse(JSON.stringify(entry));
    if (field === 'title') broken.title = '';
    else if (field === 'scientific_name') broken.scientific_name = '';
    else if (field === 'sources') broken.sources = [];
    else broken.data[field] = '';
    const brokenAudit = S.audit(broken);
    if (brokenAudit.approved) failures.push(`${type}.${field}: la auditoría aprobó un campo obligatorio vacío.`);
  }

  const noSummary = JSON.parse(JSON.stringify(entry));
  noSummary.summary = '';
  noSummary.sections.summary = '';
  if (S.audit(noSummary).approved) failures.push(`${type}.summary: la auditoría aprobó un resumen vacío.`);
}

if (failures.length) throw new Error(`Auditoría de formularios fallida:\n${failures.join('\n')}`);
console.log(`Auditoría correcta: ${Object.keys(S.CONTRACTS).length} tipos y todos sus campos obligatorios.`);
