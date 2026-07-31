# Mapa técnico — Generador de fichas AcuarioNexo

## Objetivo
Ninguna ficha documentada puede cerrarse con apartados vacíos. Cada campo debe terminar con uno de estos estados: dato verificado, no aplica con motivo técnico, o no publicado tras búsqueda documentada.

## Flujo obligatorio
1. Entrada del nombre y marca.
2. Identificación exacta de categoría, producto, versión y referencia.
3. Investigación inicial con fuente oficial o primaria, fuente especializada y tercera fuente fiable.
4. Generación de todos los campos del contrato.
5. Normalización: aplanar los apartados anidados hacia data.<campo>.
6. Auditoría determinista campo por campo.
7. Si hay campos vacíos o inválidos: crear research_gaps y relanzar búsquedas específicas. No cerrar ficha.
8. Repetir investigación y auditoría hasta que ningún campo esté vacío.
9. Si un campo no corresponde: escribir No aplica y justificarlo.
10. Si el fabricante no publica el dato: escribir No publicado por el fabricante en la documentación consultada y conservar las fuentes revisadas.
11. Solo entonces crear ficha privada en Fichas a revisar.
12. Retirar inmediatamente el trabajo de la cola.
13. El administrador decide corregir, validar o borrar.

## Reglas de cierre
- Prohibido status completed si missing_fields contiene elementos.
- Prohibido enviar una carcasa de ficha a revisión.
- Cada ciclo de reparación debe ampliar o cambiar fuentes y recibir research_gaps.
- Para marcas con documentación extensa, el motor debe seguir buscando antes de declarar no publicado.
- La ficha de revisión puede contener advertencias o contradicciones, pero no campos sin crear.

## Criterio de aceptación Salifert
- 0 campos vacíos.
- 0 falsos vacíos por estructura anidada.
- Todos los campos no aplicables explicados.
- Al menos una fuente oficial o manual exacto.
- Cola vacía al terminar.
- Ficha privada visible en Fichas a revisar.
