# ASISTENTE IA · FASE 3 · CONTEXTO DEL ACUARIO

## Objetivo

Entregar al Asistente IA un contexto reducido, actual y perteneciente exclusivamente al usuario autenticado y al acuario seleccionado.

## Propietarios únicos

- Base de datos: `public.assistant_get_aquarium_context`.
- Migración: `supabase/migrations/20260807014500_assistant_aquarium_context.sql`.
- Cliente: `src/assistant/core/assistant-aquarium-context.js`.

No se permite reconstruir este contexto mediante consultas dispersas desde pantallas, prompts o funciones paralelas.

## Seguridad

- Requiere sesión autenticada.
- Comprueba `aquariums.user_id = auth.uid()`.
- Usa `SECURITY INVOKER`.
- `anon` y `PUBLIC` no pueden ejecutar la función.
- No devuelve correo, identificadores de sesión ni datos de otros usuarios.

## Datos incluidos

### Acuario

Nombre, tipo, estado, volumen neto efectivo, dimensiones, sump, refugio, fechas de montaje/ciclado y notas técnicas.

El volumen sigue esta prioridad:

1. `manual_real_liters`
2. `real_liters`
3. `system_net_liters`
4. `volume_liters`
5. `liters`

### Habitantes

Nombre común, nombre científico, categoría, cantidad, estado y notas.

### Mediciones

- Solo lecturas dentro de la ventana solicitada.
- Una única lectura: la más reciente de cada parámetro.
- Incluye valor, unidad, método, fuente, riesgo, fecha y notas.
- Ventana predeterminada: 30 días.
- Máximo permitido: 365 días.

### Inventario

Nombre, categoría, cantidad, unidad, caducidad y notas.

### Historial operativo

- Mantenimientos recientes.
- Cambios de agua recientes.
- Tareas abiertas.
- Cultivos de microfauna vinculados.

El límite predeterminado de históricos es 12 y el máximo es 50.

## Estructura devuelta

```json
{
  "context_version": "1.0",
  "generated_at": "ISO-8601",
  "aquarium": {},
  "animals": [],
  "latest_measurements": [],
  "inventory": [],
  "recent_maintenance": [],
  "open_tasks": [],
  "recent_water_changes": [],
  "microfauna_cultures": []
}
```

## Reglas de uso por la IA

- Nunca mezclar datos de dos acuarios.
- Nunca tratar una medición fuera de la ventana como actual.
- Nunca calcular dosis sin `system_net_liters` verificado.
- Diferenciar ausencia de datos de valor normal.
- Mostrar al usuario qué acuario y qué datos se utilizaron.
- Los habitantes sin nombre científico no deben convertirse automáticamente en una especie concreta.
- El inventario indica disponibilidad, no compatibilidad; la compatibilidad debe resolverse con la biblioteca.

## Pruebas realizadas

- Propietario autenticado: contexto recuperado.
- Rol `anon`: sin permiso de ejecución.
- Rol `authenticated`: permiso de ejecución.
- Rol genérico `PUBLIC`: sin permiso de ejecución.
- Función sin privilegios elevados (`SECURITY INVOKER`).
- Ventana de 30 días: las mediciones históricas fuera de plazo no se presentan como actuales.

## Integración siguiente

La Fase 4 utilizará este contexto para el selector de acuario y la interfaz del portal. La Fase 5 combinará:

1. pregunta del usuario;
2. contexto devuelto por esta función;
3. resultados de `assistant_search_library`;
4. contrato `AssistantContract`;
5. respuesta estructurada y trazable.
