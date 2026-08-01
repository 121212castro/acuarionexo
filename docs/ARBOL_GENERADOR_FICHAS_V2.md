# Árbol del generador de fichas V2

```text
INICIO
└── Seleccionar categoría
    ├── Categoría inexistente → BLOQUEAR
    └── Categoría válida
        └── Cargar contrato desde LibrarySchema
            └── Introducir nombre exacto
                ├── Vacío → BLOQUEAR
                └── Con nombre
                    └── Investigar y generar JSON
                        ├── Respuesta técnica inválida → BLOQUEAR, NO GUARDAR
                        └── JSON recibido
                            └── Reconstruir entrada sin coerciones
                                └── Auditar con LibrarySchema.audit
                                    ├── Cero errores
                                    │   └── Guardar en review
                                    │       └── Abrir ficha
                                    └── Hay errores
                                        └── Reparación 1 con errores exactos
                                            └── Auditar
                                                ├── Cero errores → Guardar
                                                └── Hay errores
                                                    └── Reparación 2
                                                        └── Auditar
                                                            ├── Cero errores → Guardar
                                                            └── Hay errores → BLOQUEAR, NO GUARDAR
```

## Identificación biológica

```text
Nombre científico
├── Binomio válido → ACEPTAR
├── Mezcla de Microfauna con +
│   ├── culture_type/identification confirma mezcla → ACEPTAR
│   └── No confirma mezcla → BLOQUEAR
└── Género sp. en Microfauna
    ├── identification/ai_notes explica especie no publicada o no confirmada → ACEPTAR
    └── No existe explicación → BLOQUEAR
```

## Parámetros de Microfauna

```text
Temperatura o salinidad
├── Existe valor conjunto verificado → guardar número/rango
└── No existe valor conjunto para mezcla o género sin especie
    ├── explicación documentada y concreta → ACEPTAR texto
    └── campo vacío o relleno genérico → BLOQUEAR
```

## Fuentes

```text
sources[]
├── Menos de 3 → BLOQUEAR
├── Falta used_for → BLOQUEAR
├── Categoría biológica sin base especializada → BLOQUEAR
├── Producto sin fuente oficial → BLOQUEAR
├── Menos de 2 dominios fiables → BLOQUEAR
└── Cumple todo → ACEPTAR
```
