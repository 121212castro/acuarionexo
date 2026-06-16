# ARBOL MAESTRO ACUARIONEXO

Fuente de verdad: GitHub `main`.

App publicada: `https://121212castro.github.io/acuarionexo/`.

Datos y autenticacion: Supabase.

Regla base: el checkout local no es entorno de trabajo ni despliegue. Solo se usa para revisar, documentar, preparar commits y subirlos a GitHub.

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
- `update-manager.js`
- `notifications.js`
- `login-reef.js`

No carga carpetas `src/`, archivos de prueba ni copias locales alternativas.

## Nucleo funcional

`app.js` contiene el arranque y la mayoria de pantallas activas:

- autenticacion
- recuperacion de password
- dashboard
- acuarios
- biblioteca
- fichas de acuario
- animales
- mapa IA
- fotos
- parametros
- tareas
- avisos IA
- inventario

Hasta que se haga una separacion por fases, ningun archivo externo debe pisar funciones globales ni reemplazar rutas principales.

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

## Referencia tecnica no activa

Estos archivos existen en el repo, pero no deben activarse desde `index.html` sin reintegracion limpia:

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

Si una funcion de esos archivos se necesita, primero se revisa, se adapta al estado unico de `app.js` y se sube por GitHub.

## Mobile wrapper

`mobile-wrapper/` no es otra app web. Es contenedor nativo y debe cargar la URL oficial de GitHub Pages.

No debe tener una copia funcional divergente del HTML de produccion.

## Regla antes de editar

Antes de cambiar cualquier archivo:

1. Leer `ARBOL_MAESTRO.md`.
2. Leer `REGLAS_DE_CAMBIO.md`.
3. Leer `CHECKLIST_ANTES_DE_EDITAR.md`.
4. Confirmar que el cambio pertenece a GitHub/Supabase, no a un entorno local.
5. Confirmar que `index.html` no activa archivos de referencia por accidente.
