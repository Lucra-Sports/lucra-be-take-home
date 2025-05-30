import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Game, GameCell, GameStatus, CellStatus } from './entities';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,

    @InjectRepository(GameCell)
    private gameCellsRepository: Repository<GameCell>,
  ) {}  

  async findAllGames(): Promise<Game[]> {
    // console.log('this.gameRepository:', this.gamesRepository)
    // console.log('DataSource entities:', this.gamesRepository.manager.connection.entityMetadatas.map(m => m.name));
    return this.gamesRepository.find({
      relations: ['cells'],
      order: {},
    });
  }  

  async findOneGame(id: string): Promise<Game | null> {
    return this.gamesRepository.findOne({
      where: { id },
      relations: ['cells'],
    });
  }

  async createGame(rows: number, columns: number): Promise<Game> {
    // const t0 = performance.now();
   
    // Create the game entity
    const game = this.gamesRepository.create({
      rows,
      columns,
      status: GameStatus.Pending,
    });

    // Save the game first to get the ID
    const savedGame = await this.gamesRepository.save(game);

    // Create all cells
    const cells: GameCell[] = [];
    const totalCells = rows * columns;
    
    // Calculate number of mines (typically 10-20% of total cells)
    const mineCount = Math.floor(totalCells * 0.15);
    
    // Create all cells initially without mines
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const cell = this.gameCellsRepository.create({
          game: savedGame,
          xCoordinate: x,
          yCoordinate: y,
          isMine: false,
          neighboringBombCount: 0,
          status: CellStatus.Hidden,
        });
        cells.push(cell);
      }
    }

    // Randomly place mines
    const minePositions = this.getRandomMinePositions(totalCells, mineCount);
    minePositions.forEach(position => {
      cells[position].isMine = true;
    });

    // Calculate neighboring bomb counts
    this.calculateNeighboringBombCounts(cells, rows, columns);

    // Save all cells
    await this.gameCellsRepository.save(cells);

    // const t1 = performance.now();
    // console.log(`createGame took ${t1 - t0} milliseconds.`);

    // Return the game with cells
    return this.gamesRepository.findOne({
      where: { id: savedGame.id },
      relations: ['cells'],
    });     
  }

  private getRandomMinePositions(totalCells: number, mineCount: number): number[] {
    // const t0 = performance.now();

    const positions: number[] = [];
    const availablePositions = Array.from({ length: totalCells }, (_, i) => i);

    for (let i = 0; i < mineCount; i++) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      const position = availablePositions.splice(randomIndex, 1)[0];
      positions.push(position);
    }

    // const t1 = performance.now();
    // console.log(`getRandomMinePositions took ${t1 - t0} milliseconds.`);    

    return positions;
  }

  private calculateNeighboringBombCounts(
    cells: GameCell[],
    rows: number,
    columns: number,
  ): void {
    
    // const t0 = performance.now();

    // Create a 2D lookup for easier access
    const cellGrid: GameCell[][] = [];
    for (let y = 0; y < rows; y++) {
      cellGrid[y] = [];
      for (let x = 0; x < columns; x++) {
        const cellIndex = y * columns + x;
        cellGrid[y][x] = cells[cellIndex];
      }
    }

    // Calculate neighboring bomb count for each cell
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const cell = cellGrid[y][x];
        
        if (!cell.isMine) {
          let bombCount = 0;
          
          // Check all 8 neighboring cells
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              // Skip the current cell
              if (dy === 0 && dx === 0) continue;
              
              const neighborY = y + dy;
              const neighborX = x + dx;
              
              // Check if neighbor is within bounds
              if (
                neighborY >= 0 &&
                neighborY < rows &&
                neighborX >= 0 &&
                neighborX < columns
              ) {
                const neighbor = cellGrid[neighborY][neighborX];
                if (neighbor.isMine) {
                  bombCount++;
                }
              }
            }
          }
          
          cell.neighboringBombCount = bombCount;
        }
      }
    }

    // const t1 = performance.now();
    // console.log(`calculateNeighboringBombCounts took: ${t1 - t0} milliseconds.`);    
  }  
}
