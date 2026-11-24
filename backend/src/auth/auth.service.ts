import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  type AuthTokens,
} from './auth.constants.js';
import type { LoginDto } from './dtos/login.dto.js';
import type { RegisterDto } from './dtos/register.dto.js';
import { createSessionRecord, hashSessionToken } from './session-token.js';
import type { JwtPayload } from './types/jwt-payload.js';
import { Prisma, User } from '../generated/prisma/client.js';

type SafeUser = Omit<User, 'password'>;

/**
 * A real argon2 hash of a throwaway value. Used to keep `login`'s response time
 * constant whether or not the email belongs to an account, so timing cannot be
 * used to enumerate registered addresses.
 */
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$rIziei03BiS24+Xuxofi7A$DY3+KiPrvoIpjpPf6tOe6/y7jb3SLfV3s/UuKNud+1U';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException({
    error: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password.',
  });
}

function emailAlreadyExists(): ConflictException {
  return new ConflictException({
    error: 'EMAIL_ALREADY_EXISTS',
    message: 'This email address is already registered.',
  });
}

function sessionExpired(): UnauthorizedException {
  return new UnauthorizedException({
    error: 'SESSION_EXPIRED',
    message: 'Your session has expired. Please sign in again.',
  });
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(data: RegisterDto): Promise<SafeUser> {
    const email = normalizeEmail(data.email);

    const checkEmailAlreadyExist = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (checkEmailAlreadyExist) {
      throw emailAlreadyExists();
    }

    const hashedPassowrd = await hash(data.password);

    try {
      return await this.prisma.user.create({
        data: {
          name: data.name.trim(),
          email,
          password: hashedPassowrd,
        },
        omit: { password: true },
      });
    } catch (error) {
      // The pre-check above races with concurrent signups; the unique index is
      // the authoritative check, so translate its violation instead of a 500.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw emailAlreadyExists();
      }

      throw error;
    }
  }

  async login(data: LoginDto): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(data.email) },
    });

    // `password` is nullable for accounts that were created through an OAuth
    // provider and therefore have no password to check against.
    const passwordHash = user?.password ?? DUMMY_PASSWORD_HASH;
    const isValidPassword = await verify(passwordHash, data.password).catch(
      () => false,
    );

    if (!user || !user.password || !isValidPassword) {
      throw invalidCredentials();
    }

    const { password: _password, ...safeUser } = user;

    return { user: safeUser, tokens: await this.issueTokens(user) };
  }

  /**
   * Exchanges a session token for a new access token.
   *
   * The session row is rotated on every refresh: the old hash is deleted and a
   * new token is issued, so a stolen session token stops working as soon as the
   * legitimate client refreshes. Expiry slides forward with each rotation.
   */
  async refresh(sessionToken: string | undefined): Promise<AuthTokens> {
    if (!sessionToken) {
      throw sessionExpired();
    }

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(sessionToken) },
      include: { user: true },
    });

    if (!session) {
      throw sessionExpired();
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.session
        .delete({ where: { id: session.id } })
        .catch(() => undefined);

      throw sessionExpired();
    }

    const next = createSessionRecord(SESSION_TTL_SECONDS);

    await this.prisma.$transaction([
      this.prisma.session.create({
        data: {
          userId: session.userId,
          tokenHash: next.tokenHash,
          expiresAt: next.expiresAt,
        },
      }),
      this.prisma.session.delete({ where: { id: session.id } }),
    ]);

    return {
      accessToken: await this.signAccessToken(session.user),
      sessionToken: next.token,
    };
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) {
      return;
    }

    await this.prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(sessionToken) },
    });
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        error: 'USER_NOT_FOUND',
        message: 'This account no longer exists.',
      });
    }

    return user;
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const session = createSessionRecord(SESSION_TTL_SECONDS);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
      },
    });

    return {
      accessToken: await this.signAccessToken(user),
      sessionToken: session.token,
    };
  }

  private async signAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  }
}
