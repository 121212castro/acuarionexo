# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `admin-global-access-20260723-2325`.

## Navegación administrativa global

`admin_roles`
→ `src/admin/admin-core.js` resuelve `state.isAdmin`
→ `src/auth/auth-core.js` muestra u oculta `adminBtn`
→ `index.html` mantiene el botón en la cabecera de todas las pantallas
→ `src/core/module-loader.js` carga `adminPanel`
→ `src/admin/admin.js` presenta el Panel de Administración

## Flujo maestro de una ficha

`library-schema.js`
→ define el contrato y metadatos del tipo
→ `library-schema-rules.js` crea la regla efectiva única
→ `library-v3-template.js` entrega esa misma regla al Chat y fija la ruta JSON
→ `ficha-chat-import.js` audita antes de insertar
→ `library-v3-ficha.js` audita al guardar y normaliza `data.external_link`
→ `ficha-actions.js` audita al publicar o añadir y representa el botón externo
→ `library-inventory-import.js` audita antes de persistir la copia

Una ficha no puede avanzar por estado, validación de IA ni publicación si falla `LibrarySchema.audit`.

## Biblioteca / enlace externo opcional

- Todas las fichas pueden almacenar un único bloque común en `data.external_link`.
- El bloque permanece oculto cuando `enabled !== true` o la URL no es válida.
- `src/library/library-v3-ficha.js` es el propietario de edición, normalización, importación JSON y validación de la URL.
- `src/library/ficha/ficha-actions.js` es el propietario de la representación pública del botón.
- Campos disponibles: `enabled`, `provider`, `url`, `button_label`, `link_type`, `disclaimer`, `sponsored` y `affiliate`.
- No se almacena precio en este bloque y su existencia no implica patrocinio, afiliación ni colaboración.
- `commercial_link` solo se acepta como alias de lectura para migrar datos antiguos; al guardar se normaliza a `external_link`.
- No se permiten botones externos paralelos, lógica duplicada por tipo de ficha ni archivos hotfix.

## Propietarios únicos

- `index.html`: cabecera y botón global Admin.
- `src/auth/auth-core.js`: visibilidad de controles de sesión y del acceso Admin.
- `src/admin/admin-core.js`: autorización administrativa.
- `src/core/module-loader.js`: carga del panel oficial.
- `src/library/library-v3-ficha.js`: edición, guardado y validación del enlace externo opcional.
- `src/library/ficha/ficha-actions.js`: vista, publicación, entrada para añadir y representación del botón externo.
- No se permiten accesos Admin duplicados por pantalla, hotfix, patch ni wrappers.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, contratos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
