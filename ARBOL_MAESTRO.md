# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `release-20260917-marine-covers-cleanup`.

## Navegación administrativa global

`admin_roles`
→ `src/admin/admin-core.js` resuelve `state.isAdmin`
→ `src/auth/auth-core.js` muestra u oculta `adminBtn`
→ `index.html` mantiene el botón global
→ `src/core/module-loader.js` carga el panel de administración

## Flujo maestro de una ficha

`src/library/core/library-schema.js`
→ define contrato y metadatos
→ `src/library/core/library-schema-rules.js`
→ ejecuta la regla efectiva única
→ `src/library/library-v3-template.js`
→ entrega la misma regla al Chat
→ `src/library/ficha/ficha-chat-import.js`
→ audita antes de insertar
→ `src/library/library-v3-ficha.js`
→ audita al editar y guardar
→ `src/library/ficha/ficha-actions.js`
→ audita al publicar o añadir
→ `src/library/inventory/library-inventory-import.js`
→ audita antes de persistir en inventario

## Flujo maestro de imágenes de una ficha

`photo_url` = foto interior real/trazable

`cover_url` + `image_assets.cover` = portada

La foto interior y la portada son activos distintos. `photo_url` nunca sustituye a `cover_url` en las tarjetas de Biblioteca.

## Flujo maestro de una portada de pez marino

`photo_url` real y trazable
→ `src/library/ficha/library-cover-contract.js`
→ fija `marine-fish-master-v1-locked` + `cover-contract-v13`
→ `src/library/ficha/library-cover-master.js` o `supabase/functions/generate-marine-fish-cover/index.ts`
→ recorta el ejemplar real y compone la portada
→ `src/library/ficha/library-cover-backfill.js`
→ determina si la portada está ausente u obsoleta sin tocar manuales válidas
→ Supabase guarda `cover_url` y `image_assets.cover`
→ `src/library/library-v3-core.js`
→ valida plantilla, versión y foto origen antes de mostrar
→ si no es válida: `Sin portada`

Nunca se usa `photo_url` como fallback visual de portada.

## Portadas protegidas

- `manual-approved`.
- `manual-restored-approved`.
- Portadas manuales históricas guardadas en el bucket `library-images`.

Estas portadas no deben ser sustituidas por una regeneración automática.

## Portadas rechazadas como oficiales

- Generadas con una versión distinta de `cover-contract-v13`.
- Generadas con plantilla distinta de `marine-fish-master-v1-locked`.
- Generadas desde una `photo_url` diferente de la foto interior actual.
- Recortes que no permiten separar el ejemplar del fondo de forma segura.

En cualquiera de estos casos la tarjeta queda como `Sin portada` hasta disponer de una portada válida; no se inventa una imagen.

## Responsabilidad única de cada archivo de portadas

- `src/library/library-v3-images.js`: carga y persistencia de imágenes.
- `src/library/ficha/library-cover-contract.js`: contrato visual.
- `src/library/ficha/library-cover-master.js`: composición oficial cliente.
- `src/library/ficha/library-cover-backfill.js`: selección segura de pendientes/obsoletas.
- `supabase/functions/generate-marine-fish-cover/index.ts`: composición oficial servidor.
- `src/library/library-v3-core.js`: selección y representación en Biblioteca.

No se permiten hotfix, patch, wrappers ni otra cadena paralela de portadas.

## Generador automático administrativo

`src/admin/admin-library-generator.js`
→ `supabase/functions/library-identify/index.ts`
→ `supabase/functions/library-generate-draft/index.ts`
→ `supabase/functions/library-generation-worker/index.ts`
→ ficha en revisión
→ completar foto/portada
→ validar/publicar

El generador no publica fichas automáticamente.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, contratos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app móvil.
- Comprobar `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
