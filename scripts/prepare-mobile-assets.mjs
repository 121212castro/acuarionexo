import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceIcon = path.join(root, 'icon-512.png');
const assetsDir = path.join(root, 'assets');
const targetIcon = path.join(assetsDir, 'icon.png');

if (!fs.existsSync(sourceIcon)) {
  throw new Error('Missing official AcuarioNexo icon: icon-512.png');
}

fs.mkdirSync(assetsDir, { recursive: true });
fs.copyFileSync(sourceIcon, targetIcon);

console.log('Official AcuarioNexo icon prepared for native Android generation.');
