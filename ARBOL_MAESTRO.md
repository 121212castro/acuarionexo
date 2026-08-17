# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `library-image-drag-drop-20260810-2248`.

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

- `src/library/core/library-schema.js`: define los 14 contratos, campos, etiquetas, apartados y política de fuentes.
- `src/library/core/library-schema-rules.js`: convierte esos metadatos en una sola regla efectiva por campo y ejecuta la única auditoría.
- `src/library/library-v3-template.js`: genera para el Chat exactamente la misma regla efectiva y la ruta JSON de cada campo.
- `src/library/ficha/ficha-chat-import.js`: rechaza antes de insertar cualquier ficha que no apruebe `LibrarySchema.audit`.
- `src/library/library-v3-images.js`: gestiona la carga y persistencia de la portada y la foto interior.
- `src/library/library-v3-ficha.js`: usa la misma auditoría al editar y guardar; además gestiona el bloque opcional `data.external_link`.
- `src/library/ficha/ficha-actions.js`: vuelve a usar la misma auditoría al publicar o añadir y muestra el botón externo cuando está activado.
- `src/library/inventory/library-inventory-import.js`: vuelve a auditar antes de persistir la copia.
- `scripts/generate-library-server-contract.mjs`: genera el contrato del servidor directamente desde la regla efectiva del cliente.
- `supabase/functions/_shared/library-contract.generated.ts`: copia generada y desplegable; no se edita manualmente.
- `scripts/audit-library-contracts.mjs`: recorre los 14 tipos y verifica contrato, plantilla, servidor, valores cerrados, números, longitudes, resumen y fuentes.
- Las URLs de fuentes se deduplican por dirección canónica; parámetros UTM y otros identificadores de seguimiento no crean fuentes nuevas.
- No existe una segunda regla por pantalla ni una validación de IA que sustituya el contrato.

## Biblioteca / generador automático administrativo

- `src/admin/admin-library-generator.js`: propietario único de la entrada por lotes, consulta de la cola, orden y reintentos.
- `src/admin/admin-library-generator.css`: presentación adaptable de la cola; tarjetas en móvil.
- `supabase/functions/library-identify/index.ts`: identifica categoría, entidad y versión con el fabricante o marca exigido por el lote.
- `supabase/functions/library-generate-draft/index.ts`: inicia y consulta respuestas asíncronas de OpenAI; audita cada resultado y separa cada reparación en otra respuesta.
- `supabase/functions/library-generation-worker/index.ts`: consume una etapa persistente de la cola en cada ejecución, sin depender del navegador.
- `supabase/functions/_shared/library-v3.ts`: consume el contrato generado del cliente y aplica la misma auditoría en identificación, generación, revisión y publicación.
- Toda modificación de `_shared/library-v3.ts` o `library-contract.generated.ts` exige desplegar juntas `library-identify`, `library-generate-draft`, `library-generation-worker`, `library-audit-card` y `library-publish`.
- El trabajador conserva el `scientific_name` multiespecífico confirmado y garantiza que `data.culture_type` y `data.identification` declaren expresamente la mezcla.
- `data.ai_notes` debe terminar como texto técnico útil; si la IA devuelve un objeto, el trabajador lo serializa antes de auditarlo.
- `supabase/migrations/20260729233000_library_generation_worker.sql`: programa el trabajador con pg_cron y pg_net y autentica la llamada con Supabase Vault.
- `library_generation_jobs.identify_result.requested_brand`: conserva la marca común sin crear un contrato de datos paralelo.
- `library_generation_jobs.identify_result.generation_state`: conserva response_id, fase e intento para reanudar una búsqueda sin repetirla.
- `library_generation_jobs.queue_order`: fija el orden de entrada aunque varias filas se inserten en el mismo instante.
- Los nombres se limpian de numeración antes de insertarse y procesarse.
- Una ficha solo se bloquea como duplicada cuando su nombre completo normalizado coincide con otro título de la misma categoría ya guardado en la biblioteca; compartir especie, género, fabricante o palabras parciales no bloquea.
- El orden de la cola es el orden de entrada.
- Supabase despierta el trabajador cada minuto; la pantalla solo consulta el estado y puede cerrarse sin detener el proceso.
- Ninguna función espera encadenada la generación y tres reparaciones: cada llamada queda por debajo del límite de ejecución de Supabase.
- Un trabajo bloqueado o fallido muestra el motivo real y puede reintentarse de forma individual.
- Nunca publica fichas automáticamente: las deja en revisión privada para añadir fotos y validar.

## Biblioteca / reglas por clase de campo

- Valores cerrados: solo aceptan una opción exacta; no se les aplica longitud de texto descriptivo.
- Campos numéricos: exigen número o rango concreto.
- Nombre científico: exige binomio concreto válido.
- Identificadores, marcas, modelos, unidades y códigos: usan su longitud mínima específica.
- Campos descriptivos: usan la longitud mínima indicada por el contrato.
- `reef_safe`: solo `Sí`, `Sí con precaución` o `No`; la explicación pertenece a `reef_safe_notes`.
- `summary`: mínimo 20 caracteres.
- `sources`: mínimo tres fuentes reales con URL completa y `used_for`: una oficial o primaria, una base especializada adecuada a la categoría y una tercera fuente fiable.
- Para productos comerciales manda el fabricante, manual, prospecto o ficha técnica. Para peces, plantas, corales, invertebrados y microfauna se exige una base especializada de su categoría.
- Wikipedia puede complementar peces y plantas, pero nunca sustituye la fuente oficial, primaria o especializada.
- La generación, reparación y auditoría comparten esta política y bloquean la ficha cuando la combinación de fuentes no se cumple.

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
