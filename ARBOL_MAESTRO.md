# ARBOL MAESTRO ACUARIONEXO

Fuente de verdad: GitHub `main`.

App web publicada: `https://121212castro.github.io/acuarionexo/`.

App movil: Capacitor.

Datos y autenticacion: Supabase.

Build actual: `phase2-parameters-fallback-20260704-1440`.

## Entrada real web

Carga activa directa desde `index.html`:

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
- `src/inventory/inventory-form.js`
- `src/inventory/inventory.js`
- `src/inventory/inventory-ui.js`
- `src/microfauna/microfauna-core.js`
- `src/microfauna/microfauna-form.js`
- `src/microfauna/microfauna-save.js`
- `src/microfauna/microfauna.js`
- `src/ai/ai.js`
- `src/ai/ai-library-v3.js`
- `src/ai/ai-alerts-extra.js`
- `src/parameters/parameters-core.js`
- `src/parameters/parameters-alert-helpers.js`
- `src/parameters/parameters-manual.js`
- `src/parameters/parameters.js`
- `src/parameters/measurements-advanced.js`
- `src/parameters/parameters-ai-fallback.js`
- `src/tasks/tasks-core.js`
- `src/tasks/tasks-form.js`
- `src/tasks/tasks.js`
- `src/admin/admin-core.js`
- `src/admin/admin.js`
- `src/auth/auth-core.js`
- `src/auth/auth.js`
- `update-manager.js`
- `notifications.js`

## Carga activa indirecta

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

## Acuarios

- `src/aquariums/aquariums.js`: carga, lista y seleccion de acuarios.
- `loadAquariums()` queda expuesto en `window.ANX.loadAquariums`.

## Biblioteca/Fichas

- `src/library/core/library-schema.js`: contrato oficial reforzado.
- `src/library/ui/library.js`: marcador UI y carga diferida de ficha JSON.
- `src/library/inventory/library-inventory-import.js`: importacion a inventario.
- `src/library/library-v3.js`: dueño real de Biblioteca/Fichas.
- `src/library/ficha/ficha-chat-import.js`: creacion desde texto pegado.
- `src/library/ficha/ficha-json.js`: JSON estructurado para fichas pegadas desde Chat.

## Inventario

- `src/inventory/inventory-core.js`: categorias, etiquetas de ficha importada, metadatos, portada, caducidad y relacion con acuario.
- `src/inventory/inventory-list.js`: agrupacion, tarjetas/listado e HTML de ficha tecnica importada.
- `src/inventory/inventory-form.js`: formularios de alta/edicion y guardado de inventario.
- `src/inventory/inventory.js`: pantalla principal, detalle y borrado.
- `src/inventory/inventory-ui.js`: textos y aviso visual de Inventario.

## Microfauna

- `src/microfauna/microfauna-core.js`: perfiles, fechas, estados, opciones, cultivo por defecto, tarjetas y resumen.
- `src/microfauna/microfauna-form.js`: formulario visual de alta y edicion de cultivos.
- `src/microfauna/microfauna-save.js`: lectura del formulario y guardado de cultivos.
- `src/microfauna/microfauna.js`: pantalla, acciones rapidas y consultas Supabase.

## Mapa

- `src/map/map-v3-model.js`: contrato/modelo de mapa V3.
- `src/map/map-state.js`: estado, normalizacion, lectura, fotos normalizadas y seleccion de marcadores.
- `src/map/map-ui.js`: helpers HTML del panel, escenario, lista y editor del mapa.
- `src/map/map-photos.js`: preview y guardado de fotos del mapa.
- `src/map/map-markers.js`: colocar, seleccionar, actualizar, crear y borrar marcadores.
- `src/map/map-render-3d.js`: motor Three.js del gemelo 3D.
- `src/map/map-save.js`: guardado del mapa en `aquariums.ai_summary`.
- `src/map/map.js`: coordinador reducido de entrada y render de pantalla.
- `src/map/map-interactions.js`: interaccion de colocacion de puntos 3D.

## IA

- `src/ai/ai.js`: modulo IA estable activo.
- `src/ai/ai-library-v3.js`: integracion IA con Biblioteca V3.
- `src/ai/ai-alerts-extra.js`: revision extra de avisos IA.
- `src/ai/ai-constants.js`, `src/ai/ai-measurements.js` y `src/ai/ai-chemistry.js`: creados durante refactor IA, no activos.

## Parametros

- `src/parameters/parameters-core.js`: helpers visuales, ultimas mediciones, estado visual, ciclos e historial.
- `src/parameters/parameters-alert-helpers.js`: helpers de notas y notificacion local para alertas de parametros.
- `src/parameters/parameters-manual.js`: registro manual puntual de parametros.
- `src/parameters/parameters.js`: pantalla principal, analisis IA y alertas de parametros.
- `src/parameters/measurements-advanced.js`: mediciones avanzadas por perfil.
- `src/parameters/parameters-ai-fallback.js`: fallback visual de IA de parametros.
- `src/parameters/parameters-extra-fields.js`: NO2, Cobre y Silicato para plan marino, formulario mensual y guardado.

## Tareas / Avisos

- `src/tasks/tasks-core.js`: limpieza de textos, metadatos, rutas, repeticion, tarjetas y agrupacion de avisos.
- `src/tasks/tasks-form.js`: formulario visual para crear tareas de acuario; el guardado sigue en `src/tasks/tasks.js`.
- `src/tasks/tasks.js`: pantalla de tareas, guardado, detalle, repeticion, completar avisos y consultas Supabase.

## Admin y reportes

- `src/admin/admin-core.js`: roles, permisos, carga de rol, conteos y bloqueo de acceso.
- `src/admin/admin.js`: panel Admin base y Consumo IA.
- `src/admin/admin-extra.js`: usuarios, alta de Admin, reportes y historial por persona.
- `src/admin/report-issue.js`: reportes de fallos.
- `src/admin/issue-entry.js`: acceso visible a Incidencia.

## Autenticacion

- `src/auth/auth-core.js`: mensajes de Auth, timeout, refresco seguro de Admin, limpieza de estado y cabecera de sesion.
- `src/auth/auth.js`: login, alta, recuperacion de contraseña, inicio/cierre de sesion y arranque inicial.

## Notificaciones

- `notifications.js`: notificaciones, Firebase y avisos de tareas.
- `notifications.css`: estilos de notificaciones.

## Movil

- `scripts/prepare-mobile-bundle.mjs` copia los archivos activos a `www/`.
- `www/`, `android/` e `ios/` son generados y no se editan a mano.

## No editar a mano

- `www/`
- `android/`
- `ios/`
- `node_modules/`