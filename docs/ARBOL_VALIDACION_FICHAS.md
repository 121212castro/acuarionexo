# Árbol de validación de fichas

```text
Ficha en estado review
|
+-- ¿Existe control para el campo contractual?
|   |
|   +-- No --> incidencia general en el resumen; no colorear secciones
|   |
|   +-- Sí
|       |
|       +-- missing_fields / invalid_fields / errors
|       |   +-- ROJO: error confirmado
|       |
|       +-- poor_fields / review_flags
|       |   +-- AMARILLO: contenido presente que requiere revisión
|       |
|       +-- Sin incidencia asociada
|           |
|           +-- ¿Hay valor utilizable?
|           |   +-- Sí --> VERDE
|           |   +-- No --> GRIS
|           |
|           +-- ¿Usuario modifica el campo?
|               +-- Sí --> AZUL hasta guardar y auditar
```

## Reglas obligatorias

- Nunca aplicar el estado de un campo a `section`, `fieldset`, `details` o a un contenedor con varios controles.
- `poor_fields` no es un error: se representa como advertencia.
- Un campo cumplimentado no es automáticamente correcto; será verde solo si no tiene incidencia.
- Un error sin campo identificable no debe volver roja toda la ficha.
- La publicación debe bloquearse mientras exista cualquier estado rojo.
- Las advertencias amarillas requieren revisión explícita, pero no deben falsearse como campos vacíos.
