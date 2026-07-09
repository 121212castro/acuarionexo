# ACUARIONEXO · FLUJO MÓVIL

## Fuente de verdad

La fuente de verdad siempre es GitHub `main`.

La app móvil usa Capacitor con `webDir: "www"`.

`www/` es generado. No se edita a mano.

## Regla obligatoria antes de compilar Android

Cada cambio de código que afecte a la app debe terminar con:

```bash
npm run check
npm run mobile:sync
```

`mobile:sync` ejecuta:

```bash
npm run mobile:prepare
npm run mobile:check
npx cap sync
```

Si `mobile:check` falla, no se compila ni se entrega a testers.

## Qué tocar si vuelve a pasar

| Problema visible | Archivo que se toca |
|---|---|
| Botón de ficha abierta con texto incorrecto | `src/library/ficha/ficha-actions.js` |
| Vista de ficha abierta duplica portada/foto | `src/library/ficha/ficha-actions.js` |
| Panel de edición muestra mal Foto portada / Foto al abrir ficha | `src/library/library-v3-images.js` |
| Formulario, guardar, auditar, publicar o borrar ficha | `src/library/library-v3-ficha.js` |
| Pasar ficha al acuario/inventario | `src/library/inventory/library-inventory-import.js` |
| Móvil no contiene los cambios de web | `scripts/prepare-mobile-bundle.mjs` y `scripts/validate-mobile-bundle.mjs` |

## Reglas de ficha actual

- La vista abierta de ficha vive en `src/library/ficha/ficha-actions.js`.
- `src/library/library-v3-ficha.js` no puede definir `window.verFicha`.
- La vista abierta solo muestra `photo_url`.
- La vista abierta no renderiza `cover_url`.
- El botón visible debe decir `Añadir a mi acuario`.
- El texto `Añadir a mi inventario` está prohibido en la vista de ficha.
- La edición de imágenes vive en `src/library/library-v3-images.js`.
- La edición de imágenes mantiene dos campos: `cover_url` = Foto portada y `photo_url` = Foto al abrir ficha.

## Prueba de bloqueo

`npm run check` valida duplicados activos de `window.verFicha`.

`npm run mobile:check` valida que `www/` tenga el mismo código crítico que `src/` y que no aparezca la vista antigua.

Si Android muestra una pantalla vieja, no se toca `www/` a mano. Se ejecuta:

```bash
npm run mobile:sync
```

y después se recompila o se instala la build nueva en Android.
