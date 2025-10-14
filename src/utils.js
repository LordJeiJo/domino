// utils.js
// ----------
// Espacio para utilidades compartidas entre la lógica y la interfaz.
// En la Iteración 0 solo dejamos funciones de ayuda básicas que podrían
// crecer posteriormente.

/**
 * Crea un identificador sencillo de ficha basado en sus valores.
 * Útil para loguear o comparar fichas cuando extendamos funcionalidad.
 */
export function tileId(tile) {
  return `${tile.left}|${tile.right}`;
}
