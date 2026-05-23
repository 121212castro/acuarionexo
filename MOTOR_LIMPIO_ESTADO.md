# AcuarioNexo · Motor limpio

Estado de reorganizacion iniciado el 23-05.

## Objetivo
Evitar que la app vuelva a convertirse en un archivo gigante con funciones duplicadas, renders pisados y parches acumulados.

## Modulos nuevos

- `navigation-engine.js`: navegacion superior, estado activo y barra inferior.
- `fichas-engine.js`: render unico oficial de fichas visuales.
- `inventario-engine.js`: logica limpia de Inventario.
- `microfauna-engine.js`: logica limpia de Microfauna.
- `version-engine.js`: version/build global.
- `app-loader-clean.js`: cargador limpio principal de modulos.

## Motor viejo

- `modules-lite.js` ya no debe volver a crecer como motor grande.
- Debe quedar como cargador temporal hasta que `index.html` cargue directamente `app-loader-clean.js`.

## Regla del proyecto

Un modulo = una responsabilidad.

No meter mas logica nueva dentro de `modules-lite.js` salvo carga temporal de modulos.

## Siguiente paso

Conectar `app-loader-clean.js` desde `index.html` y despues retirar `visual-fichas.js` y el uso directo de `modules-lite.js`.
