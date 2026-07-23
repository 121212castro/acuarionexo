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

El acceso Admin no depende de la pantalla de origen ni de un estado temporal de retorno. Los usuarios sin rol administrativo no ven el botón.

## Flujo maestro de una ficha

`library-schema.js`
→ define el contrato y metadatos del tipo
→ `library-schema-rules.js` crea la regla efectiva única
→ `library-v3-template.js` entrega esa misma regla al Chat y fija la ruta JSON
→ `ficha-chat-import.js` audita antes de insertar
→ `library-v3-ficha.js` audita al guardar
→ `ficha-actions.js` audita al publicar o añadir
→ `library-inventory-import.js` audita antes de persistir la copia

## Propietarios únicos

- `index.html`: cabecera y botón global Admin.
- `src/auth/auth-core.js`: visibilidad de controles de sesión y del acceso Admin.
- `src/admin/admin-core.js`: autorización administrativa.
- `src/core/module-loader.js`: carga del panel oficial.
- `src/admin/admin.js`: contenido del Panel de Administración.
- No se permiten accesos Admin duplicados por pantalla, hotfix, patch ni wrappers.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, contratos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.