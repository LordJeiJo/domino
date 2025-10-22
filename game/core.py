"""Core game logic for a simple two-player domino game."""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

Tile = Tuple[int, int]


@dataclass(frozen=True)
class Move:
    """Represents a playable tile and the board ends it can connect to."""

    index: int
    ends: Tuple[str, ...]


@dataclass
class PlayerState:
    """Stores the mutable hand for a player."""

    name: str
    hand: List[Tile] = field(default_factory=list)


class DominoGame:
    """Implements the rules for a standard double-six domino match."""

    def __init__(
        self,
        players: Sequence[str] | None = None,
        *,
        hand_size: int = 7,
        rng: random.Random | None = None,
    ) -> None:
        self.rng = rng or random.Random()
        self.hand_size = hand_size
        self.turn_order: List[str] = list(players or ("player", "opponent"))
        if len(self.turn_order) != 2:
            raise ValueError("This implementation supports exactly two players.")

        self.players: Dict[str, PlayerState] = {
            name: PlayerState(name=name) for name in self.turn_order
        }
        self.stock: List[Tile] = []
        self.board: List[Tile] = []
        self.current_player: str = self.turn_order[0]
        self.status: str = "ongoing"
        self.winner: Optional[str] = None
        self.block_scores: Optional[Dict[str, int]] = None
        self.passes_in_row = 0

        self.reset()

    # ------------------------------------------------------------------
    # Setup helpers
    def reset(self) -> None:
        """Starts a new game with freshly shuffled tiles."""

        self.stock = self._create_stock()
        self.rng.shuffle(self.stock)

        for player in self.players.values():
            player.hand = [self.stock.pop() for _ in range(self.hand_size)]

        self.board = []
        self.current_player = self._determine_starting_player()
        self.status = "ongoing"
        self.winner = None
        self.block_scores = None
        self.passes_in_row = 0

    @staticmethod
    def _create_stock() -> List[Tile]:
        return [(left, right) for left in range(7) for right in range(left, 7)]

    def _determine_starting_player(self) -> str:
        def highest_double(hand: Sequence[Tile]) -> Optional[Tile]:
            doubles = [tile for tile in hand if tile[0] == tile[1]]
            return max(doubles, default=None)

        best_tile: Optional[Tile] = None
        starter = self.turn_order[0]
        tied: List[str] = []
        for name in self.turn_order:
            candidate = highest_double(self.players[name].hand)
            if candidate is None:
                continue
            if best_tile is None or candidate > best_tile:
                best_tile = candidate
                starter = name
                tied = [name]
            elif candidate == best_tile:
                tied.append(name)
        if best_tile is None:
            return self.rng.choice(self.turn_order)
        if len(tied) > 1:
            return self.rng.choice(tied)
        return starter

    # ------------------------------------------------------------------
    # Query helpers
    def board_ends(self) -> Optional[Tuple[int, int]]:
        if not self.board:
            return None
        return self.board[0][0], self.board[-1][1]

    def legal_moves(self, player: str) -> List[Move]:
        self._ensure_player(player)
        if self.status != "ongoing":
            return []

        hand = self.players[player].hand
        if not self.board:
            return [Move(index=i, ends=("L", "R")) for i in range(len(hand))]

        ends = self.board_ends()
        if ends is None:
            raise RuntimeError("Board ends requested while board is empty")
        left_end, right_end = ends

        moves: List[Move] = []
        for index, tile in enumerate(hand):
            possible: List[str] = []
            if tile[0] == left_end or tile[1] == left_end:
                possible.append("L")
            if tile[0] == right_end or tile[1] == right_end:
                possible.append("R")
            if possible:
                moves.append(Move(index=index, ends=tuple(possible)))
        return moves

    # ------------------------------------------------------------------
    # Actions
    def play_tile(self, player: str, tile_index: int, end: str) -> Tile:
        """Places a tile on the board after validating the move."""

        self._ensure_can_act(player)
        moves = {move.index: move for move in self.legal_moves(player)}
        if tile_index not in moves:
            raise ValueError("Selected tile is not a legal move")
        move = moves[tile_index]
        end = end.upper()
        if end not in move.ends:
            raise ValueError("Tile cannot be played on the chosen end")

        tile = self.players[player].hand.pop(tile_index)
        placed = self._place_tile(tile, end)
        if not self.players[player].hand:
            self.status = "won"
            self.winner = player
        self._advance_turn(moved=True)
        return placed

    def draw_tile(self, player: str) -> Tile:
        """Draws a tile from the stock for the active player."""

        self._ensure_can_act(player)
        if not self.stock:
            raise ValueError("Cannot draw: the stock is empty")
        tile = self.stock.pop()
        self.players[player].hand.append(tile)
        return tile

    def pass_turn(self, player: str) -> None:
        """Passes the turn when no moves are available and the stock is empty."""

        self._ensure_can_act(player)
        if self.legal_moves(player):
            raise ValueError("Cannot pass: legal moves are available")
        if self.stock:
            raise ValueError("Cannot pass: the stock still has tiles")
        self._advance_turn(moved=False)

    # ------------------------------------------------------------------
    # Serialization helpers
    def to_dict(self, *, for_player: Optional[str] = None) -> Dict[str, object]:
        """Serializes the game state into plain Python structures."""

        self._ensure_player(self.current_player)
        data: Dict[str, object] = {
            "board": [list(tile) for tile in self.board],
            "stock": len(self.stock) if for_player else [list(tile) for tile in self.stock],
            "current_player": self.current_player,
            "status": self.status,
            "winner": self.winner,
            "passes_in_row": self.passes_in_row,
            "players": {
                name: {
                    "name": state.name,
                    "hand": [list(tile) for tile in state.hand]
                    if (for_player is None or for_player == name)
                    else len(state.hand),
                }
                for name, state in self.players.items()
            },
        }
        if self.block_scores is not None:
            data["block_scores"] = {
                name: score for name, score in self.block_scores.items()
            }
        return data

    # ------------------------------------------------------------------
    # Internal helpers
    def _place_tile(self, tile: Tile, end: str) -> Tile:
        if not self.board:
            self.board.append(tile)
            return tile

        ends = self.board_ends()
        if ends is None:
            raise RuntimeError("Board ends requested while board is empty")
        left_end, right_end = ends

        if end == "L":
            if tile[1] == left_end:
                self.board.insert(0, tile)
                return tile
            if tile[0] == left_end:
                placed = (tile[1], tile[0])
                self.board.insert(0, placed)
                return placed
            raise ValueError("Tile does not fit on the left end")
        if end == "R":
            if tile[0] == right_end:
                self.board.append(tile)
                return tile
            if tile[1] == right_end:
                placed = (tile[1], tile[0])
                self.board.append(placed)
                return placed
            raise ValueError("Tile does not fit on the right end")
        raise ValueError("End must be 'L' or 'R'")

    def _advance_turn(self, *, moved: bool) -> None:
        if self.status != "ongoing":
            return

        if moved:
            self.passes_in_row = 0
        else:
            self.passes_in_row += 1
            if self.passes_in_row >= len(self.turn_order):
                self.status = "blocked"
                self.block_scores = {
                    name: sum(sum(tile) for tile in state.hand)
                    for name, state in self.players.items()
                }
                min_score = min(self.block_scores.values())
                winners = [name for name, score in self.block_scores.items() if score == min_score]
                if len(winners) == 1:
                    self.winner = winners[0]
                return

        idx = self.turn_order.index(self.current_player)
        self.current_player = self.turn_order[(idx + 1) % len(self.turn_order)]

    def _ensure_can_act(self, player: str) -> None:
        if self.status != "ongoing":
            raise ValueError("Game has already finished")
        if self.current_player != player:
            raise ValueError("It is not this player's turn")
        self._ensure_player(player)

    def _ensure_player(self, player: str) -> None:
        if player not in self.players:
            raise ValueError(f"Unknown player '{player}'")

    # ------------------------------------------------------------------
    # Convenience helpers for tests or tooling
    def player_hand(self, player: str) -> List[Tile]:
        self._ensure_player(player)
        return list(self.players[player].hand)

    def set_board(self, tiles: Iterable[Tile]) -> None:
        self.board = list(tiles)

    def set_hand(self, player: str, tiles: Iterable[Tile]) -> None:
        self._ensure_player(player)
        self.players[player].hand = list(tiles)

    def set_stock(self, tiles: Iterable[Tile]) -> None:
        self.stock = list(tiles)
