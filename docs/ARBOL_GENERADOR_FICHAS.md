# Árbol técnico — Generador de fichas AcuarioNexo

Generador de fichas
├── Entrada
│   ├── nombre
│   ├── marca o fabricante
│   └── categoría opcional
├── Identificación
│   ├── producto u organismo exacto
│   ├── versión y referencia
│   ├── fabricante o fuente primaria
│   ├── dos fuentes independientes
│   └── control de duplicado exacto
├── Contrato
│   ├── carga de campos por categoría
│   ├── todos los campos obligatorios
│   └── prohibido cerrar con omisiones
├── Investigación
│   ├── fabricante
│   ├── catálogo oficial
│   ├── manuales y PDF
│   ├── fichas técnicas
│   ├── distribuidores oficiales
│   ├── fuentes especializadas
│   └── nuevas búsquedas específicas por cada campo pendiente
├── Generación
│   ├── dato verificado
│   ├── No aplica + justificación técnica
│   ├── No publicado + documentación revisada
│   └── sources con URL y used_for
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
│   ├── 0 campos vacíos
│   ├── fuentes válidas
│   ├── valores y unidades
│   ├── ausencia de trazas internas
│   └── coherencia entre ficha y fuentes
├── Decisión
│   ├── faltan campos
│   │   └── volver a Investigación con búsquedas dirigidas
│   ├── fuentes insuficientes
│   │   └── ampliar investigación
│   ├── campos inválidos
│   │   └── reparar y volver a auditar
│   └── contrato completo
│       ├── crear ficha privada en review
│       └── eliminar trabajo de la cola
└── Administración
    ├── revisar
    ├── corregir
    ├── validar
    └── borrar

Implementación activa
├── library-generation-worker
├── versión 13
├── investigación iterativa sin cierre prematuro
└── completed solo cuando missing_fields = []
