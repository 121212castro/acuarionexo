# AcuarioNexo

App oficial web: `https://121212castro.github.io/acuarionexo/`

Fuente de verdad:

- GitHub `main` para codigo publicado.
- Supabase para datos, auth, storage y backend.
- Capacitor para empaquetado movil iOS/Android con archivos internos.

Regla actual: local no es entorno vivo. Cualquier cambio valido debe subirse a GitHub o aplicarse en Supabase.

Antes de editar, leer:

- `ARBOL_MAESTRO.md`
- `REGLAS_DE_CAMBIO.md`
- `CHECKLIST_ANTES_DE_EDITAR.md`
- `MAPA_ARCHIVOS.md`
- `ARCHIVOS_ACTIVOS.txt`
- `mobile/README.md` si afecta a app movil.

Build web actual:

- `tasks-details-20260704-0245`

Supabase oficial:

- Proyecto `acuarionexo-oficial`
- Ref `vqpxhozavfzgtkqscncs`
- URL `https://vqpxhozavfzgtkqscncs.supabase.co`

Destino:

- GitHub Pages para servir la web.
- Supabase para datos y fotos.
- Capacitor para app Android/iOS con `www/` generado.
- Sin Vercel.

Estructura oficial:

- `app.js`: nucleo coordinador y helpers compartidos.
- `src/`: modulos de negocio por dominio.
- `index.html`: orden de carga explicito de la app publicada.
- `capacitor.config.json`: configuracion de app movil.
- `scripts/prepare-mobile-bundle.mjs`: genera `www/` para Capacitor.
- `.github/workflows/android-debug-apk.yml`: crea APK Android debug instalable.

Validacion oficial:

- Ejecutar `npm run check` antes de subir cambios.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app movil.
