# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `library-validation-details-20260721-0955`.

## Biblioteca / flujo maestro de fichas

`src/library/core/library-schema.js`
→ define el esqueleto completo para cada `entry_type`
→ `src/library/ficha/ficha-chat-import.js` exige todos los campos del contrato
→ comprueba un mínimo de dos fuentes reales con URL
→ `src/library/core/library-schema-rules.js` ejecuta la auditoría oficial
→ solo si la auditoría aprueba se inserta la ficha en Biblioteca
→ `src/library/ficha/ficha-actions.js` vuelve a auditar al abrir, publicar o añadir
→ la validación remota debe mostrar los campos, errores o motivos devueltos

## Biblioteca / clasificación de fichas

- El `entry_type` del JSON estructurado prevalece sobre detecciones por palabras del texto visible.
- Una ficha biológica no puede quedar clasificada como producto, aditivo, test o equipamiento.
- Las correcciones de tipo deben conservar el contenido útil, limpiar nombre científico y volver a auditar la ficha.

## Biblioteca / añadir a acuario

`src/library/ficha/ficha-actions.js`
→ habilita `Añadir a mi acuario` únicamente con `audit.approved === true`
→ `src/library/inventory/library-inventory-import.js` carga los acuarios
→ presenta el formulario de destino
→ inserta la copia en `inventory_items`
→ abre el inventario del acuario seleccionado

## Propietarios únicos

- `src/library/core/library-schema.js`: esqueleto completo por tipo.
- `src/library/core/library-schema-rules.js`: auditoría oficial.
- `src/library/ficha/ficha-chat-import.js`: entrada desde ficha generada por Chat.
- `src/library/ficha/ficha-actions.js`: vista, reauditoría, publicación y mensajes de validación.
- `src/library/inventory/library-inventory-import.js`: importación al acuario o inventario.

## Reglas estructurales

- La ficha generada debe incluir todos los campos entregados por el esqueleto.
- Un campo sin dato real debe declararlo de forma explícita y respaldada, nunca omitirse.
- Se rechazan textos genéricos o imprecisos detectados por la auditoría.
- Una ficha publicada o validada no puede saltarse la auditoría vigente.
- La validación no puede responder solo «no aprobada»: debe mostrar los motivos recibidos.
- No se permiten reglas paralelas, `hotfix`, `patch` ni validadores distintos según la pantalla.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, módulos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando el cambio afecte a archivos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
