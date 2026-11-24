const MIN_JWT_SECRET_LENGTH = 32;

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Runs once at boot, under `ConfigModule.forRoot({ validate })`. Fails fast
 * with every problem listed at once, instead of throwing a 500 on the first
 * request that happens to need a missing value.
 */
export function validateEnv(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const errors: string[] = [];

  const databaseUrl = asString(raw.DATABASE_URL);
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required');
  } else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    errors.push('DATABASE_URL must be a postgres:// connection string');
  }

  const frontend_url = asString(raw.FRONTEND_URL);
  if (!frontend_url) {
    errors.push('FRONTEND_URL is required');
  }

  const jwtSecret = asString(raw.JWT_SECRET);
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required');
  } else if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`,
    );
  }

  const port = Number(raw.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('PORT must be an integer between 1 and 65535');
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n- ${errors.join('\n- ')}`,
    );
  }

  const nodeEnv = asString(raw.NODE_ENV) || 'development';
  const swaggerEnabled = asString(raw.SWAGGER_ENABLED)
    ? asString(raw.SWAGGER_ENABLED) === 'true'
    : nodeEnv !== 'production';

  return {
    ...raw,
    PORT: port,
    NODE_ENV: nodeEnv,
    SWAGGER_ENABLED: swaggerEnabled,
  };
}
