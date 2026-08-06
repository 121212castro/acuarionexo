# ASISTENTE IA — FASE 5

## Objetivo

Conectar el portal del asistente con el modelo de IA utilizando exclusivamente la biblioteca recuperada por AcuarioNexo y, en modo acuario, el contexto seguro del sistema seleccionado.

## Propietarios

- `supabase/functions/assistant-answer/index.ts`: orquestación, autenticación, recuperación de datos y llamada al modelo.
- `supabase/functions/_shared/assistant-contract.ts`: esquema de respuesta y estados de confianza del servidor.
- `src/assistant/assistant-portal.js`: envío de consultas y representación de respuestas.

## Flujo

1. El usuario escribe una pregunta y selecciona modo general o acuario.
2. `assistant-answer` valida el JWT.
3. Recupera hasta 12 fichas mediante `assistant_search_library`.
4. En modo acuario recupera `assistant_get_aquarium_context`.
5. Envía únicamente ese paquete al modelo mediante Responses API.
6. La respuesta debe cumplir JSON Schema estricto.
7. Se descartan IDs de fichas no presentes en la recuperación real.
8. El portal muestra respuesta, confianza, contexto, carencias, advertencias y fichas utilizadas.

## Reglas

- `store: false`.
- Sin búsqueda web durante la respuesta.
- No se envían fichas privadas al modelo por fuera de las políticas RLS.
- No se calculan dosis sin producto/version, objetivo y volumen verificado.
- No se diagnostican enfermedades de forma concluyente.
- Una respuesta sin evidencia suficiente debe usar `insufficient_information`.
- Solo se pueden citar IDs recuperados por el buscador oficial.

## Estados de confianza

- `confirmed_by_library`
- `compatible_with_available_data`
- `insufficient_information`
- `human_review_required`
- `source_conflict`

## Estado

La Edge Function `assistant-answer` está desplegada con JWT obligatorio. El portal llama a esta función y muestra la respuesta estructurada.