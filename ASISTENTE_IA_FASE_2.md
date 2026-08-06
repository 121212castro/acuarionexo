# ASISTENTE IA ACUARIONEXO — FASE 2

## Estado

Implementada y desplegada.

## Objetivo

Crear el buscador oficial que recupera de `library_entries` únicamente las fichas permitidas por las políticas RLS, antes de enviar contexto a la IA.

## Propietarios únicos

- `supabase/migrations/20260807011500_assistant_library_search.sql`: definición versionada de la función SQL.
- `public.assistant_search_library(...)`: consulta, filtros, ranking y motivos de selección dentro de Supabase.
- `src/assistant/core/assistant-library-search.js`: cliente oficial que normaliza solicitudes y valida resultados.
- `src/assistant/core/assistant-contract.js`: límites y comportamiento general definidos en Fase 1.

No se permiten búsquedas paralelas, consultas directas desde pantallas ni prompts que sustituyan este motor.

## Seguridad

La función utiliza `SECURITY INVOKER` y respeta las políticas RLS de `library_entries`.

- Usuarios públicos: solo `status = published` y `visibility = public`.
- No devuelve fichas privadas, en revisión o validadas sin publicar.
- `PUBLIC` no posee permiso de ejecución.
- Solo `anon` y `authenticated` pueden ejecutar la RPC.
- Límite máximo: 12 resultados.

## Entrada

- Texto de búsqueda.
- Tipos de ficha.
- Ecosistemas.
- Entornos.
- Grupos objetivo.
- Animales objetivo.
- Formatos de alimento.
- Etapas vitales.
- Límite solicitado, recortado entre 1 y 12.

La solicitud debe contener texto o al menos un filtro.

## Ranking

Prioridad descendente:

1. Título exacto.
2. Nombre científico exacto.
3. Coincidencia en título.
4. Coincidencia en nombre científico.
5. Coincidencia en etiquetas.
6. Coincidencia en resumen.
7. Coincidencia en datos estructurados.
8. Coincidencia con filtros de clasificación.

Cada resultado incluye:

- `score`;
- `selection_reasons`;
- identidad de la ficha;
- resumen;
- datos estructurados;
- fuentes;
- imagen de portada.

## Pruebas realizadas

### Consulta pública

Consulta: `escalar`, tipo `pez_dulce`, límite 12.

Resultado:

- 12 fichas publicadas.
- Orden por puntuación y título.
- Motivos como `title_match`, `tag_match`, `summary_match` y `entry_type_filter`.

### Protección de fichas privadas

Consulta pública: `Hikari`.

Resultado: 0 fichas.

Las fichas Hikari permanecen en `review` y `visibility = private`, por lo que no se filtraron al usuario.

### Propiedades de seguridad

- `SECURITY DEFINER`: falso.
- Volatilidad: estable.
- Ejecución `anon`: sí.
- Ejecución `authenticated`: sí.
- Ejecución `PUBLIC`: no.

## Pendiente para Fase 3

Enlazar los filtros del buscador con el acuario seleccionado, sus habitantes, parámetros, inventario y contexto reciente. La Fase 3 no debe consultar `library_entries` directamente; debe utilizar `AssistantLibrarySearch`.
