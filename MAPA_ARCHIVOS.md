# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

## Build actual

`library-admin-context-20260719-1345`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Entrada web activa

- `index.html`
- `app.js`
- `src/core/module-loader.js`
- `src/admin/admin-core.js`
- `src/auth/auth-core.js`
- `src/auth/auth.js`
- `src/aquariums/aquariums-core.js`
- `src/aquariums/aquariums-form.js`
- `src/aquariums/aquariums-save.js`
- `src/aquariums/aquariums.js`
- `styles.css`, `dashboard.css`, `aquarium-map.css`, `login-reef.css`
- `aquarium-cards.css`, `aquariums-mobile-fix.css`, `aquarium-form-ux.css`, `mobile-form-fix.css`
- `library-mobile-overflow-fix.css`, `library-clean.css`, `library-images.css`
- `inventory-accordion.css`, `microfauna-mobile.css`, `notifications.css`
- `settings.css`, `support.css`, `status.css`
- `config.js`, `update-manager.js`, `notifications.js`

## Módulos bajo demanda

La lista oficial se obtiene exclusivamente de `src/core/module-loader.js`.

## Biblioteca / Fichas

- `src/admin/admin.js`: abre la Biblioteca desde Admin conservando `adminReturn: true`.
- `src/library/library-v3-core.js`: listado, filtros, tarjetas y contexto de entrada.
- `src/library/library-v3-images.js`: único responsable de carga y persistencia de `cover_url` y `photo_url`.
- `src/library/library-v3-ficha.js`: único responsable del editor, guardado, auditoría, publicación y borrado.
- `src/library/ficha/ficha-actions.js`: único responsable de la vista abierta.
- `library-images.css`: única autoridad para el encaje visual de portada y foto interior.
- Ningún otro archivo puede redefinir `window.verFicha`, `window.formFicha` o `LibraryV3Images.imageBox`.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, módulos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando el cambio afecte a archivos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.