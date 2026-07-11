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

function androidValidation() {
  const fallback = {
    status: 'unknown',
    commit: '',
    run_id: '',
    apk: '',
    validated_on_emulator: false
  };

  try {
    return { ...fallback, ...JSON.parse(read('android-build-status.json')) };
  } catch {
    return fallback;
  }
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

const android = androidValidation();
const direct = quotedLocalAssets(read('index.html'));
const modules = quotedLocalAssets(read('src/core/module-loader.js'));
const indirect = ['src/library/ficha/ficha-json.js'];
const active = [...new Set([...direct, ...modules, ...indirect])].sort();

const androidSummary = `## Android

- Workflow único de validación y publicación: \`.github/workflows/build-android-apk.yml\`.
- Auditoría real del emulador: \`scripts/android-emulator-audit.sh\`.
- Resultado persistente: \`android-build-status.json\`.
- Estado registrado: \`${android.status}\`.
- Commit validado: \`${android.commit || 'sin registrar'}\`.
- Run ID: \`${android.run_id || 'sin registrar'}\`.
- Validado en emulador: \`${Boolean(android.validated_on_emulator)}\`.
- APK: ${android.apk ? `\`${android.apk}\`` : '`sin publicar`'}.

### Criterio obligatorio de cierre Android

Android solo puede declararse terminado cuando, en una misma ejecución:

1. la aplicación web y el paquete móvil pasan;
2. el proyecto Android y los iconos se generan;
3. el APK compila y se instala en el emulador;
4. el proceso de \`com.acuarionexo.app\` permanece activo;
5. \`MainActivity\` queda visible;
6. se genera captura y \`logcat\`;
7. no existe \`FATAL EXCEPTION\`, ANR ni cierre del proceso;
8. la release publica el APK;
9. \`android-build-status.json\` registra \`status: success\` y \`validated_on_emulator: true\`.

No se acepta como cierre una ejecución iniciada, una compilación aislada ni un APK generado sin instalación y arranque comprobados.`;

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

${androidSummary}

## Regla de actualización

- Ejecutar \`npm run docs:refresh\` después de modificar cargas, módulos, responsabilidades, build o el sistema Android.
- \`npm run check\` y \`npm run mobile:prepare\` regeneran este documento antes de continuar.
- Después de una validación Android, comprobar que MAPA y ÁRBOL contienen el commit, run ID, estado y enlace vigentes.
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

${androidSummary}

## Flujo de trabajo Android para futuras intervenciones

\`.github/workflows/build-android-apk.yml\`
→ valida web y paquete móvil
→ crea el proyecto Android y recursos oficiales
→ compila y renombra el APK
→ habilita KVM
→ ejecuta \`scripts/android-emulator-audit.sh\`
→ instala y abre \`MainActivity\`
→ verifica PID, actividad visible, captura y \`logcat\`
→ publica \`android-test-latest\`
→ actualiza \`android-build-status.json\`

Ante un fallo:
→ abrir el job exacto
→ descargar \`AcuarioNexo-Android-Audit\`
→ leer primero los archivos de estado y después los logs
→ corregir la causa en \`main\`
→ repetir hasta \`status: success\`
→ no detenerse en informes intermedios

## Automatización

- \`npm run docs:refresh\`: regenera MAPA y ÁRBOL.
- \`npm run check\`: regenera documentación y valida la app.
- \`npm run mobile:prepare\`: regenera documentación y prepara \`www/\` desde los activos reales.
`;

write('MAPA_ARCHIVOS.md', map);
write('ARBOL_MAESTRO.md', tree);
console.log(`MAPA_ARCHIVOS.md y ARBOL_MAESTRO.md regenerados para ${build}`);
