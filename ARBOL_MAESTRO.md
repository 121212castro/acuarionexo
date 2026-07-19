# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `library-admin-image-save-20260719-1415`.

## Entrada web

- `index.html`
- `app-version.json`
- `manifest.webmanifest`
- `styles.css`
- `dashboard.css`
- `aquarium-map.css`
- `login-reef.css`
- `aquarium-cards.css`
- `aquariums-mobile-fix.css`
- `aquarium-form-ux.css`
- `mobile-form-fix.css`
- `library-mobile-overflow-fix.css`
- `library-clean.css`
- `library-images.css`
- `inventory-accordion.css`
- `microfauna-mobile.css`
- `notifications.css`
- `settings.css`
- `support.css`
- `status.css`
- `config.js`
- `app.js`
- `src/aquariums/aquariums-core.js`
- `src/aquariums/aquariums-form.js`
- `src/aquariums/aquariums-save.js`
- `src/aquariums/aquariums.js`
- `src/admin/admin-core.js`
- `src/core/module-loader.js`
- `src/auth/auth-core.js`
- `src/auth/auth.js`
- `update-manager.js`
- `notifications.js`

## Módulos cargados bajo demanda

La lista oficial se define únicamente en `src/core/module-loader.js`.

## Biblioteca / flujo maestro

`src/admin/admin.js`
→ abre Biblioteca completa o revisión con `adminReturn: true`
→ `src/library/library-v3-core.js` conserva el contexto de entrada
→ `src/library/ficha/ficha-actions.js` abre la vista de ficha
→ `src/library/library-v3-ficha.js` abre el editor
→ el retorno se resuelve según el contexto real: Admin o Biblioteca

`src/library/library-v3-images.js`
→ autoriza la modificación mediante la política Admin
→ guarda portada y foto interior por `id` de ficha, aunque el creador original sea otro usuario
→ exige confirmación de que Supabase actualizó una fila
→ conserva el original sin transformaciones destructivas
→ `library-images.css` realiza el encaje visual una sola vez

## Propiedad única

- Contexto de entrada Admin: `src/admin/admin.js`.
- Listado y contexto de Biblioteca: `src/library/library-v3-core.js`.
- Vista abierta: `src/library/ficha/ficha-actions.js`.
- Editor de imágenes: `src/library/library-v3-images.js`.
- Editor y persistencia de ficha: `src/library/library-v3-ficha.js`.
- Presentación de imágenes: `library-images.css`.
- Ningún otro archivo puede redefinir `window.verFicha`, `window.formFicha` ni `LibraryV3Images.imageBox`.

## Automatización

- `npm run docs:refresh`: regenera Árbol y Mapa.
- `npm run check`: regenera documentación y valida la aplicación.
- `npm run mobile:prepare`: regenera documentación y prepara `www/`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
