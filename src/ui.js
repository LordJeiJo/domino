// ui.js
// -------
// Este módulo se encarga de pintar la interfaz inicial del MVP y conectar
// la interacción básica con la lógica de juego.

import { state, initRound, playTile, getTileFromHand } from './game.js';

const hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined';

let boardEl;
let handEl;
let statusBarEl;
let currentPlayerLabelEl;
let modalEl;
let modalTitleEl;
let modalMessageEl;

const controls = {
  dropLeft: null,
  dropRight: null,
  playLeftBtn: null,
  playRightBtn: null,
  drawBtn: null,
  passBtn: null,
  restartBtn: null,
  tileImageInputs: [],
  tileImagePreviews: new Map(),
  resetTileImagesBtn: null,
};

const tileImages = new Map();
let draggedTileId = null;

function cacheDomElements() {
  boardEl = document.getElementById('boardTiles');
  handEl = document.getElementById('playerHand');
  statusBarEl = document.getElementById('statusBar');
  currentPlayerLabelEl = document.getElementById('currentPlayerLabel');
  modalEl = document.getElementById('modal');
  modalTitleEl = document.getElementById('modalTitle');
  modalMessageEl = document.getElementById('modalMessage');

  controls.dropLeft = document.getElementById('dropLeft');
  controls.dropRight = document.getElementById('dropRight');
  controls.playLeftBtn = document.getElementById('playLeftBtn');
  controls.playRightBtn = document.getElementById('playRightBtn');
  controls.drawBtn = document.getElementById('drawBtn');
  controls.passBtn = document.getElementById('passBtn');
  controls.restartBtn = document.getElementById('restartBtn');
  controls.resetTileImagesBtn = document.getElementById('resetTileImagesBtn');
  controls.tileImageInputs = Array.from(document.querySelectorAll('.tile-image-input'));

  controls.tileImageInputs.forEach((input) => {
    const number = Number(input.dataset.number);
    const preview = document.getElementById(`tilePreview${number}`);
    if (Number.isInteger(number) && preview) {
      controls.tileImagePreviews.set(number, preview);
    }
  });
}

function createTileFace(value, position) {
  const faceEl = document.createElement('div');
  faceEl.className = `tile-face tile-${position}`;

  const storedImage = tileImages.get(value);
  if (storedImage) {
    faceEl.classList.add('tile-face--image');
    const img = document.createElement('img');
    img.src = storedImage;
    img.alt = `Número ${value}`;
    faceEl.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.textContent = value;
    faceEl.appendChild(span);
  }

  return faceEl;
}

function createTileElement(tile, { draggable = false } = {}) {
  const tileEl = document.createElement('div');
  tileEl.className = 'tile';
  tileEl.dataset.left = String(tile.left);
  tileEl.dataset.right = String(tile.right);
  tileEl.dataset.id = tile.id;
  tileEl.setAttribute('aria-label', `${tile.left}|${tile.right}`);

  const leftFace = createTileFace(tile.left, 'left');
  const rightFace = createTileFace(tile.right, 'right');
  tileEl.appendChild(leftFace);
  tileEl.appendChild(rightFace);

  if (draggable) {
    tileEl.draggable = true;
    tileEl.addEventListener('dragstart', handleTileDragStart);
    tileEl.addEventListener('dragend', handleTileDragEnd);
  }

  return tileEl;
}

function renderBoard() {
  if (!boardEl) return;
  boardEl.innerHTML = '';

  if (!state.board.length) {
    const placeholder = document.createElement('p');
    placeholder.className = 'board-placeholder';
    placeholder.textContent = 'El tablero está vacío. Arrastra una ficha para comenzar la ronda.';
    boardEl.appendChild(placeholder);
    return;
  }

  state.board.forEach((tile) => {
    const tileEl = createTileElement(tile);
    tileEl.classList.add('board-tile');
    tileEl.setAttribute('role', 'listitem');
    tileEl.tabIndex = -1;
    boardEl.appendChild(tileEl);
  });
}

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
    const tileEl = createTileElement(tile, { draggable: true });
    tileEl.classList.add('hand-tile');
    tileEl.setAttribute('role', 'listitem');
    tileEl.tabIndex = 0;
    handEl.appendChild(tileEl);
  });
}

function renderStatus(message = 'Arrastra una ficha hasta el extremo donde quieras jugarla.') {
  if (!statusBarEl || !currentPlayerLabelEl) return;
  currentPlayerLabelEl.textContent = `Turno de: ${state.currentPlayer === 'p1' ? 'Jugador 1' : 'Jugador 2'}`;
  statusBarEl.innerHTML = `<p>${message}</p>`;
}

function highlightDropZone(side, enable) {
  const dropZone = side === 'left' ? controls.dropLeft : controls.dropRight;
  if (!dropZone) return;
  dropZone.classList.toggle('dragover', Boolean(enable));
}

function handleDragOver(event) {
  event.preventDefault();
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  target.classList.add('dragover');
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleDragLeave(event) {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  target.classList.remove('dragover');
}

function handleTileDragStart(event) {
  const tileEl = event.currentTarget;
  if (!(tileEl instanceof HTMLElement)) return;
  draggedTileId = tileEl.dataset.id || null;
  if (event.dataTransfer && draggedTileId) {
    event.dataTransfer.setData('text/plain', draggedTileId);
    event.dataTransfer.effectAllowed = 'move';
  }
}

function handleTileDragEnd() {
  draggedTileId = null;
  highlightDropZone('left', false);
  highlightDropZone('right', false);
}

function askForInitialFlip(tile) {
  if (!hasDOM || tile.left === tile.right) {
    return false;
  }
  return window.confirm(`¿Quieres girar la ficha para que quede como ${tile.right}|${tile.left}?`);
}

function placeTileOnBoard(tileId, side) {
  const player = state.currentPlayer;
  const tile = getTileFromHand(player, tileId);
  if (!tile) {
    renderStatus('Selecciona una ficha de tu mano para jugar.');
    return;
  }

  const boardIsEmpty = state.board.length === 0;
  const forceFlip = boardIsEmpty ? askForInitialFlip(tile) : false;
  const result = playTile({ player, tileId, side, forceFlip });

  if (!result.success) {
    renderStatus(result.message);
    return;
  }

  renderBoard();
  renderActiveHand();
  renderStatus(`Se jugó la ficha ${result.tile.left}|${result.tile.right}.`);
}

function handleTileDrop(event) {
  event.preventDefault();
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  target.classList.remove('dragover');

  const side = target.dataset.side === 'left' ? 'left' : 'right';
  let droppedId = draggedTileId;
  if (event.dataTransfer && typeof event.dataTransfer.getData === 'function') {
    const transferredId = event.dataTransfer.getData('text/plain');
    if (transferredId) {
      droppedId = transferredId;
    }
  }
  if (!droppedId) {
    renderStatus('Arrastra una ficha desde tu mano hacia el tablero.');
    return;
  }

  placeTileOnBoard(droppedId, side);
  draggedTileId = null;
}

function renderTileImagePreview(number) {
  const preview = controls.tileImagePreviews.get(number);
  if (!preview) {
    return;
  }

  preview.innerHTML = '';
  const storedImage = tileImages.get(number);
  if (storedImage) {
    const img = document.createElement('img');
    img.src = storedImage;
    img.alt = `Imagen personalizada para el número ${number}`;
    preview.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.textContent = number;
    preview.appendChild(span);
  }
}

function handleTileImageChange(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const number = Number(input.dataset.number);
  if (!Number.isInteger(number) || number < 0 || number > 6) {
    return;
  }

  const file = input.files && input.files[0];
  if (!file) {
    tileImages.delete(number);
    renderTileImagePreview(number);
    renderBoard();
    renderActiveHand();
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    tileImages.set(number, String(reader.result));
    renderTileImagePreview(number);
    renderBoard();
    renderActiveHand();
  });
  reader.addEventListener('error', () => {
    renderStatus('No se pudo leer la imagen seleccionada.');
  });
  reader.readAsDataURL(file);
}

function resetTileImages() {
  tileImages.clear();
  controls.tileImageInputs.forEach((input) => {
    input.value = '';
  });
  for (let number = 0; number <= 6; number += 1) {
    renderTileImagePreview(number);
  }
  renderBoard();
  renderActiveHand();
  renderStatus('Se restableció el estilo clásico de las fichas.');
}

function initializeTileImagePreviews() {
  for (let number = 0; number <= 6; number += 1) {
    renderTileImagePreview(number);
  }
}

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
  initializeTileImagePreviews();
  renderBoard();
  renderActiveHand();
  renderStatus();
  toggleModal(false);

  [controls.dropLeft, controls.dropRight].forEach((dropZone) => {
    if (!dropZone) return;
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleTileDrop);
  });

  controls.tileImageInputs.forEach((input) => {
    input.addEventListener('change', handleTileImageChange);
  });

  if (controls.resetTileImagesBtn) {
    controls.resetTileImagesBtn.addEventListener('click', resetTileImages);
  }
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

export const ui = {
  renderBoard,
  renderActiveHand,
  renderStatus,
  toggleModal,
  controls,
};
