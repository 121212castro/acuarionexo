# MAPA DE ARCHIVOS

## Build actual

Build unificado: `phase2-parameters-fallback-20260704-1440`.

Debe coincidir en:

- `window.ACUARIONEXO_BUILD` dentro de `index.html`.
- `app-version.json`.
- `manifest.webmanifest` en `start_url`.
- Documentacion de control.

## Activos web en produccion

Estos archivos son cargados por `index.html` o forman parte directa de la app publicada:

- `index.html`
- `app.js`
- `config.js`
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
- `app-version.json`
- `manifest.webmanifest`
- `firebase-messaging-sw.js`
- `icon-512.png`

## Activos indirectos

- `src/library/ficha/ficha-json.js`: cargado dinamicamente por `src/library/ui/library.js`.
- `src/admin/admin-extra.js`: cargado dinamicamente por `src/admin/admin.js`.
- `src/admin/report-issue.js`: cargado dinamicamente por `src/admin/admin.js`.
- `src/admin/issue-entry.js`: cargado dinamicamente por `src/admin/admin.js`.
- `src/parameters/parameters-extra-fields.js`: cargado dinamicamente por `src/parameters/parameters-ai-fallback.js`.

## Candidato a integrar o retirar despues

- `src/library/ficha/ficha-template-strict.js`: no aparece en la carga activa actual; no borrar sin decidir antes si se integra en el flujo oficial de `ficha-json.js`.
- `src/ai/ai-constants.js`: creado durante refactor IA, no activo tras restaurar IA estable.
- `src/ai/ai-measurements.js`: creado durante refactor IA, no activo tras restaurar IA estable.
- `src/ai/ai-chemistry.js`: creado durante refactor IA, no activo tras restaurar IA estable.

## Admin restringido

- `src/admin/admin-core.js`: roles, permisos, carga de rol, conteos y bloqueo de acceso.
- `src/admin/admin.js`: panel Admin base y Consumo IA.
- `src/admin/admin-extra.js`: usuarios, alta de Admin, reportes e historial por persona.
- `src/admin/report-issue.js`: formulario de reportes a `admin_reports`.
- `src/admin/issue-entry.js`: acceso visible a Incidencia dentro de Inicio > Modulos.

## Autenticacion

- `src/auth/auth-core.js`: mensajes de Auth, timeout, refresco seguro de Admin, limpieza de estado y cabecera de sesion.
- `src/auth/auth.js`: login, alta, recuperacion de contraseña, inicio/cierre de sesion y arranque inicial.

## Inventario

- `src/inventory/inventory-core.js`: categorias, etiquetas de ficha importada, metadatos, portada, caducidad y relacion con acuario.
- `src/inventory/inventory-list.js`: agrupacion, tarjetas/listado e HTML de ficha tecnica importada.
- `src/inventory/inventory-form.js`: formularios de alta/edicion y guardado de inventario.
- `src/inventory/inventory.js`: pantalla principal, detalle y borrado.
- `src/inventory/inventory-ui.js`: textos y aviso visual de Inventario dentro del dominio de Inventario.

## Mapa

- `src/map/map-v3-model.js`: contrato/modelo de mapa V3.
- `src/map/map-state.js`: estado, normalizacion, lectura, fotos normalizadas y seleccion de marcadores.
- `src/map/map-ui.js`: helpers HTML del panel, escenario, lista y editor del mapa.
- `src/map/map-photos.js`: preview y guardado de fotos del mapa.
- `src/map/map-markers.js`: colocar, seleccionar, actualizar, crear y borrar marcadores.
- `src/map/map-render-3d.js`: motor Three.js del gemelo 3D.
- `src/map/map-save.js`: guardado del mapa en `aquariums.ai_summary`.
- `src/map/map.js`: coordinador reducido de entrada y render de pantalla.
- `src/map/map-interactions.js`: interaccion de colocacion de puntos 3D, movida fuera de `notifications.js`.

## IA

- `src/ai/ai.js`: modulo IA estable activo. Contiene revision de mediciones, quimica, inventario, microfauna, creacion de avisos y UI.
- `src/ai/ai-library-v3.js`: integracion IA con Biblioteca V3.
- `src/ai/ai-alerts-extra.js`: revision extra de avisos IA.

## Parametros

- `src/parameters/parameters-core.js`: helpers visuales, ultimas mediciones, estado visual, ciclos e historial.
- `src/parameters/parameters-alert-helpers.js`: helpers de notas y notificacion local para alertas de parametros.
- `src/parameters/parameters-manual.js`: registro manual puntual de parametros.
- `src/parameters/parameters.js`: pantalla principal, analisis IA y alertas de parametros.
- `src/parameters/measurements-advanced.js`: mediciones avanzadas por perfil.
- `src/parameters/parameters-ai-fallback.js`: fallback visual de IA de parametros, movido fuera de `notifications.js`; carga `src/parameters/parameters-extra-fields.js`.
- `src/parameters/parameters-extra-fields.js`: añade NO2, Cobre y Silicato al plan marino, al formulario mensual y al guardado de mediciones.

## Tareas / Avisos

- `src/tasks/tasks-core.js`: limpieza de textos, metadatos, rutas, repeticion, tarjetas y agrupacion de avisos.
- `src/tasks/tasks-form.js`: formulario visual para crear tareas de acuario; el guardado sigue en `src/tasks/tasks.js`.
- `src/tasks/tasks.js`: pantalla de tareas, guardado, detalle, repeticion, completar avisos y consultas Supabase.

## Notificaciones

- `notifications.js`: notificaciones, Firebase y avisos de tareas.
- `notifications.css`: estilos antes inyectados desde `notifications.js`, ahora cargados como CSS real.

## Movil

- `scripts/prepare-mobile-bundle.mjs` copia la app web activa a `www/`.
- Si se añade un archivo activo a `index.html`, debe añadirse tambien a `scripts/prepare-mobile-bundle.mjs`.

No editar a mano:

- `www/`
- `android/`
- `ios/`
- `node_modules/`