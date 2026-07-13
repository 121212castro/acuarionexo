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

const mobilePipeline = `## Flujo móvil común

\`Código fuente\`
→ validación web
→ preparación y validación del paquete móvil
→ generación del proyecto nativo desde las fuentes reales
→ compilación
→ instalación
→ ejecución
→ auditoría
→ resultados y evidencias publicados como artefactos

- Los workflows móviles no escriben resultados ni documentación en \`main\`.
- Los archivos de estado se generan dentro de cada job y se incluyen en su artefacto de auditoría.
- \`www/\`, \`android/\`, \`ios/\` y \`node_modules/\` son salidas generadas o dependencias y no se editan manualmente.`;

const androidSummary = `## Android

- Workflow: \`.github/workflows/build-android-apk.yml\`.
- Auditoría real: \`scripts/android-emulator-audit.sh\`.
- El workflow valida la aplicación web y el paquete móvil antes de generar Android.
- El proyecto Android y sus recursos oficiales se generan desde las fuentes reales.
- La APK se compila, instala y abre en el emulador.
- La auditoría comprueba proceso, actividad visible, captura, instalación y \`logcat\`.
- La APK se publica en la release \`android-test-latest\` únicamente cuando toda la validación termina correctamente.
- \`android-build-status.json\` se genera dentro del job y se incluye en el artefacto \`AcuarioNexo-Android-Audit\`.
- El workflow no realiza \`git commit\` ni \`git push\` y no escribe el resultado en \`main\`.

### Criterio obligatorio de cierre Android

Android solo puede declararse terminado cuando, en una misma ejecución:

1. la aplicación web y el paquete móvil pasan;
2. el proyecto Android y los recursos oficiales se generan;
3. la APK compila y se instala en el emulador;
4. el proceso de \`com.acuarionexo.app\` permanece activo;
5. \`MainActivity\` queda visible;
6. se generan captura y \`logcat\`;
7. no existe \`FATAL EXCEPTION\`, ANR ni cierre del proceso;
8. la release \`android-test-latest\` publica la APK;
9. el artefacto \`AcuarioNexo-Android-Audit\` contiene el estado y las evidencias.

No se acepta como cierre una ejecución iniciada, una compilación aislada ni una APK generada sin instalación y arranque comprobados.`;

const iosSummary = `## iOS

- Workflow: \`.github/workflows/build-ios-simulator.yml\`.
- Auditoría real: \`scripts/ios-simulator-audit.sh\`.
- El workflow valida la aplicación web y el paquete móvil antes de generar iOS.
- El proyecto iOS y sus recursos oficiales se generan desde las fuentes reales.
- La aplicación se compila sin firma para iPhone Simulator.
- La aplicación se instala y abre en el simulador.
- La auditoría comprueba la instalación, el lanzamiento, el contenedor, la captura y la consola.
- \`ios-build-status.json\` se genera dentro del job y se incluye en el artefacto \`AcuarioNexo-iOS-Simulator-Audit\`.
- El artefacto incluye también la aplicación de simulador empaquetada y las evidencias de ejecución.
- El workflow no realiza \`git commit\` ni \`git push\` y no escribe el resultado en \`main\`.
- Esta validación acredita ejecución en simulador; no acredita firma para dispositivo ni disponibilidad en TestFlight.`;

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

${mobilePipeline}

${androidSummary}

${iosSummary}

## Regla de actualización

- Ejecutar \`npm run docs:refresh\` después de modificar cargas, módulos, responsabilidades, build o los sistemas Android e iOS.
- \`npm run check\` y \`npm run mobile:prepare\` regeneran estos documentos antes de continuar.
- Los resultados de las validaciones móviles se consultan en los artefactos del run correspondiente, no en archivos persistentes de \`main\`.
- Comprobar siempre los dos documentos generados después de actualizar el generador.
- \`www/\`, \`android/\`, \`ios/\` y \`node_modules/\` no se editan manualmente.
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

## Flujo móvil maestro

\`Código fuente\`
→ validación web
→ preparación del paquete móvil
→ generación nativa
→ compilación
→ instalación
→ ejecución
→ auditoría
→ artefactos

## Flujo Android

\`.github/workflows/build-android-apk.yml\`
→ valida web y paquete móvil
→ genera el proyecto Android y los recursos oficiales
→ compila \`AcuarioNexo-Android-Test.apk\`
→ ejecuta \`scripts/android-emulator-audit.sh\`
→ instala y abre \`MainActivity\`
→ comprueba proceso, actividad visible, captura y \`logcat\`
→ si toda la validación termina correctamente, publica la APK en \`android-test-latest\`
→ genera \`android-build-status.json\` dentro del job
→ sube estado y evidencias al artefacto \`AcuarioNexo-Android-Audit\`
→ no realiza commits automáticos en \`main\`

## Flujo iOS

\`.github/workflows/build-ios-simulator.yml\`
→ valida web y paquete móvil
→ genera el proyecto iOS y los recursos oficiales
→ compila \`App.app\` sin firma para iPhone Simulator
→ ejecuta \`scripts/ios-simulator-audit.sh\`
→ instala la aplicación en el simulador
→ abre y comprueba la ejecución real
→ genera \`ios-build-status.json\` dentro del job
→ empaqueta \`AcuarioNexo-iOS-Simulator.zip\`
→ sube estado, aplicación y evidencias al artefacto \`AcuarioNexo-iOS-Simulator-Audit\`
→ no realiza commits automáticos en \`main\`

## Lectura de resultados

Ante un fallo Android:
→ abrir el job exacto
→ descargar \`AcuarioNexo-Android-Audit\`
→ leer \`android-build-status.json\` y las evidencias
→ corregir la causa en las fuentes
→ repetir la validación

Ante un fallo iOS:
→ abrir el job exacto
→ descargar \`AcuarioNexo-iOS-Simulator-Audit\`
→ leer \`ios-build-status.json\` y las evidencias
→ corregir la causa en las fuentes
→ repetir la validación

## Automatización

- \`npm run docs:refresh\`: regenera MAPA y ÁRBOL.
- \`npm run check\`: regenera documentación y valida la aplicación.
- \`npm run mobile:prepare\`: regenera documentación y prepara \`www/\` desde los activos reales.
- \`www/\`, \`android/\`, \`ios/\` y \`node_modules/\` no se editan manualmente.
`;

write('MAPA_ARCHIVOS.md', map);
write('ARBOL_MAESTRO.md', tree);
console.log(`MAPA_ARCHIVOS.md y ARBOL_MAESTRO.md regenerados para ${build}`);
