import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../prisma/prisma.module.js';
import { ACCESS_TOKEN_TTL_SECONDS } from './auth.constants.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { SessionCleanupService } from './cron/session-cleanup.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, SessionCleanupService],
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
      }),
    }),
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
