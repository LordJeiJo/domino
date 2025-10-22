from game.core import DominoGame


def create_game() -> DominoGame:
    game = DominoGame(players=("player", "opponent"))
    game.set_board([])
    game.set_stock([])
    game.set_hand("player", [])
    game.set_hand("opponent", [])
    game.current_player = "player"
    game.status = "ongoing"
    game.winner = None
    game.block_scores = None
    game.passes_in_row = 0
    return game


def test_legal_moves_on_empty_board():
    game = create_game()
    game.set_hand("player", [(6, 6), (1, 2)])
    moves = game.legal_moves("player")
    assert {move.index for move in moves} == {0, 1}
    assert all(tuple(move.ends) == ("L", "R") for move in moves)


def test_play_tile_rotates_when_necessary():
    game = create_game()
    game.set_board([(1, 4)])
    game.set_hand("player", [(2, 4), (6, 1)])
    placed = game.play_tile("player", 0, "R")
    assert placed == (4, 2)
    assert game.board[-1] == (4, 2)
    assert game.board_ends() == (1, 2)
    assert game.current_player == "opponent"


def test_blocked_game_scores_and_winner():
    game = create_game()
    game.set_board([(2, 2), (2, 4)])
    game.set_hand("player", [(1, 3)])
    game.set_hand("opponent", [(5, 6)])
    game.set_stock([])

    game.pass_turn("player")
    assert game.current_player == "opponent"
    game.pass_turn("opponent")

    assert game.status == "blocked"
    assert game.block_scores == {"player": 4, "opponent": 11}
    assert game.winner == "player"


def test_playing_last_tile_declares_winner():
    game = create_game()
    game.set_board([(2, 3)])
    game.set_hand("player", [(3, 3)])

    game.play_tile("player", 0, "R")
    assert game.status == "won"
    assert game.winner == "player"
