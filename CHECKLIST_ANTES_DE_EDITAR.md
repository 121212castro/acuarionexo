# CHECKLIST ANTES DE EDITAR

Usar siempre antes de modificar la app.

## 1. Ubicacion correcta

- Confirmar repo: `121212castro/acuarionexo`.
- Confirmar rama: `main`.
- Confirmar app publicada: `https://121212castro.github.io/acuarionexo/`.
- Confirmar que no se esta tratando local como entorno vivo.

## 2. Archivo correcto

- Si es pantalla o comportamiento visible, revisar primero el modulo `src/` correspondiente.
- Si es nucleo compartido, revisar `app.js`.
- Si es estilo, revisar CSS cargado por `index.html`.
- Si es dato persistente, revisar Supabase.
- Si es una app paralela, wrapper o copia, no meterla en `main` sin decision explicita.

## 3. Cargas reales

Comprobar `index.html`.

Solo se considera activo lo que `index.html` carga directamente o lo que esos modulos usan.

## 4. Archivos de referencia

Antes de usar un archivo de referencia:

- comprobar si esta cargado por `index.html`;
- comprobar si define funciones globales;
- comprobar si duplica algo ya integrado en `app.js` o en `src/`;
- decidir si se integra o se elimina.

## 5. Publicacion

- No dejar cambios solo en local.
- Ejecutar `npm run check`.
- Hacer commit.
- Subir a GitHub.
- Confirmar que el working tree queda limpio.
