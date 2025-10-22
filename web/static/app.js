const PLAYER_ID = "player";
const OPPONENT_ID = "opponent";
const HAND_SIZE = 7;

const boardEl = document.getElementById("board");
const handEl = document.getElementById("hand");
const statusEl = document.getElementById("status");
const opponentCountEl = document.getElementById("opponent-count");
const dropZones = Array.from(document.querySelectorAll(".drop-zone"));
const drawBtn = document.getElementById("draw-btn");
const passBtn = document.getElementById("pass-btn");
const resetBtn = document.getElementById("reset-btn");

let state = createEmptyState();
let legalMap = new Map();
let currentDrag = null;
let opponentTimer = null;

function createEmptyState() {
  return {
    board: [],
    stock: [],
    players: {
      [PLAYER_ID]: { name: PLAYER_ID, hand: [] },
      [OPPONENT_ID]: { name: OPPONENT_ID, hand: [] },
    },
    current_player: PLAYER_ID,
    status: "ongoing",
    winner: null,
    block_scores: null,
    passes_in_row: 0,
  };
}

function createStock() {
  const tiles = [];
  for (let left = 0; left <= 6; left += 1) {
    for (let right = left; right <= 6; right += 1) {
      tiles.push([left, right]);
    }
  }
  return tiles;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function highestDouble(hand) {
  let best = null;
  hand.forEach((tile) => {
    if (tile[0] === tile[1]) {
      if (!best || tile[0] > best[0]) {
        best = tile;
      }
    }
  });
  return best;
}

function determineStartingPlayer(players) {
  let bestTile = null;
  let starter = PLAYER_ID;
  const tied = [];
  for (const [name, state] of Object.entries(players)) {
    const candidate = highestDouble(state.hand);
    if (!candidate) {
      continue;
    }
    if (!bestTile || candidate[0] > bestTile[0]) {
      bestTile = candidate;
      starter = name;
      tied.length = 0;
      tied.push(name);
    } else if (bestTile && candidate[0] === bestTile[0]) {
      tied.push(name);
    }
  }
  if (!bestTile) {
    return Math.random() < 0.5 ? PLAYER_ID : OPPONENT_ID;
  }
  if (tied.length > 1) {
    return tied[Math.floor(Math.random() * tied.length)];
  }
  return starter;
}

function initializeGameState() {
  const stock = createStock();
  shuffle(stock);
  const players = {
    [PLAYER_ID]: { name: PLAYER_ID, hand: [] },
    [OPPONENT_ID]: { name: OPPONENT_ID, hand: [] },
  };
  for (let i = 0; i < HAND_SIZE; i += 1) {
    players[PLAYER_ID].hand.push(stock.pop());
    players[OPPONENT_ID].hand.push(stock.pop());
  }

  const initialState = {
    board: [],
    stock,
    players,
    current_player: determineStartingPlayer(players),
    status: "ongoing",
    winner: null,
    block_scores: null,
    passes_in_row: 0,
  };
  return initialState;
}

function boardEnds() {
  if (!state.board.length) {
    return null;
  }
  const leftEnd = state.board[0][0];
  const rightEnd = state.board[state.board.length - 1][1];
  return [leftEnd, rightEnd];
}

function getLegalMoves(playerId) {
  if (state.status !== "ongoing") {
    return [];
  }
  const hand = state.players[playerId].hand;
  if (!state.board.length) {
    return hand.map((_, index) => ({ index, ends: ["L", "R"] }));
  }
  const ends = boardEnds();
  if (!ends) {
    return [];
  }
  const [leftEnd, rightEnd] = ends;
  const moves = [];
  hand.forEach((tile, index) => {
    const endsForTile = [];
    if (tile[0] === leftEnd || tile[1] === leftEnd) {
      endsForTile.push("L");
    }
    if (tile[0] === rightEnd || tile[1] === rightEnd) {
      endsForTile.push("R");
    }
    if (endsForTile.length) {
      moves.push({ index, ends: endsForTile });
    }
  });
  return moves;
}

function placeTile(tile, end) {
  if (!state.board.length) {
    state.board.push(tile);
    return tile;
  }
  const ends = boardEnds();
  if (!ends) {
    throw new Error("El tablero no tiene extremos disponibles");
  }
  const [leftEnd, rightEnd] = ends;
  if (end === "L") {
    if (tile[1] === leftEnd) {
      state.board.unshift(tile);
      return tile;
    }
    if (tile[0] === leftEnd) {
      const placed = [tile[1], tile[0]];
      state.board.unshift(placed);
      return placed;
    }
    throw new Error("La ficha no encaja en el extremo izquierdo");
  }
  if (end === "R") {
    if (tile[0] === rightEnd) {
      state.board.push(tile);
      return tile;
    }
    if (tile[1] === rightEnd) {
      const placed = [tile[1], tile[0]];
      state.board.push(placed);
      return placed;
    }
    throw new Error("La ficha no encaja en el extremo derecho");
  }
  throw new Error("Extremo no válido");
}

function advanceTurn(moved) {
  if (state.status !== "ongoing") {
    return;
  }
  if (moved) {
    state.passes_in_row = 0;
  } else {
    state.passes_in_row += 1;
    if (state.passes_in_row >= 2) {
      state.status = "blocked";
      const scores = {};
      Object.entries(state.players).forEach(([name, playerState]) => {
        scores[name] = playerState.hand.reduce((acc, tile) => acc + tile[0] + tile[1], 0);
      });
      state.block_scores = scores;
      const values = Object.values(scores);
      const minScore = Math.min(...values);
      const winners = Object.entries(scores)
        .filter(([, score]) => score === minScore)
        .map(([name]) => name);
      if (winners.length === 1) {
        state.winner = winners[0];
      }
      return;
    }
  }
  state.current_player = state.current_player === PLAYER_ID ? OPPONENT_ID : PLAYER_ID;
}

function drawTileFor(playerId) {
  if (!state.stock.length) {
    throw new Error("No quedan fichas en el pozo");
  }
  const tile = state.stock.pop();
  state.players[playerId].hand.push(tile);
  return tile;
}

function playTileForPlayer(playerId, tileIndex, end) {
  const hand = state.players[playerId].hand;
  if (tileIndex < 0 || tileIndex >= hand.length) {
    throw new Error("Índice de ficha no válido");
  }
  const tile = hand.splice(tileIndex, 1)[0];
  placeTile(tile, end);
  if (!hand.length) {
    state.status = "won";
    state.winner = playerId;
  }
  advanceTurn(true);
}

function handleTurnTransition() {
  if (state.status !== "ongoing") {
    clearOpponentTimer();
    return;
  }
  if (state.current_player === OPPONENT_ID) {
    scheduleOpponentTurn();
  } else {
    clearOpponentTimer();
  }
}

function scheduleOpponentTurn(delay = 600) {
  clearOpponentTimer();
  opponentTimer = setTimeout(() => {
    processOpponentTurn();
  }, delay);
}

function clearOpponentTimer() {
  if (opponentTimer) {
    clearTimeout(opponentTimer);
    opponentTimer = null;
  }
}

function chooseOpponentMove(moves) {
  const doubles = moves.filter(({ index }) => {
    const tile = state.players[OPPONENT_ID].hand[index];
    return tile[0] === tile[1];
  });
  const pool = doubles.length ? doubles : moves;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickEnd(move) {
  if (move.ends.includes("R")) {
    return "R";
  }
  return move.ends[0];
}

function processOpponentTurn() {
  clearOpponentTimer();
  if (state.status !== "ongoing" || state.current_player !== OPPONENT_ID) {
    return;
  }
  const moves = getLegalMoves(OPPONENT_ID);
  if (moves.length) {
    const move = chooseOpponentMove(moves);
    const end = pickEnd(move);
    playTileForPlayer(OPPONENT_ID, move.index, end);
    updateUI();
    handleTurnTransition();
    return;
  }
  if (state.stock.length) {
    drawTileFor(OPPONENT_ID);
    updateUI();
    scheduleOpponentTurn();
    return;
  }
  advanceTurn(false);
  updateUI();
  handleTurnTransition();
}

function isPlayersTurn() {
  return state.current_player === PLAYER_ID && state.status === "ongoing";
}

function updateUI() {
  legalMap = new Map(getLegalMoves(PLAYER_ID).map((move) => [move.index, move.ends]));
  updateBoard();
  updateHand();
  updateStatusMessage();
  updateControls();
}

function updateBoard() {
  boardEl.innerHTML = "";
  const tiles = state.board;
  if (!tiles.length) {
    const empty = document.createElement("p");
    empty.textContent = "El tablero está vacío.";
    boardEl.append(empty);
  } else {
    tiles.forEach((tile) => {
      const el = document.createElement("div");
      el.className = "board-tile";
      el.textContent = `[${tile[0]}|${tile[1]}]`;
      boardEl.append(el);
    });
  }

  const availableEnds = { L: false, R: false };
  for (const ends of legalMap.values()) {
    ends.forEach((end) => {
      availableEnds[end] = true;
    });
  }
  dropZones.forEach((zone) => {
    const end = zone.dataset.end;
    zone.classList.toggle("available", isPlayersTurn() && availableEnds[end]);
  });
}

function updateHand() {
  handEl.innerHTML = "";
  const hand = state.players[PLAYER_ID].hand;
  const playersTurn = isPlayersTurn();
  hand.forEach((tile, index) => {
    const el = document.createElement("div");
    el.className = "hand-tile";
    el.textContent = `[${tile[0]}|${tile[1]}]`;
    const ends = legalMap.get(index) ?? [];
    const playable = playersTurn && ends.length > 0;
    el.draggable = playable;
    if (playable) {
      el.classList.add("playable");
    } else {
      el.classList.add("disabled");
    }
    el.dataset.index = String(index);
    el.addEventListener("dragstart", (event) => {
      if (!playable) {
        event.preventDefault();
        return;
      }
      currentDrag = { index, ends };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    });
    el.addEventListener("dragend", () => {
      currentDrag = null;
      dropZones.forEach((zone) => zone.classList.remove("drag-over"));
    });
    handEl.append(el);
  });

  opponentCountEl.textContent = String(state.players[OPPONENT_ID].hand.length);
}

function updateStatusMessage() {
  if (state.status === "won") {
    if (state.winner === PLAYER_ID) {
      setStatus("🎉 ¡Has ganado!", "success");
    } else {
      setStatus("😔 El oponente ha ganado.", "error");
    }
    return;
  }
  if (state.status === "blocked") {
    const scores = state.block_scores ?? {};
    const playerScore = scores[PLAYER_ID];
    const opponentScore = scores[OPPONENT_ID];
    let message = "La partida está bloqueada.";
    if (typeof playerScore === "number" && typeof opponentScore === "number") {
      message += ` (Tú: ${playerScore} · Oponente: ${opponentScore})`;
    }
    setStatus(message, "warning");
    return;
  }
  if (isPlayersTurn()) {
    if (legalMap.size === 0) {
      if (state.stock.length > 0) {
        setStatus("No hay jugadas. Roba una ficha.");
      } else {
        setStatus("No hay jugadas y no quedan fichas. Pulsa Pasar.");
      }
    } else {
      setStatus("Es tu turno. Arrastra una ficha hacia un extremo iluminado.");
    }
  } else {
    setStatus("Esperando al oponente...");
  }
}

function setStatus(message, variant) {
  statusEl.textContent = message;
  statusEl.dataset.variant = variant ?? "";
}

function updateControls() {
  const playersTurn = isPlayersTurn();
  const stockCount = state.stock.length;
  drawBtn.disabled = !(playersTurn && stockCount > 0);
  passBtn.disabled = !(playersTurn && legalMap.size === 0 && stockCount === 0);
  resetBtn.disabled = false;
}

function handlePlayerMove(tileIndex, end) {
  if (!isPlayersTurn()) {
    return;
  }
  const ends = legalMap.get(tileIndex);
  if (!ends || !ends.includes(end)) {
    return;
  }
  playTileForPlayer(PLAYER_ID, tileIndex, end);
  updateUI();
  handleTurnTransition();
}

dropZones.forEach((zone) => {
  zone.addEventListener("dragover", (event) => {
    if (!currentDrag || !isPlayersTurn()) {
      return;
    }
    const end = zone.dataset.end;
    if (!currentDrag.ends.includes(end)) {
      return;
    }
    event.preventDefault();
    zone.classList.add("drag-over");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("drag-over");
  });

  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("drag-over");
    if (!currentDrag) {
      return;
    }
    const end = zone.dataset.end;
    if (!currentDrag.ends.includes(end)) {
      return;
    }
    const { index } = currentDrag;
    currentDrag = null;
    handlePlayerMove(index, end);
  });
});

drawBtn.addEventListener("click", () => {
  if (!isPlayersTurn()) {
    return;
  }
  if (!state.stock.length) {
    setStatus("⚠️ No quedan fichas para robar.", "warning");
    return;
  }
  drawTileFor(PLAYER_ID);
  updateUI();
});

passBtn.addEventListener("click", () => {
  if (!isPlayersTurn()) {
    return;
  }
  if (legalMap.size > 0 || state.stock.length > 0) {
    setStatus("⚠️ Solo puedes pasar si no hay jugadas y el pozo está vacío.", "warning");
    return;
  }
  advanceTurn(false);
  updateUI();
  handleTurnTransition();
});

resetBtn.addEventListener("click", () => {
  startNewGame();
});

function startNewGame() {
  clearOpponentTimer();
  state = initializeGameState();
  legalMap = new Map();
  currentDrag = null;
  updateUI();
  handleTurnTransition();
}

startNewGame();
