import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

/** Query-string keys that must never be logged */
const SENSITIVE_QUERY_KEYS = new Set([
  'password', 'token', 'secret', 'api_key', 'apikey', 'auth', 'authorization',
]);

/**
 * Strip sensitive key=value pairs from a query string.
 * e.g. "?search=bus&password=secret" → "?search=bus&password=[REDACTED]"
 */
function sanitiseQuery(query: string): string {
  if (!query) return '';
  return query
    .split('&')
    .map(part => {
      const [key] = part.split('=');
      return SENSITIVE_QUERY_KEYS.has((key || '').toLowerCase())
        ? `${key}=[REDACTED]`
        : part;
    })
    .join('&');
}

/**
 * LoggingMiddleware — Click2Book Phase 3C
 *
 * FFSD mandatory LOGGING MIDDLEWARE requirement.
 *
 * Logs every HTTP request/response pair through the existing LoggerService
 * (which routes output to the appropriate log file via Winston).
 *
 * Log levels by status code:
 *   2xx → INFO  → application.log
 *   3xx → INFO  → application.log
 *   4xx → WARN  → application.log
 *   5xx → ERROR → application.log + error.log
 *
 * Never logs: passwords, tokens, authorization header, cookies,
 *             request body, credit card info.
 *
 * Registered in AppModule.configure() for ALL routes.
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startMs   = Date.now();
    const method    = req.method;
    // req.originalUrl preserves the full path including the /api global prefix.
    // req.path is relative to the Express mount point and returns '/' in NestJS middleware.
    const rawUrl    = req.originalUrl || req.url || '/';
    const [rawPath, rawQs = ''] = rawUrl.split('?');
    const safeQs    = rawQs ? sanitiseQuery(rawQs) : '';
    const path      = safeQs ? `${rawPath}?${safeQs}` : rawPath;
    const ip        = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
                      || req.socket?.remoteAddress
                      || 'unknown';
    const requestId: string = (req as any).requestId ?? 'none';

    // Hook into the response's 'finish' event — the status code is only
    // available after the response is sent, not before.
    res.on('finish', () => {
      const status = res.statusCode;
      const ms     = Date.now() - startMs;

      this.logger.logRequest(method, path, status, ms, {
        ip,
        requestId,
      });
    });

    next();
  }
}
