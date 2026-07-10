import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const errors = [];
const fail = message => errors.push(message);
const version = JSON.parse(fs.readFileSync(path.join(root, 'app-version.json'), 'utf8')).build;

const clean = ref => String(ref || '').split('?')[0].replace(/^\.\//, '');
const isLocal = ref => ref && !/^https?:/i.test(ref) && !ref.startsWith('data:');
const refs = () => [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]).filter(isLocal);
const scripts = () => [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]).filter(isLocal).map(clean);

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function quotedLocalAssets(text) {
  const files = new Set();
  const re = /['"]([^'"]+\.(?:html|js|css|png|webmanifest|json)(?:\?[^'"]*)?)['"]/g;
  let match;
  while ((match = re.exec(text))) {
    const file = clean(match[1]);
    if (isLocal(file)) files.add(file);
  }
  return files;
}

function activeFiles() {
  const files = new Set(['index.html', ...refs().map(clean), 'src/core/module-loader.js'].filter(Boolean));
  const queue = [...files];
  while (queue.length) {
    const current = queue.shift();
    if (!exists(current) || !/\.(?:html|js)$/i.test(current)) continue;
    for (const file of quotedLocalAssets(read(current))) {
      if (!exists(file) || files.has(file)) continue;
      files.add(file);
      queue.push(file);
    }
  }
  return [...files].sort((a, b) => a.localeCompare(b));
}

function activeScripts() {
  return activeFiles().filter(file => file.endsWith('.js'));
}

function checkRefs() {
  for (const ref of refs().map(clean)) if (!exists(ref)) fail(`Missing active asset: ${ref}`);
  const visited = new Set();
  const queue = ['index.html', 'src/core/module-loader.js'];
  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current) || !exists(current)) continue;
    visited.add(current);
    if (!/\.(?:html|js)$/i.test(current)) continue;
    for (const ref of quotedLocalAssets(read(current))) {
      if (!exists(ref)) {
        fail(`Missing referenced asset: ${current} -> ${ref}`);
        continue;
      }
      if (!visited.has(ref)) queue.push(ref);
    }
  }
}

function checkVersions() {
  const indexMatch = html.match(/window\.ACUARIONEXO_BUILD\s*=\s*['"]([^'"]+)['"]/);
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const manifestMatch = String(manifest.start_url || '').match(/[?&]v=([^&]+)/);
  const indexBuild = indexMatch ? indexMatch[1] : '';
  const manifestBuild = manifestMatch ? decodeURIComponent(manifestMatch[1]) : '';
  if (indexBuild !== version) fail(`Build mismatch: index=${indexBuild}, app-version=${version}`);
  if (manifestBuild !== version) fail(`Build mismatch: manifest=${manifestBuild}, app-version=${version}`);
}

function checkSyntax() {
  for (const file of activeScripts()) execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
}

function checkDuplicateWindows() {
  const names = ['biblioteca','renderBibliotecaActual','filtrarBiblioteca','formFicha','guardarFicha','verFicha','buscarIdentify','mostrarIdentify','adminPanel'];
  const scriptsToCheck = activeScripts();
  for (const name of names) {
    const found = [];
    for (const script of scriptsToCheck) {
      const code = read(script);
      const count = (code.match(new RegExp(`window\\.${name}\\s*=`, 'g')) || []).length;
      if (count) found.push(`${script} (${count})`);
    }
    if (found.length > 1) fail(`Duplicated window.${name}: ${found.join(', ')}`);
  }
}

function checkFichaOwnership() {
  const actions = 'src/library/ficha/ficha-actions.js';
  const ficha = 'src/library/library-v3-ficha.js';
  const images = 'src/library/library-v3-images.js';
  if (!exists(actions) || !exists(ficha) || !exists(images)) return;
  const actionsCode = read(actions);
  const fichaCode = read(ficha);
  const imagesCode = read(images);
  if (!actionsCode.includes('Añadir a mi acuario')) fail('La vista de ficha debe usar el texto Añadir a mi acuario.');
  if (actionsCode.includes('Añadir a mi inventario')) fail('Texto prohibido en vista de ficha: Añadir a mi inventario.');
  if (!actionsCode.includes('cover_url') || !actionsCode.includes('photo_url')) fail('La vista de ficha debe mostrar portada y foto al abrir.');
  if (!actionsCode.includes('fichaInformation')) fail('La vista de ficha debe mostrar la información estructurada.');
  for (const label of ['Editar', 'Publicar', 'Borrar']) if (!actionsCode.includes(label)) fail(`Falta botón de ficha: ${label}.`);
  if (fichaCode.includes('window.verFicha')) fail('library-v3-ficha.js no debe definir window.verFicha.');
  if (!imagesCode.includes("'cover_url','coverFile'")) fail('library-v3-images.js debe mantener Foto portada.');
  if (!imagesCode.includes("'photo_url','photoFile'")) fail('library-v3-images.js debe mantener Foto al abrir ficha.');
  const loaderCode = read('src/core/module-loader.js');
  if (loaderCode.includes('ficha-image-clean.js')) fail('El cargador no puede incluir ficha-image-clean.js.');
}

function checkDocs() {
  const map = read('MAPA_ARCHIVOS.md');
  const tree = read('ARBOL_MAESTRO.md');
  if (!map.includes(version)) fail('MAPA_ARCHIVOS.md no contiene el build actual.');
  if (!tree.includes(version)) fail('ARBOL_MAESTRO.md no contiene el build actual.');
  for (const required of ['src/library/ficha/ficha-actions.js', 'src/library/library-v3-images.js', 'src/library/library-v3-ficha.js']) {
    if (!map.includes(required)) fail(`MAPA_ARCHIVOS.md no documenta ${required}.`);
    if (!tree.includes(required)) fail(`ARBOL_MAESTRO.md no documenta ${required}.`);
  }
}

function mockElement(id) {
  return { id, value:'', innerHTML:'', textContent:'', style:{}, dataset:{}, options:[], onclick:null,
    classList:{add(){},remove(){},toggle(){}}, addEventListener(){}, remove(){}, insertAdjacentHTML(){}, scrollIntoView(){}, prepend(){}, appendChild(){}, click(){}, setAttribute(){}, removeAttribute(){},
    getBoundingClientRect(){return{left:0,top:0,width:640,height:360}}
  };
}

async function checkLoad() {
  const elements = new Map();
  const el = id => elements.get(id) || (elements.set(id, mockElement(id)), elements.get(id));
  const chain = { select(){return this}, eq(){return this}, order(){return this}, limit(){return Promise.resolve({data:[],error:null})}, single(){return Promise.resolve({data:{id:'x'},error:null})}, maybeSingle(){return Promise.resolve({data:null,error:null})}, insert(){return Promise.resolve({error:null})}, update(){return this}, in(){return this}, or(){return this} };
  const ctx = {
    console, setTimeout, clearTimeout, setInterval(){}, clearInterval(){}, requestAnimationFrame(fn){fn()}, scrollTo(){}, addEventListener(){},
    location:{origin:'https://example.com',pathname:'/acuarionexo/',hash:'',search:'',reload(){},replace(){}}, history:{replaceState(){}}, localStorage:{getItem(){return null},setItem(){}},
    navigator:{serviceWorker:null,clipboard:{writeText(){return Promise.resolve()}}}, Notification: undefined, crypto:{randomUUID(){return '00000000-0000-4000-8000-000000000000'}},
    caches:{keys(){return Promise.resolve([])},delete(){return Promise.resolve(true)}}, fetch(){return Promise.resolve({ok:true,json(){return Promise.resolve({})}})}, MutationObserver:function(){return{observe(){},disconnect(){}}}, Image:function(){}, URL:{createObjectURL(){return 'blob:x'}},
    document:{getElementById:el,querySelector(){return null},addEventListener(){},createElement:el,body:el('body')},
    ACUARIO_NEXO_TEST:true,
    ACUARIONEXO_CONFIG:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_KEY:'anon',APP_VERSION:'test'},
    supabase:{createClient(){return{
      from(){return Object.create(chain)},
      rpc(){return Object.create(chain)},
      storage:{from(){return{upload(){return Promise.resolve({error:null})},getPublicUrl(){return{data:{publicUrl:'https://example.com/x.jpg'}}}}}},
      functions:{invoke(){return Promise.resolve({data:{data:{sections:{}}},error:null})}},
      auth:{getSession(){return Promise.resolve({data:{session:null}})},onAuthStateChange(){},signInWithPassword(){return Promise.resolve({error:null})},signUp(){return Promise.resolve({error:null})},signOut(){return Promise.resolve({error:null})},resetPasswordForEmail(){return Promise.resolve({error:null})},updateUser(){return Promise.resolve({error:null})}}
    }}}
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const script of scripts()) vm.runInContext(read(script), ctx, { filename: script });
  if (typeof ctx.biblioteca !== 'function') fail('window.biblioteca missing');
  if (typeof ctx.pasarFichaAInventario !== 'function') fail('window.pasarFichaAInventario missing');
  if (typeof ctx.adminPanel !== 'function') fail('window.adminPanel missing');
}

try { checkRefs(); checkVersions(); checkSyntax(); checkDuplicateWindows(); checkFichaOwnership(); checkDocs(); await checkLoad(); } catch (error) { fail(error.stack || error.message); }
if (errors.length) { console.error('AcuarioNexo validation failed:'); errors.forEach(e => console.error(`- ${e}`)); process.exit(1); }
console.log('AcuarioNexo validation OK');
