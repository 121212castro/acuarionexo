# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

## Build actual

`library-detail-cover-context-20260719-1445`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Entrada web activa

- `icon-512.png`
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

## Módulos bajo demanda

La lista oficial se obtiene exclusivamente de `src/core/module-loader.js`.

## Biblioteca / propietarios únicos

- `src/admin/admin.js`: abre Biblioteca desde Admin conservando `adminReturn: true`.
- `src/library/library-v3-core.js`: listado, filtros, contexto de entrada y retorno central hacia Admin o Biblioteca.
- `src/library/library-v3-images.js`: carga y persistencia administrativa de `cover_url` y `photo_url` por id de ficha.
- `src/library/library-v3-ficha.js`: editor, guardado, auditoría, publicación y borrado.
- `src/library/ficha/ficha-actions.js`: vista abierta; utiliza el retorno central del núcleo.
- `library-images.css`: única autoridad visual; la portada abierta conserva su proporción completa y la foto interior mantiene su marco propio.
- Ningún otro archivo puede redefinir `window.verFicha`, `window.formFicha` o `LibraryV3Images.imageBox`.
- No se permiten archivos `hotfix`, `patch`, wrappers ni copias paralelas que redefinan estas rutas.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, módulos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando el cambio afecte a archivos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.