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
- `library-mobile-overflow-fix.css`
- Supabase CDN
- `src/aquariums/aquariums.js`
- `src/library/core/library-schema.js`
- `src/library/ui/library.js`
- `src/library/inventory/library-inventory-import.js`
- `src/library/library-v3.js`
- `src/library/ficha/ficha-chat-import.js`
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
- `src/admin/admin.js`
- `src/auth/auth.js`
- `update-manager.js`
- `notifications.js`
- `app-version.json`
- `manifest.webmanifest`
- `icon-512.png`

## Navegacion principal

`app.js` controla la barra inferior fija.

Modulos visibles para usuario normal:

- Inicio
- Acuarios
- Biblioteca
- Microfauna
- Avisos
- Inventario

Modulo visible solo con rol activo:

- Admin

## Admin restringido

`src/admin/admin.js` controla el panel Admin.

Funciones activas:

- `window.refreshAdminAccess`
- `window.adminPanel`
- `window.ANX.Admin.loadAdminRole`
- `window.ANX.Admin.adminAllowed`

Regla de acceso:

- El boton Admin solo aparece si `state.isAdmin` es verdadero.
- `state.isAdmin` solo se activa si existe fila activa en `admin_roles`.
- Roles admitidos: `owner`, `admin`, `trusted_admin`.
- Si un usuario intenta abrir `adminPanel()` sin permiso, se bloquea.

Base Supabase:

- Migracion: `supabase/migrations/20260702_admin_roles.sql`.
- Tabla: `admin_roles`.
- Funcion: `is_admin`.
- RLS: lectura propia y gestion por propietario.

## Microfauna

`src/microfauna/microfauna.js` es modulo principal visible.

Funciones activas:

- `window.microfauna`
- `window.formMicrofauna`
- `window.saveMicrofauna`
- `window.registrarMicrofauna`

Cultivos incluidos:

- Rotiferos
- Copepodos
- Fitoplancton
- Artemia
- Infusorios

## Limpieza Biblioteca 02/07/2026

Eliminados del repositorio por estar fuera de carga activa o duplicar funciones:

- `src/library/library.js`
- `src/library/ficha/ficha-identify.js`
- `src/library/ficha/ficha-view.js`

Estado corregido:

- `src/library/ui/library.js` ya no carga `library.js` con `document.write`.
- `src/library/inventory/library-inventory-import.js` contiene la importacion de fichas validadas a inventario.
- `src/library/library-v3.js` es el dueño real de Biblioteca/Fichas.
- `src/library/ficha/ficha-chat-import.js` crea fichas nuevas desde texto pegado del Chat.
- `scripts/prepare-mobile-bundle.mjs` esta alineado con `index.html`.
- `scripts/validate-app.mjs` detecta duplicados criticos de funciones `window.*` de Biblioteca y Admin.

## App movil

- `capacitor.config.json`: app id `com.acuarionexo.app`, nombre `AcuarioNexo`, `webDir` `www`.
- `scripts/prepare-mobile-bundle.mjs`: copia los activos web oficiales a `www/`, incluido Admin.
- `mobile/README.md`: reglas y distribucion Android/iOS.
- `.github/workflows/android-debug-apk.yml`: genera APK Android debug desde GitHub Actions.
- `www/`, `android/` e `ios/` son generados y no se versionan.

## Nucleo en `app.js`

- Configuracion compartida.
- Cliente Supabase.
- Estado comun `window.ANX.state`.
- Helpers DOM y render.
- Navegacion visual compartida.
- Barra inferior fija con Microfauna visible y Admin solo si hay rol.
- Cabecera de acuario.
- Subida de imagenes compartida.

## Modulos de negocio

- `src/aquariums/aquariums.js`: dashboard, acuarios y rutas internas del acuario.
- `src/library/core/library-schema.js`: contrato oficial reforzado de Biblioteca V3/V4.
- `src/library/ui/library.js`: marcador UI de Biblioteca; no carga modulos heredados.
- `src/library/inventory/library-inventory-import.js`: pasar fichas validadas/publicadas a inventario general o de acuario.
- `src/library/library-v3.js`: flujo Biblioteca V3/V4.
- `src/library/ficha/ficha-chat-import.js`: creador de fichas nuevas desde texto pegado del Chat.
- `src/animals/animals.js`: animales.
- `src/map/map-v3-model.js`: contrato de datos del gemelo digital.
- `src/map/map.js`: mapa IA y escena 3D real.
- `src/photos/photos.js`: fotos.
- `src/inventory/inventory.js`: inventario.
- `src/microfauna/microfauna.js`: cultivos de microfauna como modulo principal.
- `src/admin/admin.js`: panel Admin restringido.
- `src/ai/ai.js`: motor IA y avisos sugeridos.
- `src/ai/ai-library-v3.js`: apoyo IA para Biblioteca V3.
- `src/ai/ai-alerts-extra.js`: revision extendida de avisos.
- `src/parameters/parameters.js`: parametros.
- `src/parameters/measurements-advanced.js`: medicion completa.
- `src/tasks/tasks.js`: tareas y avisos.
- `src/auth/auth.js`: auth, arranque y carga de rol Admin.

## Edge Functions Supabase Biblioteca

Proyecto Supabase: `vqpxhozavfzgtkqscncs`.

Funciones relevantes:

- `library-identify`.
- `library-generate-draft`.
- `library-audit-card`.
- `library-publish`.
- Compartido: `supabase/functions/_shared/library-v3.ts`.

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
- `scripts/validate-app.mjs`: comprueba referencias de `index.html`, build, sintaxis JS, orden de carga y duplicados criticos.
- `scripts/prepare-mobile-bundle.mjs`: prepara paquete interno movil.

## Nota de control 02/07/2026

- Admin no debe quedar visible sin rol activo.
- Para activar el primer propietario hay que aplicar la migracion SQL y añadir manualmente el primer `owner` en Supabase.
- La seguridad real depende de RLS y de `admin_roles`, no solo del frontend.
