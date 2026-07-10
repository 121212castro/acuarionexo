import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = String(process.env.GITHUB_SHA || process.argv[2] || '').trim();
if (!/^[0-9a-f]{7,40}$/i.test(sha)) throw new Error('Falta un SHA de commit válido para versionar el despliegue.');
const build = `release-${sha.slice(0, 12).toLowerCase()}`;

const indexPath = path.join(root, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');
index = index.replace(/window\.ACUARIONEXO_BUILD\s*=\s*['"][^'"]+['"];/, `window.ACUARIONEXO_BUILD = '${build}';`);
fs.writeFileSync(indexPath, index);

const versionPath = path.join(root, 'app-version.json');
const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
version.build = build;
version.updated = new Date().toISOString();
fs.writeFileSync(versionPath, `${JSON.stringify(version, null, 2)}\n`);

const manifestPath = path.join(root, 'manifest.webmanifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.start_url = `./?v=${build}`;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`AcuarioNexo release stamped: ${build}`);
