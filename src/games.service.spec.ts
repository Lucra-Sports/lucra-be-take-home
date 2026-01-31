import { GamesService } from './games.service';
import { CellStatus, Game, GameCell, GameStatus } from './entities';
import { Repository } from 'typeorm';

describe('GamesService', () => {
  it('returns no-op for REVEAL on already revealed cell', async () => {
    const game = {
      id: 'game-1',
      rows: 8,
      columns: 8,
      status: GameStatus.Active,
    } as Game;

    const targetCell = {
      id: 'cell-1',
      xCoordinate: 0,
      yCoordinate: 0,
      status: CellStatus.Revealed,
      isMine: false,
      neighboringBombCount: 1,
    } as GameCell;

    const manager = {
      findOne: jest.fn()
        .mockResolvedValueOnce(game)
        .mockResolvedValueOnce(targetCell),
      save: jest.fn(),
      count: jest.fn(),
    };

    const gamesRepository = {
      manager: { transaction: (fn: (mgr: typeof manager) => Promise<unknown>) => fn(manager) },
    } as unknown as Repository<Game>;

    const gameCellsRepository = {} as Repository<GameCell>;

    const service = new GamesService(gamesRepository, gameCellsRepository);

    const result = await service.makeMove(game.id, 0, 0, 'REVEAL');

    expect(result.updatedCells).toHaveLength(0);
    expect(manager.count).not.toHaveBeenCalled();
  });
});
