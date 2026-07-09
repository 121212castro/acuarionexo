import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'www');

const fixedAssets = [
  'index.html',
  'config.js',
  'app.js',
  'app-version.json',
  'manifest.webmanifest',
  'firebase-messaging-sw.js',
  'icon-512.png',
  'src/core/module-loader.js'
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function quotedFiles(text) {
  const files = new Set();
  const re = /['"]([^'"]+\.(?:js|css|png|webmanifest|json))['"]/g;
  let match;
  while ((match = re.exec(text))) {
    const file = match[1];
    if (/^https?:\/\//i.test(file)) continue;
    files.add(file);
  }
  return files;
}

function activeFiles() {
  const files = new Set(fixedAssets);
  for (const file of quotedFiles(read('index.html'))) files.add(file);
  for (const file of quotedFiles(read('src/core/module-loader.js'))) files.add(file);
  return [...files].sort((a, b) => a.localeCompare(b));
}

function copyFile(relativePath) {
  const from = path.join(root, relativePath);
  const to = path.join(out, relativePath);
  if (!fs.existsSync(from)) throw new Error(`Missing mobile asset: ${relativePath}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const files = activeFiles();
for (const file of files) copyFile(file);

console.log(`AcuarioNexo mobile bundle ready: ${files.length} active files copied to www/`);
