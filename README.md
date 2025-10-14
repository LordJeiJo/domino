# Dominó 2P (HTML/CSS/JS) — MVP para directo

## Cómo ejecutar
Abre el archivo `index.html` en tu navegador favorito. No necesitas servidor ni dependencias externas.

## Controles básicos
- La mano del jugador activo se mostrará en la sección inferior.
- Haz clic en una ficha para seleccionarla; se habilitarán los botones de juego según corresponda.
- Usa los botones **Jugar a la izquierda** o **Jugar a la derecha** para colocar fichas válidas.
- Si no tienes jugada, pulsa **Robar**. Cuando no queden fichas en el pozo, podrás **Pasar**.

## Reglas y límites del MVP
- Set doble-seis (0-0 a 6-6).
- 7 fichas por jugador al inicio. El resto va al pozo (boneyard).
- Empieza quien tenga el doble más alto. Si nadie tiene dobles, comienza el Jugador 1.
- Turnos alternos automáticos. Si un jugador no puede jugar y no hay fichas para robar, pasa.
- La ronda termina cuando alguien se queda sin fichas o si el juego queda bloqueado.
- En caso de bloqueo, gana quien tenga menos puntos en la mano.

## Puntos de extensión sugeridos
- Drag & drop nativo para colocar fichas.
- IA rival básica para partidas en solitario.
- Marcador por rondas (bo3) con suma de puntos.
- Historial de jugadas y ayudas visuales para fichas jugables.
