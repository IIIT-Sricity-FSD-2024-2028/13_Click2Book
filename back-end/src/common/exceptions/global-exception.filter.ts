import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : (res as any).message || exception.message;
    }

    // ── File logging (does NOT affect client response) ──────────────────────
    const method    = request?.method ?? 'UNKNOWN';
    const url       = request?.originalUrl ?? request?.url ?? 'UNKNOWN';
    const requestId = (request as any)?.requestId ?? 'none';
    const finalMsg  = Array.isArray(message) ? message.join(', ') : message;

    if (status >= 500) {
      // 5xx — unexpected server error: log with full stack trace to error.log
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `[${status}] ${method} ${url} — ${finalMsg}`,
        stack,
        'GlobalExceptionFilter',
        { status, requestId },
      );
    } else {
      // 4xx — known client error: log at warn level to application.log only
      this.logger.warn(
        `[${status}] ${method} ${url} — ${finalMsg}`,
        'GlobalExceptionFilter',
        { status, requestId },
      );
    }

    // ── Client response — EXACT same shape as before ─────────────────────────
    response.status(status).json({
      success: false,
      message: finalMsg,
      data: null,
    });
  }
}
