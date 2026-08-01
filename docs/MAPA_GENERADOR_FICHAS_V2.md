# Mapa del generador de fichas V2

## Fuente única de verdad

`LibrarySchema` define contratos, campos, tipos, reglas, fuentes y excepciones válidas.

## Flujo

1. El administrador selecciona la categoría exacta.
2. Introduce el nombre exacto y, si lo conoce, el nombre científico.
3. El cliente serializa el contrato vigente de `LibrarySchema`.
4. `library-generator-v2` investiga con búsqueda web y devuelve JSON estructurado.
5. El cliente reconstruye la entrada sin convertir ni perder campos.
6. `LibrarySchema.audit()` revisa todos los campos y fuentes.
7. Con errores, el mismo generador recibe el JSON y los errores exactos y realiza hasta dos reparaciones.
8. Solo con cero errores se inserta una ficha en estado `review`.
9. La ficha se vuelve a abrir usando el mismo contrato y el mismo auditor.

## Reglas estructurales

- No existe un esquema propio del generador.
- No existe una auditoría paralela.
- No se guarda un borrador incompleto.
- No se transforman textos explicativos en números.
- `Megacalanus sp.` es válido en Microfauna únicamente cuando `identification` o `ai_notes` documentan que la especie no está publicada o confirmada.
- Las mezclas multiespecíficas admiten explicaciones documentadas en parámetros sin rango conjunto publicado.
- Las variedades ornamentales conservan la especie base y usan la variedad en el título.
- Las fuentes deben cumplir la política de la categoría antes de guardar.

## Componentes

- Cliente y UI: `src/library/library-v3-ai.js`
- Contrato y auditoría: `src/library/core/library-schema-rules.js`
- Investigación y generación: Edge Function `library-generator-v2`
- Persistencia: inserción directa en `library_entries` únicamente después de auditoría aprobada.
