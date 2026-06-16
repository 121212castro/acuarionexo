# REGLAS DE CAMBIO

## Regla principal

Local se considera muerto como entorno de ejecucion.

Todo cambio valido debe terminar en GitHub `main` o en Supabase, segun corresponda. Nada se da por hecho por existir solo en una carpeta local.

## Prohibido

- Crear una app paralela local.
- Usar una carpeta local como fuente de verdad.
- Activar archivos legacy desde `index.html` sin revision.
- Duplicar pantallas en varios archivos.
- Crear variables globales nuevas que pisen rutas existentes.
- Cambiar datos productivos con archivos locales.
- Editar `mobile-wrapper/web-fallback/index.html` como si fuera la app principal.

## Permitido

- Revisar archivos locales para saber que existe.
- Preparar commits.
- Crear documentacion que no se cargue en la app.
- Ejecutar comprobaciones de sintaxis antes de subir.
- Subir a GitHub.
- Cambiar Supabase cuando el cambio sea de datos, tablas, auth, storage o politicas.

## Donde va cada cambio

- Pantallas visibles: `app.js`, hasta que haya fase formal de extraccion.
- Estilos: `styles.css`, `aquarium-map.css` o `login-reef.css`.
- Configuracion publica: `config.js`.
- Version/build: `app-version.json` y `window.ACUARIONEXO_BUILD` en `index.html`.
- Datos persistentes: Supabase.
- Documentacion y reglas: archivos `.md` en raiz.
- Contenedor movil: `mobile-wrapper/`, solo para envoltorio nativo.

## Si aparece un archivo dudoso

No se carga.

Primero se marca como referencia, se compara contra `index.html`, y solo se integra si no duplica estado ni pisa funciones globales.

## Publicacion

Antes de considerar terminado un cambio:

1. Debe estar commiteado.
2. Debe estar subido a GitHub.
3. El remoto debe estar limpio respecto al commit local.
4. Si toca datos, debe estar aplicado en Supabase.
