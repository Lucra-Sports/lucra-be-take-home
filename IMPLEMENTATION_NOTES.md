# Minesweeper Backend Implementation Guide

## Purpose & Philosophy

This backend was architected to be more than just a simple game script—it is a production-ready, persistent Service Overlay capable of handling high-stakes Minesweeper games. My focus was on **Data Integrity**, **Cryptographic Fairness**, and **Performance Optimization**.

## Key Architecture & Improvements

### 1. Robust Persistence (Postgres)

**Decision:** All games are fully persisted to a **Postgres** database rather than being ephemeral memory objects.
**Value:**

- **State Preservation:** Games survive server restarts, crashes, and deployments.
- **Auditability:** Every game state is queryable and analyzable.
- **Scalability:** Unlike SQLite, Postgres handles concurrent game creation and writes without locking the entire database file.

### 2. Fair & Secure Mine Placement (CSPRNG)

**Change:** Replaced standard `Math.random()` with `crypto.randomInt` (Cryptographically Secure Pseudo-Random Number Generator) inside a Fisher-Yates shuffle algorithm.
**Value:**

- **Prevent Cheating:** Standard RNGs are predictable. CSPRNG ensures that even savvy players cannot predict mine locations based on previous patterns.
- **Uniform Distribution:** The Fisher-Yates shuffle guarantees unbiased permutations, ensuring every board configuration is equally probable.
- **Complexity:** O(N) efficiency ensures generation is instant, even for large grids.

### 3. High-Performance Neighbor Calculation

**Change:** Switched from a naive "check all neighbors for every cell" approach to a **2D Grid Accumulation** strategy.
**How it works:**

1. Initialize a zeroed 2D grid.
2. Iterate _only_ the mines.
3. For each mine, increment the count of its 8 surrounding neighbors in the grid.
   **Value:**

- **Speed:** Drastically reduces complexity from `O(Cells * 8)` to `O(Mines * 8)`. Since mines are a fraction of the total cells (e.g., 15%), this is significantly faster.
- **Optimization:** Reduces CPU cycles during game creation, allowing for higher concurrency.

### 4. Optimized Batch Writes

**Change:** Implemented bulk insertion for game cells using TypeORM.
**Value:**

- **Latency Reduction:** Instead of executing 100+ SQL `INSERT` statements for a 10x10 grid, we execute a single batch `INSERT`.
- **Throughput:** Reduces database network overhead by orders of magnitude.

### 5. Infrastructure & Security Hardening

**Change:** Upgraded `@nestjs/cli` to v11+ and secured dependency chains.
**Value:**

- **Security:** Patches `[DEP0190]`, preventing potential command injection vulnerabilities related to child process spawning in Node.js.
- **Stability:** Explicitly managing `class-validator` and `class-transformer` prevents implied dependency failures in different environments.

## API Usage Snapshot

- **Create Game:** `POST /games`
  - Body: `{ "rows": 10, "columns": 10, "mineCount": 15 }`
  - _Note: If `mineCount` is omitted, the backend intelligently assigns a random difficulty between 5% and 50% density._
- **List Games:** `GET /games` (Lightweight summary)
- **Get Game:** `GET /games/:id` (Full state with cell map)

## Future Roadmap to Production

1. **Gameplay Endpoints:** Add `/reveal` and `/flag` endpoints to manage state server-side securely.
2. **Transactions:** Wrap creation logic in ACID transactions to prevent "ghost games" if cell insertion fails.
3. **Caching:** Implement Redis for `GET /games/:id` to offload the database on repeated reads.
