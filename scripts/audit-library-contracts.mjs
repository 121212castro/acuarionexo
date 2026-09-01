import fs from 'node:fs';

globalThis.window = globalThis;
globalThis.ANX = {};

await import('../src/library/core/library-schema.js');
await import('../src/library/core/library-schema-rules.js');
await import('../src/library/library-v3.js');

const S = globalThis.ANX?.LibrarySchema;
if (!S) throw new Error('LibrarySchema no quedó disponible.');

const report = S.contractIntegrityReport?.();
if (!report?.approved) throw new Error(`Contratos inválidos:\n${(report?.errors || []).join('\n')}`);

const biological = new Set(S.BIOLOGICAL_TYPES || []);
const topLevel = new Set(['title', 'scientific_name', 'summary', 'sources']);
function sourcesFor(type) {
  const specialized = {
    pez_marino: ['FishBase', 'https://www.fishbase.se/summary/Amphiprion-ocellaris.html'],
    pez_dulce: ['FishBase', 'https://www.fishbase.se/summary/Pterophyllum-scalare.html'],
    planta: ['Plants of the World Online', 'https://powo.science.kew.org/taxon/example'],
    coral: ['WoRMS', 'https://www.marinespecies.org/aphia.php?p=taxdetails&id=1'],
    invertebrado: ['WoRMS', 'https://www.marinespecies.org/aphia.php?p=taxdetails&id=2'],
    microfauna: ['WoRMS', 'https://www.marinespecies.org/aphia.php?p=taxdetails&id=3'],
    fitoplancton: ['AlgaeBase', 'https://www.algaebase.org/search/species/detail/?species_id=1']
  }[type];
  if (specialized) return [
    { name: specialized[0], url: specialized[1], source_type: 'base especializada', used_for: 'Identidad, taxonomía y distribución.' },
    { name: 'IUCN o publicación primaria', url: 'https://www.iucnredlist.org/species/example', source_type: 'fuente primaria', used_for: 'Biología y conservación contrastadas.' },
    { name: 'Referencia complementaria', url: 'https://example.org/reference', source_type: 'referencia fiable', used_for: 'Contraste independiente de parámetros.' }
  ];
  return [
    { name: 'Fabricante oficial', url: 'https://manufacturer.example/product', source_type: 'fabricante oficial', used_for: 'Identidad, versión y especificaciones declaradas.' },
    { name: 'Ficha técnica oficial', url: 'https://manufacturer.example/datasheet', source_type: 'ficha técnica', used_for: 'Composición, uso y advertencias.' },
    { name: 'Referencia independiente', url: 'https://example.org/reference', source_type: 'referencia fiable', used_for: 'Contraste independiente del producto exacto.' }
  ];
}

function longText(field) {
  return `Dato concreto y verificable para ${field}, con contexto suficiente para cumplir exactamente su regla contractual.`;
}

function valueFor(field, type) {
  if (field === 'title') return `Ficha completa de prueba ${type}`;
  if (field === 'scientific_name') return 'Amphiprion ocellaris';
  if (field === 'sources') return sourcesFor(type);
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
    sources: sourcesFor(type)
  };
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }

const failures = [];
const generatedPath = new URL('../supabase/functions/_shared/library-contract.generated.ts', import.meta.url);
const generatedSource = fs.readFileSync(generatedPath, 'utf8');
const generatedMatch = generatedSource.match(/export const LIBRARY_CONTRACT = ([\s\S]+) as const;\s*$/);
if (!generatedMatch) {
  failures.push('Servidor: no se pudo leer el contrato generado.');
} else {
  const generated = JSON.parse(generatedMatch[1]);
  if (JSON.stringify(generated.contracts) !== JSON.stringify(S.CONTRACTS)) {
    failures.push('Servidor: sus contratos no coinciden exactamente con los contratos del cliente.');
  }
  if (JSON.stringify(generated.biologicalTypes) !== JSON.stringify(S.BIOLOGICAL_TYPES)) {
    failures.push('Servidor: sus categorías biológicas no coinciden con las del cliente.');
  }
  if (JSON.stringify(generated.sourcePolicy) !== JSON.stringify(S.SOURCE_POLICY)) {
    failures.push('Servidor: su política de fuentes no coincide con la del cliente.');
  }
}
const serverAuditSource = fs.readFileSync(new URL('../supabase/functions/_shared/library-v3.ts', import.meta.url), 'utf8');
if (!serverAuditSource.includes('import { LIBRARY_CONTRACT } from "./library-contract.generated.ts";')) {
  failures.push('Servidor: la auditoría no consume el contrato generado.');
}
if (/export const contracts[^=]*=\s*\{/.test(serverAuditSource) || /const sourceDomains[^=]*=\s*\{/.test(serverAuditSource)) {
  failures.push('Servidor: conserva una copia manual del contrato o de la política de fuentes.');
}
for (const [type, contract] of Object.entries(S.CONTRACTS || {})) {
  const valid = completeEntry(type, contract);
  const onlyTwo = clone(valid);
  onlyTwo.sources = onlyTwo.sources.slice(0, 2);
  if (S.audit(onlyTwo).approved) failures.push(`${type}.sources: aprobó una ficha con solo dos fuentes.`);

  const noUsedFor = clone(valid);
  delete noUsedFor.sources[0].used_for;
  if (S.audit(noUsedFor).approved) failures.push(`${type}.sources: aprobó una fuente sin used_for.`);

  const trackingDuplicate = clone(valid);
  trackingDuplicate.sources = [
    trackingDuplicate.sources[0],
    { ...trackingDuplicate.sources[0], url: `${trackingDuplicate.sources[0].url}${trackingDuplicate.sources[0].url.includes('?') ? '&' : '?'}utm_source=openai` },
    trackingDuplicate.sources[1]
  ];
  if (S.audit(trackingDuplicate).approved) failures.push(`${type}.sources: contó como distinta una URL duplicada con seguimiento UTM.`);
}
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

const multispecies = completeEntry('microfauna', S.CONTRACTS.microfauna);
multispecies.scientific_name = 'Brachionus plicatilis + Tisbe spp. + Apocyclops spp. + Tigriopus spp.';
multispecies.data.culture_type = 'Mezcla viva multiespecífica comercial.';
multispecies.data.identification = 'Mezcla multiespecífica identificada por los taxones declarados por el productor.';
if (!S.audit(multispecies).approved) {
  failures.push(`microfauna: una mezcla comercial con taxones spp. fue rechazada: ${S.audit(multispecies).errors.join(' | ')}`);
}

const previouslyApproved = completeEntry('pez_dulce', S.CONTRACTS.pez_dulce);
previouslyApproved.sources = [];
previouslyApproved.status = 'published';
previouslyApproved.validation_result = {
  approved: true,
  errors: [],
  source_count: 3,
  audited_at: '2026-08-01T12:00:00.000Z',
  engine: 'server-audit-test'
};
previouslyApproved.validated_at = '2026-08-01T12:00:00.000Z';
previouslyApproved.updated_at = '2026-08-01T12:00:01.000Z';
if (S.audit(previouslyApproved).approved) failures.push('Auditoría vigente: aceptó una ficha incompleta por su estado persistido.');
if (!S.effectiveAudit(previouslyApproved).approved || !S.effectiveAudit(previouslyApproved).authoritative) {
  failures.push('Auditoría efectiva: no respetó una aprobación autoritativa de una ficha publicada sin cambios.');
}

const staleGeneratedReview = { ...previouslyApproved, status: 'review', updated_at: '2026-08-01T12:10:00.000Z', validation_result: { ...previouslyApproved.validation_result, generated_audit: true } };
if (S.effectiveAudit(staleGeneratedReview).approved) {
  failures.push('Auditoría efectiva: reutilizó la aprobación de un borrador modificado después de generarse.');
}

if (failures.length) throw new Error(`Auditoría de enlace contrato-plantilla-validación fallida:\n${failures.join('\n')}`);
console.log(`Auditoría correcta: ${Object.keys(S.CONTRACTS).length} tipos enlazados campo por campo con su plantilla y validación.`);
