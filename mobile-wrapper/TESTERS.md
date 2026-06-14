# Entrega a testers

## Versión recomendada

- Nombre: AcuarioNexo
- Bundle/App ID: `com.acuarionexo.app`
- URL interna: `https://121212castro.github.io/acuarionexo/`
- Tipo: contenedor nativo con web viva

## Flujo de trabajo

1. Se hacen cambios en la web oficial.
2. Se suben a GitHub `main`.
3. GitHub Pages publica la misma URL.
4. La app instalada detecta la versión con `app-version.json` y recarga caché.
5. El tester sigue usando la misma app.

## Primer arranque tras una actualización fuerte

Si un tester ve una pantalla vieja, debe tocar `Refrescar` dentro de AcuarioNexo una vez. Desde la build con `update-manager.js`, la app ya queda preparada para limpiar caché en cambios posteriores.

## No hacer

- No empaquetar una copia estática del `index.html` como app final.
- No crear otra URL para testers si no es imprescindible.
- No cambiar el `bundle id` después de invitar testers, porque rompe la continuidad de instalación.
