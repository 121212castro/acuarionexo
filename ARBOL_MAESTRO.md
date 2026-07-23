# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs` y completado por `scripts/refresh-library-contract-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `library-add-direct-action-20260723-1125`.

## Biblioteca / flujo maestro de fichas

`src/library/core/library-schema.js`
→ define el esqueleto completo para cada `entry_type`
→ `src/library/core/library-schema-rules.js` aplica un contrato estricto único
→ `src/library/library-v3-template.js` genera el formulario y JSON con las rutas correctas
→ `src/library/ficha/ficha-chat-import.js` exige todos los campos, resumen y fuentes antes de insertar
→ `src/library/ficha/ficha-actions.js` vuelve a auditar al abrir, publicar o añadir

## Biblioteca / clasificación de fichas

- El `entry_type` del JSON estructurado prevalece sobre detecciones por palabras.
- Una ficha biológica no puede quedar clasificada como producto, aditivo, test o equipamiento.
- Las correcciones de tipo deben conservar contenido útil, limpiar campos superiores y volver a auditar.

## Biblioteca / añadir a acuario

`src/library/ficha/ficha-actions.js`
→ habilita `Añadir a mi acuario` únicamente con `audit.approved === true`
→ el botón llama directamente a `ANX.LibraryFichaActions.addToAquarium`
→ identifica el botón mediante su id estable, sin depender de `CSS.escape` ni APIs opcionales del navegador
→ `src/library/inventory/library-inventory-import.js` reutiliza `AquariumsCore.loadAquariums`
→ presenta el formulario de destino
→ inserta la copia en `inventory_items`
→ abre el inventario del acuario seleccionado

El estado publicado o validado no sustituye la auditoría vigente.

## Parámetros / flujo oficial de tests

`src/library/core/library-schema.js`
→ las fichas `test` definen fabricante, marca, modelo, parámetro, método y `primary_field`
→ `src/parameters/parameters-core.js` carga una sola vez el catálogo desde `library_entries`
→ normaliza el parámetro y filtra únicamente los tests compatibles
→ `src/parameters/measurements-advanced.js` presenta un selector independiente por cada valor medido
→ `src/parameters/parameters-manual.js` reutiliza el mismo catálogo en mediciones puntuales
→ cada medición guarda su test o método exacto en `aquarium_measurements.method`

No existen listas paralelas de marcas en los formularios. Hanna, JBL, Salifert y cualquier otra marca se obtienen exclusivamente de las fichas Test de Biblioteca.

## Propietarios únicos

- `src/library/core/library-schema.js`: esqueleto completo por tipo y contrato de ficha Test.
- `src/library/core/library-schema-rules.js`: auditoría estricta oficial.
- `src/library/library-v3-template.js`: plantilla para Chat y esqueleto JSON.
- `src/library/ficha/ficha-chat-import.js`: entrada desde ficha generada por Chat.
- `src/library/ficha/ficha-actions.js`: vista, reauditoría, publicación y entrada única para añadir.
- `src/library/inventory/library-inventory-import.js`: selección de destino, carga oficial de acuarios y persistencia.
- `src/parameters/parameters-core.js`: catálogo y compatibilidad de tests por parámetro.
- `src/parameters/measurements-advanced.js`: mediciones por lotes y test independiente por fila.
- `src/parameters/parameters-manual.js`: medición puntual con el mismo catálogo.

## Reglas estructurales

- La ficha generada debe incluir todos los campos entregados por el esqueleto.
- `title`, `scientific_name`, `summary` y `sources` son claves superiores; el resto pertenece a `data`.
- El resumen es obligatorio y debe tener al menos 20 caracteres.
- No existen campos opcionales ocultos según la pantalla.
- Una ficha incompleta se rechaza antes de insertarse en Biblioteca.
- No se permiten reglas paralelas, `hotfix`, `patch` ni validadores distintos según la pantalla.

<!-- LIBRARY_CONTRACT_AUDIT_START -->
## Biblioteca / auditoría integral de formularios

- Los 13 tipos definidos en `CONTRACTS` utilizan un único contrato para plantilla, importación, edición, auditoría, publicación y añadido al acuario o inventario.
- `src/library/core/library-schema-rules.js` exige todos los campos del contrato y un resumen de 20 caracteres; no existen campos opcionales ocultos según la pantalla.
- `src/library/library-v3-template.js` genera rutas JSON coherentes: `title`, `scientific_name`, `summary` y `sources` son superiores; el resto se guarda en `data`.
- `src/library/ficha/ficha-chat-import.js` exige JSON estructurado, sanea claves superiores duplicadas y rechaza la ficha antes de insertar si falta cualquier campo.
- `scripts/audit-library-contracts.mjs` prueba automáticamente cada tipo, cada campo obligatorio y el resumen.
- `npm run check` y `npm run mobile:prepare` ejecutan `npm run library:check` antes de publicar o preparar la app.
<!-- LIBRARY_CONTRACT_AUDIT_END -->

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, módulos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando el cambio afecte a archivos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.