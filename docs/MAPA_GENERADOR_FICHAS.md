# Mapa técnico — Generador de fichas AcuarioNexo

## Objetivo
Ninguna ficha documentada puede cerrarse con apartados vacíos. Cada campo debe terminar con uno de estos estados: dato verificado, no aplica con motivo técnico, o no publicado tras búsqueda documentada.

## Flujo obligatorio
1. Entrada del nombre y marca.
2. Identificación exacta de categoría, producto, versión y referencia.
3. Investigación inicial con fabricante o fuente primaria y al menos dos fuentes independientes.
4. Carga del contrato exacto de la categoría.
5. Generación de todos los campos.
6. Normalización automática de apartados anidados hacia `data.<campo>`.
7. Auditoría determinista campo por campo.
8. Si queda cualquier campo vacío, inválido o con fuentes insuficientes: iniciar una nueva investigación dirigida a esos campos.
9. Repetir investigación, normalización y auditoría hasta completar el contrato.
10. Si un campo no corresponde al producto: escribir `No aplica:` y justificar técnicamente.
11. Si el dato no está publicado: escribir `No publicado por el fabricante en la documentación consultada:` e indicar qué documentación se revisó.
12. Solo con el contrato completo crear la ficha privada en Fichas a revisar.
13. Eliminar inmediatamente el trabajo de la cola.
14. El administrador decide corregir, validar o borrar.

## Reglas de cierre
- Prohibido crear ficha si existe cualquier elemento en `missing_fields`.
- Prohibido enviar una carcasa de ficha a revisión.
- La investigación no se limita a tres páginas; debe consultar todas las necesarias.
- Cada ciclo de reparación debe realizar nuevas búsquedas específicas.
- Los campos no aplicables deben contener explicación, nunca `null`.
- Los datos no publicados deben quedar documentados, nunca omitidos.
- La cola solo contiene trabajos pendientes, identificándose o generándose.

## Implementación activa
- Edge Function: `library-generation-worker`
- Versión activa: `13`
- Motor de auditoría: contrato generado por categoría.
- Cierre correcto: creación en `review` + eliminación física del trabajo de `library_generation_jobs`.

## Criterio de aceptación Salifert
- 0 campos vacíos.
- 0 falsos vacíos por estructura anidada.
- Todos los campos no aplicables explicados.
- Fabricante, manual o documentación primaria consultados.
- Fuentes ampliadas según cada dato.
- Cola vacía al terminar.
- Ficha privada visible en Fichas a revisar.
