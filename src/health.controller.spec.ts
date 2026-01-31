import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthController', () => {
  it('returns ok for /health', () => {
    const controller = new HealthController({} as DataSource);
    expect(controller.health()).toEqual({ status: 'ok' });
  });

  it('throws when database is not ready', async () => {
    const dataSource = {
      query: jest.fn().mockRejectedValue(new Error('db down')),
    } as unknown as DataSource;

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DataSource, useValue: dataSource }],
    }).compile();

    const controller = moduleRef.get(HealthController);

    await expect(controller.ready()).rejects.toThrow(ServiceUnavailableException);
  });
});
