# MAPA DE ARCHIVOS

## Build actual

Build unificado: `phase2-map-interactions-20260704-1425`.

Debe coincidir en:

- `window.ACUARIONEXO_BUILD` dentro de `index.html`.
- `app-version.json`.
- `manifest.webmanifest` en `start_url`.
- Documentacion de control.

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
- `notifications.css`
- Supabase CDN
- Three.js CDN
- Firebase CDN
- `src/aquariums/aquariums.js`
- `src/library/core/library-schema.js`
- `src/library/ui/library.js`
- `src/library/inventory/library-inventory-import.js`
- `src/library/library-v3.js`
- `src/library/ficha/ficha-chat-import.js`
- `src/animals/animals.js`
- `src/map/map-v3-model.js`
- `src/map/map.js`
- `src/map/map-interactions.js`
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
- `app-version.json`
- `manifest.webmanifest`
- `firebase-messaging-sw.js`
- `icon-512.png`

## Activos indirectos

- `src/library/ficha/ficha-json.js`: cargado dinamicamente por `src/library/ui/library.js`.
- `src/admin/admin-extra.js`: cargado dinamicamente por `src/admin/admin.js`.
- `src/admin/report-issue.js`: cargado dinamicamente por `src/admin/admin.js`.
- `src/admin/issue-entry.js`: cargado dinamicamente por `src/admin/admin.js`.

## Candidato a integrar o retirar despues

- `src/library/ficha/ficha-template-strict.js`: no aparece en la carga activa actual; no borrar sin decidir antes si se integra en el flujo oficial de `ficha-json.js`.

## Reportes de fallos

`src/admin/report-issue.js` permite a usuarios con sesion enviar reportes a `admin_reports`.

`src/admin/issue-entry.js` añade acceso visible a Incidencia dentro de Inicio > Modulos.

Campos guardados:

- usuario
- zona afectada
- gravedad
- titulo
- descripcion
- user agent
- estado abierto

Los administradores los revisan desde Admin > Fallos.

## Admin restringido

`src/admin/admin.js` controla el panel Admin base.

`src/admin/admin-extra.js` controla herramientas avanzadas:

- Usuarios registrados.
- Alta de Admin o usuario de confianza por email.
- Reportes/fallos.
- Historial por persona.

## Inventario

- `src/inventory/inventory.js`: inventario general y por acuario.
- `src/inventory/inventory-ui.js`: textos y aviso visual de Inventario dentro del dominio de Inventario.

## Mapa

- `src/map/map-v3-model.js`: contrato/modelo de mapa V3.
- `src/map/map.js`: pantalla, editor, persistencia y render 3D principal.
- `src/map/map-interactions.js`: interaccion de colocacion de puntos 3D, movida fuera de `notifications.js`.

## Notificaciones

- `notifications.js`: notificaciones y fallback de IA de parametros.
- `notifications.css`: estilos antes inyectados desde `notifications.js`, ahora cargados como CSS real.

## Movil

- `scripts/prepare-mobile-bundle.mjs` copia la app web activa a `www/`.
- Si se añade un archivo activo a `index.html`, debe añadirse tambien a `scripts/prepare-mobile-bundle.mjs`.

No editar a mano:

- `www/`
- `android/`
- `ios/`
- `node_modules/`
