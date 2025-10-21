// ui.js
// -------
// Este módulo se encarga de pintar la interfaz inicial del MVP.
// Más adelante conectaremos eventos y lógica de juego desde aquí.

import { state, initRound } from './game.js';

const hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined';

let boardEl;
let handEl;
let statusBarEl;
let currentPlayerLabelEl;
let modalEl;
let modalTitleEl;
let modalMessageEl;

const controls = {};

function cacheDomElements() {
  boardEl = document.getElementById('boardTiles');
  handEl = document.getElementById('playerHand');
  statusBarEl = document.getElementById('statusBar');
  currentPlayerLabelEl = document.getElementById('currentPlayerLabel');
  modalEl = document.getElementById('modal');
  modalTitleEl = document.getElementById('modalTitle');
  modalMessageEl = document.getElementById('modalMessage');

  controls.playLeftBtn = document.getElementById('playLeftBtn');
  controls.playRightBtn = document.getElementById('playRightBtn');
  controls.drawBtn = document.getElementById('drawBtn');
  controls.passBtn = document.getElementById('passBtn');
  controls.restartBtn = document.getElementById('restartBtn');
}

/**
 * Renderiza la línea central del tablero usando el estado actual.
 * Por ahora solo pinta fichas como texto simple "x|y".
 */
function renderBoard() {
  if (!boardEl) return;
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
  if (!handEl) return;
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
function renderStatus(message = 'Elige una ficha y decide dónde colocarla en la mesa.') {
  if (!statusBarEl || !currentPlayerLabelEl) return;
  currentPlayerLabelEl.textContent = `Turno de: ${state.currentPlayer === 'p1' ? 'Jugador 1' : 'Jugador 2'}`;
  statusBarEl.innerHTML = `<p>${message}</p>`;
}

/**
 * Renderiza el modal con el mensaje indicado.
 * Para Iteración 0 lo dejamos oculto.
 */
function toggleModal(show = false, title = '', message = '') {
  if (!modalEl || !modalTitleEl || !modalMessageEl) return;
  modalEl.setAttribute('aria-hidden', show ? 'false' : 'true');
  modalTitleEl.textContent = title;
  modalMessageEl.textContent = message;
}

function initializeUI() {
  if (!hasDOM) {
    return;
  }
  cacheDomElements();

  if (!boardEl || !handEl || !statusBarEl || !currentPlayerLabelEl) {
    console.warn('No se encontraron los elementos base de la interfaz.');
    return;
  }

  initRound();
  renderBoard();
  renderActiveHand();
  renderStatus();
  toggleModal(false);
}

if (hasDOM) {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeUI, { once: true });
  } else {
    initializeUI();
  }
} else {
  console.warn('Entorno sin DOM detectado. La inicialización automática de la UI fue omitida.');
}

// Exportamos funciones para que la lógica pueda disparar re-renderizados.
export const ui = {
  renderBoard,
  renderActiveHand,
  renderStatus,
  toggleModal,
  controls,
};
