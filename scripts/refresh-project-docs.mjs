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
const active = [...new Set(['index.html', ...direct, ...modules, ...indirect])].sort();

const ownership = `## Biblioteca / propietarios únicos

- \`src/admin/admin.js\`: abre Biblioteca desde Admin conservando \`adminReturn: true\`.
- \`src/library/library-v3-core.js\`: listado, filtros, contexto de entrada y retorno central hacia Admin o Biblioteca.
- \`src/library/library-v3-images.js\`: carga y persistencia administrativa de \`cover_url\` y \`photo_url\` por id de ficha.
- \`src/library/library-v3-ficha.js\`: editor, guardado, auditoría, publicación y borrado.
- \`src/library/ficha/ficha-actions.js\`: vista abierta; utiliza el retorno central del núcleo.
- \`library-images.css\`: única autoridad visual; la portada abierta conserva su proporción completa y la foto interior mantiene su marco propio.
- Ningún otro archivo puede redefinir \`window.verFicha\`, \`window.formFicha\` o \`LibraryV3Images.imageBox\`.
- No se permiten archivos \`hotfix\`, \`patch\`, wrappers ni copias paralelas que redefinan estas rutas.`;

const tasksOwnership = `## Tareas / arquitectura y repetición

- \`src/tasks/tasks-core.js\`: única autoridad para opciones, validación y cálculo de repetición; contiene presets, intervalo personalizado de 1 a 365 días y recomendación contextual por IA.
- \`src/tasks/tasks-form.js\`: formulario de creación; consume los controles oficiales del núcleo y no duplica reglas de frecuencia.
- \`src/tasks/tasks.js\`: persistencia en Supabase, edición, finalización y creación de la siguiente ocurrencia.
- Metadatos oficiales: \`repeat_days\`, \`repeat_mode\`, \`repeat_reason\` y \`route\`, almacenados mediante \`taskNotesPayload\`.
- Flujo: título y acuario → selección manual o recomendación IA → validación → guardado → al marcar Hecho se crea la siguiente tarea.
- La IA propone y justifica; el usuario siempre puede sustituir la propuesta por una frecuencia personalizada.
- No se permiten listas de repetición paralelas, reglas duplicadas ni archivos \`hotfix\` o \`patch\` para este flujo.`;

const updateRules = `## Regla de actualización

- Ejecutar \`npm run docs:refresh\` después de modificar cargas, módulos, responsabilidades o build.
- Ejecutar \`npm run check\` antes de publicar.
- Ejecutar \`npm run mobile:prepare\` cuando el cambio afecte a archivos usados por la app móvil.
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

${ownership}

${tasksOwnership}

${updateRules}`;

const tree = `# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por \`scripts/refresh-project-docs.mjs\`.

Fuente de verdad: GitHub \`main\`.

Build actual: \`${build}\`.

## Entrada web

${direct.map(file => `- \`${file}\``).join('\n')}

## Módulos cargados bajo demanda

${modules.map(file => `- \`${file}\``).join('\n')}

## Biblioteca / flujo maestro

\`src/admin/admin.js\`
→ abre Biblioteca completa o revisión con \`adminReturn: true\`
→ \`src/library/library-v3-core.js\` conserva el contexto y resuelve el retorno
→ \`src/library/ficha/ficha-actions.js\` abre la vista sin perder el contexto
→ \`src/library/library-v3-ficha.js\` abre el editor
→ vista y editor regresan al Panel Admin o a Biblioteca según el origen real

\`src/library/library-v3-images.js\`
→ guarda los archivos originales sin transformaciones destructivas
→ actualiza la ficha por id y confirma la fila modificada
→ \`library-images.css\` muestra la portada completa sin recortar sus textos

## Tareas / flujo maestro

\`src/tasks/tasks-form.js\`
→ recoge título, fecha, notas y modo de repetición
→ \`src/tasks/tasks-core.js\` calcula o valida la frecuencia
→ \`src/tasks/tasks.js\` guarda los metadatos en Supabase
→ al completar la tarea crea la siguiente ocurrencia con el intervalo oficial

${ownership}

${tasksOwnership}

${updateRules}`;

const activeText = `ACUARIONEXO · MODULOS OFICIALES · 20/07/2026

FUENTE DE VERDAD
- Rama de trabajo y publicación: main.
- URL web: https://121212castro.github.io/acuarionexo/
- Supabase es la fuente de datos, autenticación y Storage.
- Local no es entorno vivo.

BUILD ACTUAL
- index.html: ${build}.
- app-version.json: ${build}.
- manifest.webmanifest: ${build}.

ARCHIVOS ACTIVOS
${active.map(file => `- ${file}`).join('\n')}

BIBLIOTECA · PROPIETARIOS UNICOS
- src/admin/admin.js: entrada desde Admin.
- src/library/library-v3-core.js: listado, contexto y retorno central.
- src/library/library-v3-images.js: carga y persistencia de imágenes.
- src/library/library-v3-ficha.js: editor y persistencia de ficha.
- src/library/ficha/ficha-actions.js: vista abierta.
- library-images.css: presentación única de imágenes.

TAREAS · PROPIETARIOS UNICOS
- src/tasks/tasks-core.js: reglas, validación y recomendación de repetición.
- src/tasks/tasks-form.js: formulario oficial de creación.
- src/tasks/tasks.js: persistencia, edición, finalización y siguiente ocurrencia.
- Metadatos: repeat_days, repeat_mode, repeat_reason y route.

GENERADO, NO EDITAR A MANO
- www/
- android/
- ios/
- node_modules/`;

write('MAPA_ARCHIVOS.md', map);
write('ARBOL_MAESTRO.md', tree);
write('ARCHIVOS_ACTIVOS.txt', activeText);
console.log(`Documentación de proyecto regenerada para ${build}`);