# MAPA DE ARCHIVOS

## Activos en produccion

Estos archivos son cargados por `index.html` o forman parte directa de la app publicada:

- `index.html`
- `app.js`
- `config.js`
- `styles.css`
- `aquarium-map.css`
- `login-reef.css`
- `src/aquariums/aquariums.js`
- `src/library/library.js`
- `src/animals/animals.js`
- `src/map/map.js`
- `src/photos/photos.js`
- `src/inventory/inventory.js`
- `src/ai/ai.js`
- `src/parameters/parameters.js`
- `src/tasks/tasks.js`
- `src/auth/auth.js`
- `update-manager.js`
- `notifications.js`
- `app-version.json`
- `manifest.webmanifest`
- `icon-512.png`

## Nucleo en `app.js`

- Configuracion compartida.
- Cliente Supabase.
- Estado comun `window.ANX.state`.
- Helpers DOM y render.
- Navegacion visual compartida.
- Cabecera de acuario.
- Subida de imagenes compartida.

## Modulos de negocio

- `src/aquariums/aquariums.js`: dashboard, acuarios y rutas internas del acuario.
- `src/library/library.js`: biblioteca y fichas.
- `src/animals/animals.js`: animales.
- `src/map/map.js`: mapa IA y 3D.
- `src/photos/photos.js`: fotos.
- `src/inventory/inventory.js`: inventario.
- `src/ai/ai.js`: motor IA y avisos sugeridos.
- `src/parameters/parameters.js`: parametros.
- `src/tasks/tasks.js`: tareas y avisos.
- `src/auth/auth.js`: auth y arranque.

## Eliminados de `main`

Estos archivos/carpetas no forman parte de la app publicada y se eliminaron para evitar confusion:

- `parameters-ui.js`
- `photo-ai.js`
- `aquarium-map.js`
- `measurement-schema.js`
- `measurement-ai.js`
- `measurement-engine.js`
- `acuarionexo-api.js`
- `api/measurement-alerts.js`
- `nav-sections-fix.js`
- `reef_mixto_parametros_v1.json`
- `assets/fondos/fondo-ficha-oficial.svg`
- `mobile-wrapper/`

## Documentacion de control

- `ARCHIVOS_ACTIVOS.txt`
- `ARBOL_MAESTRO.md`
- `REGLAS_DE_CAMBIO.md`
- `CHECKLIST_ANTES_DE_EDITAR.md`
- `MAPA_ARCHIVOS.md`
- `README.md`

## Validacion

- `package.json`: comando `npm run check`.
- `scripts/validate-app.mjs`: comprueba referencias de `index.html`, build, sintaxis JS y orden de carga.

## Nota de estabilidad 19/06/2026

- `src/library/library.js` no debe cargar automaticamente Biblioteca con busqueda vacia.
- `src/library/library.js` debe leer solo `library_entries` como almacen final de Biblioteca.
- `src/library/library.js` no debe llamar a `library_entries_catalog` ni consultar `fichas_creator`.
- `src/aquariums/aquariums.js` mantiene Dashboard en modo seguro sin conteos exactos automaticos.
