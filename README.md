# Domino en el Navegador

Aplicación web de dominó construida únicamente con HTML, CSS y JavaScript. Toda la
lógica del juego vive en el cliente, por lo que basta con abrir el fichero
`web/static/index.html` en el navegador para empezar a jugar contra un oponente
controlado por la máquina.

## Características

- Implementación completa del dominó doble-seis (baraja, reparto, turnos y
  puntuación por bloqueo).
- Interfaz con arrastrar y soltar para colocar fichas en los extremos
  disponibles del tablero.
- Oponente automático que intenta jugar dobles cuando es posible y roba del
  pozo si se queda sin movimientos.
- Posibilidad de robar, pasar turno cuando no quedan fichas en el pozo y
  reiniciar la partida en cualquier momento.

## Estructura del proyecto

- `web/static/index.html`: estructura principal de la interfaz.
- `web/static/styles.css`: estilos de la aplicación.
- `web/static/app.js`: motor del juego y comportamiento de la interfaz en el
  navegador.

## Cómo ejecutarlo

No se necesita ningún backend ni dependencias externas. Puedes usar cualquiera
de estas opciones:

1. Abrir directamente `web/static/index.html` con tu navegador preferido.
2. Servir la carpeta estática con un servidor sencillo, por ejemplo:

   ```bash
   cd web/static
   python -m http.server 8000
   ```

   Luego navega a <http://localhost:8000>.

## Reglas básicas

- Ambos jugadores reciben 7 fichas y el turno inicial se decide por el doble más
  alto (o al azar si nadie tiene dobles).
- Si puedes jugar, arrastra una ficha hasta el extremo iluminado (izquierdo o
  derecho) que coincida con alguno de sus valores.
- Si no hay jugadas disponibles y quedan fichas en el pozo, pulsa **Roba** para
  añadir una nueva ficha a tu mano.
- Si no hay jugadas y el pozo está vacío, pulsa **Pasar**. Cuando ambos jugadores
  pasan consecutivamente, la partida se considera bloqueada y gana quien tenga
  menos puntos en la mano.
- **Reiniciar** baraja de nuevo todas las fichas y empieza otra partida.

¡Disfruta jugando al dominó directamente desde tu navegador!
