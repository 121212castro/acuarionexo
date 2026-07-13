# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

## Build actual

`ficha-scientific-identity-20260713-1605`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Archivos activos

- `app.js`
- `aquarium-cards.css`
- `aquarium-map.css`
- `aquariums-mobile-fix.css`
- `config.js`
- `inventory-accordion.css`
- `library-clean.css`
- `library-images.css`
- `library-mobile-overflow-fix.css`
- `login-reef.css`
- `mobile-form-fix.css`
- `notifications.css`
- `notifications.js`
- `src/admin/admin-core.js`
- `src/admin/admin.js`
- `src/ai/ai-alerts-extra.js`
- `src/ai/ai-library-v3.js`
- `src/ai/ai.js`
- `src/animals/animals-core.js`
- `src/animals/animals.js`
- `src/aquariums/aquariums-core.js`
- `src/aquariums/aquariums-form.js`
- `src/aquariums/aquariums-save.js`
- `src/aquariums/aquariums.js`
- `src/auth/auth-core.js`
- `src/auth/auth.js`
- `src/core/module-loader.js`
- `src/inventory/inventory-core.js`
- `src/inventory/inventory-form.js`
- `src/inventory/inventory-list.js`
- `src/inventory/inventory-ui.js`
- `src/inventory/inventory.js`
- `src/library/core/library-admin-policy.js`
- `src/library/core/library-schema-rules.js`
- `src/library/core/library-schema.js`
- `src/library/ficha/ficha-actions.js`
- `src/library/ficha/ficha-chat-import.js`
- `src/library/ficha/ficha-json.js`
- `src/library/ficha/ficha-type-tools.js`
- `src/library/inventory/library-inventory-import.js`
- `src/library/library-v3-ai.js`
- `src/library/library-v3-core.js`
- `src/library/library-v3-ficha.js`
- `src/library/library-v3-images.js`
- `src/library/library-v3-template.js`
- `src/library/library-v3.js`
- `src/library/ui/library.js`
- `src/map/map-interactions.js`
- `src/map/map-markers.js`
- `src/map/map-photos.js`
- `src/map/map-render-3d.js`
- `src/map/map-save.js`
- `src/map/map-state.js`
- `src/map/map-ui.js`
- `src/map/map-v3-model.js`
- `src/map/map.js`
- `src/microfauna/microfauna-core.js`
- `src/microfauna/microfauna-form.js`
- `src/microfauna/microfauna-save.js`
- `src/microfauna/microfauna.js`
- `src/parameters/measurements-advanced.js`
- `src/parameters/parameters-ai-fallback.js`
- `src/parameters/parameters-alert-helpers.js`
- `src/parameters/parameters-core.js`
- `src/parameters/parameters-manual.js`
- `src/parameters/parameters.js`
- `src/photos/photos-core.js`
- `src/photos/photos-form.js`
- `src/photos/photos-save.js`
- `src/photos/photos.js`
- `src/tasks/tasks-core.js`
- `src/tasks/tasks-form.js`
- `src/tasks/tasks.js`
- `styles.css`
- `update-manager.js`

## Biblioteca / Fichas

- `src/library/library-v3-core.js`: carga, filtros, tarjetas y listado de Biblioteca.
- `src/library/library-v3-images.js`: único responsable del editor de las dos imágenes: `cover_url` y `photo_url`.
- `src/library/library-v3-ficha.js`: formulario, guardado, auditoría, publicación y borrado.
- `src/library/ficha/ficha-actions.js`: único responsable de la vista abierta. Muestra portada, foto al abrir, información estructurada, fuentes y botones Editar, Añadir a mi acuario, Publicar y Borrar.
- `src/library/inventory/library-inventory-import.js`: importación de la ficha al acuario o inventario general según el tipo.
- No se permiten archivos `hotfix`, `patch` o `clean` que redefinan la vista o las imágenes de ficha.

## Flujo móvil común

`Código fuente`
→ validación web
→ preparación y validación del paquete móvil
→ generación del proyecto nativo desde las fuentes reales
→ compilación
→ instalación
→ ejecución
→ auditoría
→ resultados y evidencias publicados como artefactos

- Los workflows móviles no escriben resultados ni documentación en `main`.
- Los archivos de estado se generan dentro de cada job y se incluyen en su artefacto de auditoría.
- `www/`, `android/`, `ios/` y `node_modules/` son salidas generadas o dependencias y no se editan manualmente.

## Android

- Workflow: `.github/workflows/build-android-apk.yml`.
- Auditoría real: `scripts/android-emulator-audit.sh`.
- El workflow valida la aplicación web y el paquete móvil antes de generar Android.
- El proyecto Android y sus recursos oficiales se generan desde las fuentes reales.
- La APK se compila, instala y abre en el emulador.
- La auditoría comprueba proceso, actividad visible, captura, instalación y `logcat`.
- La APK se publica en la release `android-test-latest` únicamente cuando toda la validación termina correctamente.
- `android-build-status.json` se genera dentro del job y se incluye en el artefacto `AcuarioNexo-Android-Audit`.
- El workflow no realiza `git commit` ni `git push` y no escribe el resultado en `main`.

### Criterio obligatorio de cierre Android

Android solo puede declararse terminado cuando, en una misma ejecución:

1. la aplicación web y el paquete móvil pasan;
2. el proyecto Android y los recursos oficiales se generan;
3. la APK compila y se instala en el emulador;
4. el proceso de `com.acuarionexo.app` permanece activo;
5. `MainActivity` queda visible;
6. se generan captura y `logcat`;
7. no existe `FATAL EXCEPTION`, ANR ni cierre del proceso;
8. la release `android-test-latest` publica la APK;
9. el artefacto `AcuarioNexo-Android-Audit` contiene el estado y las evidencias.

No se acepta como cierre una ejecución iniciada, una compilación aislada ni una APK generada sin instalación y arranque comprobados.

## iOS

- Workflow: `.github/workflows/build-ios-simulator.yml`.
- Auditoría real: `scripts/ios-simulator-audit.sh`.
- El workflow valida la aplicación web y el paquete móvil antes de generar iOS.
- El proyecto iOS y sus recursos oficiales se generan desde las fuentes reales.
- La aplicación se compila sin firma para iPhone Simulator.
- La aplicación se instala y abre en el simulador.
- La auditoría comprueba la instalación, el lanzamiento, el contenedor, la captura y la consola.
- `ios-build-status.json` se genera dentro del job y se incluye en el artefacto `AcuarioNexo-iOS-Simulator-Audit`.
- El artefacto incluye también la aplicación de simulador empaquetada y las evidencias de ejecución.
- El workflow no realiza `git commit` ni `git push` y no escribe el resultado en `main`.
- Esta validación acredita ejecución en simulador; no acredita firma para dispositivo ni disponibilidad en TestFlight.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, módulos, responsabilidades, build o los sistemas Android e iOS.
- `npm run check` y `npm run mobile:prepare` regeneran estos documentos antes de continuar.
- Los resultados de las validaciones móviles se consultan en los artefactos del run correspondiente, no en archivos persistentes de `main`.
- Comprobar siempre los dos documentos generados después de actualizar el generador.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
