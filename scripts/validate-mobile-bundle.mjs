import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const www = path.join(root, 'www');
const errors = [];
const fail = message => errors.push(message);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readWww = file => fs.readFileSync(path.join(www, file), 'utf8');
const existsWww = file => fs.existsSync(path.join(www, file));

function checkBundleExists() {
  if (!fs.existsSync(www)) fail('www/ no existe. Ejecuta npm run mobile:prepare antes de compilar Android.');
  if (!existsWww('mobile-bundle-manifest.json')) fail('www/mobile-bundle-manifest.json no existe. El paquete movil no fue regenerado con el script actual.');
}

function checkBuild() {
  if (!existsWww('app-version.json')) return fail('www/app-version.json no existe.');
  const sourceBuild = JSON.parse(read('app-version.json')).build;
  const mobileBuild = JSON.parse(readWww('app-version.json')).build;
  if (sourceBuild !== mobileBuild) fail(`Build movil desincronizado: source=${sourceBuild} www=${mobileBuild}`);
  if (existsWww('mobile-bundle-manifest.json')) {
    const manifestBuild = JSON.parse(readWww('mobile-bundle-manifest.json')).build;
    if (sourceBuild !== manifestBuild) fail(`Manifiesto movil desincronizado: source=${sourceBuild} manifest=${manifestBuild}`);
  }
}

function checkCriticalFiles() {
  const critical = [
    'index.html',
    'app-version.json',
    'manifest.webmanifest',
    'src/core/module-loader.js',
    'src/library/library-v3-images.js',
    'src/library/library-v3-ficha.js',
    'src/library/ficha/ficha-actions.js'
  ];
  for (const file of critical) {
    if (!existsWww(file)) fail(`Falta en www/: ${file}`);
    else if (read(file) !== readWww(file)) fail(`Archivo movil desincronizado: ${file}`);
  }
}

function checkFichaRules() {
  if (!existsWww('src/library/ficha/ficha-actions.js')) return;
  if (!existsWww('src/library/library-v3-ficha.js')) return;
  if (!existsWww('src/library/library-v3-images.js')) return;

  const actions = readWww('src/library/ficha/ficha-actions.js');
  const ficha = readWww('src/library/library-v3-ficha.js');
  const images = readWww('src/library/library-v3-images.js');

  if (!actions.includes('Añadir a mi acuario')) fail('Boton de ficha incorrecto en movil: debe decir Añadir a mi acuario.');
  if (actions.includes('Añadir a mi inventario')) fail('Texto prohibido en vista de ficha movil: Añadir a mi inventario.');
  if (!actions.includes('cover_url')) fail('La vista de ficha movil debe incluir la portada.');
  if (!actions.includes('photo_url')) fail('La vista de ficha movil debe incluir la foto al abrir.');
  if ((actions.match(/window\.verFicha\s*=/g) || []).length !== 1) fail('src/library/ficha/ficha-actions.js debe definir una sola vez window.verFicha.');
  if (ficha.includes('window.verFicha')) fail('src/library/library-v3-ficha.js no debe definir window.verFicha.');
  if (!images.includes("'cover_url','coverFile'")) fail('Panel de imagenes movil sin campo Foto portada.');
  if (!images.includes("'photo_url','photoFile'")) fail('Panel de imagenes movil sin campo Foto al abrir ficha.');
}

checkBundleExists();
if (!errors.length) {
  checkBuild();
  checkCriticalFiles();
  checkFichaRules();
}

if (errors.length) {
  console.error('AcuarioNexo mobile bundle validation failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('AcuarioNexo mobile bundle validation OK');
