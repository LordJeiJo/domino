# Domino Game

This project provides a minimal, fully playable domino game for the terminal. It
uses the classic double-six set and pits a human player against a simple
computer opponent. The goal is to be the first to play all tiles or finish with
the lowest pip total if the game becomes blocked.

## Requirements

- Python 3.9 or newer (no third-party dependencies required)

## Running the Game

```bash
python3 domino.py
```

## How to Play

1. The game shuffles a double-six set and deals seven tiles to each player.
2. On your turn, review the board that shows the current chain of tiles and the
   open ends.
3. Choose a tile from your hand by entering its number. If the tile can be
   played on both ends, you will be asked to choose which end to use.
4. If you cannot play, the game automatically draws from the boneyard. If no
   tiles remain, you must pass.
5. The computer follows the same rules, choosing the first legal move it finds.
6. The game ends when one player has no tiles left or when both players are
   forced to pass. In the latter case, the player with the lower pip total wins.

Enjoy a quick game of dominoes directly from your terminal!
