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
- `src/library/library-v3-ficha.js`: edita, guarda, importa JSON y valida el bloque opcional `data.external_link`.
- `src/library/ficha/ficha-actions.js`: publica, añade y representa el botón externo cuando está activado.
- `src/library/inventory/library-inventory-import.js`: vuelve a auditar antes de persistir la copia.

## Biblioteca / enlace externo opcional

- Propiedad única: `data.external_link`.
- Disponible en todas las fichas sin modificar los 13 contratos obligatorios.
- Oculto por defecto: no se representa si `enabled !== true`.
- Si se activa, exige una URL real con protocolo `http` o `https`.
- Campos: `enabled`, `provider`, `url`, `button_label`, `link_type`, `disclaimer`, `sponsored` y `affiliate`.
- El editor oficial está en `src/library/library-v3-ficha.js`.
- La vista oficial está en `src/library/ficha/ficha-actions.js`.
- El enlace se abre en otra pestaña con `noopener noreferrer`; añade `sponsored` cuando corresponda.
- No contiene precio fijo y no implica por sí solo patrocinio, afiliación ni colaboración.
- `commercial_link` se admite únicamente como alias heredado y se normaliza a `external_link` al guardar.
- No existen implementaciones diferentes por categoría ni archivos patch o hotfix.

## Propietarios únicos

- `index.html`: estructura de la cabecera y botón global Admin.
- `src/auth/auth-core.js`: visibilidad de controles de sesión y acceso Admin.
- `src/admin/admin-core.js`: autorización y rol administrativo.
- `src/core/module-loader.js`: carga del panel.
- `src/library/library-v3-ficha.js`: edición, guardado, importación y validación del enlace externo.
- `src/library/ficha/ficha-actions.js`: representación pública del botón externo.
- No se permiten hotfix, patch, wrappers, botones externos paralelos ni accesos Admin duplicados.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, contratos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
