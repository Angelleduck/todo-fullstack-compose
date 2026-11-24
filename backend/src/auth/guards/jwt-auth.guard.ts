import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { ACCESS_TOKEN_COOKIE } from '../auth.constants.js';
import type { JwtPayload } from '../types/jwt-payload.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token) {
      throw new UnauthorizedException({
        error: 'MISSING_ACCESS_TOKEN',
        message: 'Authentication is required.',
      });
    }

    try {
      request.user = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({
        error: 'INVALID_ACCESS_TOKEN',
        message: 'Your session is no longer valid. Please sign in again.',
      });
    }

    return true;
  }
}
