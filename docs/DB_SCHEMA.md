# Database Schema

This service uses Postgres with TypeORM. Tables are auto-managed via `synchronize: true`.

## `games`
- `id` (uuid, pk)
- `status` (enum: `ACTIVE`, `CLEARED`, `DETONATED`)
- `rows` (int)
- `columns` (int)

## `game_cells`
- `id` (uuid, pk)
- `game_id` (uuid, fk → `games.id`)
- `status` (enum: `HIDDEN`, `REVEALED`, `FLAGGED`, `DETONATED`)
- `x_coordinate` (int)
- `y_coordinate` (int)
- `is_mine` (boolean)
- `neighboring_bomb_count` (int)

## Indexes
- `game_cells(game_id, x_coordinate, y_coordinate)` unique constraint (also used for lookups).
- `game_cells(game_id, status)` index for win checks and filters.
