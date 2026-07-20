# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

## Build actual

`library-full-contract-audit-20260721-0035`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Entrada web activa

La entrada web se obtiene desde `index.html`.

## Módulos bajo demanda

La lista oficial se obtiene exclusivamente de `src/core/module-loader.js`.

## Biblioteca / propietarios únicos

- `src/library/core/library-schema.js`: contrato completo por tipo de ficha.
- `src/library/core/library-schema-rules.js`: auditoría oficial.
- `src/library/ficha/ficha-chat-import.js`: importación desde Chat con cobertura completa, fuentes y auditoría previa.
- `src/library/ficha/ficha-actions.js`: vista abierta, reauditoría y entrada para añadir.
- `src/library/inventory/library-inventory-import.js`: selección de destino y persistencia de la copia.

## Biblioteca / contrato completo de fichas

- Todos los campos de `CONTRACTS[entry_type]` deben estar presentes antes de insertar una ficha creada desde Chat.
- Se exigen al menos dos fuentes reales con URL completa.
- El texto genérico, los campos omitidos o cualquier error de auditoría impiden guardar la ficha.
- Publicar o validar no sustituye una auditoría correcta.
- La misma auditoría controla creación, apertura, publicación y añadido al acuario.

## Biblioteca / importación a acuario e inventario

- Solo una ficha con `audit.approved === true` puede activar `Añadir a mi acuario`.
- Flujo: ficha abierta → auditoría → botón Añadir → selección de acuario → formulario → inserción en `inventory_items`.
- No se permiten manejadores paralelos, reglas divergentes, `hotfix` ni `patch`.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, módulos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando el cambio afecte a archivos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
