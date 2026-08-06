# Generador IA de acuarios 3D — Fase 6

## Objetivo

Convertir una idea de acuario expresada por el usuario en un proyecto 3D estructurado, validable y editable. La salida no es una imagen: es un modelo JSON con medidas reales y objetos posicionados dentro de la urna.

## Propietario único

`src/map/map-ai-generator-contract.js`

Este archivo define el contrato de entrada y salida del generador. Las funciones de IA, el editor y el renderizador deberán consumir este contrato en lugar de crear formatos paralelos.

## Tipos de proyecto iniciales

- freshwater
- marine
- reef
- coldwater
- pond
- hospital
- quarantine

## Objetos iniciales

- substrate
- rock
- wood
- plant
- coral
- equipment
- zone
- decoration

## Unidades

- Longitud y posición: centímetros.
- Volumen: litros.
- Rotación: grados.

## Datos de la urna

- Ancho.
- Fondo.
- Alto.
- Altura del agua.
- Grosor del cristal.
- Volumen bruto estimado.
- Volumen de agua estimado.

## Datos de cada objeto

- Identificador.
- Tipo.
- Nombre visible.
- Fuente del objeto.
- Vínculo opcional con biblioteca o inventario.
- Posición X/Y/Z en centímetros.
- Rotación X/Y/Z en grados.
- Dimensiones reales.
- Material.
- Color.
- Bloqueo de edición.
- Visibilidad.
- Notas y restricciones.

## Validaciones actuales

- Identificadores duplicados.
- Objeto fuera del ancho de la urna.
- Objeto fuera de la altura de la urna.
- Objeto fuera del fondo de la urna.
- Objeto vinculado a biblioteca sin `library_entry_id`.
- Proyecto sin intención de diseño.
- Proyecto sin objetos.

## Compatibilidad con el mapa actual

`toMapV3()` transforma el proyecto con centímetros reales al sistema porcentual que utiliza actualmente `ANX_MAP_V3`. El JSON completo queda conservado dentro de `ai_project`, permitiendo evolucionar el renderizador sin perder medidas, rotaciones o dimensiones.

## Alcance del MVP de feria

El primer MVP deberá permitir:

1. Introducir medidas de urna.
2. Seleccionar tipo de acuario.
3. Describir el diseño por texto.
4. Generar sustrato, rocas, troncos, plantas, corales, equipos y zonas.
5. Visualizar el resultado con el render 3D existente.
6. Mover y editar elementos.
7. Solicitar cambios por texto.
8. Mostrar advertencias de espacio y datos faltantes.

## Limitaciones de esta fase

- Todavía no existe una Edge Function que convierta lenguaje natural al contrato.
- El portal todavía no contiene el formulario de proyecto 3D.
- El render actual no representa dimensiones y rotaciones completas de cada objeto.
- No se simulan flujo, iluminación, peso estructural ni crecimiento.
- No se guardan todavía proyectos previos separados de acuarios reales.

## Siguiente fase

Crear el generador servidor que reciba una descripción y devuelva JSON estricto conforme a este contrato. Después se conectará a una vista previa 3D antes de guardar o convertir el proyecto en acuario real.
