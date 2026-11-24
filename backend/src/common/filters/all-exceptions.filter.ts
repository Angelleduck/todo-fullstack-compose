import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

interface ErrorBody {
  error: string;
  message: string;
  details?: string[];
}

/**
 * Normalizes every error response to `{ error, message, statusCode, path,
 * timestamp }`.
 *
 * Without this, exceptions thrown with `{ error, message }` payloads and the
 * `ValidationPipe`'s `{ message: string[] }` shape reach the client looking
 * completely different.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.statusFor(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} failed with ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      ...this.toErrorBody(exception, status),
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Maps known Prisma failures to HTTP statuses so a database constraint
   * violation does not surface as an opaque 500.
   */
  private statusFor(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return HttpStatus.CONFLICT;
      }
      if (exception.code === 'P2025') {
        return HttpStatus.NOT_FOUND;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private toErrorBody(exception: unknown, status: number): ErrorBody {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          error: 'CONFLICT',
          message: 'A record with this value already exists.',
        };
      }
      // Usually when delete or update record has not been found
      if (exception.code === 'P2025') {
        return {
          error: 'NOT_FOUND',
          message: 'The requested record was not found.',
        };
      }
    }

    if (!(exception instanceof HttpException)) {
      // Never leak internals for unexpected failures.
      return {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong.',
      };
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return {
        error: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
      };
    }

    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { error: exception.name, message: payload };
    }

    const body = payload as Record<string, unknown>;

    // ValidationPipe reports every failed constraint as an array of messages.
    if (Array.isArray(body.message)) {
      return {
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: body.message.map(String),
      };
    }

    // Exceptions thrown with an explicit `{ error, message }` payload.
    if (typeof body.error === 'string' && typeof body.message === 'string') {
      return { error: body.error, message: body.message };
    }

    return {
      error: exception.name,
      message:
        typeof body.message === 'string' ? body.message : exception.message,
    };
  }
}
