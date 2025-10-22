const PLAYER_ID = "player";
const boardEl = document.getElementById("board");
const handEl = document.getElementById("hand");
const statusEl = document.getElementById("status");
const opponentCountEl = document.getElementById("opponent-count");
const dropZones = Array.from(document.querySelectorAll(".drop-zone"));
const drawBtn = document.getElementById("draw-btn");
const passBtn = document.getElementById("pass-btn");
const resetBtn = document.getElementById("reset-btn");

let state = null;
let legalMap = new Map();
let currentDrag = null;
let pollingHandle = null;

async function api(path, options = {}) {
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };
  if (config.body && typeof config.body !== "string") {
    config.body = JSON.stringify(config.body);
  }
  const response = await fetch(path, config);
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const message = detail?.detail ?? response.statusText;
    throw new Error(message);
  }
  return response.json();
}

async function loadState() {
  try {
    state = await api(`/state?player=${PLAYER_ID}`);
    updateUI();
  } catch (error) {
    console.error(error);
    setStatus(`⚠️ Error al consultar el estado: ${error.message}`);
  }
}

function updateUI() {
  if (!state) {
    return;
  }
  legalMap = new Map(
    (state.legal_moves?.[PLAYER_ID] ?? []).map((move) => [move.index, move.ends])
  );

  updateBoard();
  updateHand();
  updateStatusMessage();
  updateControls();
  schedulePolling();
}

function updateBoard() {
  boardEl.innerHTML = "";
  const tiles = state.board ?? [];
  if (!tiles.length) {
    const empty = document.createElement("p");
    empty.textContent = "El tablero está vacío.";
    boardEl.append(empty);
  } else {
    for (const tile of tiles) {
      const el = document.createElement("div");
      el.className = "board-tile";
      el.textContent = `[${tile[0]}|${tile[1]}]`;
      boardEl.append(el);
    }
  }

  const isPlayersTurn = state.current_player === PLAYER_ID && state.status === "ongoing";
  const availableEnds = { L: false, R: false };
  for (const ends of legalMap.values()) {
    for (const end of ends) {
      availableEnds[end] = true;
    }
  }
  dropZones.forEach((zone) => {
    const end = zone.dataset.end;
    zone.classList.toggle("available", isPlayersTurn && availableEnds[end]);
  });
}

function updateHand() {
  handEl.innerHTML = "";
  const hand = state.players?.[PLAYER_ID]?.hand ?? [];
  const isPlayersTurn = state.current_player === PLAYER_ID && state.status === "ongoing";

  hand.forEach((tile, index) => {
    const el = document.createElement("div");
    el.className = "hand-tile";
    el.textContent = `[${tile[0]}|${tile[1]}]`;
    const ends = legalMap.get(index) ?? [];
    const isPlayable = isPlayersTurn && ends.length > 0;
    el.draggable = isPlayable;
    if (!isPlayable) {
      el.classList.add("disabled");
    } else {
      el.classList.add("playable");
    }

    el.dataset.index = String(index);
    el.addEventListener("dragstart", (event) => {
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

  const opponent = state.players?.opponent?.hand ?? 0;
  opponentCountEl.textContent = typeof opponent === "number" ? opponent : opponent.length;
}

function updateStatusMessage() {
  if (!state) {
    setStatus("Cargando juego...");
    return;
  }

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
    const opponentScore = scores.opponent;
    let message = "La partida está bloqueada.";
    if (typeof playerScore === "number" && typeof opponentScore === "number") {
      message += ` (Tú: ${playerScore} · Oponente: ${opponentScore})`;
    }
    setStatus(message, "warning");
    return;
  }

  if (state.current_player === PLAYER_ID) {
    if (legalMap.size === 0) {
      if ((state.stock ?? 0) > 0) {
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
  const isPlayersTurn = state.current_player === PLAYER_ID && state.status === "ongoing";
  const stockCount = typeof state.stock === "number" ? state.stock : state.stock?.length ?? 0;

  drawBtn.disabled = !(isPlayersTurn && stockCount > 0);
  passBtn.disabled = !(isPlayersTurn && legalMap.size === 0 && stockCount === 0);
  resetBtn.disabled = false;
}

function schedulePolling() {
  if (pollingHandle) {
    clearInterval(pollingHandle);
  }
  const shouldPoll = state && state.status === "ongoing" && state.current_player !== PLAYER_ID;
  if (shouldPoll) {
    pollingHandle = setInterval(() => {
      if (!document.hidden) {
        loadState();
      }
    }, 4000);
  }
}

async function playMove(index, end) {
  try {
    await api("/play", {
      method: "POST",
      body: { player: PLAYER_ID, tile_index: index, end },
    });
    await loadState();
  } catch (error) {
    console.error(error);
    setStatus(`⚠️ ${error.message}`);
  }
}

async function drawTile() {
  try {
    await api("/draw", { method: "POST", body: { player: PLAYER_ID } });
    await loadState();
  } catch (error) {
    setStatus(`⚠️ ${error.message}`);
  }
}

async function passTurn() {
  try {
    await api("/pass", { method: "POST", body: { player: PLAYER_ID } });
    await loadState();
  } catch (error) {
    setStatus(`⚠️ ${error.message}`);
  }
}

async function resetGame() {
  try {
    await api("/reset", { method: "POST" });
    await loadState();
  } catch (error) {
    setStatus(`⚠️ ${error.message}`);
  }
}

dropZones.forEach((zone) => {
  zone.addEventListener("dragover", (event) => {
    if (!currentDrag) {
      return;
    }
    const isPlayersTurn = state?.current_player === PLAYER_ID && state?.status === "ongoing";
    const end = zone.dataset.end;
    if (!isPlayersTurn || !currentDrag.ends.includes(end)) {
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
    playMove(index, end);
  });
});

drawBtn.addEventListener("click", drawTile);
passBtn.addEventListener("click", passTurn);
resetBtn.addEventListener("click", resetGame);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && (!state || state.current_player !== PLAYER_ID)) {
    loadState();
  }
});

loadState();
