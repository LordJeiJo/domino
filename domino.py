from kivy.app import App
from kivy.clock import Clock
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
import random


class DominoTile(Button):
    """Simple visual representation for a domino tile."""

    def __init__(self, value_a, value_b, display_text: str | None = None, **kwargs):
        super().__init__(**kwargs)
        self.value_a = value_a
        self.value_b = value_b
        self.text = display_text or f"[{value_a}|{value_b}]"
        self.size_hint = (None, None)
        self.width = 110
        self.height = 70
        self.font_size = "18sp"
        self.background_normal = ""
        self.background_down = ""
        self.background_color = (1, 1, 1, 1)
        self.color = (0, 0, 0, 1)


class DominoGame(BoxLayout):
    """Root widget that handles the domino board and hands."""

    HAND_SIZE = 7

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        Clock.schedule_once(self._setup_game)

    def _setup_game(self, *_):
        self._create_deck()
        self.player_hand = [self.deck.pop() for _ in range(self.HAND_SIZE)]
        self.ai_hand = [self.deck.pop() for _ in range(self.HAND_SIZE)]
        self.board_tiles = []

        self._render_player_hand()
        self._render_ai_hand()
        self._start_board()

    def _create_deck(self):
        self.deck = [(a, b) for a in range(7) for b in range(a, 7)]
        random.shuffle(self.deck)

    def _render_player_hand(self):
        layout = self.ids.player_hand
        layout.clear_widgets()
        for value_a, value_b in sorted(self.player_hand):
            layout.add_widget(DominoTile(value_a, value_b))

    def _render_ai_hand(self):
        layout = self.ids.ai_hand
        layout.clear_widgets()
        for _ in self.ai_hand:
            layout.add_widget(DominoTile("?", "?", display_text="[?|?]"))

    def _start_board(self):
        layout = self.ids.board
        layout.clear_widgets()
        if self.board_tiles:
            for value_a, value_b in self.board_tiles:
                layout.add_widget(DominoTile(value_a, value_b))
        else:
            first_tile = self.deck.pop()
            self.board_tiles.append(first_tile)
            layout.add_widget(DominoTile(*first_tile))


class DominoApp(App):
    def build(self):
        return DominoGame()


if __name__ == "__main__":
    DominoApp().run()
