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

## Navegacion principal

`app.js` controla la barra inferior fija.

Modulos visibles:

- Inicio
- Acuarios
- Biblioteca
- Microfauna
- Avisos
- Inventario

## Microfauna

`src/microfauna/microfauna.js` es modulo principal visible.

Gestiona cultivos de:

- Rotiferos
- Copepodos
- Fitoplancton
- Artemia
- Infusorios

Funciones globales:

- `window.microfauna`
- `window.formMicrofauna`
- `window.saveMicrofauna`
- `window.registrarMicrofauna`

## Biblioteca/Fichas estado actual

Modulos activos:

- `src/library/core/library-schema.js`: contrato oficial reforzado de Biblioteca.
- `src/library/ui/library.js`: marcador UI; no carga modulos heredados.
- `src/library/inventory/library-inventory-import.js`: importacion de fichas validadas o publicadas a inventario.
- `src/library/library-v3.js`: dueño real de Biblioteca/Fichas.
- `src/library/ficha/ficha-chat-import.js`: creacion de fichas nuevas desde texto pegado del Chat.

Eliminados por duplicados o no cargados:

- `src/library/library.js`
- `src/library/ficha/ficha-identify.js`
- `src/library/ficha/ficha-view.js`

## Arquitectura Biblioteca

Directorios de trabajo:

- `src/library/core/`
- `src/library/inventory/`
- `src/library/images/`
- `src/library/ui/`
- `src/library/ficha/`

Responsabilidades:

- `src/library/core/`: contrato y utilidades.
- `src/library/inventory/`: importacion y enlace con inventario.
- `src/library/images/`: imagenes.
- `src/library/ui/`: render y UI.
- `src/library/ficha/`: ficha, edicion, vista, auditoria y entrada desde Chat.

## Estado Biblioteca 02/07/2026

- Contratos de ficha reforzados.
- `Copiar apartados para Chat` activo.
- `Pegar ficha del Chat` activo dentro de edicion.
- `Crear ficha desde Chat` activo en Biblioteca.
- Fuentes editables en ficha.
- `scripts/validate-app.mjs` detecta duplicados criticos de funciones globales de Biblioteca.
- `scripts/prepare-mobile-bundle.mjs` esta alineado con `index.html`.

Edge Functions relevantes:

- `library-identify`
- `library-generate-draft`
- `library-audit-card`
- `library-publish`
- `supabase/functions/_shared/library-v3.ts`

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
- Microfauna: `src/microfauna/microfauna.js`.
- Biblioteca/Fichas: `src/library/library-v3.js` y submodulos de `src/library/`.
- Importar fichas a inventario: `src/library/inventory/library-inventory-import.js`.
- Crear ficha nueva desde texto del Chat: `src/library/ficha/ficha-chat-import.js`.
- Contratos frontend: `src/library/core/library-schema.js`.
- Edge Functions de Biblioteca: `supabase/functions/`.
- Inventario: `src/inventory/inventory.js`.
- Parametros: `src/parameters/parameters.js` y `src/parameters/measurements-advanced.js`.
- IA/Avisos: `src/ai/` y `src/tasks/tasks.js`.
- Mapa: `src/map/`.
- Fotos: `src/photos/photos.js`.
- Compartido: `app.js`.

No volver a meter funcionalidades grandes en `app.js`.
Corregir siempre el modulo dueno real.

## Validacion oficial

Antes de cerrar cambios debe pasar:

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
