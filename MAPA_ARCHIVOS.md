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

`library-mobile-overflow-fix.css` corrige la barra inferior en movil para admitir 7 botones cuando Admin esta activo.

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
- Supabase oficial tiene RLS simplificado: cada usuario autenticado solo lee su propio rol.
