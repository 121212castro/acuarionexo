import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const errors = [];

function fail(message) {
  errors.push(message);
}

function localRefs() {
  return [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map(match => match[1])
    .filter(ref => !/^https?:/i.test(ref) && !ref.startsWith('data:'))
    .map(ref => ref.split('?')[0]);
}

function localRefsWithVersion() {
  return [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map(match => match[1])
    .filter(ref => !/^https?:/i.test(ref) && !ref.startsWith('data:'))
    .filter(ref => /\.(?:js|css)(?:\?|$)/i.test(ref));
}

function scriptRefs() {
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => match[1])
    .filter(ref => !/^https?:/i.test(ref))
    .map(ref => ref.split('?')[0]);
}

function checkRefs() {
  for (const ref of localRefs()) {
    if (!fs.existsSync(path.join(root, ref))) fail(`index.html references missing file: ${ref}`);
  }
}

function checkBuild() {
  const htmlBuild = html.match(/ACUARIONEXO_BUILD\s*=\s*['"]([^'"]+)['"]/)?.[1];
  const version = JSON.parse(fs.readFileSync(path.join(root, 'app-version.json'), 'utf8')).build;
  if (!htmlBuild) fail('index.html does not define window.ACUARIONEXO_BUILD.');
  if (htmlBuild !== version) fail(`Build mismatch: index.html=${htmlBuild || '-'} app-version.json=${version || '-'}`);
  for (const ref of localRefsWithVersion()) {
    const [, query = ''] = ref.split('?');
    const params = new URLSearchParams(query);
    const assetBuild = params.get('v');
    if (!assetBuild) fail(`Version missing in active asset reference: ${ref}`);
    if (htmlBuild && assetBuild && assetBuild !== htmlBuild) {
      fail(`Asset version mismatch: ${ref} uses ${assetBuild}, expected ${htmlBuild}`);
    }
  }
}

function checkSyntax() {
  const files = ['app.js', ...scriptRefs().filter(ref => ref.endsWith('.js') && ref !== 'app.js')];
  for (const file of files) {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  }
}

function createLoadContext() {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        value: '',
        innerHTML: '',
        textContent: '',
        onclick: null,
        classList: { toggle() {}, add() {}, remove() {} },
        addEventListener() {},
        remove() {},
        insertAdjacentHTML() {},
        scrollIntoView() {},
        getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 360 }; },
        style: {},
        appendChild() {},
        click() {},
        setAttribute() {},
        removeAttribute() {}
      });
    }
    return elements.get(id);
  }

  const context = {
    console,
    setTimeout,
    clearTimeout,
    setInterval() {},
    clearInterval() {},
    requestAnimationFrame(fn) { fn(); },
    scrollTo() {},
    crypto: { randomUUID() { return '00000000-0000-4000-8000-000000000000'; } },
    location: { origin: 'https://121212castro.github.io', pathname: '/acuarionexo/', hash: '', search: '', reload() {}, replace() {} },
    history: { replaceState() {} },
    localStorage: { getItem() { return null; }, setItem() {} },
    Notification: undefined,
    navigator: { serviceWorker: undefined },
    caches: { keys() { return Promise.resolve([]); }, delete() { return Promise.resolve(true); } },
    fetch() { return Promise.resolve({ ok: true, json() { return Promise.resolve({ build: 'test' }); } }); },
    document: {
      getElementById: element,
      querySelector() { return null; },
      addEventListener() {},
      body: { insertAdjacentHTML() {}, classList: { add() {}, remove() {} } },
      createElement: element
    },
    addEventListener() {},
    URL: { createObjectURL() { return 'blob:test'; } },
    Image: function Image() {},
    ACUARIO_NEXO_TEST: true
  };

  context.window = context;
  context.globalThis = context;
  context.ACUARIONEXO_CONFIG = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_KEY: 'anon',
    APP_VERSION: 'test'
  };
  context.supabase = {
    createClient() {
      const chain = {
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        limit() { return Promise.resolve({ data: [], error: null }); },
        single() { return Promise.resolve({ data: { id: 'aq1' }, error: null }); },
        insert() { return Promise.resolve({ error: null }); },
        update() { return this; },
        neq() { return this; },
        lte() { return this; },
        in() { return this; },
        or() { return this; }
      };
      return {
        from() { return Object.create(chain); },
        rpc() { return Object.create(chain); },
        storage: {
          from() {
            return {
              upload() { return Promise.resolve({ error: null }); },
              getPublicUrl() { return { data: { publicUrl: 'https://example.com/x.jpg' } }; }
            };
          }
        },
        functions: {
          invoke() { return Promise.resolve({ data: { data: { sections: {} } }, error: null }); }
        },
        auth: {
          getSession() { return Promise.resolve({ data: { session: null } }); },
          onAuthStateChange() {},
          signInWithPassword() { return Promise.resolve({ error: null }); },
          signUp() { return Promise.resolve({ error: null }); },
          signOut() { return Promise.resolve({ error: null }); },
          resetPasswordForEmail() { return Promise.resolve({ error: null }); },
          updateUser() { return Promise.resolve({ error: null }); }
        }
      };
    }
  };
  return context;
}

async function checkLoadOrder() {
  const context = createLoadContext();
  vm.createContext(context);
  for (const script of scriptRefs()) {
    vm.runInContext(fs.readFileSync(path.join(root, script), 'utf8'), context, { filename: script });
  }
  if (typeof context.biblioteca !== 'function') fail('window.biblioteca must be available when the library module is active.');
}

try {
  checkRefs();
  checkBuild();
  checkSyntax();
  await checkLoadOrder();
} catch (error) {
  fail(error.stack || error.message);
}

if (errors.length) {
  console.error('AcuarioNexo validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('AcuarioNexo validation OK');
process.exit(0);
