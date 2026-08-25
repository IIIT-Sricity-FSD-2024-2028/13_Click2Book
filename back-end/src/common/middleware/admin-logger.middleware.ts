import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

/**
 * AdminLoggerMiddleware — Click2Book Phase 3D
 *
 * FFSD mandatory ROUTER-LEVEL MIDDLEWARE requirement.
 *
 * This middleware is applied ONLY to admin-scoped routes:
 *   /admin  and  /reports
 *
 * It logs every request to those routes to admin.log via LoggerService.adminLog().
 * It does NOT replace RolesGuard — RolesGuard still enforces x-role: ADMIN.
 * It does NOT apply to Customer, Provider, or Support routes.
 *
 * Safe fields logged:
 *   - method, URL, response time, request ID, role (from header, not sensitive)
 *
 * Never logged:
 *   - passwords, tokens, authorization values, cookies, request bodies
 */
@Injectable()
export class AdminLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startMs   = Date.now();
    const method    = req.method;
    const url       = req.originalUrl || req.url || '/';
    const requestId: string = (req as any).requestId ?? 'none';

    // x-role header is safe to log — it's a role label (ADMIN), not a secret
    const role      = (req.headers['x-role'] as string) ?? 'unknown';

    res.on('finish', () => {
      const status = res.statusCode;
      const ms     = Date.now() - startMs;

      // Route to admin.log (and mirrored to application.log) via adminLog()
      this.logger.adminLog('HTTP_REQUEST', role, {
        method,
        url,
        status,
        responseTimeMs: ms,
        requestId,
      });
    });

    next();
  }
}
