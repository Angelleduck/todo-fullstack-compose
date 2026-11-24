import type { JwtPayload } from '../auth/types/jwt-payload.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
