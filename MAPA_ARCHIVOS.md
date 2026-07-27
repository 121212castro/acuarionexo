# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

## Build actual

`library-cover-card-fill-20260727-0245`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Biblioteca / listado público

- `src/library/library-v3-core.js`: propietario único del listado, filtros, agrupación y marcado de cada tarjeta. Cada tarjeta contiene únicamente la portada y abre la ficha completa.
- `library-images.css`: autoridad visual única de las imágenes de Biblioteca. Define la cuadrícula, la proporción 2:3 de la tarjeta y obliga a que la portada ocupe el 100 % del ancho y del alto mediante `object-fit: cover`.
- `library-clean.css`: solo contiene estructura de filtros, paneles y secciones; no define tamaño, encaje ni representación de portadas.
- `src/library/library-v3-images.js`: propietario de carga y persistencia de `cover_url`, `photo_url` e `image_assets`.
- No se permiten estilos paralelos, hotfix, patch, wrappers ni redefiniciones de las tarjetas en otros archivos.

## Flujo de una portada

`library_entries.cover_url` / `image_assets.cover`
→ `src/library/library-v3-core.js` genera `library-card library-cover-only`
→ `library-images.css` aplica tarjeta 2:3
→ la imagen ocupa toda la tarjeta
→ pulsación abre `verFicha(id)`.

## Propietarios únicos

- Listado y marcado: `src/library/library-v3-core.js`.
- Presentación de imágenes y tarjetas: `library-images.css`.
- Persistencia de imágenes: `src/library/library-v3-images.js`.
- Vista abierta: `src/library/ficha/ficha-actions.js`.
- Edición y guardado: `src/library/library-v3-ficha.js`.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, contratos, responsabilidades, presentación de Biblioteca o build.
- Ejecutar `npm run check` antes de publicar.
- Comprobar `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.