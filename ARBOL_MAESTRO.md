# ARBOL MAESTRO ACUARIONEXO

Fuente de verdad: GitHub main.

Build actual: library-structure-clean-20260710-1005.

## Biblioteca

library-v3-core.js
→ lista y abre fichas
→ ficha-actions.js
→ muestra cover_url y photo_url
→ muestra resumen, datos estructurados y fuentes
→ ofrece Editar, Añadir a mi acuario, Publicar y Borrar

library-v3-ficha.js
→ edición, guardado, auditoría, publicación y borrado
→ usa library-v3-images.js para cover_url y photo_url

library-inventory-import.js
→ copia la ficha al acuario o inventario según el tipo

## Propiedad única

Vista abierta: src/library/ficha/ficha-actions.js
Editor de imágenes: src/library/library-v3-images.js
Editor y persistencia: src/library/library-v3-ficha.js

No puede existir otro archivo que redefina window.verFicha o LibraryV3Images.imageBox.

## Carga activa de Biblioteca

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

## Automatización

npm run docs:refresh regenera MAPA y ÁRBOL.
npm run check regenera documentación y valida.
npm run mobile:prepare regenera documentación y prepara www.
