# Auditoría estructural de Biblioteca

Estado: en revisión.

## Motivo

Los cambios recientes de navegación e imágenes se publicaron sin regenerar `ARBOL_MAESTRO.md` y `MAPA_ARCHIVOS.md`, que siguen declarando un build anterior. Esto incumple el flujo documentado en `README.md`, `REGLAS_DE_CAMBIO.md` y `CHECKLIST_ANTES_DE_EDITAR.md`.

## Propietarios únicos que deben respetarse

- Vista abierta: `src/library/ficha/ficha-actions.js`.
- Editor de imágenes: `src/library/library-v3-images.js`.
- Editor y persistencia: `src/library/library-v3-ficha.js`.
- Listado y contexto de entrada: `src/library/library-v3-core.js`.
- Estilos de imágenes de Biblioteca: `library-images.css`.

## Trabajo obligatorio antes de publicar

1. Revisar la cadena de commits reciente de Biblioteca.
2. Comparar cada cambio con los propietarios únicos definidos en Árbol y Mapa.
3. Eliminar reglas duplicadas, redefiniciones y comportamiento superpuesto.
4. Dejar una sola implementación de navegación contextual.
5. Dejar una sola implementación de carga, persistencia y visualización de imágenes.
6. Regenerar `ARBOL_MAESTRO.md`, `MAPA_ARCHIVOS.md` y `ARCHIVOS_ACTIVOS.txt` mediante el generador oficial.
7. Ejecutar `npm run check`.
8. Publicar únicamente si la validación completa pasa.

No se añadirán archivos hotfix, patch, clean ni wrappers paralelos.
