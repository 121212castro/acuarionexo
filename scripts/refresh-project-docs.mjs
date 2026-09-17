import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), `${content.trim()}\n`);

function buildFromIndex() {
  const match = read('index.html').match(/window\.ACUARIONEXO_BUILD\s*=\s*['"]([^'"]+)['"]/);
  if (!match) throw new Error('No se encontró ACUARIONEXO_BUILD en index.html');
  return match[1];
}
function buildFromVersion() { return JSON.parse(read('app-version.json')).build; }
function buildFromManifest() {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const match = String(manifest.start_url || '').match(/[?&]v=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}
function quotedLocalAssets(text) {
  const found = new Set();
  const re = /(['"])([^'"\r\n]+\.(?:js|css|json|webmanifest|png|jpg|jpeg)(?:\?[^'"\r\n]*)?)\1/g;
  let match;
  while ((match = re.exec(text))) {
    const file = match[2].replace(/\?.*$/, '');
    if (!/^https?:\/\//i.test(file)) found.add(file);
  }
  return [...found];
}

const build = buildFromIndex();
const versionBuild = buildFromVersion();
const manifestBuild = buildFromManifest();
if (build !== versionBuild || build !== manifestBuild) {
  throw new Error(`Build desincronizado: index=${build}, app-version=${versionBuild}, manifest=${manifestBuild}`);
}

const direct = quotedLocalAssets(read('index.html'));
const modules = quotedLocalAssets(read('src/core/module-loader.js'));
const activeSet = new Set(['index.html', ...direct, ...modules, 'src/library/ficha/ficha-json.js']);
const pendingDependencies = [...activeSet];
while (pendingDependencies.length) {
  const owner = pendingDependencies.shift();
  if (!owner.endsWith('.js') || !fs.existsSync(path.join(root, owner))) continue;
  for (const dependency of quotedLocalAssets(read(owner))) {
    if (activeSet.has(dependency)) continue;
    activeSet.add(dependency);
    pendingDependencies.push(dependency);
  }
}
const active = [...activeSet].sort();

const adminNavigation = `## Administración / acceso global

- \`index.html\`: contiene el único botón persistente \`adminBtn\` de la cabecera.
- \`src/auth/auth-core.js\`: muestra el botón únicamente con sesión y \`state.isAdmin === true\`.
- \`src/admin/admin-core.js\`: determina el rol administrativo oficial mediante \`admin_roles\`.
- \`src/core/module-loader.js\`: carga el módulo oficial de administración bajo demanda.
- No se permiten accesos Admin duplicados por pantalla.`;

const contractChain = `## Biblioteca / cadena única de contrato

- \`src/library/core/library-schema.js\`: define contratos, campos, etiquetas y política de fuentes.
- \`src/library/core/library-schema-rules.js\`: ejecuta la regla efectiva y la auditoría única.
- \`src/library/library-v3-template.js\`: entrega al Chat la misma regla y las rutas JSON.
- \`src/library/ficha/ficha-chat-import.js\`: audita antes de insertar.
- \`src/library/library-v3-ficha.js\`: audita al editar y guardar.
- \`src/library/ficha/ficha-actions.js\`: audita al publicar o añadir.
- \`src/library/inventory/library-inventory-import.js\`: audita antes de persistir en inventario.
- \`scripts/generate-library-server-contract.mjs\` y \`supabase/functions/_shared/library-contract.generated.ts\`: mantienen la paridad cliente-servidor.`;

const coverPipeline = `## Biblioteca / portadas e imágenes

- \`src/library/library-v3-images.js\`: propietario de la carga y persistencia de foto interior y portada manual.
- \`src/library/ficha/library-cover-contract.js\`: contrato único de portada; define plantilla oficial, versión, proporción, posiciones y reglas visuales.
- \`src/library/ficha/library-cover-master.js\`: generador oficial en cliente para peces marinos; recorta el ejemplar real y compone contra el fondo maestro aprobado.
- \`src/library/ficha/library-cover-backfill.js\`: detecta únicamente portadas ausentes u obsoletas y protege las portadas manuales aprobadas e históricas.
- \`supabase/functions/generate-marine-fish-cover/index.ts\`: generador servidor de una portada marina; usa el contrato vigente y rechaza recortes inseguros en lugar de guardar rectángulos o fondos residuales.
- \`src/library/library-v3-core.js\`: la tarjeta de Biblioteca muestra solo una portada válida; nunca usa \`photo_url\` como sustituto de portada.
- Las portadas generadas deben declarar \`template=marine-fish-master-v1-locked\` y \`contract_version=cover-contract-v13\`.
- Una portada generada con otra versión, basada en otra foto o sin metadatos válidos no se presenta como oficial.
- Las portadas \`manual-approved\`, \`manual-restored-approved\` y las portadas manuales históricas del bucket \`library-images\` se conservan.
- Si no existe portada válida, la tarjeta muestra \`Sin portada\`; nunca inventa una imagen ni enseña la foto interior como portada.`;

const automaticGenerator = `## Biblioteca / generador automático administrativo

- \`src/admin/admin-library-generator.js\`: entrada por lotes, consulta de cola, orden y reintentos.
- \`supabase/functions/library-identify/index.ts\`: identifica categoría, entidad y versión.
- \`supabase/functions/library-generate-draft/index.ts\`: genera y repara borradores por etapas.
- \`supabase/functions/library-generation-worker/index.ts\`: consume una etapa persistente por ejecución.
- Nunca publica automáticamente: deja las fichas en revisión privada para completar fotos y validar.`;

const ownership = `## Propietarios únicos

- \`index.html\`: estructura de cabecera y acceso global Admin.
- \`src/admin/admin-core.js\`: autorización administrativa.
- \`src/library/core/library-schema.js\`: contrato de datos de fichas.
- \`src/library/core/library-schema-rules.js\`: auditoría efectiva.
- \`src/library/library-v3-images.js\`: persistencia de imágenes.
- \`src/library/ficha/library-cover-contract.js\`: contrato visual de portadas.
- \`src/library/ficha/library-cover-master.js\`: composición oficial de portada marina en cliente.
- \`src/library/ficha/library-cover-backfill.js\`: selección segura de portadas a regenerar.
- \`supabase/functions/generate-marine-fish-cover/index.ts\`: composición oficial de portada marina en servidor.
- \`src/library/library-v3-core.js\`: selección y representación de portada en las tarjetas de Biblioteca.
- \`src/library/library-v3-ficha.js\`: edición y guardado de fichas.
- \`src/library/ficha/ficha-actions.js\`: vista, publicación y acciones de ficha.
- No se permiten hotfix, patch, wrappers, validadores paralelos ni una segunda cadena de portadas.`;

const updateRules = `## Regla de actualización

- Ejecutar \`npm run docs:refresh\` después de modificar cargas, contratos, responsabilidades o build.
- Ejecutar \`npm run check\` antes de publicar.
- Ejecutar \`npm run mobile:prepare\` cuando cambien archivos activos usados por la app móvil.
- Comprobar después \`ARBOL_MAESTRO.md\`, \`MAPA_ARCHIVOS.md\` y \`ARCHIVOS_ACTIVOS.txt\`.
- \`www/\`, \`android/\`, \`ios/\` y \`node_modules/\` no se editan manualmente.`;

const map = `# MAPA DE ARCHIVOS

Documento autogenerado por \`scripts/refresh-project-docs.mjs\`.

## Build actual

\`${build}\`

El build coincide en \`index.html\`, \`app-version.json\` y \`manifest.webmanifest\`.

## Entrada web activa

${direct.map(file => `- \`${file}\``).join('\n')}

## Módulos bajo demanda

La lista oficial se obtiene exclusivamente de \`src/core/module-loader.js\`.

${adminNavigation}

${contractChain}

${coverPipeline}

${automaticGenerator}

${ownership}

${updateRules}`;

const tree = `# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por \`scripts/refresh-project-docs.mjs\`.

Fuente de verdad: GitHub \`main\`.

Build actual: \`${build}\`.

## Navegación administrativa global

\`admin_roles\`
→ \`src/admin/admin-core.js\` resuelve \`state.isAdmin\`
→ \`src/auth/auth-core.js\` muestra u oculta \`adminBtn\`
→ \`index.html\` mantiene el botón global
→ \`src/core/module-loader.js\` carga el panel de administración

${adminNavigation}

## Flujo maestro de una ficha

\`library-schema.js\`
→ \`library-schema-rules.js\`
→ \`library-v3-template.js\`
→ \`ficha-chat-import.js\`
→ \`library-v3-ficha.js\`
→ \`ficha-actions.js\`
→ \`library-inventory-import.js\`

## Flujo maestro de una portada marina

\`photo_url\` real y trazable
→ \`library-cover-contract.js\` fija plantilla y versión
→ \`library-cover-master.js\` o \`generate-marine-fish-cover\` compone la portada
→ \`library-cover-backfill.js\` decide qué falta o está obsoleto sin tocar manuales válidas
→ Supabase guarda \`cover_url\` + \`image_assets.cover\`
→ \`library-v3-core.js\` valida metadatos antes de mostrarla
→ si falla la validación: \`Sin portada\`, nunca \`photo_url\` como sustituto

${contractChain}

${coverPipeline}

${automaticGenerator}

${ownership}

${updateRules}`;

const activeText = `ACUARIONEXO · MODULOS OFICIALES

FUENTE DE VERDAD
- Rama de trabajo y publicación: main.
- Supabase es la fuente de datos, autenticación y Storage.

BUILD ACTUAL
- index.html: ${build}.
- app-version.json: ${build}.
- manifest.webmanifest: ${build}.

ARCHIVOS ACTIVOS
${active.map(file => `- ${file}`).join('\n')}

PORTADAS MARINAS · CADENA OFICIAL
- src/library/ficha/library-cover-contract.js: contrato visual único.
- src/library/ficha/library-cover-master.js: composición oficial cliente.
- src/library/ficha/library-cover-backfill.js: detección segura de pendientes/obsoletas.
- src/library/library-v3-images.js: persistencia de imágenes.
- src/library/library-v3-core.js: representación; nunca usa photo_url como portada.
- supabase/functions/generate-marine-fish-cover/index.ts: composición oficial servidor.
- Plantilla: marine-fish-master-v1-locked.
- Contrato: cover-contract-v13.
- Portadas manuales válidas se protegen; portadas generadas obsoletas se rechazan.

GENERADO, NO EDITAR A MANO
- www/
- android/
- ios/
- node_modules/`;

write('MAPA_ARCHIVOS.md', map);
write('ARBOL_MAESTRO.md', tree);
write('ARCHIVOS_ACTIVOS.txt', activeText);
console.log(`Documentación de proyecto regenerada para ${build}`);
