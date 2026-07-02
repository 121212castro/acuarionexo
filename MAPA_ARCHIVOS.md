# MAPA DE ARCHIVOS

## Activos web en produccion

Estos archivos son cargados por `index.html` o forman parte directa de la app publicada:

- `index.html`
- `app.js`
- `config.js`
- `styles.css`
- `aquarium-map.css`
- `login-reef.css`
- `aquarium-cards.css`
- `aquariums-mobile-fix.css`
- `mobile-form-fix.css`
- `library-images.css`
- `library-mobile-overflow-fix.css`
- Supabase CDN
- `src/aquariums/aquariums.js`
- `src/library/core/library-schema.js`
- `src/library/ui/library.js`
- `src/library/inventory/library-inventory-import.js`
- `src/library/library-v3.js`
- `src/library/ficha/ficha-chat-import.js`
- `src/animals/animals.js`
- `src/map/map-v3-model.js`
- `src/map/map.js`
- `src/photos/photos.js`
- `src/inventory/inventory.js`
- `src/microfauna/microfauna.js`
- `src/ai/ai.js`
- `src/ai/ai-library-v3.js`
- `src/ai/ai-alerts-extra.js`
- `src/parameters/parameters.js`
- `src/parameters/measurements-advanced.js`
- `src/tasks/tasks.js`
- `src/auth/auth.js`
- `update-manager.js`
- `notifications.js`
- `app-version.json`
- `manifest.webmanifest`
- `icon-512.png`

## Limpieza Biblioteca 02/07/2026

Eliminados del repositorio por estar fuera de carga activa o duplicar funciones:

- `src/library/library.js`
- `src/library/ficha/ficha-identify.js`
- `src/library/ficha/ficha-view.js`

Estado corregido:

- `src/library/ui/library.js` ya no carga `library.js` con `document.write`.
- `src/library/inventory/library-inventory-import.js` contiene la importacion de fichas validadas a inventario.
- `src/library/library-v3.js` es el dueño real de Biblioteca/Fichas.
- `src/library/ficha/ficha-chat-import.js` crea fichas nuevas desde texto pegado del Chat.
- `scripts/prepare-mobile-bundle.mjs` esta alineado con `index.html`.
- `scripts/validate-app.mjs` detecta duplicados criticos de funciones `window.*` de Biblioteca.

## App movil

- `capacitor.config.json`: app id `com.acuarionexo.app`, nombre `AcuarioNexo`, `webDir` `www`.
- `scripts/prepare-mobile-bundle.mjs`: copia los activos web oficiales a `www/`.
- `mobile/README.md`: reglas y distribucion Android/iOS.
- `.github/workflows/android-debug-apk.yml`: genera APK Android debug desde GitHub Actions.
- `www/`, `android/` e `ios/` son generados y no se versionan.

## Nucleo en `app.js`

- Configuracion compartida.
- Cliente Supabase.
- Estado comun `window.ANX.state`.
- Helpers DOM y render.
- Navegacion visual compartida.
- Cabecera de acuario.
- Subida de imagenes compartida.

## Modulos de negocio

- `src/aquariums/aquariums.js`: dashboard, acuarios y rutas internas del acuario.
- `src/library/core/library-schema.js`: contrato oficial reforzado de Biblioteca V3/V4 expuesto como `window.ANX.LibrarySchema`; define contratos, plantillas, campos obligatorios, normalizacion de fuentes y auditoria cliente.
- `src/library/ui/library.js`: marcador UI de Biblioteca; no carga modulos heredados.
- `src/library/inventory/library-inventory-import.js`: pasar fichas validadas/publicadas a inventario general o de acuario.
- `src/library/library-v3.js`: flujo Biblioteca V3/V4 de identificacion, borrador, edicion, auditoria, publicacion, borrado, copiado de apartados y pegado de texto en ficha existente.
- `src/library/ficha/ficha-chat-import.js`: creador de fichas nuevas desde texto pegado del Chat; reparte apartados a campos de contrato, crea fila en `library_entries` y abre la ficha para revisar/auditar.
- `src/animals/animals.js`: animales.
- `src/map/map-v3-model.js`: contrato de datos del gemelo digital.
- `src/map/map.js`: mapa IA y escena 3D real.
- `src/photos/photos.js`: fotos.
- `src/inventory/inventory.js`: inventario.
- `src/microfauna/microfauna.js`: cultivos de microfauna.
- `src/ai/ai.js`: motor IA y avisos sugeridos.
- `src/ai/ai-library-v3.js`: apoyo IA para Biblioteca V3.
- `src/ai/ai-alerts-extra.js`: revision extendida de avisos sin sobrescribir pantallas.
- `src/parameters/parameters.js`: parametros.
- `src/parameters/measurements-advanced.js`: medicion completa.
- `src/tasks/tasks.js`: tareas y avisos.
- `src/auth/auth.js`: auth y arranque.

## Arquitectura preparada de Biblioteca

Directorios activos o preparados:

- `src/library/core/`
- `src/library/inventory/`
- `src/library/images/`
- `src/library/ui/`
- `src/library/ficha/`

Responsabilidades:

- `src/library/core/`: nucleo, acceso a datos, utilidades, busqueda y esquema.
- `src/library/inventory/`: importacion, enlace y validacion de inventario.
- `src/library/images/`: subida, seleccion, previsualizacion y utilidades de imagen.
- `src/library/ui/`: render, tarjetas, toolbar y filtros.
- `src/library/ficha/`: generar, editar, auditar, publicar, ver, borrar, campos de ficha e importacion desde texto del Chat.

## Edge Functions Supabase Biblioteca

Proyecto Supabase: `vqpxhozavfzgtkqscncs`.

Funciones relevantes:

- `library-identify`: identifica la entidad antes de crear ficha.
- `library-generate-draft`: generacion de borrador reforzada; audita antes de guardar; repara hasta tres veces; si sigue pobre no guarda la ficha.
- `library-audit-card`: auditoria de ficha contra contrato reforzado.
- `library-publish`: publicacion de fichas validadas.
- Compartido: `supabase/functions/_shared/library-v3.ts` contiene contratos, normalizacion de fuentes, reparacion JSON, auditoria y cliente autenticado.

## Documentacion de control

- `ARCHIVOS_ACTIVOS.txt`
- `ARBOL_MAESTRO.md`
- `REGLAS_DE_CAMBIO.md`
- `CHECKLIST_ANTES_DE_EDITAR.md`
- `MAPA_ARCHIVOS.md`
- `README.md`
- `mobile/README.md`

## Validacion

- `package.json`: comandos `npm run check` y scripts Capacitor.
- `scripts/validate-app.mjs`: comprueba referencias de `index.html`, build, sintaxis JS, orden de carga y duplicados criticos de `window.*`.
- `scripts/prepare-mobile-bundle.mjs`: prepara paquete interno movil.

## Nota de control 02/07/2026

- Para saber que pantalla controla Biblioteca hay que revisar `index.html` y el orden de carga.
- La vista activa de ficha la controla `src/library/library-v3.js`.
- La importacion a inventario la controla `src/library/inventory/library-inventory-import.js`.
- La creacion nueva desde texto pegado la controla `src/library/ficha/ficha-chat-import.js`.
- La generacion IA real depende de Edge Functions desplegadas en Supabase, no solo del codigo en GitHub.
