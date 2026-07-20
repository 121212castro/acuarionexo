# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `library-add-aquarium-20260721-0005`.

## Entrada web

- `icon-512.png`
- `app-version.json`
- `manifest.webmanifest`
- `styles.css`
- `dashboard.css`
- `aquarium-map.css`
- `login-reef.css`
- `aquarium-cards.css`
- `aquariums-mobile-fix.css`
- `aquarium-form-ux.css`
- `mobile-form-fix.css`
- `library-mobile-overflow-fix.css`
- `library-clean.css`
- `library-images.css`
- `inventory-accordion.css`
- `microfauna-mobile.css`
- `notifications.css`
- `settings.css`
- `support.css`
- `status.css`
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

## Módulos cargados bajo demanda

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
- `src/ai/ai-access.js`
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
- `src/settings/settings.js`
- `src/support/settings-support-link.js`
- `src/status/settings-status-link.js`
- `src/support/support.js`
- `src/status/status-core.js`
- `src/status/status-ui.js`
- `src/status/status.js`

## Biblioteca / flujo maestro

`src/admin/admin.js`
→ abre Biblioteca completa o revisión con `adminReturn: true`
→ `src/library/library-v3-core.js` conserva el contexto y resuelve el retorno
→ `src/library/ficha/ficha-actions.js` abre la vista sin perder el contexto
→ `src/library/library-v3-ficha.js` abre el editor
→ vista y editor regresan al Panel Admin o a Biblioteca según el origen real

`src/library/library-v3-images.js`
→ guarda los archivos originales sin transformaciones destructivas
→ actualiza la ficha por id y confirma la fila modificada
→ `library-images.css` muestra la portada completa sin recortar sus textos

## Biblioteca / añadir a acuario

`src/library/ficha/ficha-actions.js`
→ valida que la ficha pueda importarse y muestra estado visible
→ `src/library/inventory/library-inventory-import.js` resuelve el ámbito y carga los acuarios
→ presenta el formulario de destino
→ inserta la copia en `inventory_items`
→ abre el inventario del acuario seleccionado

## Tareas / flujo maestro

`src/tasks/tasks-form.js`
→ recoge título, fecha, notas y modo de repetición
→ `src/tasks/tasks-core.js` calcula o valida la frecuencia
→ `src/tasks/tasks.js` guarda los metadatos en Supabase
→ al completar la tarea crea la siguiente ocurrencia con el intervalo oficial

## Biblioteca / propietarios únicos

- `src/admin/admin.js`: abre Biblioteca desde Admin conservando `adminReturn: true`.
- `src/library/library-v3-core.js`: listado, filtros, contexto de entrada y retorno central hacia Admin o Biblioteca.
- `src/library/library-v3-images.js`: carga y persistencia administrativa de `cover_url` y `photo_url` por id de ficha.
- `src/library/library-v3-ficha.js`: editor, guardado, auditoría, publicación y borrado.
- `src/library/ficha/ficha-actions.js`: vista abierta; utiliza el retorno central del núcleo.
- `library-images.css`: única autoridad visual; la portada abierta conserva su proporción completa y la foto interior mantiene su marco propio.
- Ningún otro archivo puede redefinir `window.verFicha`, `window.formFicha` o `LibraryV3Images.imageBox`.
- No se permiten archivos `hotfix`, `patch`, wrappers ni copias paralelas que redefinan estas rutas.

## Biblioteca / importación a acuario e inventario

- `src/library/ficha/ficha-actions.js`: única entrada desde la ficha abierta; determina la etiqueta, muestra estado y llama al importador oficial.
- `src/library/inventory/library-inventory-import.js`: única autoridad para resolver destino, cargar acuarios, presentar el formulario y persistir la copia en `inventory_items`.
- Las fichas publicadas, validadas o aprobadas por auditoría pueden iniciar la importación; los errores deben mostrarse en `libraryActionStatus`.
- Flujo: ficha abierta → botón Añadir → resolución de ámbito → selección de acuario → formulario → inserción en Supabase → apertura del inventario de destino.
- No se permiten manejadores paralelos, botones sin estado visible ni archivos `hotfix` o `patch` para este flujo.

## Tareas / arquitectura y repetición

- `src/tasks/tasks-core.js`: única autoridad para opciones, validación y cálculo de repetición; contiene presets, intervalo personalizado de 1 a 365 días y recomendación contextual por IA.
- `src/tasks/tasks-form.js`: formulario de creación; consume los controles oficiales del núcleo y no duplica reglas de frecuencia.
- `src/tasks/tasks.js`: persistencia en Supabase, edición, finalización y creación de la siguiente ocurrencia.
- Metadatos oficiales: `repeat_days`, `repeat_mode`, `repeat_reason` y `route`, almacenados mediante `taskNotesPayload`.
- Flujo: título y acuario → selección manual o recomendación IA → validación → guardado → al marcar Hecho se crea la siguiente tarea.
- La IA propone y justifica; el usuario siempre puede sustituir la propuesta por una frecuencia personalizada.
- No se permiten listas de repetición paralelas, reglas duplicadas ni archivos `hotfix` o `patch` para este flujo.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, módulos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando el cambio afecte a archivos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
