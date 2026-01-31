# Playing Minesweeper via the API

The server runs at `http://localhost:3000`. We will interact with it using REST calls and render the board state with the following symbols:

- `_` = unrevealed cell
- `^` = flagged cell
- `*` = revealed mine (only visible if detonated or explicitly returned)
- `0-8` = revealed cell showing neighboring bomb count

Boards are rendered with row and column numbers so you can call out moves precisely.

## Create a Game

```
POST http://localhost:3000/games
Content-Type: application/json

{ "rows": 8, "columns": 8 }
```

Response example:
```
{ "id": "UUID", "rows": 8, "columns": 8, "status": "ACTIVE" }
```

## Reveal a Cell

```
POST http://localhost:3000/games/{gameId}/moves
Content-Type: application/json

{ "x": 0, "y": 0, "action": "REVEAL" }
```

## Flag / Unflag a Cell

```
POST http://localhost:3000/games/{gameId}/moves
Content-Type: application/json

{ "x": 3, "y": 2, "action": "FLAG" }
```

```
POST http://localhost:3000/games/{gameId}/moves
Content-Type: application/json

{ "x": 3, "y": 2, "action": "UNFLAG" }
```

## Rendering Conventions

We render the grid with column headers on top and row headers on the left. Example for a 5x5 board:

```
   0 1 2 3 4
0  _ _ _ _ _
1  _ _ _ _ _
2  _ _ _ _ _
3  _ _ _ _ _
4  _ _ _ _ _
```

After each move, we will:
1) Apply the server response to the local board view.
2) Print the updated grid with row/column numbers.
3) Track game status (`ACTIVE`, `CLEARED`, `DETONATED`).
4) If the game detonates, reveal the full board (all mines and numbers).
