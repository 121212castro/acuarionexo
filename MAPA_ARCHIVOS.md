# MAPA DE ARCHIVOS

Documento autogenerado por `scripts/refresh-project-docs.mjs`.

## Build actual

`navigation-structure-20260713-1540`

El build coincide en `index.html`, `app-version.json` y `manifest.webmanifest`.

## Núcleo / Navegación

- `app.js`: coordinador principal, estado global, renderizado base y única definición estructural de la barra inferior.
- La barra inferior contiene exactamente cinco accesos principales: Inicio, Acuarios, Biblioteca, Microfauna y Avisos.
- Inventario y Admin permanecen como módulos internos de la pantalla principal y no se duplican en la barra inferior.
- `render()` inserta una sola barra inferior fuera de `#app` y no añade separadores HTML de altura fija.

## Biblioteca / Fichas

- `src/library/library-v3-core.js`: carga, filtros, tarjetas y listado de Biblioteca.
- `src/library/library-v3-images.js`: único responsable del editor de `cover_url` y `photo_url`.
- `src/library/library-v3-ficha.js`: formulario, guardado, auditoría, publicación y borrado.
- `src/library/library-v3-template.js`: genera el texto que se copia al Chat con el contrato exacto de cada tipo, mínimos de longitud, valores permitidos, claves JSON y comprobación final obligatoria antes de responder.
- `src/library/ficha/ficha-chat-import.js`: crea fichas desde texto del Chat y ejecuta la auditoría completa antes de insertar; una ficha inválida se rechaza y no se guarda.
- `src/library/ficha/ficha-actions.js`: único responsable de la vista abierta, información, fuentes y acciones; conecta la acción «Añadir a mi acuario» con la API estructural del importador.
- `src/library/inventory/library-inventory-import.js`: único responsable de seleccionar acuario, mostrar el formulario y copiar una ficha válida al inventario correspondiente. Expone sus operaciones mediante `window.ANX.LibraryInventoryImport` y conserva alias globales para la interfaz existente.
- No se permiten archivos `hotfix`, `patch` o `clean` que redefinan la vista, las imágenes, la importación o el contrato de ficha.

## Acuarios / Resumen

- `src/aquariums/aquariums-core.js`: carga acuarios, tarjetas y estadísticas generales. El contador «Animales registrados» suma las cantidades vivas del inventario vinculadas a todos los acuarios del usuario.
- `src/aquariums/aquariums.js`: navegación y vista de cada acuario.
- `src/animals/animals-core.js`: categorías vivas, estado del organismo y tarjetas de animales.
- `src/animals/animals.js`: listado de animales vivos por acuario.
- `src/core/module-loader.js`: carga bajo demanda el grupo `animales` mediante `window.animales`.

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
- Después de cada cambio funcional, comprobar en GitHub que `MAPA_ARCHIVOS.md` y `ARBOL_MAESTRO.md` reflejan la responsabilidad y el flujo vigentes.
- Después de una validación Android, comprobar que MAPA y ÁRBOL contienen el commit, run ID, estado y enlace vigentes.
- `www/`, `android/`, `ios/` y `node_modules/` no se editan a mano.
