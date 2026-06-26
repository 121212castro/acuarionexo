# ARBOL MAESTRO ACUARIONEXO

Fuente de verdad: GitHub `main`.

App web publicada: `https://121212castro.github.io/acuarionexo/`.

App movil: Capacitor, con archivos internos generados en `www/`.

Datos y autenticacion: Supabase `vqpxhozavfzgtkqscncs`.

Regla base: el checkout local no es entorno de ejecucion ni despliegue. Solo se usa de forma temporal para auditar, preparar y subir cambios a GitHub/Supabase.

## Entrada real web

`index.html` es la unica entrada web publicada por GitHub Pages.

Carga activa:

- `styles.css`
- `aquarium-map.css`
- `login-reef.css`
- `aquarium-cards.css`
- `aquariums-mobile-fix.css`
- `mobile-form-fix.css`
- `library-images.css`
- Supabase CDN
- Firebase CDN
- Three.js CDN r149
- `config.js`
- `app.js`
- `src/aquariums/aquariums.js`
- `src/library/core/library-schema.js`
- `src/library/library.js`
- `src/library/library-v3.js`
- `src/animals/animals.js`
- `src/map/map-v3-model.js`
- `src/map/map.js`
- `src/photos/photos.js`
- `src/inventory/inventory.js`
- `src/microfauna/microfauna.js`
- `src/ai/ai.js`
- `src/ai/ai-library-v3.js`
- `src/ai/ai-alerts-extra.js`
- `src/parameters/parameters.js`
- `src/parameters/measurements-advanced.js`
- `src/tasks/tasks.js`
- `src/auth/auth.js`
- `update-manager.js`
- `notifications.js`

## Entrada real movil

Capacitor usa:

- `capacitor.config.json`
- `webDir`: `www`
- `scripts/prepare-mobile-bundle.mjs`
- `package.json` scripts `mobile:*`

`www/`, `android/` e `ios/` son generados y no se editan a mano.

Android fuera de tienda:

- Workflow: `.github/workflows/android-debug-apk.yml`
- Artefacto: `acuarionexo-debug-apk`

IOS fuera de tienda:

- Requiere firma Apple: Ad Hoc, TestFlight o Apple Developer Program.
- El proyecto iOS se genera con `npm run mobile:add:ios` y se firma desde Xcode o CI con secretos Apple.

## Nucleo funcional

`app.js` es el nucleo coordinador. Contiene configuracion compartida, estado, helpers DOM, render, cabecera de acuario, subida de imagenes y el objeto `window.ANX`.

Las pantallas y reglas de negocio viven en modulos:

- `src/aquariums/aquariums.js`: dashboard, acuarios y panel de acuario.
- `src/library/core/library-schema.js`: contrato oficial de Biblioteca V3/V4; expone `window.ANX.LibrarySchema`.
- `src/library/library.js`: biblioteca, fichas y borradores IA.
- `src/library/library-v3.js`: Biblioteca V3/V4, dependiente de `window.ANX.LibrarySchema`.
- `src/animals/animals.js`: habitantes del acuario.
- `src/map/map.js`: mapa IA, foto base, objetos colocables y render 3D real.
- `src/map/map-v3-model.js`: contrato de datos del gemelo digital.
- `src/photos/photos.js`: galeria y subida de fotos.
- `src/inventory/inventory.js`: inventario general y por acuario.
- `src/microfauna/microfauna.js`: cultivos de microfauna.
- `src/ai/ai.js`: reglas IA, interpretacion de parametros y avisos.
- `src/ai/ai-library-v3.js`: apoyo IA para Biblioteca V3.
- `src/ai/ai-alerts-extra.js`: aportes de revision IA diaria sin pisar la pantalla principal.
- `src/parameters/parameters.js`: pantalla y registro de mediciones.
- `src/parameters/measurements-advanced.js`: medicion completa.
- `src/tasks/tasks.js`: tareas y avisos.
- `src/auth/auth.js`: login, registro, recuperacion y arranque.

`src/auth/auth.js` se carga despues de los demas modulos porque ejecuta `boot()`.

Ningun modulo debe crear una app paralela. Si expone funciones para botones inline, debe hacerlo de forma explicita en `window` y mantener el estado compartido en `window.ANX.state`.

## Arquitectura Biblioteca preparada

Fase 1 creada para refactorizacion modular, sin mover funciones y sin alterar la carga activa de `index.html`:

- `src/library/core/`
- `src/library/inventory/`
- `src/library/images/`
- `src/library/ui/`
- `src/library/ficha/`

Estado activo tras Fase 2:

- `src/library/core/library-schema.js` es el primer modulo movido.
- `src/library/library.js` y `src/library/library-v3.js` siguen cargados desde su ubicacion original.
- `index.html` carga `src/library/core/library-schema.js` antes de `library.js` y `library-v3.js`.
- La ruta antigua `src/library/library-schema.js` ha sido eliminada.
- No se ha movido ningun otro modulo.

Responsabilidades previstas:

- `src/library/core/`: `library-core.js`, `library-db.js`, `library-utils.js`, `library-search.js`, `library-schema.js`.
- `src/library/inventory/`: `inventory-import.js`, `inventory-link.js`, `inventory-validation.js`.
- `src/library/images/`: `image-upload.js`, `image-picker.js`, `image-preview.js`, `image-utils.js`.
- `src/library/ui/`: `library-ui.js`, `library-render.js`, `library-cards.js`, `library-toolbar.js`, `library-filters.js`.
- `src/library/ficha/`: `ficha-identify.js`, `ficha-generate.js`, `ficha-edit.js`, `ficha-audit.js`, `ficha-publish.js`, `ficha-view.js`, `ficha-delete.js`, `ficha-fields.js`.

## Datos externos

Supabase es la fuente de:

- usuarios y sesiones
- acuarios
- fichas
- fotos
- parametros
- tareas
- inventario
- avisos
- storage de imagenes

No se debe introducir persistencia local como fuente principal de datos.

## Regla de mantenimiento

Para cambios normales:

- Auth: `src/auth/auth.js`.
- Acuarios/navegacion de acuario: `src/aquariums/aquariums.js`.
- Biblioteca/Fichas: `src/library/library.js`, `src/library/library-v3.js` y submodulos de `src/library/` segun avance la refactorizacion.
- Inventario: `src/inventory/inventory.js`.
- Parametros: `src/parameters/parameters.js`.
- Medicion completa: `src/parameters/measurements-advanced.js`.
- Avisos/IA: `src/ai/ai.js` y `src/tasks/tasks.js`.
- Mapa: `src/map/map.js`.
- Fotos: `src/photos/photos.js`.
- Compartido: `app.js`.
- Empaquetado movil: `capacitor.config.json`, `scripts/prepare-mobile-bundle.mjs`, `mobile/README.md`.

No volver a meter funcionalidades grandes en `app.js`.
No crear archivos `*-fix.js` o parches que pisen funciones al final del `index.html`; corregir siempre el modulo dueno real.

## Validacion oficial

Antes de subir cambios debe pasar:

- `npm run check`

Si el cambio afecta a movil:

- `npm run mobile:prepare`

Ese flujo comprueba que los archivos activos existen y que el paquete interno `www/` se puede generar.

## Regla antes de editar

Antes de cambiar cualquier archivo:

1. Leer `ARBOL_MAESTRO.md`.
2. Leer `REGLAS_DE_CAMBIO.md`.
3. Leer `CHECKLIST_ANTES_DE_EDITAR.md`.
4. Confirmar que el cambio pertenece a GitHub/Supabase, no a un entorno local.
5. Confirmar que `index.html` y `scripts/prepare-mobile-bundle.mjs` siguen alineados.
