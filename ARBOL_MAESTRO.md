# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `library-cover-card-fill-20260727-0245`.

## Flujo maestro de Biblioteca

`src/library/library-v3-core.js`
→ carga las fichas visibles
→ agrupa por tipo
→ genera una tarjeta con una sola portada
→ añade `library-card library-cover-only`
→ pulsación ejecuta `verFicha(id)`.

`library-images.css`
→ define la cuadrícula oficial
→ fija cada tarjeta a proporción 2:3
→ fija la portada a `width: 100%` y `height: 100%`
→ usa `object-fit: cover`
→ elimina cualquier espacio vacío dentro de la tarjeta.

`library-clean.css`
→ conserva filtros, paneles y secciones
→ no controla dimensiones ni encaje de las portadas.

`src/library/library-v3-images.js`
→ carga la portada original
→ persiste `cover_url` e `image_assets.cover`
→ no altera la presentación pública.

## Propiedad única

- Listado y HTML de tarjeta: `src/library/library-v3-core.js`.
- Tamaño, proporción y encaje de imágenes: `library-images.css`.
- Persistencia de portada y foto interior: `src/library/library-v3-images.js`.
- Vista abierta: `src/library/ficha/ficha-actions.js`.
- Editor de ficha: `src/library/library-v3-ficha.js`.
- No se permiten hotfix, patch, wrappers ni reglas duplicadas en `library-clean.css` o `styles.css`.

## Cadena de apertura

Portada visible completa
→ tarjeta pulsable
→ `verFicha(id)`
→ vista completa de ficha
→ portada, foto interior, información y fuentes.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, responsabilidades, presentación de Biblioteca o build.
- Ejecutar `npm run check` antes de publicar.
- Comprobar `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.