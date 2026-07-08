# MAPA DE ARCHIVOS

## Build actual

Build unificado: `library-ficha-clean-20260708-0325`.

Debe coincidir en:

- `window.ACUARIONEXO_BUILD` dentro de `index.html`.
- `app-version.json`.
- `manifest.webmanifest` en `start_url`.
- Documentacion de control.

## Activos web en produccion

Archivos cargados directa o dinámicamente por la app publicada:

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
- `library-clean.css`
- `inventory-accordion.css`
- `notifications.css`
- Supabase CDN
- Three.js CDN
- Firebase CDN
- `src/aquariums/aquariums-core.js`
- `src/aquariums/aquariums-form.js`
- `src/aquariums/aquariums-save.js`
- `src/aquariums/aquariums.js`
- `src/core/module-loader.js`
- `src/library/core/library-schema.js`
- `src/library/core/library-schema-rules.js`
- `src/library/ui/library.js`
- `src/library/inventory/library-inventory-import.js`
- `src/library/library-v3-core.js`
- `src/library/library-v3-template.js`
- `src/library/library-v3-images.js`
- `src/library/library-v3-ai.js`
- `src/library/library-v3-ficha.js`
- `src/library/ficha/ficha-actions.js`
- `src/library/library-v3.js`
- `src/library/ficha/ficha-type-tools.js`
- `src/library/ficha/ficha-chat-import.js`
- `src/library/core/library-admin-policy.js`
- `src/animals/animals-core.js`
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
- `src/photos/photos-core.js`
- `src/photos/photos-form.js`
- `src/photos/photos-save.js`
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

## Biblioteca / Fichas

- `src/library/core/library-schema.js`: contrato oficial reforzado de plantillas y auditoria.
- `src/library/core/library-schema-rules.js`: reglas de validacion de campos obligatorios.
- `src/library/ui/library.js`: entrada UI y carga diferida de ficha JSON.
- `src/library/inventory/library-inventory-import.js`: importacion de fichas completas al acuario o a producto compartido. Textos visibles: “Añadir al acuario”, “Guardar en acuario”, “Añadir producto desde Biblioteca”.
- `src/library/library-v3-core.js`: tipos, filtros, carga de fichas, tarjetas, listado y entrada Biblioteca.
- `src/library/library-v3-template.js`: generación y copiado de apartados para Chat.
- `src/library/library-v3-images.js`: panel oficial de dos imágenes de ficha: `cover_url` = Foto portada y `photo_url` = Foto al abrir ficha.
- `src/library/library-v3-ai.js`: identificar, generar borrador y llamadas IA de Biblioteca.
- `src/library/library-v3-ficha.js`: formulario de ficha, pegado desde Chat, guardado, auditoria, publicación y borrado.
- `src/library/ficha/ficha-actions.js`: vista activa de ficha y botones de accion. En vista solo renderiza una imagen principal: `photo_url`; si no existe, no duplica la portada.
- `src/library/library-v3.js`: coordinador reducido de Biblioteca V3.
- `src/library/ficha/ficha-type-tools.js`: herramientas auxiliares de tipo de ficha.
- `src/library/ficha/ficha-chat-import.js`: creacion desde texto pegado.
- `src/library/ficha/ficha-json.js`: JSON estructurado para fichas pegadas desde Chat.
- `src/library/core/library-admin-policy.js`: politica visible de biblioteca/admin.

## Archivos eliminados en limpieza

Estos parches fueron retirados y no deben volver a cargarse:

- `src/library/ficha/ficha-display-hotfix.js`
- `src/library/ficha/ficha-display-hotfix-2.js`
- `src/library/ficha/ficha-display-hotfix-3.js`
- `src/library/ficha/ficha-ui-text-patch.js`
- `src/library/ficha/ficha-cover-style.css`

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

## Inventario

- `src/inventory/inventory-core.js`: categorias, etiquetas de ficha importada, metadatos, portada, caducidad y relacion con acuario.
- `src/inventory/inventory-list.js`: agrupacion, tarjetas/listado e HTML de ficha tecnica importada.
- `src/inventory/inventory-form.js`: formularios de alta/edicion y guardado de inventario.
- `src/inventory/inventory.js`: pantalla principal, detalle y borrado.
- `src/inventory/inventory-ui.js`: textos y aviso visual de Inventario dentro del dominio de Inventario.

## Movil

- `scripts/prepare-mobile-bundle.mjs` copia la app web activa a `www/`.
- Si se añade un archivo activo a `index.html` o `src/core/module-loader.js`, debe añadirse tambien a `scripts/prepare-mobile-bundle.mjs` cuando proceda.

## No editar a mano

- `www/`
- `android/`
- `ios/`
- `node_modules/`
