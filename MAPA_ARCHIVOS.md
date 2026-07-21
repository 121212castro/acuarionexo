# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs` y completado por `scripts/refresh-library-contract-docs.mjs`.

## Build actual

`library-contract-audit-20260721-1025`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Biblioteca / propietarios únicos

- `src/library/core/library-schema.js`: contratos y reglas base de los 13 tipos.
- `src/library/core/library-schema-rules.js`: contrato estricto, resumen obligatorio y auditoría única.
- `src/library/library-v3-template.js`: formulario para Chat y esqueleto JSON con rutas correctas.
- `src/library/ficha/ficha-chat-import.js`: importación estructurada, saneamiento y rechazo previo.
- `src/library/library-v3-ficha.js`: editor y guardado mediante la auditoría oficial.
- `src/library/ficha/ficha-actions.js`: reauditoría, publicación y añadido.
- `src/library/inventory/library-inventory-import.js`: selección de destino y persistencia.

## Contrato completo

- Todos los campos de `CONTRACTS[entry_type]` son obligatorios.
- `summary` es obligatorio y requiere 20 caracteres.
- Se exigen al menos dos fuentes reales con URL completa.
- `title`, `scientific_name`, `summary` y `sources` son claves superiores.
- El resto de campos se almacena exclusivamente dentro de `data`.
- El texto genérico, los campos omitidos y los tipos incorrectos impiden guardar o publicar.

## Flujo oficial

Plantilla → JSON estructurado → comprobación de tipo → saneamiento de claves → cobertura completa → auditoría → inserción → reauditoría al abrir → publicación o añadido.

<!-- LIBRARY_CONTRACT_AUDIT_START -->
## Biblioteca / auditoría integral de formularios

- `scripts/audit-library-contracts.mjs` construye una ficha completa por cada tipo y comprueba que apruebe.
- Después vacía individualmente cada campo para verificar que la auditoría lo rechace.
- También comprueba el resumen, duplicados, etiquetas visibles, apartados y correspondencia exacta entre contrato y plantilla.
- `npm run library:check` forma parte de `npm run check` y `npm run mobile:prepare`.
<!-- LIBRARY_CONTRACT_AUDIT_END -->

## Importación a acuario e inventario

- Solo una ficha con `audit.approved === true` puede activar el botón de añadido.
- El estado publicado o validado no sustituye la auditoría vigente.
- No se permiten manejadores paralelos, reglas divergentes, `hotfix` ni `patch`.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, módulos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando el cambio afecte a archivos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
