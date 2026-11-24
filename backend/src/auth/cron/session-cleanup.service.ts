import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SessionCleanupService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(SessionCleanupService.name);

  /** Deletes expired sessions from the database every day at midnight. */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    this.logger.log('Session cron job executed!');
  }
}
