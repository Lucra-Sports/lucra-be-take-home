import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CellStatus, Game, GameCell, GameStatus } from './entities';
import {
  buildCellSeeds,
  computeMineCount,
  computeRevealPositions,
  pickMinePositions,
} from './games.logic';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,

    @InjectRepository(GameCell)
    private gameCellsRepository: Repository<GameCell>,
  ) {}

  async findAllGames(limit: number, offset: number) {
    return this.gamesRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { id: 'ASC' },
    });
  }

  async findOneGame(id: string) {
    return this.gamesRepository.findOneBy({ id });
  }

  async createGame(rows: number, columns: number) {
    return this.gamesRepository.manager.transaction(async (manager) => {
      const game = manager.create(Game, { rows, columns });
      const savedGame = await manager.save(Game, game);
      const totalCells = rows * columns;
      const mineCount = computeMineCount(totalCells);
      const minePositions = pickMinePositions(totalCells, mineCount);
      const cellSeeds = buildCellSeeds(rows, columns, minePositions);
      const cells = cellSeeds.map((seed) =>
        this.gameCellsRepository.create({ game: savedGame, ...seed }),
      );

      await manager.save(GameCell, cells);
      return savedGame;
    });
  }

  async makeMove(
    gameId: string,
    x: number,
    y: number,
    action: 'REVEAL' | 'FLAG' | 'UNFLAG',
  ) {
    return this.gamesRepository.manager.transaction(async (manager) => {
      const game = await manager.findOne(Game, {
        where: { id: gameId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!game) {
        throw new NotFoundException(`Game with id "${gameId}" not found`);
      }

      if (game.status !== GameStatus.Active) {
        throw new ConflictException('Game is not active');
      }

      if (x < 0 || x >= game.columns || y < 0 || y >= game.rows) {
        throw new BadRequestException('Move is out of bounds');
      }

      const target = await manager.findOne(GameCell, {
        where: { game: { id: gameId }, xCoordinate: x, yCoordinate: y },
      });

      if (!target) {
        throw new BadRequestException('Cell not found');
      }

      if (action === 'FLAG') {
        if (target.status === CellStatus.Flagged) {
          return { game, updatedCells: [] };
        }
        if (target.status !== CellStatus.Hidden) {
          throw new UnprocessableEntityException('Cell is not flaggable');
        }
        target.status = CellStatus.Flagged;
        await manager.save(GameCell, target);
        return { game, updatedCells: [target] };
      }

      if (action === 'UNFLAG') {
        if (target.status === CellStatus.Hidden) {
          return { game, updatedCells: [] };
        }
        if (target.status !== CellStatus.Flagged) {
          throw new UnprocessableEntityException('Cell is not unflaggable');
        }
        target.status = CellStatus.Hidden;
        await manager.save(GameCell, target);
        return { game, updatedCells: [target] };
      }

      if (target.status === CellStatus.Revealed) {
        return { game, updatedCells: [] };
      }

      if (target.status !== CellStatus.Hidden) {
        throw new UnprocessableEntityException('Cell is not revealable');
      }

      const updatedCells: GameCell[] = [];

      if (target.isMine) {
        target.status = CellStatus.Detonated;
        updatedCells.push(target);
        game.status = GameStatus.Detonated;
        await manager.save(GameCell, updatedCells);
        await manager.save(Game, game);
        return { game, updatedCells };
      }

      if (target.neighboringBombCount > 0) {
        target.status = CellStatus.Revealed;
        updatedCells.push(target);
        await manager.save(GameCell, updatedCells);
      } else {
        const cells = await manager.find(GameCell, {
          where: { game: { id: gameId } },
        });
        const total = game.rows * game.columns;
        const isMine = new Array<boolean>(total).fill(false);
        const neighborCounts = new Array<number>(total).fill(0);
        for (const cell of cells) {
          const index = cell.yCoordinate * game.columns + cell.xCoordinate;
          isMine[index] = cell.isMine;
          neighborCounts[index] = cell.neighboringBombCount;
        }
        const revealKeys = computeRevealPositions(
          game.rows,
          game.columns,
          isMine,
          neighborCounts,
          x,
          y,
        );

        for (const cell of cells) {
          if (!cell.isMine && cell.status === CellStatus.Hidden) {
            const index = cell.yCoordinate * game.columns + cell.xCoordinate;
            if (revealKeys[index] === 1) {
              cell.status = CellStatus.Revealed;
              updatedCells.push(cell);
            }
          }
        }

        if (updatedCells.length > 0) {
          await manager.save(GameCell, updatedCells);
        }
      }

      const remainingHiddenSafe = await manager.count(GameCell, {
        where: {
          game: { id: gameId },
          isMine: false,
          status: CellStatus.Hidden,
        },
      });

      if (remainingHiddenSafe === 0) {
        game.status = GameStatus.Cleared;
        await manager.save(Game, game);
      }

      return { game, updatedCells };
    });
  }
}
