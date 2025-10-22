"""FastAPI application exposing the domino engine through REST endpoints."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from game.core import DominoGame

app = FastAPI(title="Domino API", version="1.0.0")

game = DominoGame()


def _serialize_moves(player: str) -> list[dict[str, object]]:
    return [
        {"index": move.index, "ends": list(move.ends)}
        for move in game.legal_moves(player)
    ]


def _serialize_state(*, perspective: str | None = None) -> dict:
    state = game.to_dict(for_player=perspective)
    if perspective is None:
        legal = {name: _serialize_moves(name) for name in game.players}
    else:
        legal = {perspective: _serialize_moves(perspective)}
    state["legal_moves"] = legal
    return state


class PlayRequest(BaseModel):
    player: str
    tile_index: int
    end: str


class DrawRequest(BaseModel):
    player: str


class PassRequest(BaseModel):
    player: str


@app.get("/state")
def get_state(player: str | None = None) -> dict:
    """Returns the current game state."""

    if player is not None and player not in game.players:
        raise HTTPException(status_code=404, detail="Unknown player")
    return _serialize_state(perspective=player)


@app.post("/play")
def play_tile(request: PlayRequest) -> dict:
    try:
        game.play_tile(request.player, request.tile_index, request.end)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialize_state()


@app.post("/draw")
def draw_tile(request: DrawRequest) -> dict:
    try:
        game.draw_tile(request.player)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialize_state(perspective=request.player)


@app.post("/pass")
def pass_turn(request: PassRequest) -> dict:
    try:
        game.pass_turn(request.player)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialize_state()


@app.post("/reset")
def reset_game() -> dict:
    game.reset()
    return _serialize_state()
