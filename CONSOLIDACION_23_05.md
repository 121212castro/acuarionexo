# AcuarioNexo · Consolidacion 23-05

## Objetivo
Parar la acumulacion de parches y dejar una base limpia antes de seguir anadiendo funciones.

## Entrada principal activa

- `index.html` es la entrada principal.
- `index.html` carga `app-loader-clean.js`.
- `index.html` ya no debe cargar `modules-lite.js` ni `visual-fichas.js`.

## Cargador limpio activo

Archivo: `app-loader-clean.js`

Carga los modulos:

1. `version-engine.js`
2. `cache-engine.js`
3. `state-engine.js`
4. `navigation-engine.js`
5. `fichas-engine.js`
6. `crop-visual-engine.js`
7. `product-crop-engine.js`
8. `ai-engine.js`
9. `gemini-engine.js`
10. `inventario-engine.js`
11. `microfauna-engine.js`
12. `parameters-engine.js`
13. `nav-visual-fix.js`

## Archivos antiguos / no tocar

- `modules-lite.js`: apagado. No meter logica nueva.
- `visual-fichas.js`: eliminado.
- `index-clean.html`: solo prueba historica, no usar como entrada principal.

## Regla obligatoria

Un modulo = una responsabilidad.

No volver a meter navegacion, IA, inventario, microfauna, avisos y fichas en un mismo archivo gigante.

## Siguiente comprobacion manual

1. Abrir app.
2. Refrescar.
3. Probar Microfauna.
4. Probar Inventario.
5. Probar ficha limpia.
6. Probar boton IA.
7. Probar Avisos cuando se conecte al loader.

## Pendiente antes de seguir con funciones grandes

- Conectar `recommendation-engine.js` al loader.
- Conectar `alerts-engine.js` al loader.
- Conectar `alerts-inbox-engine.js` al loader.
- Probar que no se duplican botones ni estados activos.
- Crear panel Avisos final.
