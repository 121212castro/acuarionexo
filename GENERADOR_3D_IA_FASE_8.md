# Generador 3D IA — Fase 8

## Objetivo

Permitir modificar por lenguaje natural un proyecto 3D generado previamente, sin guardar cambios automáticamente.

## Flujo

1. El usuario genera o abre un proyecto IA.
2. Escribe una orden concreta.
3. `map-edit-project` recibe el proyecto completo y la orden.
4. El modelo devuelve un proyecto completo nuevo, nunca un parche parcial.
5. El cliente valida el resultado con `MapAiGeneratorContract`.
6. Se carga como borrador en el visor 3D.
7. El usuario puede guardar o deshacer el último cambio.

## Operaciones permitidas

- mover;
- girar;
- redimensionar;
- añadir;
- eliminar;
- duplicar;
- redistribuir;
- cambiar material;
- cambiar color.

## Reglas

- Mantener los ids y objetos no afectados.
- No cambiar especies, marcas o productos sin una orden expresa.
- Mantener posiciones y dimensiones dentro de la urna.
- Máximo 40 objetos.
- No guardar automáticamente.
- `store: false` en la llamada al modelo.
- Requiere JWT válido.
- Si la orden es ambigua, aplicar el cambio mínimo y advertirlo.

## Componentes

- `supabase/functions/map-edit-project/index.ts`
- Edge Function `map-edit-project`
- `src/map/map-ai-generator.js`
- `src/map/map-ai-generator-contract.js`

## Estado del MVP

La edición conversacional modifica el JSON espacial completo y actualiza la vista previa. El renderizador todavía utiliza modelos genéricos y no representa con fidelidad completa todas las dimensiones, materiales y rotaciones guardadas en el proyecto.
