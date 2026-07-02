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

const refs = () => [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]).filter(r => !/^https?:/i.test(r) && !r.startsWith('data:'));
const clean = ref => ref.split('?')[0];
const scripts = () => [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]).filter(r => !/^https?:/i.test(r)).map(clean);

function checkRefs() {
  for (const ref of refs().map(clean)) if (!fs.existsSync(path.join(root, ref))) fail(`Missing active asset: ${ref}`);
}

function checkVersions() {
  for (const ref of refs().filter(r => /\.(js|css)(\?|$)/i.test(r))) {
    const build = new URLSearchParams(ref.split('?')[1] || '').get('v');
    if (!build) fail(`Version missing: ${ref}`);
    if (build && build !== version) fail(`Version mismatch: ${ref}`);
  }
}

function checkSyntax() {
  for (const file of ['app.js', ...scripts().filter(f => f.endsWith('.js') && f !== 'app.js')]) execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
}

function checkDuplicateWindows() {
  const names = ['biblioteca','renderBibliotecaActual','filtrarBiblioteca','formFicha','guardarFicha','verFicha','buscarIdentify','mostrarIdentify'];
  for (const name of names) {
    const found = [];
    for (const script of scripts()) {
      const code = fs.readFileSync(path.join(root, script), 'utf8');
      const count = (code.match(new RegExp(`window\\.${name}\\s*=`, 'g')) || []).length;
      if (count) found.push(`${script} (${count})`);
    }
    if (found.length > 1) fail(`Duplicated window.${name}: ${found.join(', ')}`);
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
  const chain = { select(){return this}, eq(){return this}, order(){return this}, limit(){return Promise.resolve({data:[],error:null})}, single(){return Promise.resolve({data:{id:'x'},error:null})}, insert(){return Promise.resolve({error:null})}, update(){return this}, in(){return this}, or(){return this} };
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
  for (const script of scripts()) vm.runInContext(fs.readFileSync(path.join(root, script), 'utf8'), ctx, { filename: script });
  if (typeof ctx.biblioteca !== 'function') fail('window.biblioteca missing');
  if (typeof ctx.pasarFichaAInventario !== 'function') fail('window.pasarFichaAInventario missing');
}

try { checkRefs(); checkVersions(); checkSyntax(); checkDuplicateWindows(); await checkLoad(); } catch (error) { fail(error.stack || error.message); }
if (errors.length) { console.error('AcuarioNexo validation failed:'); errors.forEach(e => console.error(`- ${e}`)); process.exit(1); }
console.log('AcuarioNexo validation OK');
