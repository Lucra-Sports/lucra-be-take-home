# Repository Guidelines

## Project Structure & Module Organization
This is a NestJS backend with TypeORM.
- `src/` contains application code (controllers, services, entities).
- `src/entities/` defines `Game` and `GameCell` models mapped to Postgres.
- `test/` holds e2e test configuration (`jest-e2e.json`).
- `docs/API.md` describes the API and points to the OpenAPI docs.
- `docs/DB_SCHEMA.md` describes the database schema.
- `docker-compose.yml` runs a local Postgres instance for development.
- `context/PLAYING.md` instructions for the agent to act as a client to play the game.

## Build, Test, and Development Commands
Use Yarn (v4) as defined in `package.json`.
- Before running any Yarn commands in this shell, use Node 22 via NVM:
  - `source ~/.nvm/nvm.sh && nvm use 22`
- `yarn install` installs dependencies.
- `yarn start:dev` starts the API in watch mode and brings up Postgres.
- `yarn start` runs the NestJS server without watch.
- `yarn build` compiles TypeScript to `dist/`.
- `yarn lint` runs ESLint with `--fix`.
- `yarn format` formats `src/` and `test/` with Prettier.
- `yarn test` runs unit tests in `src/`.
- `yarn test:e2e` runs e2e tests via `test/jest-e2e.json`.
- `yarn db:start` / `yarn db:stop` manage the local database container.
- `yarn db:reset` removes the DB container and volume.
- API docs are served at `http://localhost:3000/docs` when the app is running.
- Health endpoints: `GET /health` (liveness) and `GET /ready` (readiness).

## Coding Style & Naming Conventions
- TypeScript with NestJS patterns (controller/service/entity).
- 2-space indentation, single quotes, and semicolons are enforced by Prettier/ESLint.
- File naming follows Nest defaults: `*.controller.ts`, `*.service.ts`, `*.entity.ts`.
- Entities use snake_case column names via decorators (see `src/entities/*.ts`).

## Testing Guidelines
- Jest is configured for unit tests under `src/` (`*.spec.ts`).
- E2E tests use `test/jest-e2e.json`.
- Follow the test pyramid: more unit tests than e2e tests.
- Aim to cover controllers and services with small, focused unit tests.
- Use e2e tests for behavior-driven scenarios that match a player’s flow:
  - Create a game with valid `rows`/`columns`; expect a game id and dimensions.
  - Reject invalid sizes (missing, non-integer, zero, negative, or too large).
  - List games with pagination (`limit`, `offset`) and verify totals.
  - Fetch a game by id and handle 404 for unknown ids.
  - Verify generated cells match `rows * columns`, mines are within expected bounds,
    and `neighboring_bomb_count` is correct for a few sampled positions.

## Commit & Pull Request Guidelines
- Recent history uses Conventional Commits (e.g., `chore(deps): update ...`).
- Include a short, scoped type prefix and a clear message.
- PRs should describe what changed and why; link any relevant issues/tickets if available.

## Configuration & Environment
- Postgres connection defaults are in `src/app.module.ts`.
- Use `docker-compose.yml` for local development; `.env` is loaded via `dotenv`.
- Required DB env vars are documented in `.env.example` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

## Game Size Rules
- Minimum size is `2x2` to avoid trivial coin-flip boards (1x2/2x1).
- Maximum size is `100x100` to keep cell generation and queries reasonable.

## Error Strategy
- Use consistent HTTP semantics: `400` for invalid input, `404` for missing games,
  `409` for state conflicts, `422` for invalid actions on valid resources.
- Standardize error payloads, e.g. `{ error, message, details }`, for predictable client handling.
- Validate identifiers (UUIDs) early to avoid opaque 500s on `GET /games/:id`.
- Use a global exception filter to normalize unhandled errors into a safe `500` response.

## Move Endpoint (Planned)
- Wrap each move in a transaction and lock the game row to prevent concurrent updates.
- Fetch the target cell by `(game_id, x_coordinate, y_coordinate)`.
- Update revealed cells in batches after BFS expansion.
- Track win condition by comparing revealed safe cells to total safe cells (optimize later with a counter).
