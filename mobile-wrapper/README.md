# AcuarioNexo Mobile Wrapper

Contenedor nativo para testers. La app instalada carga siempre la URL oficial:

https://121212castro.github.io/acuarionexo/

Esto evita congelar una copia vieja del HTML dentro de la app. Los cambios normales se publican en GitHub Pages y llegan a los testers desde la misma app.

## Preparar entorno

Necesitas Node.js, Xcode para iOS y/o Android Studio para Android.

```bash
cd mobile-wrapper
npm install
```

## Android testers

```bash
npm run add:android
npm run sync
npm run open:android
```

En Android Studio genera un APK/AAB de prueba desde `Build > Generate Signed Bundle / APK` o ejecuta en un dispositivo conectado.

## iPhone testers

```bash
npm run add:ios
npm run sync
npm run open:ios
```

En Xcode configura el equipo de firma y sube a TestFlight desde `Product > Archive`.

## Permisos previstos

- Cámara y fotos para cargar imágenes.
- Notificaciones push para avisos.
- Acceso web HTTPS a GitHub Pages y Supabase.

## Cuándo hay que sacar otra build nativa

Sólo cuando cambien icono, nombre, permisos, firma, bundle id o configuración nativa. Para cambios de fichas, IA, diseño o módulos, basta con publicar la web oficial.

## URL alternativa de pruebas

Para apuntar temporalmente a otra URL:

```bash
ACUARIONEXO_APP_URL=https://otra-url.example/ npm run sync
```

No uses una copia local como URL de testers salvo para pruebas internas muy puntuales.
