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
  'aquarium-summary-enhancer.js',
  'aquarium-section-router-fix.js',
  'inventory-timeout-fix.js',
  'update-manager.js',
  'notifications.js',
  'app-version.json',
  'manifest.webmanifest',
  'icon-512.png',
  'src/aquariums/aquariums.js',
  'src/aquariums/photo-picker-fix.js',
  'src/library/library.js',
  'src/animals/animals.js',
  'src/map/map.js',
  'src/photos/photos.js',
  'src/inventory/inventory.js',
  'src/ai/ai.js',
  'src/parameters/parameters.js',
  'src/parameters/measurements-advanced.js',
  'src/tasks/tasks.js',
  'src/auth/auth.js'
];

function copyFile(relativePath) {
  const from = path.join(root, relativePath);
  const to = path.join(out, relativePath);
  if (!fs.existsSync(from)) throw new Error(`Missing mobile asset: ${relativePath}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of files) copyFile(file);
console.log(`AcuarioNexo mobile bundle ready: ${files.length} files copied to www/`);
