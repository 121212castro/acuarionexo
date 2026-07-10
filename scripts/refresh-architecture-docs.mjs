import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const build = JSON.parse(fs.readFileSync(path.join(root, 'app-version.json'), 'utf8')).build || 'dev';

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function clean(value) {
  return String(value || '').replace(/^\.\//, '').replace(/\?.*$/, '').trim();
}

function quotedAssets(text) {
  const out = new Set();
  const re = /['"]([^'"]+\.(?:html|js|css|png|webmanifest|json)(?:\?[^'"]*)?)['"]/g;
  let match;
  while ((match = re.exec(text))) {
    const file = clean(match[1]);
    if (file && !/^https?:\/\//i.test(file) && exists(file)) out.add(file);
  }
  return [...out];
}

function activeFiles() {
  const initial = ['index.html', 'config.js', 'app.js', 'app-version.json', 'manifest.webmanifest', 'firebase-messaging-sw.js', 'icon-512.png', 'src/core/module-loader.js'];
  const files = new Set(initial.filter(exists));
  const queue = [...files];
  while (queue.length) {
    const current = queue.shift();
    if (!/\.(?:html|js)$/i.test(current)) continue;
    for (const file of quotedAssets(read(current))) {
      if (files.has(file)) continue;
      files.add(file);
      queue.push(file);
    }
  }
  return [...files].sort((a, b) => a.localeCompare(b));
}

function libraryFiles(files) {
  return files.filter(file => file.startsWith('src/library/'));
}

function renderList(files) {
  return files.map(file => `- \`${file}\``).join('\n');
}

const files = activeFiles();
const library = libraryFiles(files);
const mapa = `# MAPA DE ARCHIVOS\n\n## Build actual\n\nBuild unificado: \`${build}\`.\n\nDebe coincidir en \`index.html\`, \`app-version.json\`, \`manifest.webmanifest\`, este mapa y \`ARBOL_MAESTRO.md\`.\n\n## Regla de mantenimiento\n\nEste archivo y \`ARBOL_MAESTRO.md\` se regeneran con \`npm run docs:refresh\`. Los comandos \`npm run check\`, \`npm run mobile:prepare\` y \`npm run mobile:sync\` ejecutan esa regeneración antes de validar o empaquetar.\n\n## Archivos activos detectados\n\n${renderList(files)}\n\n## Biblioteca / Fichas\n\n${renderList(library)}\n\n### Responsabilidades oficiales\n\n- \`src/library/library-v3-core.js\`: carga, filtros, tarjetas y listado.\n- \`src/library/library-v3-images.js\`: edición de \`cover_url\` y \`photo_url\`.\n- \`src/library/library-v3-ficha.js\`: formulario, guardado, auditoría, publicación y borrado.\n- \`src/library/ficha/ficha-actions.js\`: única vista abierta de ficha, información completa y botones.\n- \`src/library/inventory/library-inventory-import.js\`: copia de la ficha al acuario o inventario según tipo.\n\n## Archivos generados: no editar a mano\n\n- \`www/\`\n- \`android/\`\n- \`ios/\`\n- \`node_modules/\`\n`;

const arbol = `# ARBOL MAESTRO ACUARIONEXO\n\nFuente de verdad: GitHub \`main\`.\n\nApp web publicada: \`https://121212castro.github.io/acuarionexo/\`.\n\nApp móvil: Capacitor.\n\nDatos y autenticación: Supabase.\n\nBuild actual: \`${build}\`.\n\n## Flujo de entrada\n\n\`index.html\` → \`app.js\` → \`src/core/module-loader.js\` → módulos activos.\n\n## Árbol activo\n\n${renderList(files)}\n\n## Biblioteca / Fichas\n\n${renderList(library)}\n\n### Propiedad única\n\n- Vista abierta: \`src/library/ficha/ficha-actions.js\`.\n- Editor y persistencia: \`src/library/library-v3-ficha.js\`.\n- Imágenes editables: \`src/library/library-v3-images.js\`.\n- Importación al acuario/inventario: \`src/library/inventory/library-inventory-import.js\`.\n- Contrato y validación: \`src/library/core/library-schema.js\` y \`src/library/core/library-schema-rules.js\`.\n\n## Control automático\n\n\`npm run docs:refresh\` regenera este árbol y \`MAPA_ARCHIVOS.md\`. La validación falla si hay referencias activas inexistentes, versiones desincronizadas o propietarios globales duplicados.\n\n## No editar a mano\n\n- \`www/\`\n- \`android/\`\n- \`ios/\`\n- \`node_modules/\`\n`;

fs.writeFileSync(path.join(root, 'MAPA_ARCHIVOS.md'), mapa);
fs.writeFileSync(path.join(root, 'ARBOL_MAESTRO.md'), arbol);
console.log(`Architecture docs refreshed for build ${build}: ${files.length} active files.`);
