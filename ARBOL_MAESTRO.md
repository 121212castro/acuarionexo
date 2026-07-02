# ARBOL MAESTRO ACUARIONEXO

Fuente de verdad: GitHub `main`.

App web publicada: `https://121212castro.github.io/acuarionexo/`.

App movil: Capacitor, con archivos internos generados en `www/`.

Datos y autenticacion: Supabase.

## Entrada real web

`index.html` es la unica entrada web publicada por GitHub Pages.

Carga activa actual:

- `styles.css`
- `aquarium-map.css`
- `login-reef.css`
- `aquarium-cards.css`
- `aquariums-mobile-fix.css`
- `mobile-form-fix.css`
- `library-images.css`
- `library-mobile-overflow-fix.css`
- Supabase CDN
- `config.js`
- `app.js`
- `src/aquariums/aquariums.js`
- `src/library/core/library-schema.js`
- `src/library/ui/library.js`
- `src/library/ficha/ficha-identify.js`
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

## Nucleo funcional

`app.js` contiene configuracion compartida, estado, helpers DOM, render, cabecera de acuario, subida de imagenes y `window.ANX`.

`src/auth/auth.js` se carga al final porque ejecuta el arranque.

## Biblioteca/Fichas estado actual

Modulos activos:

- `src/library/core/library-schema.js`: contrato oficial reforzado de Biblioteca; expone `window.ANX.LibrarySchema`; contiene contratos por tipo, plantillas, normalizacion de fuentes y auditoria cliente.
- `src/library/ui/library.js`: puente de carga controlado hacia `src/library/library.js`.
- `src/library/library.js`: modulo heredado conservado, cargado por el puente UI.
- `src/library/ficha/ficha-identify.js`: identificacion separada de fichas.
- `src/library/library-v3.js`: vista activa de Biblioteca/Fichas; define `window.verFicha`; gestiona identificar, crear borrador, editar, auditar, publicar, borrar, pasar a inventario, copiar apartados, fuentes editables y pegar ficha del Chat en una ficha existente.
- `src/library/ficha/ficha-chat-import.js`: crea fichas nuevas desde texto pegado del Chat desde la pantalla principal de Biblioteca.

Modulo excluido de carga activa:

- `src/library/ficha/ficha-view.js`: no se carga en `index.html` para evitar duplicar y pisar `window.verFicha`.

## Arquitectura Biblioteca preparada

Directorios de trabajo:

- `src/library/core/`
- `src/library/inventory/`
- `src/library/images/`
- `src/library/ui/`
- `src/library/ficha/`

Responsabilidades previstas:

- `src/library/core/`: nucleo, esquema, utilidades y busqueda.
- `src/library/inventory/`: importacion y enlace con inventario.
- `src/library/images/`: subida y gestion de imagenes.
- `src/library/ui/`: render, tarjetas, filtros y toolbar.
- `src/library/ficha/`: identificar, generar, editar, auditar, publicar, ver, borrar, campos e importacion desde texto del Chat.

## Estado Biblioteca 02/07/2026

- Contratos de ficha reforzados para evitar fichas pobres.
- Boton `Copiar apartados para Chat` activo.
- Boton `Pegar ficha del Chat` activo dentro de edicion de ficha existente.
- Boton `Crear ficha desde Chat` activo en la pantalla principal de Biblioteca.
- Fuentes editables en ficha.
- Creador desde texto exige fuentes con URL.
- Generacion IA real depende de Edge Functions desplegadas en Supabase.

Edge Functions relevantes:

- `library-identify`: identifica entidad.
- `library-generate-draft`: genera, audita, repara y no guarda fichas pobres si la auditoria final falla.
- `library-audit-card`: audita contra contrato reforzado.
- `library-publish`: publica fichas validadas.
- `supabase/functions/_shared/library-v3.ts`: contratos, fuentes, auditoria y reparacion de JSON.

## Entrada real movil

Capacitor usa:

- `capacitor.config.json`
- `scripts/prepare-mobile-bundle.mjs`
- `package.json` scripts `mobile:*`

`www/`, `android/` e `ios/` son generados y no se editan a mano.

## Regla de mantenimiento

Para cambios normales:

- Auth: `src/auth/auth.js`.
- Acuarios: `src/aquariums/aquariums.js`.
- Biblioteca/Fichas: `src/library/ui/library.js`, `src/library/library.js`, `src/library/library-v3.js` y submodulos de `src/library/`.
- Crear ficha nueva desde texto del Chat: `src/library/ficha/ficha-chat-import.js`.
- Contratos frontend: `src/library/core/library-schema.js`.
- Contratos y generacion de Edge Functions: `supabase/functions/_shared/library-v3.ts`, `supabase/functions/library-generate-draft/index.ts`, `supabase/functions/library-audit-card/index.ts`.
- Inventario: `src/inventory/inventory.js`.
- Parametros: `src/parameters/parameters.js` y `src/parameters/measurements-advanced.js`.
- IA/Avisos: `src/ai/ai.js`, `src/ai/ai-library-v3.js`, `src/ai/ai-alerts-extra.js`, `src/tasks/tasks.js`.
- Mapa: `src/map/map.js` y `src/map/map-v3-model.js`.
- Fotos: `src/photos/photos.js`.
- Compartido: `app.js`.

No volver a meter funcionalidades grandes en `app.js`.
Corregir siempre el modulo dueno real.

## Validacion oficial

Antes de subir cambios debe pasar:

- `npm run check`

Si el cambio afecta a movil:

- `npm run mobile:prepare`

## Regla antes de editar

Antes de cambiar cualquier archivo:

1. Leer `ARBOL_MAESTRO.md`.
2. Leer `REGLAS_DE_CAMBIO.md`.
3. Leer `CHECKLIST_ANTES_DE_EDITAR.md`.
4. Confirmar que el cambio pertenece a GitHub/Supabase.
5. Confirmar que `index.html` y `scripts/prepare-mobile-bundle.mjs` siguen alineados.
