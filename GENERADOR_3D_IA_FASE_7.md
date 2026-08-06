# Generador 3D IA — Fase 7

## Objetivo

Transformar una descripción del usuario y las medidas de una urna en un proyecto 3D editable compatible con el Gemelo 3D actual.

## Componentes

- Edge Function `map-generate-project` con JWT obligatorio.
- Cliente `src/map/map-ai-generator.js`.
- Integración en `src/map/map.js` mediante el botón `Crear con IA`.
- Contrato de validación `src/map/map-ai-generator-contract.js`.

## Flujo

1. El usuario abre el Gemelo 3D.
2. Pulsa `Crear con IA`.
3. Introduce largo, fondo, alto, altura de agua, tipo de proyecto y descripción.
4. La Edge Function genera JSON estructurado con objetos y coordenadas reales en centímetros.
5. El cliente valida el proyecto con el contrato oficial.
6. El proyecto se convierte al formato V3 y también a marcadores compatibles con el renderizador actual.
7. La propuesta se muestra como borrador.
8. Solo se persiste al pulsar `Guardar`.

## Seguridad y límites

- Requiere sesión válida.
- No guarda automáticamente.
- No usa marcas ni especies concretas si el usuario no las proporciona.
- Máximo de 40 objetos por generación.
- Valida límites de la urna.
- La generación usa `store: false`.

## Limitaciones del MVP

- El renderizador actual usa modelos genéricos por tipo de objeto.
- La rotación y dimensiones completas se conservan en `ai_project`, pero todavía no se representan con precisión geométrica.
- No existe todavía edición conversacional del proyecto.
- No se simulan flujo, iluminación ni crecimiento.

## Próxima fase

Fase 8: edición conversacional del proyecto 3D mediante operaciones estructuradas `move`, `rotate`, `resize`, `add`, `remove` y `duplicate`.