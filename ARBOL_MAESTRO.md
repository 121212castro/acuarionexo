# ARBOL MAESTRO ACUARIONEXO

Fuente de verdad: GitHub `main`.

App publicada: `https://121212castro.github.io/acuarionexo/`.

Datos y autenticacion: Supabase.

Regla base: el checkout local no es entorno de ejecucion ni despliegue. Solo se usa de forma temporal para auditar, preparar commits y subirlos a GitHub.

## Entrada real de la app

`index.html` es la unica entrada web publicada por GitHub Pages.

Carga activa comprobada:

- `styles.css`
- `aquarium-map.css`
- `login-reef.css`
- Supabase CDN
- Three.js CDN
- `config.js`
- `app.js`
- `src/aquariums/aquariums.js`
- `src/library/library.js`
- `src/animals/animals.js`
- `src/map/map.js`
- `src/photos/photos.js`
- `src/inventory/inventory.js`
- `src/ai/ai.js`
- `src/parameters/parameters.js`
- `src/tasks/tasks.js`
- `src/auth/auth.js`
- `update-manager.js`
- `notifications.js`
- `login-reef.js`

No carga archivos de prueba, wrappers moviles ni copias locales alternativas.

## Nucleo funcional

`app.js` es el nucleo coordinador. Contiene configuracion compartida, estado, helpers DOM, render, cabecera de acuario, subida de imagenes y el objeto `window.ANX`.

Las pantallas y reglas de negocio viven en modulos:

- `src/aquariums/aquariums.js`: dashboard, alta/edicion/apertura de acuarios y panel de acuario.
- `src/library/library.js`: biblioteca, normalizacion de fichas, detalle e importacion.
- `src/animals/animals.js`: habitantes del acuario.
- `src/map/map.js`: mapa IA, foto base, puntos y render 3D.
- `src/photos/photos.js`: galeria y subida de fotos.
- `src/inventory/inventory.js`: inventario general y por acuario.
- `src/ai/ai.js`: reglas IA, interpretacion de parametros y generacion de avisos.
- `src/parameters/parameters.js`: pantalla y registro de mediciones.
- `src/tasks/tasks.js`: tareas de acuario y avisos generales.
- `src/auth/auth.js`: login, registro, recuperacion de password y arranque.

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

## Archivos activos de soporte

- `config.js`: claves/configuracion publica de Supabase.
- `app-version.json`: build publicado.
- `update-manager.js`: gestion de actualizacion/cache.
- `notifications.js`: soporte de notificaciones.
- `login-reef.js`: experiencia visual del login.
- `styles.css`: estilos principales.
- `aquarium-map.css`: estilos usados por mapa integrado.
- `manifest.webmanifest` e `icon-512.png`: PWA.

## Regla de mantenimiento

Para cambios normales:

- Cambios de auth: `src/auth/auth.js`.
- Cambios de acuarios o navegacion de acuario: `src/aquariums/aquariums.js`.
- Cambios de biblioteca/fichas: `src/library/library.js`.
- Cambios de inventario: `src/inventory/inventory.js`.
- Cambios de parametros: `src/parameters/parameters.js`.
- Cambios de avisos/IA: `src/ai/ai.js` y `src/tasks/tasks.js`.
- Cambios de mapa: `src/map/map.js`.
- Cambios de fotos: `src/photos/photos.js`.
- Cambios compartidos: `app.js`.

No volver a meter funcionalidades grandes en `app.js`.

## Archivos eliminados del core

La limpieza de junio de 2026 elimino archivos que no estaban cargados por `index.html`, duplicaban funciones ya integradas en `app.js` o pertenecian a un wrapper separado:

- `parameters-ui.js`
- `photo-ai.js`
- `aquarium-map.js`
- `measurement-schema.js`
- `measurement-ai.js`
- `measurement-engine.js`
- `acuarionexo-api.js`
- `api/measurement-alerts.js`
- `nav-sections-fix.js`
- `reef_mixto_parametros_v1.json`
- `assets/fondos/fondo-ficha-oficial.svg`
- `mobile-wrapper/`

Si una funcion eliminada se necesita, se recupera desde el historial de GitHub, se adapta al estado unico de `app.js` y se sube como cambio nuevo.

## Regla antes de editar

Antes de cambiar cualquier archivo:

1. Leer `ARBOL_MAESTRO.md`.
2. Leer `REGLAS_DE_CAMBIO.md`.
3. Leer `CHECKLIST_ANTES_DE_EDITAR.md`.
4. Confirmar que el cambio pertenece a GitHub/Supabase, no a un entorno local.
5. Confirmar que `index.html` no activa archivos externos por accidente.
