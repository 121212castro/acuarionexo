import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'www');

const entryAssets = [
  'index.html',
  'config.js',
  'app.js',
  'app-version.json',
  'manifest.webmanifest',
  'firebase-messaging-sw.js',
  'icon-512.png',
  'src/core/module-loader.js'
];

function normalizeAsset(file) {
  return String(file || '').replace(/^\.\//, '').replace(/\?.*$/, '').trim();
}

function isLocalAsset(file) {
  return file && !/^https?:\/\//i.test(file) && /\.(?:html|js|css|png|webmanifest|json)$/i.test(file);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function quotedFiles(text) {
  const files = new Set();
  const re = /['"]([^'"]+\.(?:html|js|css|png|webmanifest|json)(?:\?[^'"]*)?)['"]/g;
  let match;
  while ((match = re.exec(text))) {
    const file = normalizeAsset(match[1]);
    if (isLocalAsset(file)) files.add(file);
  }
  return files;
}

function activeFiles() {
  const files = new Set(entryAssets.map(normalizeAsset));
  const queue = [...files];

  while (queue.length) {
    const current = queue.shift();
    if (!exists(current) || !/\.(?:html|js)$/i.test(current)) continue;

    for (const file of quotedFiles(read(current))) {
      if (!exists(file) || files.has(file)) continue;
      files.add(file);
      queue.push(file);
    }
  }

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
