# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs` y completado por `scripts/refresh-library-contract-docs.mjs`.

## Build actual

`module-loader-recovery-20260723-1230`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Carga de módulos / propietario único

- `src/core/module-loader.js`: única autoridad para cargar grupos bajo demanda.
- Un script solo se registra como cargado después de completar `onload`.
- Las etiquetas fallidas se eliminan antes de reintentar.
- Cada módulo admite hasta tres intentos con URL renovada.
- Un fallo temporal de GitHub Pages no puede quedar guardado como carga correcta.

## Biblioteca / propietarios únicos

- `src/library/core/library-schema.js`: contratos y reglas base de los 13 tipos, incluida la identidad completa de `test`.
- `src/library/core/library-schema-rules.js`: contrato estricto, resumen obligatorio y auditoría única.
- `src/library/library-v3-template.js`: formulario para Chat y esqueleto JSON con rutas correctas.
- `src/library/ficha/ficha-chat-import.js`: importación estructurada, saneamiento y rechazo previo.
- `src/library/library-v3-ficha.js`: editor y guardado mediante la auditoría oficial.
- `src/library/ficha/ficha-actions.js`: reauditoría, publicación y entrada única del botón Añadir.
- `src/library/inventory/library-inventory-import.js`: selección de destino, carga oficial de acuarios y persistencia.

## Importación a acuario e inventario

- El botón usa un listener delegado único dentro de `src/library/ficha/ficha-actions.js`.
- `src/library/ficha/ficha-actions.js` identifica el botón mediante un id estable y contiene toda la captura de errores dentro de la acción.
- No depende de `CSS.escape`, alias globales ni APIs opcionales del navegador.
- `src/library/inventory/library-inventory-import.js` reutiliza `AquariumsCore.loadAquariums`; no mantiene una segunda consulta o estructura de acuarios.
- Solo una ficha que aprueba `LibrarySchema.audit` puede abrir el formulario o guardarse, aunque su estado sea publicado o validado.
- Flujo: ficha abierta → auditoría → listener del módulo → carga oficial de acuarios → selección de destino → formulario → inserción en `inventory_items` → inventario del destino.
- No existen manejadores paralelos, wrappers, `hotfix` ni archivos `patch` para esta acción.

## Parámetros / propietarios únicos

- `src/parameters/parameters-core.js`: única autoridad para cargar fichas Test desde Biblioteca, normalizar parámetros, filtrar compatibilidad y generar opciones.
- `src/parameters/measurements-advanced.js`: formulario semanal, mensual e ICP; presenta y guarda un test diferente para cada parámetro.
- `src/parameters/parameters-manual.js`: medición puntual; reutiliza exactamente el mismo catálogo.
- `src/library/core/library-schema.js`: define en cada ficha Test `manufacturer`, `brand`, `product_code`, `parameter`, `method` y `primary_field`.
- `aquarium_measurements.method`: destino persistente del test o método realmente utilizado.
- No existen listas internas separadas para Hanna, JBL, Salifert ni otras marcas.

## Contrato completo

- Todos los campos de `CONTRACTS[entry_type]` son obligatorios.
- `summary` es obligatorio y requiere 20 caracteres.
- Se exigen al menos dos fuentes reales con URL completa.
- `title`, `scientific_name`, `summary` y `sources` son claves superiores.
- El resto de campos se almacena exclusivamente dentro de `data`.
- El texto genérico, los campos omitidos y los tipos incorrectos impiden guardar o publicar.

## Flujo oficial de tests y mediciones

Ficha Test de Biblioteca → auditoría → catálogo central de Parámetros → normalización de `primary_field`/`parameter` → filtrado por parámetro → selección independiente por fila → guardado del método en la medición.

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