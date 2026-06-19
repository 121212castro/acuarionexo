# AcuarioNexo

App oficial: `https://121212castro.github.io/acuarionexo/`

Fuente de verdad:

- GitHub `main` para codigo publicado.
- Supabase para datos, auth, storage y configuracion de backend.

Regla actual: local no es entorno vivo. Cualquier cambio valido debe subirse a GitHub o aplicarse en Supabase.

Antes de editar, leer:

- `ARBOL_MAESTRO.md`
- `REGLAS_DE_CAMBIO.md`
- `CHECKLIST_ANTES_DE_EDITAR.md`
- `MAPA_ARCHIVOS.md`
- `ARCHIVOS_ACTIVOS.txt`

Build actual:

- `biblioteca-store-only-v1-20260619`

Destino:

- GitHub Pages para servir la app.
- Supabase para datos y fotos.
- Sin Vercel.

Estructura oficial:

- `app.js`: nucleo coordinador y helpers compartidos.
- `src/`: modulos de negocio por dominio.
- `index.html`: orden de carga explicito de la app publicada.

Validacion oficial:

- Ejecutar `npm run check` antes de subir cambios.
