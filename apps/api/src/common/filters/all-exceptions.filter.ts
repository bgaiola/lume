import { type ApiError } from '@lume/protocol';
import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { ZodError } from 'zod';

/**
 * Catches every uncaught error and serializes it into the canonical
 * {@link ApiError} envelope. Keeping the response shape identical for
 * every failure path is a hard product requirement.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message, details } = this.normalize(exception);

    if (statusCode >= 500) {
      this.logger.error(
        { err: exception, path: request.url, method: request.method },
        'unhandled exception',
      );
    }

    const body: ApiError = {
      statusCode,
      error,
      message,
      details: details ?? undefined,
      timestamp: new Date().toISOString() as ApiError['timestamp'],
      path: request.url,
      requestId: (request as Request & { id?: string }).id,
    };

    response.status(statusCode).json(body);
  }

  private normalize(exception: unknown): {
    statusCode: number;
    error: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof ZodError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'ValidationError',
        message: 'Request payload failed validation',
        details: exception.flatten(),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return {
          statusCode: status,
          error: exception.name,
          message: res,
        };
      }
      const obj = res as { error?: string; message?: string | string[]; details?: unknown };
      return {
        statusCode: status,
        error: obj.error ?? exception.name,
        message: Array.isArray(obj.message)
          ? obj.message.join(', ')
          : (obj.message ?? exception.message),
        details: obj.details,
      };
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'InternalServerError',
        message: exception.message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
    };
  }
}
