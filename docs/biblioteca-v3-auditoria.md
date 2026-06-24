# AcuarioNexo Biblioteca V3 - Auditoría

Fecha: 2026-06-24

## Estado anterior

- `library-generate-card` mezclaba identificación y generación.
- El navegador podía guardar `published`, `validated_at` y `published_at` directamente.
- `library_entries` solo usaba por convención `draft/published`, sin constraints ni triggers.
- Las fuentes se guardaban como texto en `sections.sources` y `source_notes`.
- No existía `library_audit_log`.
- Inventario copiaba fichas sin una barrera completa de estado.
- La IA no consultaba Biblioteca.
- GitHub y la Edge Function desplegada no coincidían exactamente.
- Storage dispone de `animal-photos`, `aquarium-photos` y `photos`; no existe `library-photos`.

## Riesgos confirmados

1. Publicación directa desde cliente.
2. Identificación no persistente.
3. Una URL podía superar la validación.
4. Sin contrato por tipo.
5. Sin historial completo.
6. Sin auditoría reproducible.
7. Sin consumo de Biblioteca por la IA.

## Arquitectura V3

- Estados: `identified`, `draft`, `review`, `validated`, `published`.
- Contrato oficial en `src/library/library-schema.js`.
- Fuentes JSON estructuradas y mínimo de dos URLs reales.
- Motores separados: `library-identify`, `library-generate-draft`, `library-audit-card`, `library-publish`.
- Trigger de transiciones y bloqueo de publicación.
- `library_audit_log` conserva cambios y eliminaciones.
- La edición posterior a validar/publicar devuelve la ficha a `review`.
- IA e inventario consumen únicamente `validated/published`.

## Conclusión

La Biblioteca anterior era un editor con generación asistida. V3 desplaza la autoridad de identidad, validación y publicación a Supabase y convierte las fichas en conocimiento trazable.
