import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'www');
const files = [
  'index.html',
  'config.js',
  'app.js',
  'styles.css',
  'aquarium-map.css',
  'login-reef.css',
  'aquarium-cards.css',
  'aquariums-mobile-fix.css',
  'mobile-form-fix.css',
  'library-images.css',
  'library-mobile-overflow-fix.css',
  'notifications.css',
  'update-manager.js',
  'notifications.js',
  'app-version.json',
  'manifest.webmanifest',
  'firebase-messaging-sw.js',
  'icon-512.png',
  'src/aquariums/aquariums.js',
  'src/library/core/library-schema.js',
  'src/library/ui/library.js',
  'src/library/inventory/library-inventory-import.js',
  'src/library/library-v3.js',
  'src/library/ficha/ficha-chat-import.js',
  'src/library/ficha/ficha-json.js',
  'src/animals/animals.js',
  'src/map/map-v3-model.js',
  'src/map/map-state.js',
  'src/map/map-ui.js',
  'src/map/map-photos.js',
  'src/map/map-markers.js',
  'src/map/map-render-3d.js',
  'src/map/map-save.js',
  'src/map/map.js',
  'src/map/map-interactions.js',
  'src/photos/photos.js',
  'src/inventory/inventory-core.js',
  'src/inventory/inventory-list.js',
  'src/inventory/inventory.js',
  'src/inventory/inventory-ui.js',
  'src/microfauna/microfauna.js',
  'src/ai/ai.js',
  'src/ai/ai-library-v3.js',
  'src/ai/ai-alerts-extra.js',
  'src/parameters/parameters.js',
  'src/parameters/measurements-advanced.js',
  'src/parameters/parameters-ai-fallback.js',
  'src/tasks/tasks.js',
  'src/admin/admin.js',
  'src/admin/admin-extra.js',
  'src/admin/report-issue.js',
  'src/admin/issue-entry.js',
  'src/auth/auth.js'
];

function copyFile(relativePath) {
  const from = path.join(root, relativePath);
  const to = path.join(out, relativePath);
  if (!fs.existsSync(from)) throw new Error(`Missing mobile asset: ${relativePath}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

fs.mkdirSync(out, { recursive: true });
for (const file of files) copyFile(file);
console.log(`AcuarioNexo mobile bundle ready: ${files.length} files copied to www/`);