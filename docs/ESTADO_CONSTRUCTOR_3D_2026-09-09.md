# Estado del Constructor 3D de AcuarioNexo — 09/09/2026

Este documento deja constancia del estado real del módulo antes de mover o duplicar su acceso a la portada.

## Objetivo funcional

El módulo ya no se plantea como un simple mapa sobre una fotografía. El objetivo actual es un **constructor de acuarios 3D a escala real**: el usuario introduce las dimensiones físicas de la urna y la aplicación genera una representación tridimensional proporcional, navegable y editable.

## Urna 3D a escala real

Archivo principal: `src/map/map-builder.js`.

Funciones implementadas:

- Entrada de largo, fondo, alto y altura real de agua en centímetros.
- Valores iniciales de referencia: 80 × 30 × 35 cm.
- Cálculo de volumen geométrico de la urna.
- Cálculo del volumen de agua según la altura indicada.
- Redibujado inmediato de la escena 3D al modificar medidas.
- Limitación de altura de agua para que no supere el alto de la urna.
- Guardado de las dimensiones reales en la tabla `aquariums` de Supabase.
- Actualización del objeto de acuario en memoria tras guardar.
- Recentrado de la vista 3D.

Campos de `aquariums` utilizados:

- `tank_length_cm`
- `tank_width_cm`
- `tank_height_cm`
- `display_water_height_cm`
- `gross_liters`
- `display_water_liters`

## Motor 3D

Archivos principales:

- `src/map/map-render-3d.js`
- `src/map/map-render-families.js`
- `src/map/map-model-families.js`

El motor usa Three.js y genera una escena real, no una fotografía estática.

Elementos de escena ya presentes:

- urna con proporciones derivadas de las medidas reales;
- cristales;
- volumen de agua;
- superficie de agua;
- sustrato;
- aquascape base de roca;
- iluminación;
- circulación visual de agua;
- cámara con vistas frontal, lateral izquierda, lateral derecha y superior;
- giro manual;
- zoom;
- objetos colocables en coordenadas X/Y/Z;
- etiquetas dentro de la escena;
- animación básica para peces.

## Familias 3D reutilizables

En lugar de generar un modelo nuevo mediante IA para cada ficha, el sistema utiliza familias geométricas reutilizables.

Familias de coral implementadas:

- SPS ramificado;
- SPS plato / incrustante;
- LPS masivo;
- LPS tipo cerebro;
- LPS de tentáculos largos;
- LPS de pólipos florales;
- coralimorfarios / mushroom;
- Zoanthus / Palythoa;
- corales cuero;
- Xenia / Anthelia;
- gorgonias;
- coral genérico.

Familias de peces implementadas:

- cirujano;
- ángel;
- mariposa;
- lábrido;
- gobio;
- payaso;
- caballito de mar;
- pez genérico.

Familias adicionales:

- plantas de roseta, tallo, césped, musgo y rizoma;
- bombas, filtros, skimmer, calentadores, iluminación y equipo genérico;
- roca;
- objeto genérico.

La familia puede resolverse automáticamente por el nombre del elemento y también puede seleccionarse manualmente en el editor.

## Editor de elementos

Archivos principales:

- `src/map/map-ui.js`
- `src/map/map-markers.js`
- `src/map/map-state.js`

Cada elemento colocado puede guardar:

- nombre;
- tipo;
- familia de modelo 3D;
- notas;
- posición izquierda/derecha (`x`);
- altura (`y`);
- profundidad (`z`);
- tamaño 3D;
- identificador propio.

Tipos disponibles:

- coral;
- planta;
- roca / zona;
- pez;
- equipo;
- otro.

## Persistencia del diseño

Archivo: `src/map/map-save.js`.

El diseño se serializa y guarda actualmente en `aquariums.ai_summary` con el prefijo:

`ACUARIONEXO_MAP_V2:`

Se guardan la escena, marcadores, posiciones, familias 3D y referencias asociadas. Las dimensiones físicas de la urna se guardan además en sus columnas propias de `aquariums`.

## Fotografías

Las fotografías han quedado como **referencia opcional**.

No son necesarias para crear la urna 3D. Si existen, pueden usarse como guía frontal, lateral izquierda, lateral derecha o superior para reproducir un montaje real.

El texto actual de interfaz deja explícito que las fotos no forman el acuario 3D.

## Interfaz actual

Archivo coordinador: `src/map/map.js`.

Título actual del módulo:

**Constructor de acuario 3D**

Texto actual:

**Diseña la urna con sus medidas reales y coloca dentro rocas, corales, plantas, peces y equipos.**

La pantalla integra:

1. constructor de dimensiones;
2. escena 3D;
3. controles de cámara;
4. editor de elementos;
5. guardado del diseño;
6. fotografías de referencia opcionales.

## Carga del módulo

El grupo `mapa` del cargador incluye actualmente:

- Three.js;
- contrato de mapa V3;
- estado del mapa;
- familias 3D;
- constructor de urna;
- interfaz;
- fotos;
- marcadores;
- render 3D;
- render de familias;
- guardado;
- coordinador;
- interacciones.

## Decisión pendiente

**Todavía no se debe eliminar ni trasladar la implementación actual del apartado Mapa/Gemelo 3D.**

El siguiente cambio previsto es añadir un acceso visible desde la portada para que el usuario pueda comenzar directamente un diseño 3D. Antes de hacerlo debe conservarse el módulo actual como base funcional y evitar duplicar o romper su lógica.

La portada debe actuar como **punto de entrada al constructor existente**, no como una segunda implementación independiente.

## Principio de producto

Mensaje de producto que define el módulo:

**Diseña tu acuario antes de montarlo.**

El usuario debe poder introducir dimensiones reales y construir visualmente la urna, decoración, equipos y habitantes en 3D sin depender de fotografías ni de generación de IA de pago.
