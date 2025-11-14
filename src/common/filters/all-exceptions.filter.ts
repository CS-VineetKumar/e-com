import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { Prisma } from '@prisma/client';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, errors } = this.normalizeException(exception);

    const errorResponse: ApiResponse = {
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(errorResponse);
  }

  private normalizeException(exception: unknown): {
    status: number;
    message: string;
    errors: any;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          status,
          message: response,
          errors: null,
        };
      }

      if (typeof response === 'object') {
        const body = response as Record<string, any>;
        const message =
          typeof body.message === 'string'
            ? body.message
            : Array.isArray(body.message)
            ? 'Validation failed'
            : body.error ?? 'An error occurred';

        const errors =
          Array.isArray(body.message) && body.message.length > 0
            ? body.message
            : body.errors ?? null;

        return {
          status,
          message,
          errors,
        };
      }

      return {
        status,
        message: exception.message,
        errors: null,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Database error occurred',
        errors: {
          code: exception.code,
          meta: exception.meta,
        },
      };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Database validation error',
        errors: exception.message,
      };
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message || 'Internal server error',
        errors: null,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      errors: null,
    };
  }
}

