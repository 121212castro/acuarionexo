# ARBOL MAESTRO ACUARIONEXO

Fuente de verdad: GitHub `main`.

App web publicada: `https://121212castro.github.io/acuarionexo/`.

App movil: Capacitor.

Datos y autenticacion: Supabase.

Build actual: `phase2-parameters-fallback-20260704-1440`.

## Entrada real web

Carga activa directa desde `index.html`:

- `styles.css`
- `aquarium-map.css`
- `login-reef.css`
- `aquarium-cards.css`
- `aquariums-mobile-fix.css`
- `mobile-form-fix.css`
- `library-images.css`
- `library-mobile-overflow-fix.css`
- `notifications.css`
- Supabase CDN
- Three.js CDN
- Firebase CDN
- `config.js`
- `app.js`
- `src/aquariums/aquariums.js`
- `src/library/core/library-schema.js`
- `src/library/ui/library.js`
- `src/library/inventory/library-inventory-import.js`
- `src/library/library-v3.js`
- `src/library/ficha/ficha-chat-import.js`
- `src/animals/animals.js`
- `src/map/map-v3-model.js`
- `src/map/map-state.js`
- `src/map/map-ui.js`
- `src/map/map-photos.js`
- `src/map/map-markers.js`
- `src/map/map-render-3d.js`
- `src/map/map-save.js`
- `src/map/map.js`
- `src/map/map-interactions.js`
- `src/photos/photos.js`
- `src/inventory/inventory-core.js`
- `src/inventory/inventory-list.js`
- `src/inventory/inventory.js`
- `src/inventory/inventory-ui.js`
- `src/microfauna/microfauna.js`
- `src/ai/ai.js`
- `src/ai/ai-library-v3.js`
- `src/ai/ai-alerts-extra.js`
- `src/parameters/parameters.js`
- `src/parameters/measurements-advanced.js`
- `src/parameters/parameters-ai-fallback.js`
- `src/tasks/tasks.js`
- `src/admin/admin.js`
- `src/auth/auth.js`
- `update-manager.js`
- `notifications.js`

Carga activa indirecta:

- `src/library/ficha/ficha-json.js`: cargado por `src/library/ui/library.js`.
- `src/admin/admin-extra.js`: cargado por `src/admin/admin.js`.
- `src/admin/report-issue.js`: cargado por `src/admin/admin.js`.
- `src/admin/issue-entry.js`: cargado por `src/admin/admin.js`.
- `src/parameters/parameters-extra-fields.js`: cargado por `src/parameters/parameters-ai-fallback.js`.

## Navegacion principal

- Inicio
- Acuarios
- Biblioteca
- Microfauna
- Avisos
- Inventario
- Admin solo con rol activo

La barra inferior movil se ajusta desde `library-mobile-overflow-fix.css` para admitir 7 botones.

## Reportes de fallos

- `src/admin/report-issue.js`: formulario para que usuarios con sesion reporten fallos.
- `src/admin/issue-entry.js`: acceso visible a Incidencia en Inicio > Modulos.
- Guarda en `admin_reports`.
- Admin revisa desde Fallos.

## Admin restringido

- `src/admin/admin.js`: panel Admin base.
- `src/admin/admin-extra.js`: usuarios, alta de Admin, reportes y historial por persona.
- `supabase/migrations/20260702_admin_roles.sql`: roles restringidos.
- `supabase/migrations/20260702_admin_tools_foundation.sql`: reportes, historial y funciones RPC.

Admin ya esta activo para propietario.

## Acuarios estado actual

- `src/aquariums/aquariums.js`: carga, lista y seleccion de acuarios.
- `loadAquariums()` queda expuesto en `window.ANX.loadAquariums` para que Microfauna e IA puedan cargar acuarios desde su propio modulo.

## Microfauna

`src/microfauna/microfauna.js` es modulo principal visible y usa `window.ANX.loadAquariums` para rellenar opciones de acuario cuando falta estado cargado.

## Biblioteca/Fichas estado actual

- `src/library/core/library-schema.js`: contrato oficial reforzado.
- `src/library/ui/library.js`: marcador UI y carga diferida de ficha JSON.
- `src/library/inventory/library-inventory-import.js`: importacion a inventario.
- `src/library/library-v3.js`: dueño real de Biblioteca/Fichas.
- `src/library/ficha/ficha-chat-import.js`: creacion desde texto pegado.
- `src/library/ficha/ficha-json.js`: JSON estructurado para fichas pegadas desde Chat.

## Inventario estado actual

- `src/inventory/inventory-core.js`: categorias, etiquetas de ficha importada, metadatos, portada, caducidad y relacion con acuario.
- `src/inventory/inventory-list.js`: agrupacion, tarjetas/listado e HTML de ficha tecnica importada.
- `src/inventory/inventory.js`: pantalla, formulario, detalle, edicion, guardado y borrado.
- `src/inventory/inventory-ui.js`: textos y aviso visual de Inventario dentro del dominio de Inventario.

## Mapa estado actual

- `src/map/map-v3-model.js`: contrato/modelo de mapa V3.
- `src/map/map-state.js`: estado, normalizacion, lectura, fotos normalizadas y seleccion de marcadores.
- `src/map/map-ui.js`: helpers HTML del panel, escenario, lista y editor del mapa.
- `src/map/map-photos.js`: preview y guardado de fotos del mapa.
- `src/map/map-markers.js`: colocar, seleccionar, actualizar, crear y borrar marcadores.
- `src/map/map-render-3d.js`: motor Three.js del gemelo 3D.
- `src/map/map-save.js`: guardado del mapa en `aquariums.ai_summary`.
- `src/map/map.js`: coordinador reducido de entrada y render de pantalla.
- `src/map/map-interactions.js`: interaccion de colocacion de puntos 3D, movida fuera de `notifications.js`.

## IA estado actual

- `src/ai/ai.js`: modulo IA estable activo. Contiene revision de mediciones, quimica, inventario, microfauna, creacion de avisos y UI.
- `src/ai/ai-library-v3.js`: integracion IA con Biblioteca V3.
- `src/ai/ai-alerts-extra.js`: revision extra de avisos IA.
- `src/ai/ai-constants.js`, `src/ai/ai-measurements.js` y `src/ai/ai-chemistry.js`: archivos creados durante refactor, no activos tras restaurar IA estable.

## Parametros estado actual

- `src/parameters/parameters.js`: pantalla principal y alertas de parametros.
- `src/parameters/measurements-advanced.js`: mediciones avanzadas por perfil.
- `src/parameters/parameters-ai-fallback.js`: fallback visual de IA de parametros, movido fuera de `notifications.js`; carga el modulo extra de parametros.
- `src/parameters/parameters-extra-fields.js`: añade NO2, Cobre y Silicato al plan marino, al formulario mensual y al guardado de mediciones.

## Notificaciones estado actual

- `notifications.js`: notificaciones, Firebase y avisos de tareas.
- `notifications.css`: estilos antes inyectados desde `notifications.js`, ahora cargados como CSS real.

## Movil

- `scripts/prepare-mobile-bundle.mjs` copia los archivos activos a `www/`.
- `www/`, `android/` e `ios/` son generados y no se editan a mano.
- Si se añade un archivo activo en `index.html`, debe añadirse tambien a `scripts/prepare-mobile-bundle.mjs`.