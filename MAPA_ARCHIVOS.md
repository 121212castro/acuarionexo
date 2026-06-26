# MAPA DE ARCHIVOS

## Activos web en produccion

Estos archivos son cargados por `index.html` o forman parte directa de la app publicada:

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
- Supabase CDN
- Firebase CDN
- Three.js CDN r149
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
- `app-version.json`
- `manifest.webmanifest`
- `icon-512.png`

## App movil

- `capacitor.config.json`: app id `com.acuarionexo.app`, nombre `AcuarioNexo`, `webDir` `www`.
- `scripts/prepare-mobile-bundle.mjs`: copia los activos web oficiales a `www/`.
- `mobile/README.md`: reglas y distribucion Android/iOS.
- `.github/workflows/android-debug-apk.yml`: genera APK Android debug desde GitHub Actions.
- `www/`, `android/` e `ios/` son generados y no se versionan.

## Nucleo en `app.js`

- Configuracion compartida.
- Cliente Supabase.
- Estado comun `window.ANX.state`.
- Helpers DOM y render.
- Navegacion visual compartida.
- Cabecera de acuario.
- Subida de imagenes compartida.

## Modulos de negocio

- `src/aquariums/aquariums.js`: dashboard, acuarios y rutas internas del acuario.
- `src/library/core/library-schema.js`: contrato oficial de Biblioteca V3/V4 expuesto como `window.ANX.LibrarySchema`.
- `src/library/library.js`: biblioteca, fichas y borradores IA.
- `src/library/library-v3.js`: flujo Biblioteca V3/V4 de identificacion, borrador, edicion, auditoria, publicacion, borrado e inventario.
- `src/animals/animals.js`: animales.
- `src/map/map-v3-model.js`: contrato de datos del gemelo digital.
- `src/map/map.js`: mapa IA y escena 3D real.
- `src/photos/photos.js`: fotos.
- `src/inventory/inventory.js`: inventario.
- `src/microfauna/microfauna.js`: cultivos de microfauna.
- `src/ai/ai.js`: motor IA y avisos sugeridos.
- `src/ai/ai-library-v3.js`: apoyo IA para Biblioteca V3.
- `src/ai/ai-alerts-extra.js`: revision extendida de avisos sin sobrescribir pantallas.
- `src/parameters/parameters.js`: parametros.
- `src/parameters/measurements-advanced.js`: medicion completa.
- `src/tasks/tasks.js`: tareas y avisos.
- `src/auth/auth.js`: auth y arranque.

## Arquitectura preparada de Biblioteca

Fase 1 creada sin mover funciones ni cambiar comportamiento. Estos directorios quedan preparados para la refactorizacion modular posterior:

- `src/library/core/.gitkeep`
- `src/library/inventory/.gitkeep`
- `src/library/images/.gitkeep`
- `src/library/ui/.gitkeep`
- `src/library/ficha/.gitkeep`

Responsabilidades previstas:

- `src/library/core/`: nucleo, acceso a datos, utilidades, busqueda y esquema.
- `src/library/inventory/`: importacion, enlace y validacion de inventario.
- `src/library/images/`: subida, seleccion, previsualizacion y utilidades de imagen.
- `src/library/ui/`: render, tarjetas, toolbar y filtros.
- `src/library/ficha/`: identificar, generar, editar, auditar, publicar, ver, borrar y campos de ficha.

## Fase 2 Biblioteca

Primer modulo movido:

- Antes: `src/library/library-schema.js`
- Ahora: `src/library/core/library-schema.js`

Resultado:

- `index.html` carga `src/library/core/library-schema.js` antes de `library.js` y `library-v3.js`.
- La ruta antigua `src/library/library-schema.js` ha sido eliminada.
- No se ha movido ningun otro modulo.

## Documentacion de control

- `ARCHIVOS_ACTIVOS.txt`
- `ARBOL_MAESTRO.md`
- `REGLAS_DE_CAMBIO.md`
- `CHECKLIST_ANTES_DE_EDITAR.md`
- `MAPA_ARCHIVOS.md`
- `README.md`
- `mobile/README.md`

## Validacion

- `package.json`: comandos `npm run check` y scripts Capacitor.
- `scripts/validate-app.mjs`: comprueba referencias de `index.html`, build, sintaxis JS y orden de carga.
- `scripts/prepare-mobile-bundle.mjs`: prepara paquete interno movil.

## Nota de estabilidad 21/06/2026

- Biblioteca/Fichas esta activa como modulo separado y solo consulta `library_entries` al abrir Biblioteca.
- Mediciones completas estan aisladas en `src/parameters/measurements-advanced.js`.
- App movil se prepara con Capacitor llevando los archivos dentro del paquete.
- No hay parches JS cargados al final que sustituyan modulos principales.

## Nota Fase 1 Biblioteca 26/06/2026

- Se ha creado solo la arquitectura modular vacia bajo `src/library/`.
- No se ha movido ninguna funcion.
- No se ha modificado `index.html`.
- `src/library/library.js` sigue siendo modulo activo de Biblioteca/Fichas.
