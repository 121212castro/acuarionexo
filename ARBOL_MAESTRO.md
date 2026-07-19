# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `library-core-20260719-1305`.

## Entrada web

- `icon-512.png`
- `app-version.json`
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
- `manifest.webmanifest`
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

## Biblioteca / Flujo de ficha

`library-v3-core.js`
→ lista y abre una ficha
→ `ficha-actions.js`
→ muestra `cover_url` y `photo_url`
→ muestra datos estructurados y fuentes
→ ofrece Editar / Añadir a mi acuario / Publicar / Borrar

`library-v3-ficha.js`
→ edición y guardado
→ usa `library-v3-images.js` para las dos imágenes

`library-inventory-import.js`
→ copia la ficha al acuario o al inventario correspondiente

## Propiedad única

- Vista abierta: `src/library/ficha/ficha-actions.js`.
- Editor de imágenes: `src/library/library-v3-images.js`.
- Editor y persistencia de ficha: `src/library/library-v3-ficha.js`.
- Ningún otro archivo puede redefinir `window.verFicha` ni `LibraryV3Images.imageBox`.

## Flujo móvil maestro

`Código fuente`
→ validación web
→ preparación del paquete móvil
→ generación nativa
→ compilación
→ instalación
→ ejecución
→ auditoría
→ artefactos

## Flujo Android

`.github/workflows/build-android-apk.yml`
→ valida web y paquete móvil
→ genera el proyecto Android y los recursos oficiales
→ compila `AcuarioNexo-Android-Test.apk`
→ ejecuta `scripts/android-emulator-audit.sh`
→ instala y abre `MainActivity`
→ comprueba proceso, actividad visible, captura y `logcat`
→ si toda la validación termina correctamente, publica la APK en `android-test-latest`
→ genera `android-build-status.json` dentro del job
→ sube estado y evidencias al artefacto `AcuarioNexo-Android-Audit`
→ no realiza commits automáticos en `main`

## Flujo iOS

`.github/workflows/build-ios-simulator.yml`
→ valida web y paquete móvil
→ genera el proyecto iOS y los recursos oficiales
→ compila `App.app` sin firma para iPhone Simulator
→ ejecuta `scripts/ios-simulator-audit.sh`
→ instala la aplicación en el simulador
→ abre y comprueba la ejecución real
→ genera `ios-build-status.json` dentro del job
→ empaqueta `AcuarioNexo-iOS-Simulator.zip`
→ sube estado, aplicación y evidencias al artefacto `AcuarioNexo-iOS-Simulator-Audit`
→ no realiza commits automáticos en `main`

## Lectura de resultados

Ante un fallo Android:
→ abrir el job exacto
→ descargar `AcuarioNexo-Android-Audit`
→ leer `android-build-status.json` y las evidencias
→ corregir la causa en las fuentes
→ repetir la validación

Ante un fallo iOS:
→ abrir el job exacto
→ descargar `AcuarioNexo-iOS-Simulator-Audit`
→ leer `ios-build-status.json` y las evidencias
→ corregir la causa en las fuentes
→ repetir la validación

## Automatización

- `npm run docs:refresh`: regenera MAPA y ÁRBOL.
- `npm run check`: regenera documentación y valida la aplicación.
- `npm run mobile:prepare`: regenera documentación y prepara `www/` desde los activos reales.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.