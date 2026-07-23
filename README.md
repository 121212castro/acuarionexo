# AcuarioNexo

App oficial web: `https://121212castro.github.io/acuarionexo/`

Fuente de verdad:

- GitHub `main` para código publicado.
- Supabase para datos, autenticación, Storage y backend.
- Capacitor para empaquetado móvil iOS/Android con archivos internos.

Regla actual: local no es entorno vivo. Cualquier cambio válido debe subirse a GitHub o aplicarse en Supabase.

Antes de editar, leer:

- `ARBOL_MAESTRO.md`
- `REGLAS_DE_CAMBIO.md`
- `CHECKLIST_ANTES_DE_EDITAR.md`
- `MAPA_ARCHIVOS.md`
- `ARCHIVOS_ACTIVOS.txt`
- `mobile/README.md` si afecta a la app móvil.

Build web actual:

- `library-contract-link-20260723-1305`

Biblioteca:

- Los 13 tipos de ficha proceden de `src/library/core/library-schema.js`.
- `src/library/core/library-schema-rules.js` es la única auditoría efectiva.
- `src/library/library-v3-template.js` entrega al Chat exactamente las mismas reglas y rutas JSON.
- `scripts/audit-library-contracts.mjs` verifica cada tipo y cada campo contra contrato, plantilla y auditoría.
- Una validación de IA, un estado publicado o una pantalla distinta no pueden sustituir `LibrarySchema.audit`.

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

- `app.js`: núcleo coordinador y helpers compartidos.
- `src/`: módulos de negocio por dominio.
- `index.html`: orden de carga explícito de la app publicada.
- `capacitor.config.json`: configuración de app móvil.
- `scripts/prepare-mobile-bundle.mjs`: genera `www/` para Capacitor.

Validación oficial:

- Ejecutar `npm run docs:refresh` después de cambiar cargas, contratos, responsabilidades o build.
- Ejecutar `npm run check` antes de subir cambios.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.