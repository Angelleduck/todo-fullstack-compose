import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import {
  ACCESS_TOKEN_COOKIE,
  SESSION_TOKEN_COOKIE,
} from './auth/auth.constants.js';

export const SWAGGER_PATH = 'docs';

/**
 * Mounts the OpenAPI document and Swagger UI. Called from `bootstrap` only
 * when `SWAGGER_ENABLED` is true.
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Todo API')
    .setDescription('Authentication and document API')
    .setVersion('1.0')
    .addCookieAuth(
      ACCESS_TOKEN_COOKIE,
      { type: 'apiKey', in: 'cookie' },
      'access-cookie',
    )
    .addCookieAuth(
      SESSION_TOKEN_COOKIE,
      { type: 'apiKey', in: 'cookie' },
      'session-cookie',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
