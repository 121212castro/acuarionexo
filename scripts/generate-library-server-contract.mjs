import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = globalThis;
globalThis.ANX = {};
await import(path.join(root, 'src/library/core/library-schema.js'));
await import(path.join(root, 'src/library/core/library-schema-rules.js'));

const schema = globalThis.ANX?.LibrarySchema;
if (!schema) throw new Error('No se pudo cargar LibrarySchema.');

const integrity = schema.contractIntegrityReport?.();
if (!integrity?.approved) {
  throw new Error(`Contrato cliente inválido:\n${(integrity?.errors || []).join('\n')}`);
}

const fieldRules = {};
for (const type of Object.keys(schema.CONTRACTS || {})) {
  fieldRules[type] = Object.fromEntries(
    schema.completeTemplateFor(type)
      .flatMap(section => section.fields)
      .map(field => [field.id, {
        id: field.id,
        label: field.label,
        section: field.section,
        type: field.type,
        minLength: Number(field.minLength || 1),
        allowed: field.allowed || null,
        validator: field.validator || null
      }])
  );
}

const payload = {
  statuses: schema.STATUSES,
  biologicalTypes: schema.BIOLOGICAL_TYPES,
  productTypes: schema.PRODUCT_TYPES,
  contracts: schema.CONTRACTS,
  fieldRules,
  sourcePolicy: schema.SOURCE_POLICY
};
const target = path.join(root, 'supabase/functions/_shared/library-contract.generated.ts');
const content = [
  '// GENERATED FILE. Edit src/library/core/library-schema*.js and run npm run library:sync-server.',
  `export const LIBRARY_CONTRACT = ${JSON.stringify(payload, null, 2)} as const;`,
  ''
].join('\n');
fs.writeFileSync(target, content);
console.log(`Contrato de servidor actualizado: ${path.relative(root, target)}`);
