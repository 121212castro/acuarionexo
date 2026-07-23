# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

## Build actual

`admin-global-access-20260723-2325`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Administración / acceso global

- `index.html`: contiene el único botón persistente `adminBtn` de la cabecera.
- `src/auth/auth-core.js`: muestra el botón únicamente cuando existe sesión y `state.isAdmin === true`.
- `src/admin/admin-core.js`: determina el rol administrativo oficial mediante `admin_roles`.
- `src/core/module-loader.js`: `adminPanel` carga el módulo oficial `src/admin/admin.js`.
- El botón está disponible desde cualquier pantalla y abre siempre el Panel de Administración.
- Los usuarios sin rol administrativo no ven el botón.
- No se permiten botones Admin duplicados dentro de pantallas concretas.

## Biblioteca / cadena única de contrato

- `src/library/core/library-schema.js`: define los 13 contratos y sus metadatos.
- `src/library/core/library-schema-rules.js`: ejecuta la única auditoría efectiva.
- `src/library/library-v3-template.js`: entrega al Chat las mismas reglas y rutas JSON.
- `src/library/ficha/ficha-chat-import.js`: rechaza antes de insertar lo que no apruebe `LibrarySchema.audit`.
- `src/library/library-v3-ficha.js`, `src/library/ficha/ficha-actions.js` y `src/library/inventory/library-inventory-import.js` reutilizan esa auditoría.

## Propietarios únicos

- `index.html`: estructura de la cabecera y botón global Admin.
- `src/auth/auth-core.js`: visibilidad de controles de sesión y acceso Admin.
- `src/admin/admin-core.js`: autorización y rol administrativo.
- `src/core/module-loader.js`: carga del panel.
- No se permiten hotfix, patch, wrappers ni accesos Admin paralelos.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, contratos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.