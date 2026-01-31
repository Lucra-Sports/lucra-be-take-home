# API Documentation

The API is documented via OpenAPI (Swagger). When the server is running, visit:

```
http://localhost:3000/docs
```

## Endpoints (Summary)

## API Contracts

### Error Payload
All error responses follow this shape:
```json
{
  "error": "bad_request",
  "message": "Human-readable message",
  "details": { "path": "/games/..." }
}
```

### Idempotent No-Op Semantics
Certain move actions are idempotent and return a no-op response with `updatedCells: []`:
- `FLAG` on an already flagged cell
- `UNFLAG` on an already hidden cell
- `REVEAL` on an already revealed cell

### `GET /health`
Liveness check.

Response:
```json
{ "status": "ok" }
```

### `GET /ready`
Readiness check (verifies DB connectivity).

Response:
```json
{ "status": "ready" }
```

### `POST /games`
Create a new game.

Request body:
```json
{ "rows": 8, "columns": 8 }
```

Response:
```json
{ "id": "uuid", "rows": 8, "columns": 8, "status": "ACTIVE" }
```

### `GET /games`
List games (paginated).

Query params: `limit`, `offset`

Response:
```json
{ "data": [ ... ], "total": 0, "limit": 50, "offset": 0 }
```

### `GET /games/:id`
Fetch a game by id.

Response:
```json
{ "id": "uuid", "rows": 8, "columns": 8, "status": "ACTIVE" }
```

### `POST /games/:id/moves`
Make a move (reveal a cell).

Request body:
```json
{ "x": 0, "y": 0, "action": "REVEAL" }
```

Response:
```json
{
  "game": { "id": "uuid", "rows": 8, "columns": 8, "status": "ACTIVE" },
  "updatedCells": [
    { "x": 0, "y": 0, "status": "REVEALED", "neighboringBombCount": 0 }
  ]
}
```

Supported actions: `REVEAL`, `FLAG`, `UNFLAG`.
