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
- `src/aquariums/aquariums.js`
- `src/library/library.js`
- `src/animals/animals.js`
- Three.js CDN r149
- `src/map/map-v3-model.js`
- `src/map/map.js`
- `src/photos/photos.js`
- `src/inventory/inventory.js`
- `src/microfauna/microfauna.js`
- `src/ai/ai.js`
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
- `src/library/library.js`: biblioteca, fichas y borradores IA.
- `src/animals/animals.js`: animales.
- `src/map/map-v3-model.js`: contrato de datos del gemelo digital.
- `src/map/map.js`: mapa IA y escena 3D real.
- `src/photos/photos.js`: fotos.
- `src/inventory/inventory.js`: inventario.
- `src/microfauna/microfauna.js`: cultivos de microfauna.
- `src/ai/ai.js`: motor IA y avisos sugeridos.
- `src/ai/ai-alerts-extra.js`: revision extendida de avisos sin sobrescribir pantallas.
- `src/parameters/parameters.js`: parametros.
- `src/parameters/measurements-advanced.js`: medicion completa.
- `src/tasks/tasks.js`: tareas y avisos.
- `src/auth/auth.js`: auth y arranque.

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
