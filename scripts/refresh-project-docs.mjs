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

function buildFromVersion() {
  return JSON.parse(read('app-version.json')).build;
}

function buildFromManifest() {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const match = String(manifest.start_url || '').match(/[?&]v=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function quotedLocalAssets(text) {
  const found = new Set();
  const re = /['"]([^'"]+\.(?:js|css|json|webmanifest|png)(?:\?[^'"]*)?)['"]/g;
  let match;
  while ((match = re.exec(text))) {
    const file = match[1].replace(/\?.*$/, '');
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
const indirect = ['src/library/ficha/ficha-json.js'];
const active = [...new Set([...direct, ...modules, ...indirect])].sort();

const map = `# MAPA DE ARCHIVOS

Documento autogenerado por \`scripts/refresh-project-docs.mjs\`.

## Build actual

\`${build}\`

El build coincide en \`index.html\`, \`app-version.json\` y \`manifest.webmanifest\`.

## Archivos activos

${active.map(file => `- \`${file}\``).join('\n')}

## Biblioteca / Fichas

- \`src/library/library-v3-core.js\`: carga, filtros, tarjetas y listado de Biblioteca.
- \`src/library/library-v3-images.js\`: único responsable del editor de las dos imágenes: \`cover_url\` y \`photo_url\`.
- \`src/library/library-v3-ficha.js\`: formulario, guardado, auditoría, publicación y borrado.
- \`src/library/ficha/ficha-actions.js\`: único responsable de la vista abierta. Muestra portada, foto al abrir, información estructurada, fuentes y botones Editar, Añadir a mi acuario, Publicar y Borrar.
- \`src/library/inventory/library-inventory-import.js\`: importación de la ficha al acuario o inventario general según el tipo.
- No se permiten archivos \`hotfix\`, \`patch\` o \`clean\` que redefinan la vista o las imágenes de ficha.

## Regla de actualización

- Ejecutar \`npm run docs:refresh\` después de modificar cargas, módulos, responsabilidades o build.
- \`npm run check\` y \`npm run mobile:prepare\` regeneran este documento antes de continuar.
- \`www/\`, \`android/\`, \`ios/\` y \`node_modules/\` no se editan a mano.
`;

const tree = `# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por \`scripts/refresh-project-docs.mjs\`.

Fuente de verdad: GitHub \`main\`.

Build actual: \`${build}\`.

## Entrada web

${direct.map(file => `- \`${file}\``).join('\n')}

## Módulos cargados bajo demanda

${modules.map(file => `- \`${file}\``).join('\n')}

## Biblioteca / Flujo de ficha

\`library-v3-core.js\`
→ lista y abre una ficha
→ \`ficha-actions.js\`
→ muestra \`cover_url\` y \`photo_url\`
→ muestra datos estructurados y fuentes
→ ofrece Editar / Añadir a mi acuario / Publicar / Borrar

\`library-v3-ficha.js\`
→ edición y guardado
→ usa \`library-v3-images.js\` para las dos imágenes

\`library-inventory-import.js\`
→ copia la ficha al acuario o al inventario correspondiente

## Propiedad única

- Vista abierta: \`src/library/ficha/ficha-actions.js\`.
- Editor de imágenes: \`src/library/library-v3-images.js\`.
- Editor y persistencia de ficha: \`src/library/library-v3-ficha.js\`.
- Ningún otro archivo puede redefinir \`window.verFicha\` ni \`LibraryV3Images.imageBox\`.

## Automatización

- \`npm run docs:refresh\`: regenera MAPA y ÁRBOL.
- \`npm run check\`: regenera documentación y valida la app.
- \`npm run mobile:prepare\`: regenera documentación y prepara \`www/\` desde los activos reales.
`;

write('MAPA_ARCHIVOS.md', map);
write('ARBOL_MAESTRO.md', tree);
console.log(`MAPA_ARCHIVOS.md y ARBOL_MAESTRO.md regenerados para ${build}`);
