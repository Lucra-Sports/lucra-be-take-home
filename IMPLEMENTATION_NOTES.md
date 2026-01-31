<!--
Describe implementation below.

Feel free to add any relevant info on what packages you may have added, the directory structure you chose, the tests you added etc. Is there anything you would have done differently with more time and or resources?
-->

## What We Implemented
### Endpoints
- `POST /games` creates a game and its cells with randomized mines and precomputed neighbor counts.
- `GET /games` lists games with limit/offset pagination.
- `GET /games/:id` fetches a single game.
- `POST /games/:id/moves` supports `REVEAL`, `FLAG`, and `UNFLAG` actions.

### Move Behavior
`POST /games/:id/moves` accepts `{ x, y, action: "REVEAL" | "FLAG" | "UNFLAG" }`. Revealing a mine sets the cell to `DETONATED` and the game to `DETONATED`. Revealing a safe cell marks it `REVEALED` and flood-reveals connected zero-count cells plus their border numbers, then clears the game when all safe cells are revealed. Flagging toggles a hidden cell to `FLAGGED`, and unflagging returns it to `HIDDEN`. Redundant actions (`FLAG` on flagged, `UNFLAG` on hidden, `REVEAL` on revealed) return a no-op response with no updated cells.

### Error Handling
Consistent HTTP semantics (`400` invalid input, `404` missing game, `409` conflicts, `422` invalid actions) and a standardized error payload `{ error, message, details }`. UUIDs are validated, and a global exception filter normalizes unexpected errors to a safe `500`.

### Validation
Request validation uses DTOs with `class-validator` and a global `ValidationPipe`, reducing manual parsing and ensuring consistent error responses.

### Testing
Behavior-driven flows are covered by e2e tests and kept fewer than unit tests to align with the test pyramid. Unit tests cover controller/service logic and game-generation helpers; e2e tests validate core flows like create/list/fetch and move actions.

### Documentation
OpenAPI (Swagger) is available at `/docs`. Markdown docs live in `docs/API.md` and `docs/DB_SCHEMA.md`.

### Data Integrity
Added a unique constraint on `game_cells(game_id, x_coordinate, y_coordinate)` plus an index on `(game_id, status)` to enforce cell uniqueness and speed win checks.

### Configuration
Database credentials are required environment variables. `.env` files are loaded via `dotenv` for local development; startup fails fast if any required keys are missing or invalid (e.g., `DB_PORT`).

### Health & Readiness
Added `GET /health` (liveness) and `GET /ready` (readiness) endpoints. `/ready` checks database connectivity.

### Graceful Shutdown
Enabled Nest shutdown hooks so the app drains requests and closes the database connection on termination signals.

## Decisions
### Game Rules & Limits
Game size boundaries: minimum `2x2`, maximum `100x100`. The minimum avoids trivial “coin flip” boards like `1x2` or `2x1` where the first click decides the outcome and neighboring counts are meaningless. The maximum keeps game creation (cell generation, mine placement, and neighbor counts) within a reasonable envelope for fun and engaging gameplay.

### Mine Density
Default mine density is **15%** (`DEFAULT_MINE_RATIO = 0.15`) to keep boards playable while still requiring deductions. This is defined in `src/games.logic.ts` and used by `computeMineCount`.

### Performance: Move Fetch Strategy
For performance, moves fetch only the target cell first and load all cells only when a reveal can flood (neighbor count = 0). This avoids full-board reads for flag/unflag and non-zero reveals.

### Peformance: Flood-Fill Queue
Flood-fill uses index-based queue iteration to avoid O(n^2) behavior from repeated `shift()` operations.

### Performance: Reveal Data Structures
Flood-fill uses integer indices and arrays (`isMine[]`, `neighborCounts[]`, `Uint8Array`) instead of string keys to reduce allocations.

## Future Ideas
### Configurable Mine Density
Allow `POST /games` to accept `mineRatio` (0–1) or `mineCount`, validate the input (cap at `rows * columns - 1`), and persist the chosen value on the game for auditing and client display.

### Prevent Losing on First Move
Guarantee the first move is never a mine by relocating mines after the first reveal when needed.

### Performance Improvements
- Replace per-move `count` scans with a `revealed_safe_count` on `games` to avoid full-table counts.
- Bulk insert game cells during creation rather than saving each entity to reduce insert overhead.
- Add `created_at` and order game listings by it instead of UUID for better locality and semantics.
- Once authn/z is implemented add 'gamer_id' with an index to support quick retrieval of a user's games.

### Reliability, Error Handling, Observability (Plan)
Here are some additional ideas to make the service more production ready. Request Id value increases as the system becomes more distributed. For example if this service had to call other dependent services for normal functionality.
- Standardize error payloads with a stable `code` and `requestId` for correlation (defer).
- Add DB timeouts and surface slow query metrics.
- Add structured logging with `requestId`, `gameId`, action, and coordinates.
- Emit metrics for endpoint latency, move outcomes, and flood-reveal sizes.
- Add tracing (OpenTelemetry) for HTTP + DB spans.

### Security Considerations
I didn't implement most of these ideas because I see an opportunity to handle things like authn/z, rate-limiting, CORS, TLS at a platform level. I think one of the best value propositions a platform can offer is taking cognitive load away from the developers by giving them must have capabilities "for free" (or at least for less!).
- Add authentication/authorization and store `owner_id` on games to enforce per-user access.
- Rate-limit `POST /games` and `/moves` to prevent abuse or brute-force probing.
- Configure CORS explicitly and add CSRF protection for browser-based clients.
- Ensure cell-fetch APIs never expose mines for active games.
- Avoid logging full boards or mine locations; log request IDs + minimal metadata.
- Use TLS and enforce HTTPS in production.
