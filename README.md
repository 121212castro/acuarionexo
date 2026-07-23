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

- `admin-global-access-20260723-2325`

Administración:

- `index.html` contiene el único botón persistente `adminBtn`.
- `src/auth/auth-core.js` lo muestra únicamente cuando existe sesión y `state.isAdmin` es verdadero.
- `src/admin/admin-core.js` determina el rol oficial mediante `admin_roles`.
- `src/core/module-loader.js` carga `adminPanel` desde cualquier pantalla.
- Los usuarios no administradores no ven el botón.

Biblioteca:

- Los 13 tipos de ficha proceden de `src/library/core/library-schema.js`.
- `src/library/core/library-schema-rules.js` es la única auditoría efectiva.
- `src/library/library-v3-template.js` entrega al Chat exactamente las mismas reglas y rutas JSON.
- `scripts/audit-library-contracts.mjs` verifica cada tipo y cada campo contra contrato, plantilla y auditoría.

Supabase oficial:

- Proyecto `acuarionexo-oficial`
- Ref `vqpxhozavfzgtkqscncs`
- URL `https://vqpxhozavfzgtkqscncs.supabase.co`

Destino:

- GitHub Pages para servir la web.
- Supabase para datos y fotos.
- Capacitor para app Android/iOS con `www/` generado.
- Sin Vercel.

Validación oficial:

- Ejecutar `npm run docs:refresh` después de cambiar cargas, contratos, responsabilidades o build.
- Ejecutar `npm run check` antes de subir cambios.
- Ejecutar `npm run mobile:prepare` cuando cambien archivos activos usados por la app móvil.
- Comprobar después `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt`.