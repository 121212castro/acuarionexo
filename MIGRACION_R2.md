# Migración de medios de AcuarioNexo a Cloudflare R2

## Estado preparado

El código de AcuarioNexo ya admite dos proveedores de imágenes:

- `supabase` (actual y activo)
- `r2` (preparado, todavía desactivado)

No se cambia el proveedor activo hasta que R2 esté creado, probado y contenga una copia válida de los archivos.

## Inventario de migración

El manifiesto `data/storage-migration-manifest.json` contiene únicamente los buckets públicos de Biblioteca:

- `library-images`
- `library-generated-covers`

No contiene fotos privadas de acuarios ni archivos de usuarios.

## Crear R2

1. Crear en Cloudflare un bucket R2 llamado `acuarionexo-media`.
2. Crear credenciales S3/R2 con permisos de lectura y escritura sobre ese bucket.
3. Configurar una URL pública o desplegar el Worker incluido en `cloudflare/r2-worker`.
4. No guardar claves R2 en GitHub ni en `config.js`.

## Variables para migrar

Configurar localmente:

```bash
export R2_ACCOUNT_ID="..."
export R2_ACCESS_KEY_ID="..."
export R2_SECRET_ACCESS_KEY="..."
export R2_BUCKET="acuarionexo-media"
export R2_PUBLIC_BASE_URL="https://media.acuarionexo.com/media"
```

Después:

```bash
npm install
npm run r2:migrate
```

El migrador:

- no borra nada de Supabase;
- conserva la ruta original bajo `supabase/<bucket>/<ruta>`;
- omite objetos que ya existen en R2;
- guarda el resultado en `data/r2-migration-result.json`;
- registra por separado cualquier archivo que Supabase no permita descargar.

Mientras Supabase mantenga el 402 de cuota, es posible que las descargas desde Storage fallen. El migrador está preparado para continuar/reintentarse en cuanto el origen permita lectura.

## Worker de medios

El Worker está en:

`cloudflare/r2-worker/src/index.js`

Configuración:

`cloudflare/r2-worker/wrangler.toml`

Antes de desplegar:

- enlazar el bucket R2;
- definir `SUPABASE_ANON_KEY` como secreto/variable de Worker;
- definir `PUBLIC_BASE_URL`;
- comprobar `ALLOWED_ORIGIN`.

Despliegue:

```bash
npm run r2:worker:deploy
```

El Worker ofrece:

- `GET /health`
- `GET /media/<ruta>`
- `POST /upload` autenticado
- `DELETE /object?key=<ruta>` autenticado y limitado al propietario

## Cambio de URLs de fichas

Cuando la copia de R2 esté verificada:

```bash
node scripts/generate-r2-relink-sql.mjs
```

Esto genera `data/r2-relink-library.sql`.

El SQL actualiza solamente referencias exactas migradas de:

- `cover_url`
- `photo_url`
- `image_assets.cover.original`
- `image_assets.photo.original`
- `image_assets.cover.generated_from_photo_url`

Ejecutar el SQL únicamente después de comprobar que los objetos existen y cargan desde R2.

## Activar R2 para nuevas imágenes

Después de desplegar el Worker y probarlo, cambiar en `config.js`:

```js
MEDIA_PROVIDER: "r2",
MEDIA_API_URL: "https://<worker-o-dominio>",
MEDIA_PUBLIC_BASE_URL: "https://<dominio-publico>/media",
```

A partir de entonces las nuevas imágenes cargadas desde la app irán a R2.

## Liberar Supabase

No borrar Storage de Supabase hasta comprobar:

1. todas las URLs migradas responden;
2. las fichas muestran las portadas correctas;
3. las fotos interiores funcionan;
4. nuevas cargas van a R2;
5. la copia de seguridad de la base de datos está realizada.

Después puede eliminarse físicamente el contenido antiguo de Storage mediante la API oficial de Supabase cuando la plataforma vuelva a permitir DELETE.

## Regla permanente

Las imágenes nuevas no deben volver a depender exclusivamente de Supabase Storage. Supabase queda como backend de datos/autenticación mientras R2 se utiliza para medios pesados.
