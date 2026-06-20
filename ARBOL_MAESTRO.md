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
- Supabase CDN
- Three.js CDN
- `config.js`
- `app.js`
- `src/aquariums/aquariums.js`
- `src/aquariums/photo-picker-fix.js`
- `aquarium-summary-enhancer.js`
- `src/library/library.js`
- `src/animals/animals.js`
- `src/map/map.js`
- `src/photos/photos.js`
- `src/inventory/inventory.js`
- `src/ai/ai.js`
- `src/parameters/parameters.js`
- `src/parameters/measurements-advanced.js`
- `src/tasks/tasks.js`
- `aquarium-section-router-fix.js`
- `inventory-timeout-fix.js`
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
- `src/aquariums/photo-picker-fix.js`: separa galeria/camara en portada de acuario.
- `src/library/library.js`: biblioteca, fichas y borradores IA.
- `src/animals/animals.js`: habitantes del acuario.
- `src/map/map.js`: mapa IA, foto base, puntos y render 3D.
- `src/photos/photos.js`: galeria y subida de fotos.
- `src/inventory/inventory.js`: inventario general y por acuario.
- `src/ai/ai.js`: reglas IA, interpretacion de parametros y avisos.
- `src/parameters/parameters.js`: pantalla y registro de mediciones.
- `src/parameters/measurements-advanced.js`: medicion completa.
- `src/tasks/tasks.js`: tareas y avisos.
- `src/auth/auth.js`: login, registro, recuperacion y arranque.

`src/auth/auth.js` se carga despues de los demas modulos porque ejecuta `boot()`.

Ningun modulo debe crear una app paralela. Si expone funciones para botones inline, debe hacerlo de forma explicita en `window` y mantener el estado compartido en `window.ANX.state`.

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
- Selector galeria/camara: `src/aquariums/photo-picker-fix.js`.
- Biblioteca/Fichas: `src/library/library.js`.
- Inventario: `src/inventory/inventory.js`.
- Parametros: `src/parameters/parameters.js`.
- Medicion completa: `src/parameters/measurements-advanced.js`.
- Avisos/IA: `src/ai/ai.js` y `src/tasks/tasks.js`.
- Mapa: `src/map/map.js`.
- Fotos: `src/photos/photos.js`.
- Compartido: `app.js`.
- Empaquetado movil: `capacitor.config.json`, `scripts/prepare-mobile-bundle.mjs`, `mobile/README.md`.

No volver a meter funcionalidades grandes en `app.js`.

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
