# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

## Build actual

`release-20260917-marine-covers-cleanup`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Fuente de carga

- `index.html`: entrada web.
- `src/core/module-loader.js`: fuente oficial de módulos bajo demanda.
- `src/library/ficha/ficha-json.js`: apoyo de serialización de fichas.

## Administración / acceso global

- `index.html`: contiene el único botón persistente `adminBtn` de la cabecera.
- `src/auth/auth-core.js`: muestra el botón únicamente con sesión y `state.isAdmin === true`.
- `src/admin/admin-core.js`: determina el rol administrativo mediante `admin_roles`.
- `src/core/module-loader.js`: carga el panel oficial de administración.

## Biblioteca / cadena única de contrato

- `src/library/core/library-schema.js`: contratos, campos, etiquetas y política de fuentes.
- `src/library/core/library-schema-rules.js`: regla efectiva y auditoría única.
- `src/library/library-v3-template.js`: instrucciones y rutas JSON para Chat.
- `src/library/ficha/ficha-chat-import.js`: auditoría antes de insertar.
- `src/library/library-v3-ficha.js`: edición, guardado y auditoría.
- `src/library/ficha/ficha-actions.js`: vista, publicación y acciones.
- `src/library/inventory/library-inventory-import.js`: persistencia en inventario.
- `scripts/generate-library-server-contract.mjs`: genera la copia de contrato servidor.
- `supabase/functions/_shared/library-contract.generated.ts`: contrato generado del servidor.

## Biblioteca / portadas e imágenes

- `src/library/library-v3-images.js`: propietario de la carga y persistencia de foto interior y portada manual.
- `src/library/ficha/library-cover-contract.js`: contrato visual único de portada; fija plantilla, versión, proporción y posiciones.
- `src/library/ficha/library-cover-master.js`: generador oficial cliente para peces marinos; recorta el ejemplar real y compone la portada.
- `src/library/ficha/library-cover-backfill.js`: detecta portadas ausentes u obsoletas y protege las manuales aprobadas e históricas.
- `supabase/functions/generate-marine-fish-cover/index.ts`: generador oficial servidor; rechaza recortes inseguros en vez de guardar fondos residuales.
- `src/library/library-v3-core.js`: valida la portada antes de mostrarla en Biblioteca y nunca utiliza `photo_url` como sustituto.

### Contrato vigente de pez marino

- Plantilla: `marine-fish-master-v1-locked`.
- Versión: `cover-contract-v13`.
- `manual-approved` y `manual-restored-approved`: protegidas.
- Portadas manuales históricas del bucket `library-images`: protegidas.
- Portadas generadas con contrato anterior, con una foto origen distinta o sin metadatos válidos: no se presentan como oficiales.
- Sin portada válida: la tarjeta muestra `Sin portada`; nunca muestra la foto interior como portada.

## Biblioteca / generador automático administrativo

- `src/admin/admin-library-generator.js`: entrada por lotes, consulta de cola, orden y reintentos.
- `supabase/functions/library-identify/index.ts`: identificación.
- `supabase/functions/library-generate-draft/index.ts`: generación y reparación por etapas.
- `supabase/functions/library-generation-worker/index.ts`: consumidor persistente de cola.
- Nunca publica automáticamente; deja las fichas en revisión para completar imágenes y validar.

## Propietarios únicos relacionados con portadas

- Persistencia de imágenes: `src/library/library-v3-images.js`.
- Contrato visual: `src/library/ficha/library-cover-contract.js`.
- Composición cliente: `src/library/ficha/library-cover-master.js`.
- Selección de pendientes: `src/library/ficha/library-cover-backfill.js`.
- Composición servidor: `supabase/functions/generate-marine-fish-cover/index.ts`.
- Representación en tarjetas: `src/library/library-v3-core.js`.

No se permiten hotfix, patch, wrappers, validadores paralelos ni una segunda cadena de portadas.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, contratos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app móvil.
- Comprobar `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
