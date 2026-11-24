import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: 'ok'; uptime: number }> {
    try {
      // Readiness, not just liveness: a dead database must not report "ok".
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        error: 'DATABASE_UNAVAILABLE',
        message: 'The database is not reachable.',
      });
    }

    return { status: 'ok', uptime: Math.floor(process.uptime()) };
  }
}
