# Árbol técnico — Generador de fichas AcuarioNexo

Generador de fichas
├── Entrada
│   ├── nombre
│   ├── marca o fabricante
│   └── categoría opcional
├── Identificación
│   ├── producto u organismo exacto
│   ├── versión y referencia
│   ├── fuentes mínimas de identidad
│   └── control de duplicado exacto
├── Investigación
│   ├── fuente oficial o primaria
│   ├── manual, prospecto o ficha técnica
│   ├── fuente especializada
│   ├── tercera fuente fiable
│   └── búsquedas específicas por research_gaps
├── Generación
│   ├── todos los campos del contrato
│   ├── dato verificado
│   ├── No aplica + justificación
│   └── No publicado + fuentes consultadas
├── Normalización
│   ├── identity → data
│   ├── measurement → data
│   ├── compatibility → data
│   ├── reagents → data
│   ├── purchase → data
│   ├── procedure → data
│   ├── maintenance → data
│   ├── reading → data
│   ├── recommended_values → data
│   ├── mapping → data
│   ├── use → data
│   ├── risks → data
│   └── ai → data
├── Auditoría
│   ├── contrato completo
│   ├── fuentes válidas
│   ├── valores y unidades
│   ├── ausencia de campos vacíos
│   └── coherencia entre ficha y fuentes
├── Decisión
│   ├── faltan campos
│   │   └── volver a Investigación con research_gaps
│   ├── hay contradicciones
│   │   └── Fichas a revisar con avisos
│   └── completa
│       └── Fichas a revisar, privada
└── Cola
    ├── pending
    ├── identifying
    ├── generating
    └── eliminar al crear la ficha de revisión

Regla final: completed solo puede existir con missing_fields = [].
