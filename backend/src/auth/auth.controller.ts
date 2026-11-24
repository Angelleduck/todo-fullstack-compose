import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  clearAuthCookies,
  SESSION_TOKEN_COOKIE,
  setAuthCookies,
} from './auth.constants.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { ErrorResponseDto } from './dtos/error-response.dto.js';
import { LoginDto } from './dtos/login.dto.js';
import { LoginResponseDto } from './dtos/login-response.dto.js';
import { RefreshResponseDto } from './dtos/refresh-response.dto.js';
import { RegisterDto } from './dtos/register.dto.js';
import { UserResponseDto } from './dtos/user-response.dto.js';
import type { JwtPayload } from './types/jwt-payload.js';
import { User } from '../generated/prisma/client.js';

type SafeUser = Omit<User, 'password'>;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create an account' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'This email address is already registered.',
  })
  register(@Body() body: RegisterDto): Promise<SafeUser> {
    return this.authService.register(body);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in and set auth cookies' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: SafeUser }> {
    const { user, tokens } = await this.authService.login(body);

    setAuthCookies(res, tokens);

    return { user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access-cookie')
  @ApiOperation({ summary: 'Return the signed-in user' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  me(@CurrentUser() payload: JwtPayload): Promise<SafeUser> {
    return this.authService.findById(payload.sub);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('session-cookie')
  @ApiOperation({
    summary: 'Rotate the session token and issue a new access token',
  })
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const tokens = await this.authService.refresh(
      req.cookies?.[SESSION_TOKEN_COOKIE],
    );

    setAuthCookies(res, tokens);

    return { ok: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('session-cookie')
  @ApiOperation({
    summary: 'Delete the current session and clear auth cookies',
  })
  @ApiNoContentResponse()
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(req.cookies?.[SESSION_TOKEN_COOKIE]);

    clearAuthCookies(res);
  }
}
