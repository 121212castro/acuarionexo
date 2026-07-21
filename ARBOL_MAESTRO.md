# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs` y completado por `scripts/refresh-library-contract-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `library-contract-audit-20260721-1025`.

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
→ `src/library/inventory/library-inventory-import.js` carga los acuarios
→ presenta el formulario de destino
→ inserta la copia en `inventory_items`

## Propietarios únicos

- `src/library/core/library-schema.js`: esqueleto completo por tipo.
- `src/library/core/library-schema-rules.js`: auditoría estricta oficial.
- `src/library/library-v3-template.js`: plantilla para Chat y esqueleto JSON.
- `src/library/ficha/ficha-chat-import.js`: entrada desde ficha generada por Chat.
- `src/library/ficha/ficha-actions.js`: vista, reauditoría, publicación y mensajes de validación.
- `src/library/inventory/library-inventory-import.js`: importación al acuario o inventario.

## Reglas estructurales

- La ficha generada debe incluir todos los campos entregados por el esqueleto.
- `title`, `scientific_name`, `summary` y `sources` son claves superiores; el resto pertenece a `data`.
- El resumen es obligatorio y debe tener al menos 20 caracteres.
- No existen campos opcionales ocultos según la pantalla.
- Una ficha incompleta se rechaza antes de insertarse en Biblioteca.
- No se permiten reglas paralelas, `hotfix`, `patch` ni validadores distintos según la pantalla.

<!-- LIBRARY_CONTRACT_AUDIT_START -->
## Biblioteca / auditoría integral de formularios

- Los 13 tipos definidos en `CONTRACTS` utilizan un único contrato para plantilla, importación, edición, auditoría, publicación y añadido.
- `scripts/audit-library-contracts.mjs` prueba cada tipo, cada campo obligatorio y el resumen.
- `npm run check` y `npm run mobile:prepare` ejecutan `npm run library:check`.
- La plantilla no indica `data.title`, `data.scientific_name` ni `data.sources`; utiliza las rutas superiores reales.
<!-- LIBRARY_CONTRACT_AUDIT_END -->

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, módulos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando el cambio afecte a archivos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
