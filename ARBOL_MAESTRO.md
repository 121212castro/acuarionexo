# ARBOL MAESTRO ACUARIONEXO

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

Fuente de verdad: GitHub `main`.

Build actual: `library-structure-clean-20260710-1005`.

## Biblioteca / Flujo de ficha

`library-v3-core.js`
→ lista y abre una ficha
→ `ficha-actions.js`
→ muestra `cover_url` y `photo_url`
→ muestra datos estructurados y fuentes
→ ofrece Editar / Añadir a mi acuario / Publicar / Borrar

`library-v3-ficha.js`
→ edición y guardado
→ usa `library-v3-images.js` para las dos imágenes

`library-inventory-import.js`
→ copia la ficha al acuario o al inventario correspondiente

## Propiedad única

- Vista abierta: `src/library/ficha/ficha-actions.js`.
- Editor de imágenes: `src/library/library-v3-images.js`.
- Editor y persistencia de ficha: `src/library/library-v3-ficha.js`.
- Ningún otro archivo puede redefinir `window.verFicha` ni `LibraryV3Images.imageBox`.

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
- Después de una validación Android, MAPA y ÁRBOL deben conservar commit, run ID, estado y enlace vigentes.
