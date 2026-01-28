import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Game, GameCell } from './entities';

describe('GamesController', () => {
  let gamesController: GamesController;

  const mockGame = {
    id: 'test-uuid',
    rows: 5,
    columns: 5,
    status: 'PENDING',
    cells: [],
  };

  const mockGamesRepository = {
    findOneBy: jest.fn(() => null),
    findOne: jest.fn(() => mockGame),
    find: jest.fn(() => [mockGame]),
    create: jest.fn((dto) => ({ id: 'test-uuid', ...dto })),
    save: jest.fn((game) => Promise.resolve({ id: 'test-uuid', ...game })),
  };

  const mockGameCellsRepository = {
    findOneBy: jest.fn(() => null),
    create: jest.fn((dto) => dto),
    save: jest.fn((cells) => Promise.resolve(cells)),
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
  });

  describe('/games', () => {
    it('should return a list of available games', async () => {
      const data = await gamesController.getAll();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should create a new game with specified rows and columns', async () => {
      const createGameDto = { rows: 5, columns: 5 };
      const data = await gamesController.create(createGameDto);
      expect(data).toBeDefined();
      expect(mockGamesRepository.create).toHaveBeenCalledWith({
        rows: 5,
        columns: 5,
      });
    });

    it('should create game cells when creating a game', async () => {
      const createGameDto = { rows: 3, columns: 3 };
      await gamesController.create(createGameDto);
      // Should create 9 cells for a 3x3 grid
      expect(mockGameCellsRepository.save).toHaveBeenCalled();
    });
  });
});
