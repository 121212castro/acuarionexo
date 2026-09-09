# Estado del Constructor 3D de AcuarioNexo — 09/09/2026

Este documento deja constancia del estado real del módulo y de la decisión de mantener **dos accesos al mismo constructor 3D**: uno desde la portada y otro dentro de cada acuario.

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
- Guardado de las dimensiones reales en la tabla `aquariums` de Supabase cuando se trabaja dentro de un acuario existente.
- Aplicación de las medidas solo al borrador cuando se trabaja desde portada.
- Actualización del objeto de acuario en memoria.
- Recentrado de la vista 3D.

Campos de `aquariums` utilizados:

- `tank_length_cm`
- `tank_width_cm`
- `tank_height_cm`
- `display_water_height_cm`
- `gross_liters`
- `display_water_liters`
- `display_net_liters`
- `system_net_liters`
- `real_liters`
- `liters`
- `volume_liters`

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

## Interfaz dentro de cada acuario

Archivo coordinador: `src/map/map.js`.

Dentro de cada acuario se mantiene el acceso al **Constructor de acuario 3D** desde su apartado Mapa/Gemelo 3D.

Ese contexto trabaja directamente con el acuario real y permite:

1. modificar y guardar sus medidas;
2. editar la escena 3D;
3. colocar elementos;
4. guardar el diseño asociado a ese acuario;
5. utilizar fotos solo como referencia opcional.

## Acceso desde portada

Se añadió un segundo acceso desde Inicio, sin duplicar el motor ni el editor.

Archivo de entrada: `src/aquariums/aquariums.js`.

La portada muestra ahora:

**Diseña tu acuario en 3D**

El botón **Diseñar acuario 3D** carga el mismo grupo `mapa` y abre un borrador independiente.

Archivo específico de contexto: `src/map/map-standalone.js`.

Características del modo portada:

- crea un borrador temporal, inicialmente 80 × 30 × 35 cm;
- utiliza exactamente el mismo constructor de medidas;
- utiliza el mismo motor Three.js;
- utiliza las mismas familias 3D;
- utiliza el mismo editor de elementos;
- no necesita que exista previamente un acuario en la cuenta;
- no guarda cambios de medidas en Supabase mientras siga siendo borrador;
- permite poner nombre y tipo al diseño;
- ofrece **Guardar como nuevo acuario**;
- al guardar, crea una fila real en `aquariums` y conserva la escena 3D en `ai_summary`;
- respeta el límite de acuarios del plan mediante `app_entitlements`;
- tras guardarlo, el usuario continúa en el Gemelo 3D del acuario recién creado.

## Arquitectura compartida

Los dos accesos usan el mismo motor. No existen dos constructores independientes.

**Portada** → diseño nuevo / simulador → guardar como nuevo acuario.

**Dentro de un acuario** → Gemelo 3D persistente del acuario real.

El grupo `mapa` del cargador incluye:

- Three.js;
- contrato de mapa V3;
- estado del mapa;
- familias 3D;
- constructor de urna;
- contexto independiente de portada;
- interfaz;
- fotos;
- marcadores;
- render 3D;
- render de familias;
- guardado;
- coordinador;
- interacciones.

## Regla de mantenimiento

No se debe crear una segunda implementación paralela para portada. Cualquier mejora futura del constructor, las familias, el render o el editor debe beneficiar a ambos contextos.

El acceso dentro de cada acuario no se elimina ni se sustituye.

## Principio de producto

Mensaje de producto que define el módulo:

**Diseña tu acuario antes de montarlo.**

El usuario puede introducir dimensiones reales y construir visualmente la urna, decoración, equipos y habitantes en 3D sin depender de fotografías ni de generación de IA de pago.