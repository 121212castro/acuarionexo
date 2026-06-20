# AcuarioNexo movil

Objetivo: app real iOS/Android con los archivos web dentro del paquete usando Capacitor.

Fuente de verdad:

- Codigo: GitHub `main`.
- Datos/Auth/Storage: Supabase `vqpxhozavfzgtkqscncs`.
- Paquete web interno: `www/`, generado, no versionado.

## Android fuera de tienda

Android puede distribuirse como APK fuera de Play Store.

Flujo recomendado:

1. En GitHub, abrir `Actions`.
2. Ejecutar `Android Debug APK` manualmente o esperar al push a `main`.
3. Descargar el artefacto `acuarionexo-debug-apk`.
4. Instalar `app-debug.apk` en el dispositivo Android.

Cuando la app este lista para testers externos, cambiar a APK/AAB firmado de release.

## iPhone fuera de tienda

iOS no permite instalar una IPA normal fuera de App Store sin firma Apple. Opciones reales:

- Ad Hoc: requiere Apple Developer Program, certificado, provisioning profile y UDID de cada iPhone.
- TestFlight: no es App Store publica, pero requiere Apple Developer Program.
- PWA instalada: funciona sin Apple Developer, pero no es app nativa empaquetada.

## iOS ya preparado en GitHub

Hay dos workflows:

- `iOS Capacitor Project`: genera y sube el proyecto Xcode como artefacto `acuarionexo-ios-project`.
- `iOS Ad Hoc IPA`: genera una IPA instalable cuando esten configurados los secretos Apple.

Secretos requeridos para `iOS Ad Hoc IPA`:

- `APPLE_TEAM_ID`
- `IOS_DISTRIBUTION_CERTIFICATE_BASE64`
- `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`
- `IOS_ADHOC_PROVISION_PROFILE_BASE64`
- `IOS_KEYCHAIN_PASSWORD`

La IPA solo se instalara en iPhones incluidos en el provisioning profile Ad Hoc.

## Scripts oficiales

```bash
npm run check
npm run mobile:prepare
npm run mobile:add:android
npm run mobile:add:ios
npm run mobile:sync
```

## Estructura

- `capacitor.config.json`: identificador `com.acuarionexo.app`, nombre `AcuarioNexo`, `webDir` `www`.
- `scripts/prepare-mobile-bundle.mjs`: copia la app web activa dentro de `www/`.
- `.github/workflows/android-debug-apk.yml`: genera APK Android debug desde GitHub.
- `.github/workflows/ios-mobile-build.yml`: genera proyecto iOS/Xcode desde GitHub.
- `.github/workflows/ios-adhoc-ipa.yml`: genera IPA Ad Hoc firmada cuando existan secretos Apple.

## Reglas

- No editar `www/`: se regenera.
- No usar `server.url` en Capacitor: la app debe llevar los archivos dentro.
- No duplicar logica movil: la logica vive en `app.js` y `src/`.
- Si se anaden archivos activos a `index.html`, tambien deben anadirse a `scripts/prepare-mobile-bundle.mjs`.
