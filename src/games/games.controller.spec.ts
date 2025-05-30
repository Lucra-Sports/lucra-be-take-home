import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Game, GameCell } from './entities';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GameStatus } from './entities/game.entity';
import { CellStatus } from './entities/game-cell.entity';

describe('GamesController', () => {
  let gamesController: GamesController;
  let gamesService: GamesService;

  const mockGame: Game = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    status: GameStatus.Pending,
    rows: 10,
    columns: 10,
    cells: [],
  };

  const mockGameCell: GameCell = {
    id: 'cell-123',
    game: mockGame,
    status: CellStatus.Hidden,
    xCoordinate: 0,
    yCoordinate: 0,
    isMine: false,
    neighboringBombCount: 2,
  };

  const mockGamesRepository = {
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(() => Promise.resolve(null)),
    findOneBy: jest.fn(() => Promise.resolve(null)),
    create: jest.fn(() => mockGame),
    save: jest.fn(() => Promise.resolve(mockGame)),
  };

  const mockGameCellsRepository = {
    findOneBy: jest.fn(() => Promise.resolve(null)),
    create: jest.fn(() => mockGameCell),
    save: jest.fn(() => Promise.resolve([mockGameCell])),
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

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /games', () => {
    it('should return a list of available games', async () => {
      const mockGames = [mockGame];
      mockGamesRepository.find.mockResolvedValue(mockGames);

      const result = await gamesController.getAll();

      expect(result).toBeDefined();
      expect(result).toEqual(mockGames);
      expect(mockGamesRepository.find).toHaveBeenCalledWith({
        relations: ['cells'],
        order: {},
      });
    });

    it('should return empty array when no games exist', async () => {
      mockGamesRepository.find.mockResolvedValue([]);

      const result = await gamesController.getAll();

      expect(result).toEqual([]);
      expect(mockGamesRepository.find).toHaveBeenCalled();
    });
  });

  describe('GET /games/:id', () => {
    const gameId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return a game when found', async () => {
      const gameWithCells = { ...mockGame, cells: [mockGameCell] };
      mockGamesRepository.findOne.mockResolvedValue(gameWithCells);

      const result = await gamesController.findOne(gameId);

      expect(result).toEqual(gameWithCells);
      expect(mockGamesRepository.findOne).toHaveBeenCalledWith({
        where: { id: gameId },
        relations: ['cells'],
      });
    });

    it('should throw NotFoundException when game is not found', async () => {
      mockGamesRepository.findOne.mockResolvedValue(null);

      await expect(gamesController.findOne(gameId)).rejects.toThrow(
        new NotFoundException(`Game with id "${gameId}" not found`)
      );

      expect(mockGamesRepository.findOne).toHaveBeenCalledWith({
        where: { id: gameId },
        relations: ['cells'],
      });
    });

    it('should throw NotFoundException for invalid UUID', async () => {
      const invalidId = 'invalid-id';
      mockGamesRepository.findOne.mockResolvedValue(null);

      await expect(gamesController.findOne(invalidId)).rejects.toThrow(
        new NotFoundException(`Game with id "${invalidId}" not found`)
      );
    });
  });

  describe('POST /games', () => {
    const validGameData = { rows: 10, columns: 10 };

    it('should create a new game with valid input', async () => {
      const createdGame = { ...mockGame, cells: [mockGameCell] };
      
      // Mock the repository calls for createGame
      mockGamesRepository.save.mockResolvedValue(mockGame);
      mockGamesRepository.findOne.mockResolvedValue(createdGame);
      mockGameCellsRepository.save.mockResolvedValue([mockGameCell]);

      const result = await gamesController.create(validGameData);

      expect(result).toEqual(createdGame);
      expect(mockGamesRepository.create).toHaveBeenCalledWith({
        rows: 10,
        columns: 10,
        status: GameStatus.Pending,
      });
      expect(mockGamesRepository.save).toHaveBeenCalled();
      expect(mockGameCellsRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when rows is missing', async () => {
      const invalidData = { columns: 10 };

      await expect(gamesController.create(invalidData as any)).rejects.toThrow(
        new BadRequestException('Both rows and columns must be positive integers')
      );
    });

    it('should throw BadRequestException when columns is missing', async () => {
      const invalidData = { rows: 10 };

      await expect(gamesController.create(invalidData as any)).rejects.toThrow(
        new BadRequestException('Both rows and columns must be positive integers')
      );
    });

    it('should throw BadRequestException when rows is zero', async () => {
      const invalidData = { rows: 0, columns: 10 };

      await expect(gamesController.create(invalidData)).rejects.toThrow(
        new BadRequestException('Both rows and columns must be positive integers')
      );
    });

    it('should throw BadRequestException when columns is zero', async () => {
      const invalidData = { rows: 10, columns: 0 };

      await expect(gamesController.create(invalidData)).rejects.toThrow(
        new BadRequestException('Both rows and columns must be positive integers')
      );
    });

    it('should throw BadRequestException when rows is negative', async () => {
      const invalidData = { rows: -5, columns: 10 };

      await expect(gamesController.create(invalidData)).rejects.toThrow(
        new BadRequestException('Both rows and columns must be positive integers')
      );
    });

    it('should throw BadRequestException when columns is negative', async () => {
      const invalidData = { rows: 10, columns: -5 };

      await expect(gamesController.create(invalidData)).rejects.toThrow(
        new BadRequestException('Both rows and columns must be positive integers')
      );
    });

    it('should throw BadRequestException when grid is too large', async () => {
      const invalidData = { rows: 51, columns: 51 };

      await expect(gamesController.create(invalidData)).rejects.toThrow(
        new BadRequestException('Grid size too large. Maximum 50x50 allowed')
      );
    });

    it('should throw BadRequestException when only rows exceed limit', async () => {
      const invalidData = { rows: 51, columns: 10 };

      await expect(gamesController.create(invalidData)).rejects.toThrow(
        new BadRequestException('Grid size too large. Maximum 50x50 allowed')
      );
    });

    it('should throw BadRequestException when only columns exceed limit', async () => {
      const invalidData = { rows: 10, columns: 51 };

      await expect(gamesController.create(invalidData)).rejects.toThrow(
        new BadRequestException('Grid size too large. Maximum 50x50 allowed')
      );
    });

    it('should handle service errors gracefully', async () => {
      mockGamesRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(gamesController.create(validGameData)).rejects.toThrow(
        new BadRequestException('Failed to create game')
      );
    });

    it('should accept maximum allowed grid size', async () => {
      const maxValidData = { rows: 50, columns: 50 };
      const createdGame = { ...mockGame, rows: 50, columns: 50, cells: [] };
      
      mockGamesRepository.save.mockResolvedValue(createdGame);
      mockGamesRepository.findOne.mockResolvedValue(createdGame);
      mockGameCellsRepository.save.mockResolvedValue([]);

      const result = await gamesController.create(maxValidData);

      expect(result).toBeDefined();
      expect(mockGamesRepository.create).toHaveBeenCalledWith({
        rows: 50,
        columns: 50,
        status: GameStatus.Pending,
      });
    });

    it('should accept minimum valid grid size', async () => {
      const minValidData = { rows: 1, columns: 1 };
      const createdGame = { ...mockGame, rows: 1, columns: 1, cells: [] };
      
      mockGamesRepository.save.mockResolvedValue(createdGame);
      mockGamesRepository.findOne.mockResolvedValue(createdGame);
      mockGameCellsRepository.save.mockResolvedValue([]);

      const result = await gamesController.create(minValidData);

      expect(result).toBeDefined();
      expect(mockGamesRepository.create).toHaveBeenCalledWith({
        rows: 1,
        columns: 1,
        status: GameStatus.Pending,
      });
    });
  });
});