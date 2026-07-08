# ARBOL MAESTRO ACUARIONEXO

Fuente de verdad: GitHub `main`.

App web publicada: `https://121212castro.github.io/acuarionexo/`.

App movil: Capacitor.

Datos y autenticacion: Supabase.

Build actual: `library-ficha-clean-20260708-0325`.

## Entrada real web

Carga activa directa desde `index.html`:

- `config.js`
- `app.js`
- `src/aquariums/aquariums-core.js`
- `src/aquariums/aquariums-form.js`
- `src/aquariums/aquariums-save.js`
- `src/aquariums/aquariums.js`
- `src/admin/admin-core.js`
- `src/core/module-loader.js`
- `src/auth/auth-core.js`
- `src/auth/auth.js`
- `update-manager.js`
- `notifications.js`

## Carga activa por `src/core/module-loader.js`

### Biblioteca

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

### Mapa

- `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`
- `src/map/map-v3-model.js`
- `src/map/map-state.js`
- `src/map/map-ui.js`
- `src/map/map-photos.js`
- `src/map/map-markers.js`
- `src/map/map-render-3d.js`
- `src/map/map-save.js`
- `src/map/map.js`
- `src/map/map-interactions.js`

### Resto de modulos

- `src/animals/animals-core.js`
- `src/animals/animals.js`
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
- `src/admin/admin.js`

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

## Biblioteca/Fichas

- `src/library/core/library-schema.js`: contrato oficial reforzado.
- `src/library/core/library-schema-rules.js`: reglas de validacion.
- `src/library/ui/library.js`: marcador UI y carga diferida de ficha JSON.
- `src/library/inventory/library-inventory-import.js`: crea registros desde Biblioteca. Para seres vivos/equipos el flujo visible es “Añadir al acuario” y “Guardar en acuario”. Para productos el flujo visible es “Añadir producto desde Biblioteca”.
- `src/library/library-v3-core.js`: carga de fichas, filtros, tarjetas, listado y estado base.
- `src/library/library-v3-template.js`: plantillas y copiado de apartados para Chat.
- `src/library/library-v3-images.js`: controla exactamente dos imágenes editables: `cover_url` como Foto portada y `photo_url` como Foto al abrir ficha.
- `src/library/library-v3-ai.js`: identificación, borrador IA y llamadas de edge functions de Biblioteca.
- `src/library/library-v3-ficha.js`: editor de ficha, pegado desde Chat, guardado, auditoria, publicación y borrado.
- `src/library/ficha/ficha-actions.js`: vista activa de ficha y botones de accion; muestra una sola imagen principal en la vista (`photo_url`) y no duplica la portada.
- `src/library/library-v3.js`: coordinador reducido de Biblioteca V3.
- `src/library/ficha/ficha-type-tools.js`: herramientas auxiliares por tipo.
- `src/library/ficha/ficha-chat-import.js`: creacion desde texto pegado.
- `src/library/ficha/ficha-json.js`: JSON estructurado para fichas pegadas desde Chat.
- `src/library/core/library-admin-policy.js`: politica visible de biblioteca/admin.

## Limpieza realizada

Retirados los archivos de parche/hotfix que no forman parte del arbol activo:

- `src/library/ficha/ficha-display-hotfix.js`
- `src/library/ficha/ficha-display-hotfix-2.js`
- `src/library/ficha/ficha-display-hotfix-3.js`
- `src/library/ficha/ficha-ui-text-patch.js`
- `src/library/ficha/ficha-cover-style.css`

## Acuarios

- `src/aquariums/aquariums-core.js`: carga acuarios, portadas, tarjetas y helpers visuales.
- `src/aquariums/aquariums-form.js`: formulario, calculos de litros y payload.
- `src/aquariums/aquariums-save.js`: alta y edicion de acuarios.
- `src/aquariums/aquariums.js`: dashboard, lista, resumen, borrado y rutas internas.
- `loadAquariums()` queda expuesto en `window.ANX.loadAquariums`.

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
- `src/inventory/inventory-ui.js`: textos y aviso visual de Inventario.

## Movil

- `scripts/prepare-mobile-bundle.mjs` copia los archivos activos a `www/`.
- `www/`, `android/` e `ios/` son generados y no se editan a mano.

## No editar a mano

- `www/`
- `android/`
- `ios/`
- `node_modules/`
