import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Game, GameCell } from './entities';

describe('GamesController', () => {
  let gamesController: GamesController;
  let gamesService: GamesService;
  const mockGamesRepository = {
    findOneBy: jest.fn(() => null),
    findAndCount: jest.fn(async () => [[], 0]),
  };

  const mockGameCellsRepository = {
    findOneBy: jest.fn(() => null),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        GamesService,
        {
          provide: getRepositoryToken(Game),
          useValue: mockGamesRepository,
        },
        {
          provide: getRepositoryToken(GameCell),
          useValue: mockGameCellsRepository,
        },
      ],
    }).compile();

    gamesController = app.get<GamesController>(GamesController);
    gamesService = app.get<GamesService>(GamesService);
  });

  describe('getAll', () => {
    it('passes pagination through to the service', async () => {
      const serviceSpy = jest
        .spyOn(gamesService, 'findAllGames')
        .mockResolvedValueOnce([[], 0]);

      await gamesController.getAll({ limit: 10, offset: 5 });

      expect(serviceSpy).toHaveBeenCalledWith(10, 5);
    });
  });

  describe('findOne', () => {
    it('returns a game when found', async () => {
      const game = {
        id: '00000000-0000-4000-8000-000000000000',
        rows: 8,
        columns: 8,
        status: 'ACTIVE',
      } as Game;

      jest.spyOn(gamesService, 'findOneGame').mockResolvedValueOnce(game);

      const result = await gamesController.findOne(game.id);
      expect(result).toBe(game);
    });
  });

  describe('create', () => {
    it('returns the created game summary', async () => {
      const game = {
        id: '00000000-0000-4000-8000-000000000000',
        rows: 8,
        columns: 8,
        status: 'ACTIVE',
      } as Game;

      jest.spyOn(gamesService, 'createGame').mockResolvedValueOnce(game);

      const result = await gamesController.create({ rows: 8, columns: 8 });
      expect(result).toEqual({
        id: game.id,
        rows: 8,
        columns: 8,
        status: 'ACTIVE',
      });
    });
  });

  describe('move', () => {
    it('returns updated cells with game summary', async () => {
      const game = {
        id: '00000000-0000-4000-8000-000000000000',
        rows: 8,
        columns: 8,
        status: 'ACTIVE',
      } as Game;
      const cell = {
        xCoordinate: 1,
        yCoordinate: 2,
        status: 'REVEALED',
        neighboringBombCount: 1,
      } as GameCell;

      jest
        .spyOn(gamesService, 'makeMove')
        .mockResolvedValueOnce({ game, updatedCells: [cell] });

      const result = await gamesController.move(game.id, {
        x: 1,
        y: 2,
        action: 'REVEAL',
      });

      expect(result).toEqual({
        game: {
          id: game.id,
          rows: 8,
          columns: 8,
          status: 'ACTIVE',
        },
        updatedCells: [
          {
            x: 1,
            y: 2,
            status: 'REVEALED',
            isMine: undefined,
            neighboringBombCount: 1,
          },
        ],
      });
    });
  });
});
