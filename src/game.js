// game.js
// --------------
// Define y expone el estado central del juego de dominó. Esta capa NO maneja
// DOM directamente; solo contiene el estado y, en iteraciones posteriores,
// la lógica pura para manipularlo.

export const state = {
  stock: [], // fichas en el pozo para robar
  board: [], // fichas colocadas en orden desde izquierda a derecha
  hands: {
    p1: [],
    p2: [],
  },
  currentPlayer: 'p1', // jugador actual: 'p1' o 'p2'
  leftEnd: null, // valor numérico en el extremo izquierdo del tablero
  rightEnd: null, // valor numérico en el extremo derecho del tablero
  lockedTurnsInRow: 0, // cuántos turnos consecutivos sin jugada (para bloqueo)
};

/**
 * Reset suave del estado a su configuración inicial.
 * Útil para reiniciar la ronda sin recrear el objeto en memoria.
 */
export function resetState() {
  state.stock = [];
  state.board = [];
  state.hands.p1 = [];
  state.hands.p2 = [];
  state.currentPlayer = 'p1';
  state.leftEnd = null;
  state.rightEnd = null;
  state.lockedTurnsInRow = 0;
}

/**
 * Genera el set clásico doble-seis de dominó.
 * @returns {{left:number,right:number}[]}
 */
function createDoubleSixSet() {
  const tiles = [];
  for (let left = 0; left <= 6; left += 1) {
    for (let right = left; right <= 6; right += 1) {
      tiles.push({ left, right });
    }
  }
  return tiles;
}

/**
 * Desordena un arreglo in-place usando Fisher-Yates.
 * @param {Array<unknown>} array
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Busca el doble más alto en una mano.
 * @param {{left:number,right:number}[]} hand
 */
function findHighestDouble(hand) {
  return hand.reduce((bestTile, tile) => {
    if (tile.left !== tile.right) {
      return bestTile;
    }

    if (!bestTile || tile.left > bestTile.left) {
      return tile;
    }

    return bestTile;
  }, null);
}

/**
 * Determina qué jugador inicia la ronda.
 */
function determineStartingPlayer() {
  const p1Double = findHighestDouble(state.hands.p1);
  const p2Double = findHighestDouble(state.hands.p2);

  if (p1Double && p2Double) {
    if (p1Double.left === p2Double.left) {
      return 'p1';
    }
    return p1Double.left > p2Double.left ? 'p1' : 'p2';
  }

  if (p1Double) {
    return 'p1';
  }

  if (p2Double) {
    return 'p2';
  }

  return 'p1';
}

/**
 * Configura una ronda nueva con manos y pozo iniciales.
 */
export function initRound(tileSet = null) {
  resetState();

  const baseTiles = Array.isArray(tileSet) && tileSet.length
    ? tileSet
    : createDoubleSixSet();

  state.stock = baseTiles.map((tile) => ({
    left: Number(tile.left),
    right: Number(tile.right),
  })).filter((tile) => Number.isFinite(tile.left) && Number.isFinite(tile.right));

  shuffle(state.stock);

  const maxHandSize = 7;
  const availablePairs = Math.floor(state.stock.length / 2);
  const handSize = Math.min(maxHandSize, availablePairs);

  for (let i = 0; i < handSize; i += 1) {
    const tileForP1 = state.stock.pop();
    const tileForP2 = state.stock.pop();

    if (tileForP1) {
      state.hands.p1.push(tileForP1);
    }
    if (tileForP2) {
      state.hands.p2.push(tileForP2);
    }
  }

  state.currentPlayer = determineStartingPlayer();
}
