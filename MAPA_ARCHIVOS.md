# MAPA DE ARCHIVOS

## Build actual

library-structure-clean-20260710-1005

## Biblioteca

src/library/library-v3-core.js: carga y listado.
src/library/library-v3-images.js: editor único de cover_url y photo_url.
src/library/library-v3-ficha.js: edición y persistencia.
src/library/ficha/ficha-actions.js: vista única, imágenes, información, fuentes y botones.
src/library/inventory/library-inventory-import.js: copia al acuario o inventario.

## Carga activa

src/library/core/library-schema.js
src/library/core/library-schema-rules.js
src/library/ui/library.js
src/library/inventory/library-inventory-import.js
src/library/library-v3-core.js
src/library/library-v3-template.js
src/library/library-v3-images.js
src/library/library-v3-ai.js
src/library/library-v3-ficha.js
src/library/ficha/ficha-actions.js
src/library/library-v3.js
src/library/ficha/ficha-type-tools.js
src/library/ficha/ficha-chat-import.js
src/library/core/library-admin-policy.js

## Retirado

src/library/ficha/ficha-image-clean.js

## Automatización

npm run docs:refresh regenera MAPA y ÁRBOL.
npm run check regenera documentación y valida.
npm run mobile:prepare regenera documentación y prepara www.
