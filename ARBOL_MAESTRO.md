# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `navigation-structure-20260713-1540`.

## Núcleo / Navegación principal

`app.js`
→ mantiene el estado global y el renderizado base
→ elimina cualquier barra inferior anterior antes de renderizar
→ inserta una única `.bottom-nav` fuera de `#app`
→ muestra exactamente cinco accesos principales
→ Inicio / Acuarios / Biblioteca / Microfauna / Avisos
→ no duplica Inventario ni Admin en la navegación fija
→ no inserta separadores HTML de altura fija

## Biblioteca / Flujo de ficha

`library-v3-core.js`
→ lista y abre una ficha
→ `ficha-actions.js`
→ muestra `cover_url` y `photo_url`
→ muestra datos estructurados y fuentes
→ ofrece Editar / Añadir a mi acuario / Publicar / Borrar
→ «Añadir a mi acuario» llama a `ANX.LibraryInventoryImport.pasarFichaAInventario`
→ `library-inventory-import.js`
→ recarga la ficha desde `library_entries`
→ determina si el destino es acuario o inventario general
→ carga los acuarios del usuario cuando corresponde
→ muestra el formulario de alta con acuario, cantidad, unidad, fecha, procedencia, precio, lote y notas
→ guarda una copia real en `inventory_items`

`library-v3-template.js`
→ obtiene el contrato real mediante `LibrarySchema.templateFor(type)`
→ genera el texto «Copiar apartados» con cada clave JSON, mínimo, tipo y valor permitido
→ exige comprobación final antes de que ChatGPT responda
→ advierte que cualquier incumplimiento hará que AcuarioNexo rechace la ficha

`ficha-chat-import.js`
→ recibe el texto y el bloque `ACUARIONEXO_JSON_START/END`
→ detecta y valida el `entry_type`
→ construye la fila candidata sin guardarla
→ ejecuta `LibrarySchema.audit(entry)`
→ si existe un campo inválido, muestra todos los errores y no inserta nada
→ solo una ficha aprobada se guarda en `library_entries`

`library-v3-ficha.js`
→ edición y guardado
→ usa `library-v3-images.js` para las dos imágenes

## Acuarios / Animales

`aquariums.js`
→ abre un acuario
→ `openAqSection('animales')`
→ `module-loader.js`
→ carga `animals-core.js` y `animals.js`
→ `animals.js`
→ consulta `inventory_items` del acuario
→ filtra categorías vivas y organismos no dados de baja
→ muestra los animales del acuario

`dashboard()`
→ `loadAquariums()`
→ `loadDashboardStats(list)`
→ consulta `inventory_items` vinculados a todos los acuarios del usuario
→ aplica las mismas reglas de categorías vivas y estado
→ suma `quantity`
→ muestra el total en «Animales registrados»

## Propiedad única

- Navegación inferior y renderizado base: `app.js`.
- Vista abierta y acciones de ficha: `src/library/ficha/ficha-actions.js`.
- Contrato copiado al Chat: `src/library/library-v3-template.js`.
- Creación y validación previa desde texto del Chat: `src/library/ficha/ficha-chat-import.js`.
- Importación desde Biblioteca: `src/library/inventory/library-inventory-import.js` mediante `window.ANX.LibraryInventoryImport`.
- Editor de imágenes: `src/library/library-v3-images.js`.
- Editor y persistencia de ficha: `src/library/library-v3-ficha.js`.
- Ningún otro archivo puede redefinir `window.verFicha`, `LibraryV3Images.imageBox`, el contrato del Chat, el flujo de importación de Biblioteca ni la estructura de `.bottom-nav`.

## Android

- Workflow único de validación y publicación: `.github/workflows/build-android-apk.yml`.
- Auditoría real del emulador: `scripts/android-emulator-audit.sh`.
- Resultado persistente: `android-build-status.json`.
- Estado registrado: `success`.
- Commit validado: `30c5e6069d8b55f88eab6d90ec62cd5ebe2825f9`.
- Run ID: `29156270867`.
- Validado en emulador: `true`.
- APK: `https://github.com/121212castro/acuarionexo/releases/download/android-test-latest/AcuarioNexo-Android-Test.apk`.

### Criterio obligatorio de cierre Android

Android solo puede declararse terminado cuando, en una misma ejecución:

1. la aplicación web y el paquete móvil pasan;
2. el proyecto Android y los iconos se generan;
3. el APK compila y se instala en el emulador;
4. el proceso `com.acuarionexo.app` permanece activo;
5. `MainActivity` queda visible;
6. se genera captura y `logcat`;
7. no existe `FATAL EXCEPTION`, ANR ni cierre del proceso;
8. la release publica el APK;
9. `android-build-status.json` registra `status: success` y `validated_on_emulator: true`.

No se acepta como cierre una ejecución iniciada, una compilación aislada ni un APK generado sin instalación y arranque comprobados.

## Flujo de trabajo Android para futuras intervenciones

`.github/workflows/build-android-apk.yml`
→ valida web y paquete móvil
→ crea el proyecto Android y recursos oficiales
→ compila y renombra el APK
→ habilita KVM
→ ejecuta `scripts/android-emulator-audit.sh`
→ instala y abre `MainActivity`
→ verifica PID, actividad visible, captura y `logcat`
→ publica `android-test-latest`
→ actualiza `android-build-status.json`

Ante un fallo:
→ abrir el job exacto
→ descargar `AcuarioNexo-Android-Audit`
→ leer primero los archivos de estado y después los logs
→ corregir la causa en `main`
→ repetir hasta `status: success`
→ no detenerse en informes intermedios

## Automatización

- `npm run docs:refresh`: regenera MAPA y ÁRBOL.
- `npm run check`: regenera documentación y valida la app.
- `npm run mobile:prepare`: regenera documentación y prepara `www/` desde los activos reales.
- Después de cada cambio funcional, MAPA y ÁRBOL deben reflejar el flujo vigente y comprobarse desde GitHub.
- Después de una validación Android, MAPA y ÁRBOL deben conservar commit, run ID, estado y enlace vigentes.
