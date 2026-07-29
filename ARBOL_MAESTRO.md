# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `release-9c8ae91bc15f`.

## Navegación administrativa global

`admin_roles`
→ `src/admin/admin-core.js` resuelve `state.isAdmin`
→ `src/auth/auth-core.js` muestra u oculta `adminBtn`
→ `index.html` mantiene el botón en la cabecera de todas las pantallas
→ `src/core/module-loader.js` carga `adminPanel`
→ `src/admin/admin.js` presenta el Panel de Administración

## Administración / acceso global

- `index.html`: contiene el único botón persistente `adminBtn` de la cabecera.
- `src/auth/auth-core.js`: muestra el botón únicamente cuando existe sesión y `state.isAdmin === true`.
- `src/admin/admin-core.js`: determina el rol administrativo oficial mediante `admin_roles`.
- `src/core/module-loader.js`: `adminPanel` carga el módulo oficial `src/admin/admin.js`.
- El botón está disponible desde cualquier pantalla y abre siempre el Panel de Administración.
- Los usuarios sin rol administrativo no ven el botón.
- No se permiten botones Admin duplicados dentro de pantallas concretas.

## Flujo maestro de una ficha

`library-schema.js`
→ define el contrato y metadatos del tipo
→ `library-schema-rules.js` crea la regla efectiva única
→ `library-v3-template.js` entrega esa misma regla al Chat y fija la ruta JSON
→ `ficha-chat-import.js` audita antes de insertar
→ `library-v3-ficha.js` audita al guardar y normaliza `data.external_link`
→ `ficha-actions.js` audita al publicar o añadir y representa el botón externo
→ `library-inventory-import.js` audita antes de persistir la copia

Una ficha no puede avanzar por estado, validación de IA ni publicación si falla `LibrarySchema.audit`.

## Biblioteca / cadena única de contrato

- `src/library/core/library-schema.js`: define los 13 contratos, campos, etiquetas, apartados y metadatos base.
- `src/library/core/library-schema-rules.js`: convierte esos metadatos en una sola regla efectiva por campo y ejecuta la única auditoría.
- `src/library/library-v3-template.js`: genera para el Chat exactamente la misma regla efectiva y la ruta JSON de cada campo.
- `src/library/ficha/ficha-chat-import.js`: rechaza antes de insertar cualquier ficha que no apruebe `LibrarySchema.audit`.
- `src/library/library-v3-images.js`: gestiona la carga y persistencia de la portada y la foto interior.
- `src/library/library-v3-ficha.js`: usa la misma auditoría al editar y guardar; además gestiona el bloque opcional `data.external_link`.
- `src/library/ficha/ficha-actions.js`: vuelve a usar la misma auditoría al publicar o añadir y muestra el botón externo cuando está activado.
- `src/library/inventory/library-inventory-import.js`: vuelve a auditar antes de persistir la copia.
- `scripts/audit-library-contracts.mjs`: recorre los 13 tipos y verifica contrato, plantilla, rutas, valores cerrados, números, longitudes, resumen y fuentes.
- No existe una segunda regla por pantalla ni una validación de IA que sustituya el contrato.

## Biblioteca / reglas por clase de campo

- Valores cerrados: solo aceptan una opción exacta; no se les aplica longitud de texto descriptivo.
- Campos numéricos: exigen número o rango concreto.
- Nombre científico: exige binomio concreto válido.
- Identificadores, marcas, modelos, unidades y códigos: usan su longitud mínima específica.
- Campos descriptivos: usan la longitud mínima indicada por el contrato.
- `reef_safe`: solo `Sí`, `Sí con precaución` o `No`; la explicación pertenece a `reef_safe_notes`.
- `summary`: mínimo 20 caracteres.
- `sources`: mínimo dos fuentes reales con URL completa.

## Biblioteca / enlace externo opcional

- Todas las fichas pueden almacenar un único bloque común en `data.external_link`.
- El bloque permanece oculto cuando `enabled !== true` o la URL no es válida.
- `src/library/library-v3-ficha.js` es el propietario de edición, normalización, importación JSON y validación de la URL.
- `src/library/ficha/ficha-actions.js` es el propietario de la representación pública del botón.
- Campos disponibles: `enabled`, `provider`, `url`, `button_label`, `link_type`, `disclaimer`, `sponsored` y `affiliate`.
- No se almacena precio en este bloque y su existencia no implica patrocinio, afiliación ni colaboración.
- `commercial_link` solo se acepta como alias de lectura para migrar datos antiguos; al guardar se normaliza a `external_link`.
- No se permiten botones externos paralelos, lógica duplicada por tipo de ficha ni archivos hotfix.

## Propietarios únicos

- `index.html`: estructura de la cabecera y botón global Admin.
- `src/auth/auth-core.js`: visibilidad de controles de sesión y del acceso Admin.
- `src/admin/admin-core.js`: autorización y rol administrativo.
- `src/library/core/library-schema.js`: contratos y metadatos base.
- `src/library/core/library-schema-rules.js`: regla efectiva y auditoría única.
- `src/library/library-v3-template.js`: instrucciones y esqueleto JSON para el Chat.
- `src/library/ficha/ficha-chat-import.js`: entrada de fichas desde Chat.
- `src/library/library-v3-images.js`: carga y persistencia de imágenes de las fichas.
- `src/library/library-v3-ficha.js`: edición, guardado y validación del enlace externo opcional.
- `src/library/ficha/ficha-actions.js`: vista, publicación, entrada para añadir y representación del botón externo.
- `src/library/inventory/library-inventory-import.js`: destino y persistencia en inventario.
- `src/parameters/parameters-core.js`: catálogo de fichas Test y compatibilidad por parámetro.
- No se permiten hotfix, patch, wrappers, validadores paralelos ni contratos duplicados.

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, contratos, responsabilidades o build.
- Ejecutar `npm run check` antes de publicar.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan manualmente.
