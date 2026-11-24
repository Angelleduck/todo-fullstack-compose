import type { CookieOptions, Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const SESSION_TOKEN_COOKIE = 'session_token';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface AuthTokens {
  accessToken: string;
  sessionToken: string;
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };
}

export function accessCookieOptions(): CookieOptions {
  return {
    ...baseCookieOptions(),
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  };
}

export function sessionCookieOptions(): CookieOptions {
  return {
    ...baseCookieOptions(),
    path: '/auth',
    maxAge: SESSION_TTL_SECONDS * 1000,
  };
}

export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessCookieOptions());
  res.cookie(SESSION_TOKEN_COOKIE, tokens.sessionToken, sessionCookieOptions());
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseCookieOptions(), path: '/' });
  res.clearCookie(SESSION_TOKEN_COOKIE, {
    ...baseCookieOptions(),
    path: '/auth',
  });
}
