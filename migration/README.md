# Migración de AcuarioNexo fuera de Supabase

Rama de trabajo: `migration/neon-firebase-r2-20261005`.

## Destino acordado

- Firebase Authentication conserva los UUID actuales como Firebase UID.
- Neon PostgreSQL recibe el esquema y las tablas públicas con sus IDs y relaciones.
- Cloudflare R2 recibe imágenes; la migración de medios públicos ya tiene un flujo de copia no destructivo.
- GitHub Pages permanece como hosting web.

No se cambia el backend de producción ni se borra Supabase durante esta fase.

## Datos inventariados

- 35 tablas públicas en PostgreSQL, incluidas 1.139 fichas de biblioteca, 9 acuarios, 42 mediciones, 17 artículos de inventario y 170 tareas.
- 14 Edge Functions y funciones RPC que todavía requieren adaptación al Worker nuevo.
- 2.538 archivos públicos de Biblioteca (3,54 GB) y 31 fotos privadas (aprox. 71 MB). El manifiesto público no incluye las fotos privadas.
- El primer intento de copia pública terminó con 0 objetos copiados y 2.538 fallidos; el flujo anterior no reportaba fallo del job. No se considera migrado ningún archivo hasta comprobarlo en R2.

## Guardas de migración de PostgreSQL/Auth

`scripts/migrate-supabase-to-neon.mjs`:

- requiere una base Neon dedicada y vacía;
- aborta si detecta tablas públicas o un `auth.users` existente en Neon;
- copia esquema y datos de `public` sin escribir ni borrar en Supabase;
- refleja en Neon solo UUID, correo y fecha de creación necesarios para mantener FKs;
- crea las funciones `auth.uid()`, `auth.role()`, `auth.jwt()` y `auth.email()` para conservar las políticas durante la transición.

`scripts/import-supabase-users-to-firebase.mjs` importa cuentas conservando UID, correo verificado y hashes BCRYPT. No muestra hashes ni correos en los logs. La documentación oficial de Firebase admite importación BCRYPT sin parámetros adicionales.

## Secretos requeridos por el flujo

Deben estar configurados en GitHub Actions: `SUPABASE_DATABASE_URL`, `NEON_DATABASE_URL` y `FIREBASE_SERVICE_ACCOUNT_JSON`. Los valores no se guardan en Git. Si faltan, el flujo termina antes de copiar datos.

## Pendiente antes de activar el nuevo backend

1. Verificar y completar la copia pública a R2.
2. Copiar fotos privadas conservando acceso por propietario; desplegar un Worker que valide Firebase ID tokens y nunca haga públicas esas fotos.
3. Portar las RPC y Edge Functions usadas por la app al backend nuevo.
4. Actualizar el cliente web para Firebase Auth + API Neon/Worker + R2.
5. Validar los datos y los flujos críticos y entonces hacer el corte; mantener Supabase intacto hasta cerrar verificación y rollback.
