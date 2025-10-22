"""Command-line domino game using a double-six set.

The implementation focuses on clarity and playability. Run the script with
Python 3.9+ and follow the on-screen prompts to play against a simple computer
opponent.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import List, Optional, Sequence, Tuple

Tile = Tuple[int, int]


@dataclass
class Move:
    index: int
    ends: Sequence[str]


class DominoGame:
    def __init__(self) -> None:
        self.stock: List[Tile] = self._create_stock()
        random.shuffle(self.stock)

        self.player_hand = [self.stock.pop() for _ in range(7)]
        self.computer_hand = [self.stock.pop() for _ in range(7)]
        self.board: List[Tile] = []

        self.current_player = self._determine_starting_player()

    @staticmethod
    def _create_stock() -> List[Tile]:
        return [(left, right) for left in range(7) for right in range(left, 7)]

    def _determine_starting_player(self) -> str:
        def highest_double(hand: Sequence[Tile]) -> Optional[Tile]:
            doubles = [tile for tile in hand if tile[0] == tile[1]]
            return max(doubles, default=None)

        player_double = highest_double(self.player_hand)
        computer_double = highest_double(self.computer_hand)

        if player_double and computer_double:
            return "player" if player_double > computer_double else "computer"
        if player_double:
            return "player"
        if computer_double:
            return "computer"
        return random.choice(["player", "computer"])

    def draw_tile(self, hand: List[Tile]) -> Optional[Tile]:
        if not self.stock:
            return None
        tile = self.stock.pop()
        hand.append(tile)
        return tile

    @staticmethod
    def format_tile(tile: Tile) -> str:
        return f"[{tile[0]}|{tile[1]}]"

    def board_ends(self) -> Optional[Tuple[int, int]]:
        if not self.board:
            return None
        left_end = self.board[0][0]
        right_end = self.board[-1][1]
        return left_end, right_end

    def legal_moves(self, hand: Sequence[Tile]) -> List[Move]:
        if not self.board:
            return [Move(index=i, ends=("L", "R")) for i in range(len(hand))]

        ends = self.board_ends()
        if ends is None:
            raise RuntimeError("Board ends requested while board is empty")
        left_end, right_end = ends
        moves: List[Move] = []
        for index, tile in enumerate(hand):
            possible_ends = []
            if tile[0] == left_end or tile[1] == left_end:
                possible_ends.append("L")
            if tile[0] == right_end or tile[1] == right_end:
                possible_ends.append("R")
            if possible_ends:
                moves.append(Move(index=index, ends=tuple(possible_ends)))
        return moves

    def place_tile(self, tile: Tile, end: str) -> None:
        if not self.board:
            self.board.append(tile)
            return

        ends = self.board_ends()
        if ends is None:
            raise RuntimeError("Board ends requested while board is empty")
        left_end, right_end = ends

        if end == "L":
            if tile[1] == left_end:
                self.board.insert(0, tile)
            elif tile[0] == left_end:
                self.board.insert(0, (tile[1], tile[0]))
            else:
                raise ValueError("Tile does not fit on the left end")
        else:  # end == "R"
            if tile[0] == right_end:
                self.board.append(tile)
            elif tile[1] == right_end:
                self.board.append((tile[1], tile[0]))
            else:
                raise ValueError("Tile does not fit on the right end")

    def take_turn(self, hand: List[Tile], is_player: bool) -> bool:
        moves = self.legal_moves(hand)

        if is_player:
            return self._player_turn(hand, moves)
        return self._computer_turn(hand, moves)

    def _player_turn(self, hand: List[Tile], moves: List[Move]) -> bool:
        print("\nYour turn!")
        self._show_board()

        if not moves:
            tile = self.draw_tile(hand)
            if tile:
                print(f"No legal moves. Drew tile {self.format_tile(tile)}.")
                return self._player_turn(hand, self.legal_moves(hand))
            print("No legal moves and the boneyard is empty. You pass.")
            return False

        self._show_hand(hand, moves)

        while True:
            choice = input("Select a tile number to play (or 'q' to quit): ").strip()
            if choice.lower() == "q":
                raise SystemExit("Game aborted by player.")
            if not choice.isdigit():
                print("Please enter a valid number.")
                continue
            index = int(choice) - 1
            if index < 0 or index >= len(hand):
                print("Number out of range. Try again.")
                continue

            matching_move = next((move for move in moves if move.index == index), None)
            if matching_move is None:
                print("That tile cannot be played right now. Choose another.")
                continue

            end = self._choose_end(matching_move)
            tile = hand.pop(index)
            self.place_tile(tile, end)
            print(f"You played {self.format_tile(tile)} on the {'left' if end == 'L' else 'right'} end.")
            return True

    def _show_board(self) -> None:
        if not self.board:
            print("Board is empty.")
            return
        board_str = "".join(self.format_tile(tile) for tile in self.board)
        ends = self.board_ends()
        if ends is None:
            raise RuntimeError("Board ends requested while board is empty")
        left_end, right_end = ends
        print(f"Board: {board_str} (open ends: {left_end} / {right_end})")

    def _show_hand(self, hand: Sequence[Tile], moves: List[Move]) -> None:
        playable_indices = {move.index for move in moves}
        print("Your hand:")
        for i, tile in enumerate(hand, start=1):
            marker = "*" if (i - 1) in playable_indices else " "
            print(f"  {i:2d}. {self.format_tile(tile)}{marker}")
        print("Tiles marked with * are playable.")

    def _choose_end(self, move: Move) -> str:
        if len(move.ends) == 1 or not self.board:
            return move.ends[0]

        while True:
            selection = input("Play on the (L)eft or (R)ight? ").strip().upper()
            if selection in move.ends:
                return selection
            print("Invalid choice for this tile. Try again.")

    def _computer_turn(self, hand: List[Tile], moves: List[Move]) -> bool:
        print("\nComputer's turn...")
        self._show_board()

        while not moves:
            tile = self.draw_tile(hand)
            if not tile:
                print("Computer cannot move and the boneyard is empty. It passes.")
                return False
            print("Computer draws a tile.")
            moves = self.legal_moves(hand)

        move = moves[0]
        tile = hand.pop(move.index)
        end = move.ends[0]
        self.place_tile(tile, end)
        print(f"Computer plays {self.format_tile(tile)} on the {'left' if end == 'L' else 'right'} end.")
        return True

    def play(self) -> None:
        print("Welcome to Dominoes! You are playing with a double-six set.")
        print(f"The {self.current_player} goes first.\n")

        passes_in_row = 0
        while True:
            if self.current_player == "player":
                moved = self.take_turn(self.player_hand, is_player=True)
                if not self.player_hand:
                    print("\nYou played all your tiles. You win!")
                    return
                self.current_player = "computer"
            else:
                moved = self.take_turn(self.computer_hand, is_player=False)
                if not self.computer_hand:
                    print("\nThe computer has no tiles left. It wins!")
                    return
                self.current_player = "player"

            passes_in_row = 0 if moved else passes_in_row + 1
            if passes_in_row >= 2:
                print("\nBoth players are blocked. Calculating scores...")
                self._handle_blocked_game()
                return

    def _handle_blocked_game(self) -> None:
        player_score = sum(sum(tile) for tile in self.player_hand)
        computer_score = sum(sum(tile) for tile in self.computer_hand)

        player_tiles = " ".join(self.format_tile(t) for t in self.player_hand) or "none"
        computer_tiles = " ".join(self.format_tile(t) for t in self.computer_hand) or "none"

        print(f"Your remaining tiles ({player_score} points): {player_tiles}")
        print(f"Computer's remaining tiles ({computer_score} points): {computer_tiles}")

        if player_score < computer_score:
            print("You win by having the lower pip total!")
        elif computer_score < player_score:
            print("The computer wins with the lower pip total.")
        else:
            print("It's a draw!")


def main() -> None:
    random.seed()
    game = DominoGame()
    game.play()


if __name__ == "__main__":
    main()
