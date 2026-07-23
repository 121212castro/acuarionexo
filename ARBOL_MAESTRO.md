# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `library-contract-link-20260723-1305`.

## Flujo maestro de una ficha

`library-schema.js`
→ define el contrato y metadatos del tipo
→ `library-schema-rules.js` crea la regla efectiva única
→ `library-v3-template.js` entrega esa misma regla al Chat y fija la ruta JSON
→ `ficha-chat-import.js` audita antes de insertar
→ `library-v3-ficha.js` audita al guardar
→ `ficha-actions.js` audita al publicar o añadir
→ `library-inventory-import.js` audita antes de persistir la copia

Una ficha no puede avanzar por estado, validación de IA ni publicación si falla `LibrarySchema.audit`.

## Biblioteca / cadena única de contrato

- `src/library/core/library-schema.js`: define los 13 contratos, campos, etiquetas, apartados y metadatos base.
- `src/library/core/library-schema-rules.js`: convierte esos metadatos en una sola regla efectiva por campo y ejecuta la única auditoría.
- `src/library/library-v3-template.js`: genera para el Chat exactamente la misma regla efectiva y la ruta JSON de cada campo.
- `src/library/ficha/ficha-chat-import.js`: rechaza antes de insertar cualquier ficha que no apruebe `LibrarySchema.audit`.
- `src/library/library-v3-ficha.js`: usa la misma auditoría al editar y guardar.
- `src/library/ficha/ficha-actions.js`: vuelve a usar la misma auditoría al publicar o añadir.
- `src/library/inventory/library-inventory-import.js`: vuelve a auditar antes de persistir la copia.
- `scripts/audit-library-contracts.mjs`: recorre los 13 tipos y verifica contrato, plantilla, rutas, valores cerrados, números, longitudes, resumen y fuentes.
- No existe una segunda regla por pantalla ni una validación de IA que sustituya el contrato.

## Biblioteca / reglas por clase de campo

- Valores cerrados: solo aceptan una opción exacta; no se les aplica longitud de texto descriptivo.
- Campos numéricos: exigen número o rango concreto.
- Nombre científico: exige binomio concreto válido.
- Identificadores, marcas, modelos, unidades y códigos: usan su longitud mínima específica.
- Campos descriptivos: usan la longitud mínima indicada por el contrato.
- `reef_safe`: solo `Sí`, `Sí con precaución` o `No`; la explicación pertenece a `reef_safe_notes`.
- `summary`: mínimo 20 caracteres.
- `sources`: mínimo dos fuentes reales con URL completa.

## Propietarios únicos

- `src/library/core/library-schema.js`: contratos y metadatos base.
- `src/library/core/library-schema-rules.js`: regla efectiva y auditoría única.
- `src/library/library-v3-template.js`: instrucciones y esqueleto JSON para el Chat.
- `src/library/ficha/ficha-chat-import.js`: entrada de fichas desde Chat.
- `src/library/library-v3-ficha.js`: edición y guardado.
- `src/library/ficha/ficha-actions.js`: vista, publicación y entrada para añadir.
- `src/library/inventory/library-inventory-import.js`: destino y persistencia en inventario.
- `src/parameters/parameters-core.js`: catálogo de fichas Test y compatibilidad por parámetro.
- No se permiten hotfix, patch, wrappers, validadores paralelos ni contratos duplicados.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, contratos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.