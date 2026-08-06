# ASISTENTE IA ACUARIONEXO — FASE 4

## Objetivo

Crear el punto visible de interacción del Asistente AcuarioNexo en el portal de Inicio.

## Propietarios

- `src/core/module-loader.js`: registra y carga el grupo oficial `assistant`.
- `src/assistant/assistant-portal.js`: propietario único de la pantalla y preparación de consultas.
- `src/assistant/assistant-portal.css`: presentación exclusiva de la pantalla.
- `src/aquariums/aquariums.js`: contiene el acceso principal desde Inicio.

## Cadena de carga

1. `src/assistant/core/assistant-contract.js`
2. `src/assistant/core/assistant-library-search.js`
3. `src/assistant/core/assistant-aquarium-context.js`
4. `src/assistant/assistant-portal.js`

No se reutiliza ni modifica el asistente antiguo de `src/ai`.

## Modos visibles

### Consulta general

Prepara una búsqueda contra las fichas públicas y publicadas de la biblioteca.

### Consultar mi acuario

Exige seleccionar un acuario del usuario y añade el contexto seguro generado por `assistant_get_aquarium_context`.

## Resultado de la Fase 4

La pantalla muestra:

- consulta escrita por el usuario;
- selector de modo;
- selector de acuario cuando corresponde;
- ejemplos de consulta;
- resumen del contexto utilizado;
- fichas seleccionadas por el buscador;
- enlace a cada ficha;
- estado de preparación.

## Límite deliberado

La Fase 4 no llama al modelo de lenguaje ni genera una respuesta conversacional. Prepara y hace visible el paquete de información que será enviado al modelo en la Fase 5.

No debe simular una respuesta de IA ni presentar inferencias automáticas como hechos.

## Seguridad

- El modo acuario requiere sesión.
- Solo se muestran acuarios pertenecientes al usuario.
- El buscador sigue las políticas RLS de la Fase 2.
- Las fichas privadas o en revisión no aparecen para el usuario público.
- La interfaz no modifica fichas, inventario, parámetros ni acuarios.

## Estado

Fase 4 implementada en GitHub `main`.