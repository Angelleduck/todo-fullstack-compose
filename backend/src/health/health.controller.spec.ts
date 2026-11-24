import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  const prisma = { $queryRaw: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get(HealthController);
    prisma.$queryRaw.mockReset();
  });

  it('reports ok when the database responds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toMatchObject({ status: 'ok' });
  });

  it('reports unavailable when the database is unreachable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('checks the database on every request', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await controller.check();
    await controller.check();
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });
});
