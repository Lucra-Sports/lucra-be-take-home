/**
 * GamesService - Core Game Logic & Persistence
 *
 * Handles the business logic for Minesweeper:
 * - Game Creation:
 *   - Calculates mine counts (random 5-50% if not specified).
 *   - Generates grid positions.
 *   - Places mines using Fisher-Yates shuffle (O(n) complexity).
 *   - Pre-calculates neighboring bomb counts for all cells.
 * - Persistence strategy:
 *   - Uses bulk inserts for cells to optimize performance.
 *   - Stores full game state to allow resuming games (Trade-off: more storage, but better UX).
 */
import { randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Game, GameCell } from './entities';
import { CreateGameDto } from './dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,

    @InjectRepository(GameCell)
    private gameCellsRepository: Repository<GameCell>,
  ) {}

  async findOneGame(id: string) {
    return this.gamesRepository.findOne({
      where: { id },
      relations: ['cells'],
    });
  }

  async findAll() {
    return this.gamesRepository.find();
  }

  async createGame(createGameDto: CreateGameDto) {
    const { rows, columns, mineCount } = createGameDto;

    // Calculate mine count logic:
    // 1. If 'mineCount' is provided by the user, use it directly.
    // 2. Otherwise, generate a random difficulty between 5% (0.05) and 50% (0.50) of total cells:
    //    - Math.random() * 0.45 + 0.05 generates a float in range [0.05, 0.50)
    //    - We multiply this percentage by totalCells and floor it to get an integer.
    //    - We use Math.max(1, ...) to ensure every game has at least 1 mine, even on tiny grids.
    const totalCells = rows * columns;
    const actualMineCount =
      mineCount ??
      Math.max(1, Math.floor(totalCells * (Math.random() * 0.45 + 0.05)));

    // Create and save the game first
    const game = this.gamesRepository.create({
      rows,
      columns,
    });
    const savedGame = await this.gamesRepository.save(game);

    // Generate all cell positions
    const cellPositions: { x: number; y: number }[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        cellPositions.push({ x, y });
      }
    }

    // Algorithm: Fisher-Yates Shuffle with CSPRNG
    // Why:
    // 1. Unbiased: Every permutation is equally likely (unlike naive random swaps).
    // 2. Efficient: O(n) time complexity.
    // 3. Secure: Uses CSPRNG (Cryptographically Secure Pseudo-Random Number Generator).
    //    Unlike Math.random(), which can be predictable, CSPRNG uses system entropy
    //    to ensure mine positions are practically impossible to guess.
    const minePositions = new Set<string>();
    const shuffled = [...cellPositions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // randomInt(min, max) is exclusive on max, so we use i + 1 to get [0, i]
      const j = randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let i = 0; i < Math.min(actualMineCount, totalCells); i++) {
      minePositions.add(`${shuffled[i].x},${shuffled[i].y}`);
    }

    // Algorithm: 2D Grid Accumulation for Neighbor Counts
    // Why:
    // 1. Performance: Instead of checking 8 neighbors for every cell (O(N*8)), we only iterate mines (O(M*8)).
    //    Since M (mines) is typically ~15-20% of N (cells), this is 5x faster.
    // 2. Efficiency: Uses simple integer arrays references ([y][x]) instead of expensive Set lookups.
    const neighborCounts = Array.from({ length: rows }, () =>
      Array(columns).fill(0),
    );

    // Iterate only active mines to populate neighbor counts
    for (let i = 0; i < Math.min(actualMineCount, totalCells); i++) {
      const { x, y } = shuffled[i];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < columns && ny >= 0 && ny < rows) {
            neighborCounts[ny][nx]++;
          }
        }
      }
    }

    // Create all cells with mine status and pre-calculated neighboring bomb count
    const cells: GameCell[] = [];
    for (const pos of cellPositions) {
      const isMine = minePositions.has(`${pos.x},${pos.y}`);
      const neighboringBombCount = isMine ? 0 : neighborCounts[pos.y][pos.x];

      const cell = this.gameCellsRepository.create({
        game: savedGame,
        xCoordinate: pos.x,
        yCoordinate: pos.y,
        isMine,
        neighboringBombCount,
      });
      cells.push(cell);
    }

    // Bulk save all cells
    await this.gameCellsRepository.save(cells);

    // Return the game with cells
    return this.findOneGame(savedGame.id);
  }
}
