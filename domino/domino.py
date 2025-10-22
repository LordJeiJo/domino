"""Presentation utilities built on top of the core domino engine."""

from __future__ import annotations

from typing import Iterable, Sequence

from game.core import DominoGame, Move, Tile

__all__ = [
    "DominoGame",
    "Move",
    "Tile",
    "format_tile",
    "render_board",
    "render_hand",
]


def format_tile(tile: Tile) -> str:
    return f"[{tile[0]}|{tile[1]}]"


def _tile_art(tile: Tile) -> tuple[str, str, str]:
    return ("┌───┐", f"│{tile[0]}|{tile[1]}│", "└───┘")


def _chunked(iterable: Sequence[Tile], size: int) -> list[list[Tile]]:
    return [list(iterable[i : i + size]) for i in range(0, len(iterable), size)]


def render_board(game: DominoGame) -> str:
    """Returns an ASCII representation of the board and its open ends."""

    if not game.board:
        return "Board is empty."

    lines: list[str] = []
    for chunk in _chunked(game.board, 9):
        top_line: list[str] = []
        middle_line: list[str] = []
        bottom_line: list[str] = []
        for tile in chunk:
            top, middle, bottom = _tile_art(tile)
            top_line.append(top)
            middle_line.append(middle)
            bottom_line.append(bottom)
        lines.extend([" ".join(top_line), " ".join(middle_line), " ".join(bottom_line), ""])

    ends = game.board_ends()
    assert ends is not None
    lines.append(f"Open ends: {ends[0]} / {ends[1]}")
    return "\n".join(line.rstrip() for line in lines if line or lines[-1] == line)


def render_hand(hand: Sequence[Tile], moves: Iterable[Move]) -> str:
    """Renders a player's hand highlighting legal moves."""

    playable = {move.index for move in moves}
    lines: list[str] = []
    for chunk_start in range(0, len(hand), 9):
        chunk = hand[chunk_start : chunk_start + 9]
        indices_line: list[str] = []
        art_lines = ["", "", ""]
        for offset, tile in enumerate(chunk):
            idx = chunk_start + offset
            marker = "*" if idx in playable else " "
            indices_line.append(f"{idx + 1:2d}{marker}")
            top, middle, bottom = _tile_art(tile)
            art_lines[0] += top + " "
            art_lines[1] += middle + " "
            art_lines[2] += bottom + " "
        lines.append("  " + "   ".join(indices_line))
        lines.extend(line.rstrip() for line in art_lines)
    if not lines:
        return "  (empty)"
    lines.append("Tiles marked with * are playable.")
    return "\n".join(lines)
