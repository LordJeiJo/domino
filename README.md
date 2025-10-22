# Domino Game Platform

This project contains a reusable domino engine, a REST API and a draggable web
client built around a standard double-six set. The stack is intentionally
minimal so it can run with a local Python interpreter and a static file server.

## Project Structure

- `game/core.py`: pure game engine with no direct I/O.
- `domino/`: presentation helpers that format hands and boards for CLIs or logs.
- `web/server.py`: FastAPI backend that exposes JSON endpoints to inspect the
  match, play tiles, draw from the stock, pass or reset the game.
- `web/static/`: HTML, CSS and JavaScript for the draggable browser interface.
- `tests/`: pytest-based coverage for core move validation, tile rotation and
  blocked game scoring.

## Requirements

- Python 3.9+
- Dependencies listed in `requirements.txt` (`fastapi`, `uvicorn`, `pydantic`,
  `pytest`).

Install them with:

```bash
python -m pip install -r requirements.txt
```

## Running the API and Frontend

Start the FastAPI backend with uvicorn:

```bash
uvicorn web.server:app --reload
```

The API offers the following routes:

- `GET /state`: returns the current match snapshot (use `?player=player` to hide
  the opponent hand).
- `POST /play`: body `{ "player": "player", "tile_index": 0, "end": "L" }` to
  play a tile by index.
- `POST /draw`: body `{ "player": "player" }` to draw from the stock.
- `POST /pass`: body `{ "player": "player" }` to pass when there are no moves
  and the stock is empty.
- `POST /reset`: restart the match with a freshly shuffled stock.

Serve the static client (for example with `python -m http.server`) and open
`web/static/index.html`. The UI highlights valid ends, supports drag & drop and
provides buttons to draw, pass or reset.

## Running Tests

```bash
pytest
```

The engine tests cover legal move detection, automatic rotation of tiles and the
blocked-game scoring rules.
