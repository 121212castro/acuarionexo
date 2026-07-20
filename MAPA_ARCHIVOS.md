# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

## Build actual

`library-add-aquarium-20260721-0005`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Entrada web activa

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

## Módulos bajo demanda

La lista oficial se obtiene exclusivamente de `src/core/module-loader.js`.

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
