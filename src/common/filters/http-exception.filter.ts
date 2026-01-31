import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

const ERROR_SLUGS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'bad_request',
  [HttpStatus.NOT_FOUND]: 'not_found',
  [HttpStatus.CONFLICT]: 'conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'unprocessable_entity',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'internal_error',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();
      const { message, details } = this.extractMessageAndDetails(
        responseBody,
        request.url,
      );

      response.status(status).json({
        error: ERROR_SLUGS[status] ?? 'error',
        message,
        details,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: ERROR_SLUGS[HttpStatus.INTERNAL_SERVER_ERROR],
      message: 'Internal server error',
      details: { path: request.url },
    });
  }

  private extractMessageAndDetails(responseBody: unknown, path: string) {
    if (typeof responseBody === 'string') {
      return { message: responseBody, details: { path } };
    }

    if (responseBody && typeof responseBody === 'object') {
      const body = responseBody as {
        message?: string | string[];
        error?: string;
      };
      const rawMessage = body.message ?? body.error ?? 'Request failed';
      const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
      const details: Record<string, unknown> = { path };

      if (Array.isArray(body.message)) {
        details.validationErrors = body.message;
      }

      return { message, details };
    }

    return { message: 'Request failed', details: { path } };
  }
}
