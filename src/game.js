// game.js
// --------------
// Define y expone el estado central del juego de dominó. Esta capa NO maneja
// DOM directamente; solo contiene el estado y, en iteraciones posteriores,
// la lógica pura para manipularlo.

let tileCounter = 0;

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

function createTileObject(left, right) {
  tileCounter += 1;
  return {
    id: `tile-${tileCounter}`,
    left,
    right,
  };
}

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
  tileCounter = 0;
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
  })).filter((tile) => Number.isFinite(tile.left) && Number.isFinite(tile.right))
    .map((tile) => createTileObject(tile.left, tile.right));

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

function flipTile(tile) {
  return {
    id: tile.id,
    left: tile.right,
    right: tile.left,
  };
}

function findTileIndex(hand, tileId) {
  return hand.findIndex((tile) => tile.id === tileId);
}

function determinePlacement(tile, side) {
  if (state.board.length === 0) {
    return {
      canPlay: true,
      shouldFlip: false,
    };
  }

  if (side === 'left') {
    if (tile.right === state.leftEnd) {
      return { canPlay: true, shouldFlip: false };
    }
    if (tile.left === state.leftEnd) {
      return { canPlay: true, shouldFlip: true };
    }
  } else if (side === 'right') {
    if (tile.left === state.rightEnd) {
      return { canPlay: true, shouldFlip: false };
    }
    if (tile.right === state.rightEnd) {
      return { canPlay: true, shouldFlip: true };
    }
  }

  return { canPlay: false };
}

function updateBoardExtremes(side, placedTile, boardWasEmpty) {
  if (boardWasEmpty) {
    state.leftEnd = placedTile.left;
    state.rightEnd = placedTile.right;
    return;
  }

  if (side === 'left') {
    state.leftEnd = placedTile.left;
  } else {
    state.rightEnd = placedTile.right;
  }
}

export function getTileFromHand(player, tileId) {
  const hand = state.hands[player];
  const index = findTileIndex(hand, tileId);
  if (index === -1) {
    return null;
  }
  return hand[index];
}

export function playTile({ player, tileId, side, forceFlip = false }) {
  if (!player || !tileId || (side !== 'left' && side !== 'right')) {
    return { success: false, message: 'Movimiento inválido.' };
  }

  const hand = state.hands[player];
  const tileIndex = findTileIndex(hand, tileId);
  if (tileIndex === -1) {
    return { success: false, message: 'La ficha seleccionada no está en tu mano.' };
  }

  const tile = hand[tileIndex];
  const boardWasEmpty = state.board.length === 0;

  let shouldFlip = false;
  if (boardWasEmpty) {
    shouldFlip = Boolean(forceFlip);
  } else {
    const placement = determinePlacement(tile, side);
    if (!placement.canPlay) {
      return { success: false, message: 'Esa ficha no encaja en ese extremo.' };
    }
    shouldFlip = placement.shouldFlip;
  }

  const placedTile = shouldFlip ? flipTile(tile) : { ...tile };

  hand.splice(tileIndex, 1);

  if (boardWasEmpty) {
    state.board.push(placedTile);
  } else if (side === 'left') {
    state.board.unshift(placedTile);
  } else {
    state.board.push(placedTile);
  }

  updateBoardExtremes(side, placedTile, boardWasEmpty);
  state.lockedTurnsInRow = 0;
  state.currentPlayer = state.currentPlayer === 'p1' ? 'p2' : 'p1';

  return { success: true, tile: placedTile };
}

export function canPlaceTile(tile, side) {
  const placement = determinePlacement(tile, side);
  return placement.canPlay;
}
