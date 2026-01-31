import 'dotenv/config';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Game, GameCell } from '../src/entities';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('Games (e2e)', () => {
  let app: INestApplication;
  let gamesRepository: Repository<Game>;
  let gameCellsRepository: Repository<GameCell>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    gamesRepository = moduleFixture.get(getRepositoryToken(Game));
    gameCellsRepository = moduleFixture.get(getRepositoryToken(GameCell));
  });

  beforeEach(async () => {
    await gameCellsRepository.delete({});
    await gamesRepository.delete({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a game and persists cells', async () => {
    const response = await request(app.getHttpServer())
      .post('/games')
      .send({ rows: 2, columns: 2 })
      .expect(201);

    expect(response.body).toMatchObject({
      rows: 2,
      columns: 2,
      status: 'ACTIVE',
    });
    expect(response.body.id).toMatch(UUID_REGEX);

    const cellCount = await gameCellsRepository
      .createQueryBuilder('cell')
      .where('cell.game_id = :gameId', { gameId: response.body.id })
      .getCount();

    expect(cellCount).toBe(4);
  });

  it('lists games with pagination', async () => {
    await request(app.getHttpServer())
      .post('/games')
      .send({ rows: 2, columns: 2 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/games?limit=1&offset=0')
      .expect(200);

    expect(response.body.limit).toBe(1);
    expect(response.body.offset).toBe(0);
    expect(response.body.total).toBe(1);
    expect(response.body.data).toHaveLength(1);
  });

  it('fetches a game by id', async () => {
    const created = await request(app.getHttpServer())
      .post('/games')
      .send({ rows: 2, columns: 2 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/games/${created.body.id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: created.body.id,
      rows: 2,
      columns: 2,
      status: 'ACTIVE',
    });
  });

  it('reveals a safe cell', async () => {
    const created = await request(app.getHttpServer())
      .post('/games')
      .send({ rows: 2, columns: 2 })
      .expect(201);

    const safeCell = await gameCellsRepository.findOne({
      where: { game: { id: created.body.id }, isMine: false },
    });

    expect(safeCell).toBeTruthy();

    const response = await request(app.getHttpServer())
      .post(`/games/${created.body.id}/moves`)
      .send({ x: safeCell!.xCoordinate, y: safeCell!.yCoordinate, action: 'REVEAL' })
      .expect(201);

    expect(response.body.game.status).toBe('ACTIVE');
    expect(response.body.updatedCells.length).toBeGreaterThan(0);
  });

  it('detonates when revealing a mine', async () => {
    const created = await request(app.getHttpServer())
      .post('/games')
      .send({ rows: 2, columns: 2 })
      .expect(201);

    const mineCell = await gameCellsRepository.findOne({
      where: { game: { id: created.body.id }, isMine: true },
    });

    expect(mineCell).toBeTruthy();

    const response = await request(app.getHttpServer())
      .post(`/games/${created.body.id}/moves`)
      .send({ x: mineCell!.xCoordinate, y: mineCell!.yCoordinate, action: 'REVEAL' })
      .expect(201);

    expect(response.body.game.status).toBe('DETONATED');
  });

  it('flags and unflags a cell', async () => {
    const created = await request(app.getHttpServer())
      .post('/games')
      .send({ rows: 2, columns: 2 })
      .expect(201);

    const targetCell = await gameCellsRepository.findOne({
      where: { game: { id: created.body.id }, isMine: false },
    });

    expect(targetCell).toBeTruthy();

    const flagged = await request(app.getHttpServer())
      .post(`/games/${created.body.id}/moves`)
      .send({ x: targetCell!.xCoordinate, y: targetCell!.yCoordinate, action: 'FLAG' })
      .expect(201);

    expect(flagged.body.updatedCells[0].status).toBe('FLAGGED');

    const flaggedAgain = await request(app.getHttpServer())
      .post(`/games/${created.body.id}/moves`)
      .send({ x: targetCell!.xCoordinate, y: targetCell!.yCoordinate, action: 'FLAG' })
      .expect(201);

    expect(flaggedAgain.body.updatedCells).toHaveLength(0);

    const unflagged = await request(app.getHttpServer())
      .post(`/games/${created.body.id}/moves`)
      .send({ x: targetCell!.xCoordinate, y: targetCell!.yCoordinate, action: 'UNFLAG' })
      .expect(201);

    expect(unflagged.body.updatedCells[0].status).toBe('HIDDEN');

    const unflaggedAgain = await request(app.getHttpServer())
      .post(`/games/${created.body.id}/moves`)
      .send({ x: targetCell!.xCoordinate, y: targetCell!.yCoordinate, action: 'UNFLAG' })
      .expect(201);

    expect(unflaggedAgain.body.updatedCells).toHaveLength(0);
  });

  it('rejects invalid board sizes', async () => {
    const response = await request(app.getHttpServer())
      .post('/games')
      .send({ rows: 1, columns: 2 })
      .expect(400);

    expect(response.body.error).toBe('bad_request');
  });

  it('returns not found for unknown games', async () => {
    const response = await request(app.getHttpServer())
      .get('/games/00000000-0000-4000-8000-000000000000')
      .expect(404);

    expect(response.body.error).toBe('not_found');
  });

  it('rejects invalid game ids', async () => {
    const response = await request(app.getHttpServer())
      .get('/games/not-a-uuid')
      .expect(400);

    expect(response.body.error).toBe('bad_request');
  });
});
