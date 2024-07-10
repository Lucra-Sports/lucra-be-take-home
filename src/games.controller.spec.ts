import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Game, GameCell } from './entities';

describe('GamesController', () => {
  let gamesController: GamesController;
  const mockGamesRepository = {
    findOneBy: jest.fn(() => null),
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
  });

  describe('/games', () => {
    it('should return a list of available games', async () => {
      const data = gamesController.getAll();
      expect(data).toBeDefined();
    });
  });
});
