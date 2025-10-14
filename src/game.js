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
