# Mapa de validación de fichas

## Flujo único

1. La ficha se genera según `LibrarySchema.CONTRACTS[entry_type]`.
2. La auditoría guarda el resultado en `library_entries.validation_result`.
3. El editor lee ese resultado mediante `src/library/review-field-highlights.js`.
4. Cada incidencia se asocia a un campo concreto por ID contractual o alias visible.
5. La interfaz pinta únicamente el contenedor directo de ese campo.
6. Guardar una corrección obliga a ejecutar de nuevo la auditoría antes de publicar.

## Estados visuales

- `valid` — verde: existe contenido utilizable y no hay incidencia asociada.
- `warning` — amarillo: existe contenido, pero `poor_fields` o `review_flags` piden precisión, fuente o comprobación.
- `error` — rojo: `missing_fields`, `invalid_fields` o `errors` confirman ausencia o incompatibilidad.
- `unedited` — gris: campo opcional vacío o sin evaluación.
- `edited` — azul: contenido cambiado manualmente y pendiente de guardar/auditar.

## Regla de precedencia

`error > warning > valid > unedited`

Una advertencia no puede convertir en rojo un campo que sí contiene datos. Un error general sin campo identificable se muestra en el resumen y no colorea una sección completa.

## Archivos responsables

- Contrato y reglas: `src/library/core/library-schema.js`
- Plantillas de generación: `src/library/library-v3-template.js`
- Flujo de revisión: `src/library/review-workflow.js`
- Estados por campo: `src/library/review-field-highlights.js`
- Presentación visual: `src/library/review-field-highlights.css`
