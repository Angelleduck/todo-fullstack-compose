import { NestFactory } from '@nestjs/core';
import { NestNodeApplication, NodeAdapter } from '@nestjs/platform-node';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger, SWAGGER_PATH } from './setup.js';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestNodeApplication>(
    AppModule,
    new NodeAdapter(),
  );

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const config = app.get(ConfigService);
  const swaggerEnabled = config.get<boolean>('SWAGGER_ENABLED');
  const frontend_url = config.getOrThrow<string>('FRONTEND_URL');

  app.enableCors({
    origin: [frontend_url],
    credentials: true,
  });

  // Swagger UI injects inline scripts, which helmet's default CSP blocks.
  // Skip the middleware for the docs path only, keeping CSP on the API.
  const helmetMiddleware = helmet();
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (swaggerEnabled && req.path.startsWith(`/${SWAGGER_PATH}`)) {
      return next();
    }

    helmetMiddleware(req, res, next);
  });

  if (swaggerEnabled) {
    setupSwagger(app);
  }

  await app.listen(config.getOrThrow<number>('PORT'));
}
await bootstrap();
