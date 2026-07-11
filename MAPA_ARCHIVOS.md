# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

## Build actual

`library-structure-clean-20260710-1005`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Biblioteca / Fichas

- `src/library/library-v3-core.js`: carga, filtros, tarjetas y listado de Biblioteca.
- `src/library/library-v3-images.js`: único responsable del editor de `cover_url` y `photo_url`.
- `src/library/library-v3-ficha.js`: formulario, guardado, auditoría, publicación y borrado.
- `src/library/ficha/ficha-actions.js`: único responsable de la vista abierta, información, fuentes y acciones.
- `src/library/inventory/library-inventory-import.js`: importación al acuario o inventario correspondiente.
- No se permiten archivos `hotfix`, `patch` o `clean` que redefinan la vista o las imágenes de ficha.

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

## Regla de actualización

- Ejecutar `npm run docs:refresh` después de modificar cargas, módulos, responsabilidades, build o el sistema Android.
- `npm run check` y `npm run mobile:prepare` regeneran este documento.
- Después de una validación Android, comprobar que MAPA y ÁRBOL contienen el commit, run ID, estado y enlace vigentes.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan a mano.
