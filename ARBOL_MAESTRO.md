# ARBOL MAESTRO ACUARIONEXO

Fuente de verdad: GitHub `main`.

App web publicada: `https://121212castro.github.io/acuarionexo/`.

App movil: Capacitor.

Datos y autenticacion: Supabase.

Build actual: `phase2-inventory-ui-20260704-1350`.

## Entrada real web

Carga activa directa desde `index.html`:

- `styles.css`
- `aquarium-map.css`
- `login-reef.css`
- `aquarium-cards.css`
- `aquariums-mobile-fix.css`
- `mobile-form-fix.css`
- `library-images.css`
- `library-mobile-overflow-fix.css`
- Supabase CDN
- Three.js CDN
- Firebase CDN
- `config.js`
- `app.js`
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
- `src/inventory/inventory-ui.js`
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

Carga activa indirecta:

- `src/library/ficha/ficha-json.js`: cargado por `src/library/ui/library.js`.
- `src/admin/admin-extra.js`: cargado por `src/admin/admin.js`.
- `src/admin/report-issue.js`: cargado por `src/admin/admin.js`.
- `src/admin/issue-entry.js`: cargado por `src/admin/admin.js`.

## Navegacion principal

- Inicio
- Acuarios
- Biblioteca
- Microfauna
- Avisos
- Inventario
- Admin solo con rol activo

La barra inferior movil se ajusta desde `library-mobile-overflow-fix.css` para admitir 7 botones.

## Reportes de fallos

- `src/admin/report-issue.js`: formulario para que usuarios con sesion reporten fallos.
- `src/admin/issue-entry.js`: acceso visible a Incidencia en Inicio > Modulos.
- Guarda en `admin_reports`.
- Admin revisa desde Fallos.

## Admin restringido

- `src/admin/admin.js`: panel Admin base.
- `src/admin/admin-extra.js`: usuarios, alta de Admin, reportes y historial por persona.
- `supabase/migrations/20260702_admin_roles.sql`: roles restringidos.
- `supabase/migrations/20260702_admin_tools_foundation.sql`: reportes, historial y funciones RPC.

Admin ya esta activo para propietario.

## Microfauna

`src/microfauna/microfauna.js` es modulo principal visible.

## Biblioteca/Fichas estado actual

- `src/library/core/library-schema.js`: contrato oficial reforzado.
- `src/library/ui/library.js`: marcador UI y carga diferida de ficha JSON.
- `src/library/inventory/library-inventory-import.js`: importacion a inventario.
- `src/library/library-v3.js`: dueño real de Biblioteca/Fichas.
- `src/library/ficha/ficha-chat-import.js`: creacion desde texto pegado.
- `src/library/ficha/ficha-json.js`: JSON estructurado para fichas pegadas desde Chat.

## Inventario estado actual

- `src/inventory/inventory.js`: inventario general y de acuario.
- `src/inventory/inventory-ui.js`: textos y aviso visual de Inventario dentro del dominio de Inventario.

## Movil

- `scripts/prepare-mobile-bundle.mjs` copia los archivos activos a `www/`.
- `www/`, `android/` e `ios/` son generados y no se editan a mano.
- Si se añade un archivo activo en `index.html`, debe añadirse tambien a `scripts/prepare-mobile-bundle.mjs`.
