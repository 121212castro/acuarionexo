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
- `src/library/ficha/ficha-json.js`
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
- `src/admin/admin-extra.js`
- `src/admin/report-issue.js`
- `src/auth/auth.js`
- `update-manager.js`
- `notifications.js`
- `app-version.json`
- `manifest.webmanifest`
- `icon-512.png`

## Reportes de fallos

`src/admin/report-issue.js` permite a usuarios con sesion enviar reportes a `admin_reports`.

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

Base Supabase avanzada:

- `admin_reports`.
- `admin_user_history`.
- `admin_list_users()`.
- `admin_set_role_by_email()`.
- `admin_get_user_history()`.
- Migracion GitHub: `supabase/migrations/20260702_admin_tools_foundation.sql`.
