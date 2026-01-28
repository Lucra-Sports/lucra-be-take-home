# Minesweeper API Service

## Project Overview

This is a high-performance backend service designed to power a front-end Minesweeper client. Built with **NestJS**, **TypeORM**, and **PostgreSQL**, it provides a robust API for generating random, cryptographically secure game boards.

The current implementation focuses on the initialization phase of Minesweeper: creating grids, ensuring fair mine distribution, and calculating neighbor data efficiently so the client receives a "ready-to-play" board.

## Technology Stack

- **Framework:** NestJS (Node.js)
- **Database:** PostgreSQL (v16)
- **ORM:** TypeORM
- **Infrastructure:** Docker & Docker Compose
- **Key Utilities:**
  - `crypto` (Node.js native) for secure random number generation
  - `class-validator` for strict input validation

## Getting Started

### Prerequisites

- Node.js (v20+)
- Docker & Docker Compose
- Yarn

### Installation & Running

1. **Install Dependencies:**

   ```bash
   yarn install
   ```

2. **Start the Development Server:**
   This command starts the database container and the NestJS application in watch mode.

   ```bash
   yarn start:dev
   ```

3. **Database Management:**
   - `yarn db:start`: Spins up the Postgres container.
   - `yarn db:stop`: Stops the container.
   - `yarn db:reset`: Nukes and recreates the database volume (useful for a fresh start).

## API Endpoints

### 1. Create Game

**POST** `/games`
Initializes a new game board. The backend handles mine placement and neighbor calculation immediately upon creation.

**Payload:**

```json
{
  "rows": 10, // Required: 2-50
  "columns": 10, // Required: 2-50
  "mineCount": 10 // Optional: Defaults to 5-50% density if omitted
}
```

### 2. List Games

**GET** `/games`
Returns a lightweight summary of all persisted games. Excludes individual cell data to strictly optimize for list-view performance.

### 3. Retrieve Game

**GET** `/games/:id`
Returns the full game state, including the status of every single cell (`hidden`, `revealed`, `flagged`, etc.) and its coordinates.

## Outstanding Work (Roadmap)

While the core generation engine is complete, the following features are required to make this a fully playable backend. **You are responsible for architecting and implementing these solutions.**

### 1. Gameplay Interaction

Currently, the API only creates games. We need endpoints to interactions:

- **Reveal Cell:** An endpoint to reveal a specific coordinate. This must:
  - Handle "Game Over" states if a mine is hit.
  - Recursively revealing neighboring zero-count cells (the "flood fill" effect) if an empty cell is clicked.
  - Update the game status to `CLEARED` if all non-mine cells are revealed.
- **Flag Cell:** An endpoint to toggle a flag on a hidden cell to prevent accidental clicks.

### 2. State Management & Integrity

- **Win/Loss Detection:** The system needs robust logic to determine when a game is won or lost and lock the game state accordingly so no further moves can be made.
- **Transactions:** Game creation is currently atomic-ish, but gameplay moves involving complex database updates should ideally use transactions to prevent data inconsistency.

### 3. Optimization & Testing

- **Pagination:** The list endpoint returns _all_ games. As the database grows, this will degrade. A strategy for pagination or cursor-based retrieval is needed.
- **Testing:** While unit tests exist, integration tests for the full "Create -> Play -> Win/Lose" flow are required to ensure reliability.
