# Permisos nativos previstos

## iOS

Cuando se genere `ios/` con Capacitor, revisar en Xcode `Info.plist`:

- `NSCameraUsageDescription`: AcuarioNexo usa la cámara para añadir fotos de acuarios, fichas y animales.
- `NSPhotoLibraryUsageDescription`: AcuarioNexo usa la galería para seleccionar fotos existentes.
- `NSPhotoLibraryAddUsageDescription`: AcuarioNexo puede guardar o preparar imágenes asociadas a fichas.

Para notificaciones, activar Push Notifications y Background Modes si se usan avisos nativos.

## Android

Cuando se genere `android/`, revisar permisos según versión objetivo:

- Cámara.
- Lectura de imágenes en Android moderno si se usa selector de fotos.
- Notificaciones en Android 13+.

## Nota importante

La web actual ya usa inputs de archivo/cámara. Los plugins nativos quedan preparados para la siguiente fase si necesitamos integración más profunda con cámara, fotos o avisos push nativos.
