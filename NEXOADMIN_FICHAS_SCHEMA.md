# NexoAdmin · Estructura completa de fichas

## Objetivo
Cuando se cargue una foto o exportacion de Canva, NexoAdmin debe identificar a que tipo de ficha pertenece y generar una ficha completa, revisable y publicable en AcuarioNexo.

## Clasificacion principal
- inventario_producto
- pez_marino
- pez_dulce
- coral
- invertebrado
- planta_dulce
- alimento
- medicamento
- tratamiento
- sal_marina
- aditivo
- test_parametro
- equipamiento
- microfauna
- enfermedad
- guia_mantenimiento

## Campos obligatorios comunes
- tipo_ficha
- categoria
- marca
- nombre_comercial
- nombre_cientifico_si_aplica
- resumen_corto
- descripcion_detallada
- usos_principales
- modo_de_uso
- dosis
- advertencias
- compatibilidad
- acuario_compatible
- parametros_relacionados
- errores_frecuentes
- mantenimiento_o_seguimiento
- cuando_no_usar
- nivel_confianza
- fuentes_recomendadas_para_verificar
- notas_admin

## Si es producto de inventario
- fabricante
- formato
- composicion
- funcion
- dosis_marino
- dosis_dulce
- dosis_arrecife
- frecuencia_uso
- sobredosificacion
- almacenamiento
- caducidad
- interacciones
- reef_safe
- seguro_para_gambas_caracoles_corales

## Si es pez
- nombre_cientifico
- familia
- origen
- tamano_adulto
- litros_minimos
- comportamiento
- compatibilidad
- alimentacion
- parametros_agua
- dificultad
- reef_safe
- observaciones

## Si es coral
- tipo_coral
- luz
- flujo
- colocacion
- agresividad
- alimentacion
- parametros_agua
- crecimiento
- compatibilidad
- dificultad

## Regla principal
Si no se puede confirmar un dato por la foto, debe marcarse como pendiente_verificacion y no inventarse.

## Salida esperada
Gemini debe devolver JSON valido sin Markdown, sin explicaciones fuera del JSON.
