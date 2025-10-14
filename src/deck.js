/**
 * Genera todas las fichas del set doble-seis.
 * Retorna un arreglo de objetos { left: number, right: number }.
 * La estructura facilita extender a otros sets (doble-9, etc.).
 */
export function generateDoubleSixSet() {
  const tiles = [];
  for (let left = 0; left <= 6; left += 1) {
    for (let right = left; right <= 6; right += 1) {
      tiles.push({ left, right });
    }
  }
  return tiles;
}

/**
 * Baraja un arreglo in-place usando Fisher–Yates.
 * Se devuelve la misma referencia para permitir composición fluida.
 * @param {Array} array - arreglo a barajar.
 * @returns {Array}
 */
export function shuffle(array) {
  const result = array;
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
