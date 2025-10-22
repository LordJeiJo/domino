# Dominó 2 jugadores (MVP)

Pequeño prototipo web para jugar una partida rápida de dominó entre dos personas en el mismo dispositivo. El objetivo es validar la jugabilidad básica sin depender de frameworks ni backends: todo ocurre en el navegador con HTML, CSS y JavaScript modernos.

## Características principales

- Generación automática del set clásico doble-seis.
- Reparto inicial aleatorio (7 fichas por jugador) y control de turnos.
- Interacción por drag & drop o botones para jugar a izquierda/derecha.
- Indicadores visuales del extremo donde sueltas la ficha.
- Representación renovada de las fichas con pips (puntos) al estilo tradicional.
- Personalización opcional de las caras mediante imágenes locales.
- Modal de fin de ronda con opción para reiniciar la partida.

## Cómo probarlo

1. Clona este repositorio y entra en la carpeta del proyecto.
2. Abre `index.html` directamente en tu navegador favorito (Chrome, Firefox, Edge, Safari moderno). No necesitas servidor.
3. Arrastra una ficha desde tu mano hasta alguno de los extremos señalados o selecciona la ficha y usa los botones «Jugar a la izquierda/derecha».
4. Si te quedas sin jugadas, pulsa «Robar»; si tampoco puedes jugar, «Pasar» cede el turno.

### Versión Kivy de escritorio (experimental)

Si prefieres una interfaz nativa utilizando [Kivy](https://kivy.org), puedes ejecutar una versión mínima incluida en `domino.py`:

```bash
python -m pip install kivy
python domino.py
```

Esta versión crea el tablero con tres contenedores (`ia`, `tablero` y `jugador`) y, al iniciar, reparte automáticamente las manos mostrando las fichas del jugador en pantalla.

> 💡 Consejo: si personalizas las fichas con imágenes, recuerda que sólo se guardan en la sesión actual del navegador.

## Desarrollo

El proyecto está dividido en módulos simples dentro de `src/`:

- `game.js`: estado global y reglas básicas de dominó.
- `ui.js`: renderizado y eventos del DOM.
- `deck.js`: utilidades para generar y barajar fichas.
- `utils.js`: helpers compartidos (por ejemplo, para formatos de texto).

No hay dependencias externas. Puedes modificar los módulos y recargar la página para ver los cambios. Si necesitas lanzar un servidor local, bastará con `npx serve` o cualquier servidor estático.

## Próximos pasos sugeridos

- Añadir conteo automático de puntos cuando se cierre una ronda.
- Implementar una IA sencilla para practicar contra el ordenador.
- Guardar la partida en `localStorage` para continuar después.
- Adaptar la UI a pantallas pequeñas con una disposición vertical.

¡Disfruta el juego y gracias por las pruebas!
