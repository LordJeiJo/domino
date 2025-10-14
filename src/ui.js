// ui.js
// -------
// Este módulo se encarga de pintar la interfaz inicial del MVP.
// Más adelante conectaremos eventos y lógica de juego desde aquí.

import { state } from './game.js';

const boardEl = document.getElementById('boardTiles');
const handEl = document.getElementById('playerHand');
const statusBarEl = document.getElementById('statusBar');
const currentPlayerLabelEl = document.getElementById('currentPlayerLabel');
const modalEl = document.getElementById('modal');
const modalTitleEl = document.getElementById('modalTitle');
const modalMessageEl = document.getElementById('modalMessage');

const controls = {
  playLeftBtn: document.getElementById('playLeftBtn'),
  playRightBtn: document.getElementById('playRightBtn'),
  drawBtn: document.getElementById('drawBtn'),
  passBtn: document.getElementById('passBtn'),
  restartBtn: document.getElementById('restartBtn'),
};

/**
 * Renderiza la línea central del tablero usando el estado actual.
 * Por ahora solo pinta fichas como texto simple "x|y".
 */
function renderBoard() {
  boardEl.innerHTML = '';
  if (!state.board.length) {
    const placeholder = document.createElement('p');
    placeholder.className = 'board-placeholder';
    placeholder.textContent = 'El tablero está vacío. Juega una ficha para comenzar.';
    boardEl.appendChild(placeholder);
    return;
  }

  state.board.forEach((tile) => {
    const tileEl = createTileElement(tile);
    tileEl.classList.add('board-tile');
    tileEl.setAttribute('aria-label', `${tile.left}|${tile.right}`);
    tileEl.setAttribute('role', 'listitem');
    tileEl.tabIndex = -1;
    boardEl.appendChild(tileEl);
  });
}

/**
 * Renderiza la mano del jugador activo.
 * Más adelante incorporaremos eventos de clic.
 */
function renderActiveHand() {
  const currentHand = state.hands[state.currentPlayer] || [];
  handEl.innerHTML = '';

  if (!currentHand.length) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'Sin fichas en mano.';
    handEl.appendChild(emptyMsg);
    return;
  }

  currentHand.forEach((tile) => {
    const tileEl = createTileElement(tile);
    tileEl.classList.add('hand-tile');
    tileEl.setAttribute('aria-label', `${tile.left}|${tile.right}`);
    tileEl.setAttribute('role', 'listitem');
    tileEl.tabIndex = 0;
    handEl.appendChild(tileEl);
  });
}

/**
 * Crea un elemento DOM que representa una ficha.
 * @param {{left:number,right:number}} tile
 * @returns {HTMLElement}
 */
function createTileElement(tile) {
  const tileEl = document.createElement('div');
  tileEl.className = 'tile';
  tileEl.dataset.left = tile.left;
  tileEl.dataset.right = tile.right;
  tileEl.setAttribute('aria-label', `${tile.left}|${tile.right}`);

  const leftSpan = document.createElement('span');
  leftSpan.textContent = tile.left;
  leftSpan.className = 'tile-left';
  tileEl.appendChild(leftSpan);

  const rightSpan = document.createElement('span');
  rightSpan.textContent = tile.right;
  rightSpan.className = 'tile-right';
  tileEl.appendChild(rightSpan);

  return tileEl;
}

/**
 * Actualiza las etiquetas de turno y mensaje general.
 */
function renderStatus(message = 'Preparado para jugar.') {
  currentPlayerLabelEl.textContent = `Turno de: ${state.currentPlayer === 'p1' ? 'Jugador 1' : 'Jugador 2'}`;
  statusBarEl.innerHTML = `<p>${message}</p>`;
}

/**
 * Renderiza el modal con el mensaje indicado.
 * Para Iteración 0 lo dejamos oculto.
 */
function toggleModal(show = false, title = '', message = '') {
  modalEl.setAttribute('aria-hidden', show ? 'false' : 'true');
  modalTitleEl.textContent = title;
  modalMessageEl.textContent = message;
}

// Render inicial para la Iteración 0
renderBoard();
renderActiveHand();
renderStatus();
toggleModal(false);

// Exportamos funciones para que la lógica pueda disparar re-renderizados.
export const ui = {
  renderBoard,
  renderActiveHand,
  renderStatus,
  toggleModal,
  controls,
};
