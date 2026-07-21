import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const start = '<!-- LIBRARY_CONTRACT_AUDIT_START -->';
const end = '<!-- LIBRARY_CONTRACT_AUDIT_END -->';
const section = `${start}
## Biblioteca / auditoría integral de formularios

- Los 13 tipos definidos en \`CONTRACTS\` utilizan un único contrato para plantilla, importación, edición, auditoría, publicación y añadido al acuario o inventario.
- \`src/library/core/library-schema-rules.js\` exige todos los campos del contrato y un resumen de 20 caracteres; no existen campos opcionales ocultos según la pantalla.
- \`src/library/library-v3-template.js\` genera rutas JSON coherentes: \`title\`, \`scientific_name\`, \`summary\` y \`sources\` son superiores; el resto se guarda en \`data\`.
- \`src/library/ficha/ficha-chat-import.js\` exige JSON estructurado, sanea claves superiores duplicadas y rechaza la ficha antes de insertar si falta cualquier campo.
- \`scripts/audit-library-contracts.mjs\` prueba automáticamente cada tipo, cada campo obligatorio y el resumen.
- \`npm run check\` y \`npm run mobile:prepare\` ejecutan \`npm run library:check\` antes de publicar o preparar la app.
${end}`;

for (const file of ['ARBOL_MAESTRO.md', 'MAPA_ARCHIVOS.md']) {
  const target = path.join(root, file);
  let text = fs.readFileSync(target, 'utf8').trim();
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`, 'm');
  text = pattern.test(text) ? text.replace(pattern, section) : `${text}\n\n${section}`;
  fs.writeFileSync(target, `${text.trim()}\n`);
}

const activePath = path.join(root, 'ARCHIVOS_ACTIVOS.txt');
let active = fs.readFileSync(activePath, 'utf8').trim();
const activeSection = `BIBLIOTECA · AUDITORIA INTEGRAL DE FORMULARIOS
- scripts/audit-library-contracts.mjs: prueba todos los tipos y todos los campos.
- npm run library:check: comprobación obligatoria del contrato.
- title, scientific_name, summary y sources son claves superiores; el resto pertenece a data.
- No se inserta una ficha incompleta para corregirla después.`;
const activePattern = /BIBLIOTECA · AUDITORIA INTEGRAL DE FORMULARIOS[\s\S]*?(?=\n[A-ZÁÉÍÓÚÑ ·]+\n|$)/m;
active = activePattern.test(active) ? active.replace(activePattern, activeSection) : `${active}\n\n${activeSection}`;
fs.writeFileSync(activePath, `${active.trim()}\n`);
console.log('Documentación de auditoría integral de formularios actualizada.');
