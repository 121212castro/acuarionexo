import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), `${content.trim()}\n`);

function buildFromIndex() {
  const match = read('index.html').match(/window\.ACUARIONEXO_BUILD\s*=\s*['"]([^'"]+)['"]/);
  if (!match) throw new Error('No se encontró ACUARIONEXO_BUILD en index.html');
  return match[1];
}
function buildFromVersion() { return JSON.parse(read('app-version.json')).build; }
function buildFromManifest() {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const match = String(manifest.start_url || '').match(/[?&]v=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}
function quotedLocalAssets(text) {
  const found = new Set();
  const re = /['"]([^'"]+\.(?:js|css|json|webmanifest|png)(?:\?[^'"]*)?)['"]/g;
  let match;
  while ((match = re.exec(text))) {
    const file = match[1].replace(/\?.*$/, '');
    if (!/^https?:\/\//i.test(file)) found.add(file);
  }
  return [...found];
}

const build = buildFromIndex();
const versionBuild = buildFromVersion();
const manifestBuild = buildFromManifest();
if (build !== versionBuild || build !== manifestBuild) throw new Error(`Build desincronizado: index=${build}, app-version=${versionBuild}, manifest=${manifestBuild}`);

const direct = quotedLocalAssets(read('index.html'));
const modules = quotedLocalAssets(read('src/core/module-loader.js'));
const active = [...new Set(['index.html', ...direct, ...modules, 'src/library/ficha/ficha-json.js'])].sort();

const adminNavigation = `## Administración / acceso global

- \`index.html\`: contiene el único botón persistente \`adminBtn\` de la cabecera.
- \`src/auth/auth-core.js\`: muestra el botón únicamente cuando existe sesión y \`state.isAdmin === true\`.
- \`src/admin/admin-core.js\`: determina el rol administrativo oficial mediante \`admin_roles\`.
- \`src/core/module-loader.js\`: \`adminPanel\` carga el módulo oficial \`src/admin/admin.js\`.
- El botón está disponible desde cualquier pantalla y abre siempre el Panel de Administración.
- Los usuarios sin rol administrativo no ven el botón.
- No se permiten botones Admin duplicados dentro de pantallas concretas.`;

const contractChain = `## Biblioteca / cadena única de contrato

- \`src/library/core/library-schema.js\`: define los 13 contratos, campos, etiquetas, apartados y metadatos base.
- \`src/library/core/library-schema-rules.js\`: convierte esos metadatos en una sola regla efectiva por campo y ejecuta la única auditoría.
- \`src/library/library-v3-template.js\`: genera para el Chat exactamente la misma regla efectiva y la ruta JSON de cada campo.
- \`src/library/ficha/ficha-chat-import.js\`: rechaza antes de insertar cualquier ficha que no apruebe \`LibrarySchema.audit\`.
- \`src/library/library-v3-ficha.js\`: usa la misma auditoría al editar y guardar; además gestiona el bloque opcional \`data.external_link\`.
- \`src/library/ficha/ficha-actions.js\`: vuelve a usar la misma auditoría al publicar o añadir y muestra el botón externo cuando está activado.
- \`src/library/inventory/library-inventory-import.js\`: vuelve a auditar antes de persistir la copia.
- \`scripts/audit-library-contracts.mjs\`: recorre los 13 tipos y verifica contrato, plantilla, rutas, valores cerrados, números, longitudes, resumen y fuentes.
- No existe una segunda regla por pantalla ni una validación de IA que sustituya el contrato.`;

const fieldRules = `## Biblioteca / reglas por clase de campo

- Valores cerrados: solo aceptan una opción exacta; no se les aplica longitud de texto descriptivo.
- Campos numéricos: exigen número o rango concreto.
- Nombre científico: exige binomio concreto válido.
- Identificadores, marcas, modelos, unidades y códigos: usan su longitud mínima específica.
- Campos descriptivos: usan la longitud mínima indicada por el contrato.
- \`reef_safe\`: solo \`Sí\`, \`Sí con precaución\` o \`No\`; la explicación pertenece a \`reef_safe_notes\`.
- \`summary\`: mínimo 20 caracteres.
- \`sources\`: mínimo dos fuentes reales con URL completa.`;

const externalLinks = `## Biblioteca / enlace externo opcional

- Todas las fichas pueden almacenar un único bloque común en \`data.external_link\`.
- El bloque permanece oculto cuando \`enabled !== true\` o la URL no es válida.
- \`src/library/library-v3-ficha.js\` es el propietario de edición, normalización, importación JSON y validación de la URL.
- \`src/library/ficha/ficha-actions.js\` es el propietario de la representación pública del botón.
- Campos disponibles: \`enabled\`, \`provider\`, \`url\`, \`button_label\`, \`link_type\`, \`disclaimer\`, \`sponsored\` y \`affiliate\`.
- No se almacena precio en este bloque y su existencia no implica patrocinio, afiliación ni colaboración.
- \`commercial_link\` solo se acepta como alias de lectura para migrar datos antiguos; al guardar se normaliza a \`external_link\`.
- No se permiten botones externos paralelos, lógica duplicada por tipo de ficha ni archivos hotfix.`;

const ownership = `## Propietarios únicos

- \`index.html\`: estructura de la cabecera y botón global Admin.
- \`src/auth/auth-core.js\`: visibilidad de controles de sesión y del acceso Admin.
- \`src/admin/admin-core.js\`: autorización y rol administrativo.
- \`src/library/core/library-schema.js\`: contratos y metadatos base.
- \`src/library/core/library-schema-rules.js\`: regla efectiva y auditoría única.
- \`src/library/library-v3-template.js\`: instrucciones y esqueleto JSON para el Chat.
- \`src/library/ficha/ficha-chat-import.js\`: entrada de fichas desde Chat.
- \`src/library/library-v3-ficha.js\`: edición, guardado y validación del enlace externo opcional.
- \`src/library/ficha/ficha-actions.js\`: vista, publicación, entrada para añadir y representación del botón externo.
- \`src/library/inventory/library-inventory-import.js\`: destino y persistencia en inventario.
- \`src/parameters/parameters-core.js\`: catálogo de fichas Test y compatibilidad por parámetro.
- No se permiten hotfix, patch, wrappers, validadores paralelos ni contratos duplicados.`;

const updateRules = `## Regla de actualización

- Ejecutar \`npm run docs:refresh\` después de modificar cargas, contratos, responsabilidades o build.
- Ejecutar \`npm run check\` antes de publicar.
- Ejecutar \`npm run mobile:prepare\` cuando cambien archivos activos usados por la app móvil.
- Comprobar después \`ARBOL_MAESTRO.md\`, \`MAPA_ARCHIVOS.md\` y \`ARCHIVOS_ACTIVOS.txt\`.
- \`www/\`, \`android/\`, \`ios/\` y \`node_modules/\` no se editan manualmente.`;

const map = `# MAPA DE ARCHIVOS

Documento autogenerado por \`scripts/refresh-project-docs.mjs\`.

## Build actual

\`${build}\`

El build coincide en \`index.html\`, \`app-version.json\` y \`manifest.webmanifest\`.

## Entrada web activa

${direct.map(file => `- \`${file}\``).join('\n')}

## Módulos bajo demanda

La lista oficial se obtiene exclusivamente de \`src/core/module-loader.js\`.

${adminNavigation}

${contractChain}

${fieldRules}

${externalLinks}

${ownership}

${updateRules}`;

const tree = `# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por \`scripts/refresh-project-docs.mjs\`.

Fuente de verdad: GitHub \`main\`.

Build actual: \`${build}\`.

## Navegación administrativa global

\`admin_roles\`
→ \`src/admin/admin-core.js\` resuelve \`state.isAdmin\`
→ \`src/auth/auth-core.js\` muestra u oculta \`adminBtn\`
→ \`index.html\` mantiene el botón en la cabecera de todas las pantallas
→ \`src/core/module-loader.js\` carga \`adminPanel\`
→ \`src/admin/admin.js\` presenta el Panel de Administración

${adminNavigation}

## Flujo maestro de una ficha

\`library-schema.js\`
→ define el contrato y metadatos del tipo
→ \`library-schema-rules.js\` crea la regla efectiva única
→ \`library-v3-template.js\` entrega esa misma regla al Chat y fija la ruta JSON
→ \`ficha-chat-import.js\` audita antes de insertar
→ \`library-v3-ficha.js\` audita al guardar y normaliza \`data.external_link\`
→ \`ficha-actions.js\` audita al publicar o añadir y representa el botón externo
→ \`library-inventory-import.js\` audita antes de persistir la copia

Una ficha no puede avanzar por estado, validación de IA ni publicación si falla \`LibrarySchema.audit\`.

${contractChain}

${fieldRules}

${externalLinks}

${ownership}

${updateRules}`;

const activeText = `ACUARIONEXO · MODULOS OFICIALES · 23/07/2026

FUENTE DE VERDAD
- Rama de trabajo y publicación: main.
- Supabase es la fuente de datos, autenticación y Storage.

BUILD ACTUAL
- index.html: ${build}.
- app-version.json: ${build}.
- manifest.webmanifest: ${build}.

ARCHIVOS ACTIVOS
${active.map(file => `- ${file}`).join('\n')}

ADMINISTRACION · ACCESO GLOBAL
- index.html: botón único adminBtn en la cabecera.
- src/auth/auth-core.js: visible solo con sesión administrativa.
- src/admin/admin-core.js: autoridad del rol administrativo.
- src/core/module-loader.js: carga de adminPanel.
- No existen botones Admin duplicados por pantalla.

BIBLIOTECA · CADENA ÚNICA
- library-schema.js: contratos y metadatos base.
- library-schema-rules.js: regla efectiva y auditoría única.
- library-v3-template.js: misma regla para el Chat y rutas JSON.
- ficha-chat-import.js: rechazo previo a la inserción.
- library-v3-ficha.js: auditoría al guardar y gestión de data.external_link.
- ficha-actions.js: auditoría al publicar o añadir y representación del botón externo.
- library-inventory-import.js: auditoría antes de persistir.
- audit-library-contracts.mjs: prueba los 13 tipos campo por campo.

ENLACE EXTERNO OPCIONAL
- Propiedad única: data.external_link.
- Oculto por defecto.
- URL http/https obligatoria solo cuando enabled=true.
- Sin precio fijo y sin implicar patrocinio o afiliación.
- No se permiten implementaciones paralelas por tipo de ficha.

REGLAS
- Valores cerrados, números, identificadores y textos descriptivos no comparten una longitud genérica.
- reef_safe usa un valor exacto y reef_safe_notes contiene la explicación.
- No se permiten validadores paralelos, hotfix ni patch.

GENERADO, NO EDITAR A MANO
- www/
- android/
- ios/
- node_modules/`;

write('MAPA_ARCHIVOS.md', map);
write('ARBOL_MAESTRO.md', tree);
write('ARCHIVOS_ACTIVOS.txt', activeText);
console.log(`Documentación de proyecto regenerada para ${build}`);
