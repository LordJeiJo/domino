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

const customTiles = [];
const MINIMUM_CUSTOM_TILES = 14;

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
  controls.customTileForm = document.getElementById('customTileForm');
  controls.customTileLeft = document.getElementById('customTileLeft');
  controls.customTileRight = document.getElementById('customTileRight');
  controls.customTilesList = document.getElementById('customTilesList');
  controls.downloadTilesBtn = document.getElementById('downloadTilesBtn');
  controls.uploadTilesInput = document.getElementById('uploadTilesInput');
  controls.uploadTilesBtn = document.getElementById('uploadTilesBtn');
  controls.useCustomTilesBtn = document.getElementById('useCustomTilesBtn');
  controls.customTilesHint = document.getElementById('customTilesHint');
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

function renderCustomTiles() {
  if (!controls.customTilesList) return;

  controls.customTilesList.innerHTML = '';

  if (!customTiles.length) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'Todavía no agregaste fichas personalizadas.';
    emptyMsg.className = 'custom-tiles-empty';
    controls.customTilesList.appendChild(emptyMsg);
  } else {
    customTiles.forEach((tile, index) => {
      const item = document.createElement('div');
      item.className = 'custom-tile-item';
      item.setAttribute('role', 'listitem');

      const label = document.createElement('span');
      label.textContent = `${tile.left}|${tile.right}`;
      label.setAttribute('aria-label', `Ficha ${tile.left} | ${tile.right}`);
      item.appendChild(label);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'custom-tile-remove';
      removeBtn.dataset.index = String(index);
      removeBtn.textContent = 'Quitar';
      removeBtn.setAttribute('aria-label', `Quitar ficha ${tile.left}|${tile.right}`);
      item.appendChild(removeBtn);

      controls.customTilesList.appendChild(item);
    });
  }

  if (controls.downloadTilesBtn) {
    controls.downloadTilesBtn.disabled = customTiles.length === 0;
  }
  if (controls.useCustomTilesBtn) {
    controls.useCustomTilesBtn.disabled = customTiles.length < MINIMUM_CUSTOM_TILES;
  }
  if (controls.customTilesHint) {
    const remaining = Math.max(MINIMUM_CUSTOM_TILES - customTiles.length, 0);
    controls.customTilesHint.textContent = remaining
      ? `Necesitas ${remaining} ficha${remaining === 1 ? '' : 's'} más para repartir manos completas.`
      : 'Tu colección personalizada está lista para iniciar una ronda.';
  }
}

function addCustomTile(leftValue, rightValue) {
  customTiles.push({ left: leftValue, right: rightValue });
  renderCustomTiles();
}

function handleCustomTileSubmit(event) {
  event.preventDefault();

  if (!controls.customTileLeft || !controls.customTileRight) return;

  const leftValue = Number(controls.customTileLeft.value);
  const rightValue = Number(controls.customTileRight.value);

  if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
    renderStatus('Los valores de la ficha deben ser números válidos.');
    return;
  }

  if (!Number.isInteger(leftValue) || !Number.isInteger(rightValue)) {
    renderStatus('Usa números enteros para crear tus fichas personalizadas.');
    return;
  }

  if (leftValue < 0 || rightValue < 0) {
    renderStatus('Las fichas personalizadas no pueden tener valores negativos.');
    return;
  }

  addCustomTile(leftValue, rightValue);
  renderStatus(`Ficha ${leftValue}|${rightValue} agregada a tu colección personalizada.`);

  controls.customTileLeft.value = '';
  controls.customTileRight.value = '';
  controls.customTileLeft.focus();
}

function handleCustomTilesListClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.classList.contains('custom-tile-remove') && target.dataset.index) {
    const index = Number(target.dataset.index);
    if (Number.isInteger(index) && index >= 0 && index < customTiles.length) {
      const [removedTile] = customTiles.splice(index, 1);
      renderCustomTiles();
      const label = removedTile ? `${removedTile.left}|${removedTile.right}` : '';
      renderStatus(`La ficha ${label} fue eliminada.`);
    }
  }
}

function handleDownloadCustomTiles() {
  if (!customTiles.length) {
    renderStatus('Agrega fichas personalizadas antes de descargarlas.');
    return;
  }

  const blob = new Blob([JSON.stringify(customTiles, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fichas-personalizadas.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  renderStatus('Se descargó tu colección de fichas personalizadas.');
}

function parseCustomTiles(rawTiles) {
  if (!Array.isArray(rawTiles)) {
    throw new Error('Formato inválido: se esperaba un arreglo de fichas.');
  }

  return rawTiles.map((tile, index) => {
    if (typeof tile !== 'object' || tile === null) {
      throw new Error(`Ficha en posición ${index + 1} inválida.`);
    }

    const left = Number(tile.left);
    const right = Number(tile.right);

    if (!Number.isFinite(left) || !Number.isFinite(right)) {
      throw new Error(`Los valores de la ficha ${index + 1} deben ser numéricos.`);
    }

    if (!Number.isInteger(left) || !Number.isInteger(right)) {
      throw new Error(`Los valores de la ficha ${index + 1} deben ser enteros.`);
    }

    if (left < 0 || right < 0) {
      throw new Error(`La ficha ${index + 1} no puede contener números negativos.`);
    }

    return { left, right };
  });
}

function handleUploadCustomTiles(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.files || !input.files[0]) {
    return;
  }

  const [file] = input.files;
  const reader = new FileReader();

  reader.addEventListener('load', () => {
    try {
      const text = String(reader.result);
      const parsed = JSON.parse(text);
      const tiles = parseCustomTiles(parsed);

      customTiles.splice(0, customTiles.length, ...tiles);
      renderCustomTiles();
      renderStatus(`Se cargaron ${tiles.length} fichas personalizadas desde el archivo.`);
    } catch (error) {
      renderStatus(error instanceof Error ? error.message : 'No se pudieron cargar las fichas.');
    } finally {
      input.value = '';
    }
  });

  reader.addEventListener('error', () => {
    renderStatus('Ocurrió un problema al leer el archivo de fichas.');
    input.value = '';
  });

  reader.readAsText(file);
}

function handleUploadButtonClick() {
  if (controls.uploadTilesInput) {
    controls.uploadTilesInput.click();
  }
}

function handleUseCustomTiles() {
  if (customTiles.length < MINIMUM_CUSTOM_TILES) {
    renderStatus(`Agrega al menos ${MINIMUM_CUSTOM_TILES} fichas personalizadas para repartir manos completas.`);
    return;
  }

  initRound(customTiles);
  renderBoard();
  renderActiveHand();
  renderStatus('Ronda reiniciada con fichas personalizadas. ¡Empieza a jugar!');
  toggleModal(false);
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
  renderCustomTiles();

  if (controls.customTileForm) {
    controls.customTileForm.addEventListener('submit', handleCustomTileSubmit);
  }
  if (controls.customTilesList) {
    controls.customTilesList.addEventListener('click', handleCustomTilesListClick);
  }
  if (controls.downloadTilesBtn) {
    controls.downloadTilesBtn.addEventListener('click', handleDownloadCustomTiles);
  }
  if (controls.uploadTilesBtn) {
    controls.uploadTilesBtn.addEventListener('click', handleUploadButtonClick);
  }
  if (controls.uploadTilesInput) {
    controls.uploadTilesInput.addEventListener('change', handleUploadCustomTiles);
  }
  if (controls.useCustomTilesBtn) {
    controls.useCustomTilesBtn.addEventListener('click', handleUseCustomTiles);
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

// Exportamos funciones para que la lógica pueda disparar re-renderizados.
export const ui = {
  renderBoard,
  renderActiveHand,
  renderStatus,
  toggleModal,
  controls,
};
