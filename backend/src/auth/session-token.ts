import { createHash, randomBytes } from 'node:crypto';

/**
 * Generates an opaque session token. 256 bits of CSPRNG output, base64url
 * encoded (43 chars) so it is safe to place in a cookie without escaping.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * 128 bits of the SHA-256 digest, hex encoded (32 chars): the conventional
 * minimum strength for a session credential.
 *
 * Truncating further is unsafe — at 40 bits (10 chars), anyone with read access
 * to `Session` could brute-force a preimage in minutes and forge sessions, and
 * birthday collisions would start breaking the unique index around ~1M rows.
 *
 * Hashing stays deterministic (no salt) because refresh looks the row up by
 * equality on this value.
 */
const SESSION_TOKEN_HASH_HEX_LENGTH = 32;

/**
 * SHA-256 of a session token, truncated to 128 bits and hex encoded (32 chars).
 *
 * Only the hash is persisted: a leaked database dump then does not hand over
 * usable sessions. SHA-256 is enough here because the token already has 256
 * bits of entropy, so there is nothing to brute force.
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256')
    .update(token)
    .digest('hex')
    .slice(0, SESSION_TOKEN_HASH_HEX_LENGTH);
}

export interface SessionRecord {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function createSessionRecord(ttlSeconds: number): SessionRecord {
  const token = generateSessionToken();

  return {
    token,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
  };
}
