import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { Game } from '../src/games/entities/game.entity';
import { GameCell } from '../src/games/entities/game-cell.entity';

describe('GamesController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dataSource.getRepository(GameCell).delete({});
    await dataSource.getRepository(Game).delete({});
  });

  describe('/games (GET)', () => {
    it('should return empty array when no games exist', () => {
      return request(app.getHttpServer())
        .get('/games')
        .expect(200)
        .expect([]);
    });

    it('should return array of games when games exist', async () => {
      // Create test game first
      const createGameDto = {
        rows: 5,
        columns: 5,
        firstMoveX: 2,
        firstMoveY: 2,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(201);

      // Now test getting all games
      return request(app.getHttpServer())
        .get('/games')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('status', 'PENDING');
          expect(res.body[0]).toHaveProperty('rows', 5);
          expect(res.body[0]).toHaveProperty('columns', 5);
          expect(res.body[0]).toHaveProperty('cells');
        });
    });
  });

  describe('/games/:id (GET)', () => {
    it('should return a specific game by id', async () => {
      // Create test game first
      const createGameDto = {
        rows: 3,
        columns: 3
      };

      const createResponse = await request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(201);

      const gameId = createResponse.body.id;

      return request(app.getHttpServer())
        .get(`/games/${gameId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', gameId);
          expect(res.body).toHaveProperty('status', 'PENDING');
          expect(res.body).toHaveProperty('rows', 3);
          expect(res.body).toHaveProperty('columns', 3);
          expect(res.body).toHaveProperty('cells');
          expect(res.body.cells).toHaveLength(9); // 3x3 grid
        });
    });

    it('should return 404 for non-existent game', () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      
      return request(app.getHttpServer())
        .get(`/games/${nonExistentId}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 404);
          expect(res.body).toHaveProperty('message', `Game with id "${nonExistentId}" not found`);
        });
    });

  });

  describe('/games (POST)', () => {
    it('should create a new game with valid input', () => {
      const createGameDto = {
        rows: 10,
        columns: 10
      };

      return request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('status', 'PENDING');
          expect(res.body).toHaveProperty('rows', 10);
          expect(res.body).toHaveProperty('columns', 10);
          expect(res.body).toHaveProperty('cells');
          expect(res.body.cells).toHaveLength(100); // 10x10 grid

          // Verify mines are placed (should have some mines)
          const mineCount = res.body.cells.filter((cell: any) => cell.isMine).length;
          expect(mineCount).toBeGreaterThan(0);
          expect(mineCount).toBeLessThan(100); // Should not be all mines
        });
    });

    it('should create game with minimum valid size', () => {
      const createGameDto = {
        rows: 1,
        columns: 1
      };

      return request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('rows', 1);
          expect(res.body).toHaveProperty('columns', 1);
          expect(res.body.cells).toHaveLength(1);
          expect(res.body.cells[0].isMine).toBe(false); // Only cell cannot be mine
        });
    });

    it('should create game with maximum valid size', () => {
      const createGameDto = {
        rows: 50,
        columns: 50
      };

      return request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('rows', 50);
          expect(res.body).toHaveProperty('columns', 50);
          expect(res.body.cells).toHaveLength(2500); // 50x50 grid
        });
    });

    it('should reject missing rows', () => {
      const createGameDto = {
        columns: 10
      };

      return request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Both rows and columns must be positive integers');
        });
    });

    it('should reject missing columns', () => {
      const createGameDto = {
        rows: 10
      };

      return request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(400);
    });

    it('should reject zero rows', () => {
      const createGameDto = {
        rows: 0,
        columns: 10
      };

      return request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(400);
    });

    it('should reject negative values', () => {
      const createGameDto = {
        rows: -5,
        columns: 10
      };

      return request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(400);
    });

    it('should reject grid size too large', () => {
      const createGameDto = {
        rows: 51,
        columns: 51
      };

      return request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Grid size too large. Maximum 50x50 allowed');
        });
    });
  });

  describe('Game Logic Validation', () => {
    it('should properly calculate neighboring bomb counts', async () => {
      const createGameDto = {
        rows: 5,
        columns: 5
      };

      const response = await request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(201);

      const cells = response.body.cells;
      
      // Each non-mine cell should have correct neighboring bomb count
      cells.forEach((cell: any) => {
        if (!cell.isMine) {
          expect(cell.neighboringBombCount).toBeGreaterThanOrEqual(0);
          expect(cell.neighboringBombCount).toBeLessThanOrEqual(8);
        }
      });
    });

    it('should have reasonable mine distribution', async () => {
      const createGameDto = {
        rows: 10,
        columns: 10
      };

      const response = await request(app.getHttpServer())
        .post('/games')
        .send(createGameDto)
        .expect(201);

      const totalCells = 100;
      const mineCount = response.body.cells.filter((cell: any) => cell.isMine).length;
      
      // Should have approximately 15% mines (±5% tolerance)
      expect(mineCount).toBeGreaterThan(totalCells * 0.10);
      expect(mineCount).toBeLessThan(totalCells * 0.20);
    });
  });
});